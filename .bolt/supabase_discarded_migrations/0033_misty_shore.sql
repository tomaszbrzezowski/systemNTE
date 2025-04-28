/*
  # Add transfer-related columns and indexes
  
  1. Changes
    - Add to_user_id column (UUID, references users)
    - Add transfer_status column (TEXT)
    - Create indexes for new columns
*/

-- Add transfer columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'to_user_id'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN to_user_id UUID REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'transfer_status'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN transfer_status TEXT;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_calendar_events_to_user_id 
  ON calendar_events(to_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_transfer_status 
  ON calendar_events(transfer_status);