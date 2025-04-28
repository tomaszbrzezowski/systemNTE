/*
  # Add layout_blocks column to calendar_events
  
  1. Changes
    - Add layout_blocks column to calendar_events table if it doesn't exist
    - Create index for better query performance
    
  2. Notes
    - Stores hall layout data in JSON format
    - Maintains backward compatibility with existing code
*/

-- Add layout_blocks column to calendar_events table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'layout_blocks'
  ) THEN
    ALTER TABLE calendar_events
    ADD COLUMN layout_blocks JSONB DEFAULT NULL;
    
    -- Add comment explaining purpose
    COMMENT ON COLUMN calendar_events.layout_blocks IS 'Stores hall layout blocks data in JSON format';
  END IF;
END $$;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_calendar_events_layout_blocks ON calendar_events USING gin (layout_blocks);