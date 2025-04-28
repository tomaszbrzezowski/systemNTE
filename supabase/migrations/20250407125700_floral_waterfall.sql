/*
  # Add layout_blocks column to calendar_events
  
  1. Changes
    - Add layout_blocks column to calendar_events table
    - Set default value to null
    - Add comment explaining purpose
    
  2. Notes
    - Used for storing hall layout data
    - JSON format for flexible storage
*/

-- Add layout_blocks column to calendar_events table
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS layout_blocks JSONB DEFAULT NULL;

-- Add comment explaining purpose
COMMENT ON COLUMN calendar_events.layout_blocks IS 'Stores hall layout blocks data in JSON format';