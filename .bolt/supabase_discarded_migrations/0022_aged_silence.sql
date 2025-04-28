/*
  # Fix transfer schema and add proper constraints

  1. Changes
    - Add to_user_id and transfer_status columns to calendar_events
    - Add proper constraints and indexes
    - Update RLS policies for transfer management
    - Add validation triggers

  2. Security
    - Enable RLS for all tables
    - Add policies for transfer management
    - Add validation triggers for data integrity
*/

-- Drop existing transfer-related objects if they exist
DROP TRIGGER IF EXISTS validate_transfer_trigger ON calendar_events;
DROP FUNCTION IF EXISTS validate_transfer();
DROP INDEX IF EXISTS idx_calendar_events_to_user_id;
DROP INDEX IF EXISTS idx_calendar_events_transfer_status;

-- Add transfer columns with proper constraints
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS to_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS transfer_status TEXT CHECK (
  transfer_status IN ('pending', 'accepted', 'rejected') OR transfer_status IS NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_to_user_id ON calendar_events(to_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_transfer_status ON calendar_events(transfer_status);

-- Create transfer validation function
CREATE OR REPLACE FUNCTION validate_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate przekazywany status requires to_user_id
  IF NEW.status = 'przekazywany' AND NEW.to_user_id IS NULL THEN
    RAISE EXCEPTION 'to_user_id is required for przekazywany status';
  END IF;

  -- Clear transfer data when status changes from przekazywany
  IF OLD.status = 'przekazywany' AND NEW.status != 'przekazywany' THEN
    NEW.to_user_id := NULL;
    NEW.transfer_status := NULL;
  END IF;

  -- Set initial transfer status for new transfers
  IF NEW.status = 'przekazywany' AND NEW.transfer_status IS NULL THEN
    NEW.transfer_status := 'pending';
  END IF;

  -- Prevent self-transfers
  IF NEW.user_id = NEW.to_user_id THEN
    RAISE EXCEPTION 'Cannot transfer to self';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create transfer validation trigger
CREATE TRIGGER validate_transfer_trigger
  BEFORE INSERT OR UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_transfer();

-- Update RLS policies for transfer management
DROP POLICY IF EXISTS "Users can view and manage their transfers" ON calendar_events;

CREATE POLICY "Users can view and manage their transfers"
  ON calendar_events
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    to_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        role = 'administrator' OR
        (role = 'supervisor' AND user_id = ANY(organizer_ids))
      )
    )
  );