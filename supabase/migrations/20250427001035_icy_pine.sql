/*
  # Add hall_id column to calendar_events table
  
  1. Changes
    - Add hall_id column to calendar_events table
    - Add foreign key constraint to halls table
    - Add index for better query performance
    
  2. Notes
    - This column is needed for the hall layout functionality
    - Maintains backward compatibility with existing code
*/

-- Add hall_id column to calendar_events table if it doesn't exist
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
    
    -- Create index for better query performance
    CREATE INDEX idx_calendar_events_hall_id ON calendar_events(hall_id);
  END IF;
END $$;

-- Update existing events to set hall_id based on city_id
UPDATE calendar_events ce
SET hall_id = (
  SELECT h.id 
  FROM halls h 
  WHERE h.city_id = ce.city_id 
  LIMIT 1
)
WHERE ce.hall_id IS NULL AND ce.city_id IS NOT NULL;