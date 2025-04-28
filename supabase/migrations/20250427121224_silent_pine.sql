/*
  # Fix hall layout storage and retrieval
  
  1. Changes
    - Add hall_id column to calendar_events table if it doesn't exist
    - Add layout_blocks column to calendar_events table if it doesn't exist
    - Create function to sync layout_blocks between events and hall layouts
    - Add trigger to update hall layout total seats when layout_blocks changes
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper data synchronization
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
    
    -- Create index for better query performance
    CREATE INDEX idx_calendar_events_layout_blocks ON calendar_events USING gin (layout_blocks);
  END IF;
END $$;

-- Create function to update hall layout total seats
CREATE OR REPLACE FUNCTION update_hall_layout_total_seats()
RETURNS TRIGGER AS $$
DECLARE
  total_seats integer := 0;
  hall_id uuid;
  layout_blocks jsonb;
  block jsonb;
  sections jsonb;
  section_data jsonb;
  section_key text;
  row_count integer;
  seat_count integer;
  i integer;
  j integer;
BEGIN
  -- Get layout_blocks
  layout_blocks := NEW.layout_blocks;
  
  -- If layout_blocks is null, return
  IF layout_blocks IS NULL OR jsonb_typeof(layout_blocks) != 'array' THEN
    RETURN NEW;
  END IF;
  
  -- Find the seat_assignments block
  FOR i IN 0..jsonb_array_length(layout_blocks) - 1 LOOP
    block := layout_blocks->i;
    
    IF block->>'type' = 'seat_assignments' AND block ? 'sections' THEN
      sections := block->'sections';
      
      -- Iterate through sections
      FOR section_key IN SELECT jsonb_object_keys(sections) LOOP
        section_data := sections->section_key;
        
        -- Get row count
        IF section_data ? 'rows' THEN
          row_count := (section_data->>'rows')::integer;
          
          -- Iterate through rows
          FOR j IN 0..row_count-1 LOOP
            -- Skip empty rows
            IF section_data ? 'emptyRows' AND jsonb_typeof(section_data->'emptyRows') = 'array' THEN
              DECLARE
                is_empty boolean := false;
                k integer;
              BEGIN
                FOR k IN 0..jsonb_array_length(section_data->'emptyRows')-1 LOOP
                  IF (section_data->'emptyRows'->k)::integer = j THEN
                    is_empty := true;
                    EXIT;
                  END IF;
                END LOOP;
                
                IF is_empty THEN
                  CONTINUE;
                END IF;
              END;
            END IF;
            
            -- Get seats in this row
            IF section_data ? 'rowSeats' AND jsonb_array_length(section_data->'rowSeats') > j THEN
              seat_count := (section_data->'rowSeats'->j)::integer;
              
              -- Subtract removed seats
              IF section_data ? 'removedSeats' AND section_data->'removedSeats' ? j::text THEN
                seat_count := seat_count - jsonb_array_length(section_data->'removedSeats'->j::text);
              END IF;
              
              -- Add to total
              total_seats := total_seats + seat_count;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
      
      -- Update hall_layouts total_seats if needed
      IF NEW.hall_id IS NOT NULL THEN
        UPDATE hall_layouts
        SET total_seats = total_seats
        WHERE hall_id = NEW.hall_id;
      END IF;
      
      EXIT; -- Exit after processing the first seat_assignments block
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update hall layout total seats
DROP TRIGGER IF EXISTS update_hall_layout_total_seats_trigger ON calendar_events;
CREATE TRIGGER update_hall_layout_total_seats_trigger
  AFTER UPDATE OF layout_blocks ON calendar_events
  FOR EACH ROW
  WHEN (OLD.layout_blocks IS DISTINCT FROM NEW.layout_blocks)
  EXECUTE FUNCTION update_hall_layout_total_seats();

-- Create function to sync layout_blocks to seat assignments
CREATE OR REPLACE FUNCTION sync_layout_blocks_to_seat_assignments()
RETURNS TRIGGER AS $$
DECLARE
  layout_blocks jsonb;
  block jsonb;
  assignments jsonb;
  i integer;
BEGIN
  -- Get layout_blocks
  layout_blocks := NEW.layout_blocks;
  
  -- If layout_blocks is null, return
  IF layout_blocks IS NULL OR jsonb_typeof(layout_blocks) != 'array' THEN
    RETURN NEW;
  END IF;
  
  -- Find the seat_assignments block
  FOR i IN 0..jsonb_array_length(layout_blocks) - 1 LOOP
    block := layout_blocks->i;
    
    IF block->>'type' = 'seat_assignments' AND block ? 'assignments' THEN
      -- Process assignments as needed
      -- This function can be extended to sync with other tables if needed
      RETURN NEW;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync layout_blocks to seat assignments
DROP TRIGGER IF EXISTS sync_layout_blocks_to_seat_assignments_trigger ON calendar_events;
CREATE TRIGGER sync_layout_blocks_to_seat_assignments_trigger
  AFTER UPDATE OF layout_blocks ON calendar_events
  FOR EACH ROW
  WHEN (OLD.layout_blocks IS DISTINCT FROM NEW.layout_blocks)
  EXECUTE FUNCTION sync_layout_blocks_to_seat_assignments();

-- Update existing events to set hall_id based on city_id
UPDATE calendar_events ce
SET hall_id = (
  SELECT h.id 
  FROM halls h 
  WHERE h.city_id = ce.city_id 
  LIMIT 1
)
WHERE ce.hall_id IS NULL AND ce.city_id IS NOT NULL;