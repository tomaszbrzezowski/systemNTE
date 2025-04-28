/*
  # Add transfer columns to calendar_events table

  1. Changes
    - Add to_user_id column to calendar_events table
    - Add foreign key constraint to users table
    - Add index for better query performance

  2. Security
    - Update RLS policies to handle transfer requests
*/

-- Add to_user_id column
ALTER TABLE calendar_events
ADD COLUMN to_user_id UUID REFERENCES users(id);

-- Add index for better performance
CREATE INDEX idx_calendar_events_to_user_id ON calendar_events(to_user_id);

-- Update RLS policies
CREATE POLICY "Users can view their transfer requests"
ON calendar_events
FOR SELECT
TO authenticated
USING (
  to_user_id = auth.uid() OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

-- Add trigger to handle transfer status changes
CREATE OR REPLACE FUNCTION handle_transfer_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'przekazywany', ensure to_user_id is set
  IF NEW.status = 'przekazywany' AND NEW.to_user_id IS NULL THEN
    RAISE EXCEPTION 'to_user_id must be set when status is przekazywany';
  END IF;

  -- When status changes from 'przekazywany', clear to_user_id
  IF OLD.status = 'przekazywany' AND NEW.status != 'przekazywany' THEN
    NEW.to_user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_status_trigger
  BEFORE INSERT OR UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_transfer_status();