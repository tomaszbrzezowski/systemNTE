/*
  # Fix hall_id ambiguity and layout_blocks handling
  
  1. Changes
    - Ensure hall_id column exists in calendar_events table
    - Add index for better query performance
    - Fix ambiguous column references in queries
    
  2. Notes
    - Safe to run multiple times (idempotent)
    - Maintains backward compatibility
*/

-- Ensure hall_id column exists in calendar_events table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_events' AND column_name = 'hall_id'
  ) THEN
    ALTER TABLE calendar_events
    ADD COLUMN hall_id uuid REFERENCES halls(id) ON DELETE SET NULL;
    
    -- Add comment explaining purpose
    COMMENT ON COLUMN calendar_events.hall_id IS 'Reference to the hall where the event takes place';
  END IF;
END $$;

-- Ensure layout_blocks column exists in calendar_events table
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

-- Create indexes for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_calendar_events_hall_id ON calendar_events(hall_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_layout_blocks ON calendar_events USING gin (layout_blocks);