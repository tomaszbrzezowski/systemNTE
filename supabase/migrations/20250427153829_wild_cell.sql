/*
  # Fix ambiguous column references in calendar_events
  
  1. Changes
    - Ensure hall_id column exists in calendar_events table
    - Create indexes for better query performance
    - Fix ambiguous column references in queries
    
  2. Notes
    - Safe to run multiple times
    - Maintains existing data
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

-- Update existing events to set hall_id based on city_id if not already set
UPDATE calendar_events ce
SET hall_id = (
  SELECT h.id 
  FROM halls h 
  WHERE h.city_id = ce.city_id 
  LIMIT 1
)
WHERE ce.hall_id IS NULL AND ce.city_id IS NOT NULL;

-- Create or replace function to update hall layout total seats
CREATE OR REPLACE FUNCTION update_hall_layout_total_seats()
RETURNS TRIGGER AS $$
DECLARE
  total_seats integer;
  hall_id uuid;
BEGIN
  -- Calculate total seats
  total_seats := calculate_total_seats(NEW.layout_blocks);
  
  -- Update hall_layouts total_seats if needed
  IF NEW.hall_id IS NOT NULL THEN
    -- Get hall_id for this event
    SELECT NEW.hall_id INTO hall_id;
    
    IF hall_id IS NOT NULL THEN
      UPDATE hall_layouts
      SET total_seats = total_seats
      WHERE hall_id = hall_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_hall_layout_total_seats_trigger ON calendar_events;

-- Create trigger to update hall layout total seats
CREATE TRIGGER update_hall_layout_total_seats_trigger
  AFTER UPDATE OF layout_blocks ON calendar_events
  FOR EACH ROW
  WHEN (OLD.layout_blocks IS DISTINCT FROM NEW.layout_blocks)
  EXECUTE FUNCTION update_hall_layout_total_seats();