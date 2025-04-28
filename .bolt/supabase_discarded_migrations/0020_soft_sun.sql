/*
  # Fix transfer requests functionality

  1. Changes
    - Drop existing transfer columns
    - Add transfer columns with proper constraints
    - Update triggers and policies
    - Add indexes for performance

  2. Security
    - Add RLS policies for transfers
    - Add validation triggers
*/

-- Drop existing transfer-related objects
DROP TRIGGER IF EXISTS validate_transfer_trigger ON calendar_events;
DROP FUNCTION IF EXISTS validate_transfer();
DROP INDEX IF EXISTS idx_calendar_events_to_user_id;
DROP INDEX IF EXISTS idx_calendar_events_transfer_status;

-- Remove existing columns
ALTER TABLE calendar_events 
  DROP COLUMN IF EXISTS to_user_id,
  DROP COLUMN IF EXISTS transfer_status;

-- Add transfer columns with proper constraints
ALTER TABLE calendar_events
  ADD COLUMN to_user_id UUID REFERENCES users(id),
  ADD COLUMN transfer_status TEXT CHECK (
    transfer_status IN ('pending', 'accepted', 'rejected') OR transfer_status IS NULL
  );

-- Add indexes for performance
CREATE INDEX idx_calendar_events_to_user_id ON calendar_events(to_user_id);
CREATE INDEX idx_calendar_events_transfer_status ON calendar_events(transfer_status);

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

  -- Set initial transfer status
  IF NEW.status = 'przekazywany' AND NEW.transfer_status IS NULL THEN
    NEW.transfer_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create transfer validation trigger
CREATE TRIGGER validate_transfer_trigger
  BEFORE INSERT OR UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION validate_transfer();

-- Update RLS policies
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
      AND role = 'administrator'
    )
  );