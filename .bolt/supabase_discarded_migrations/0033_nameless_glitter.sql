/*
  # Fix calendar table columns

  1. Changes
    - Remove transfer-related columns from calendar_events table
    - Ensure order_index exists in calendars table
    - Create index for order_index column
*/

-- Fix calendar_events table first
DO $$ 
BEGIN
  -- Remove transfer-related columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'to_user_id'
  ) THEN
    ALTER TABLE calendar_events DROP COLUMN to_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' 
    AND column_name = 'transfer_status'
  ) THEN
    ALTER TABLE calendar_events DROP COLUMN transfer_status;
  END IF;
END $$;

-- Ensure order_index exists and has proper index
DO $$ 
BEGIN
  -- Only add order_index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendars' 
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE calendars ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_calendars_order_index 
  ON calendars(order_index);