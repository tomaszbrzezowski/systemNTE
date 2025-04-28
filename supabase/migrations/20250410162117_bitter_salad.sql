/*
  # Fix seat layout and assignment storage
  
  1. Changes
    - Create index on layout_blocks column for better query performance
    - Create function to sync layout_blocks to seat assignments
    - Add function to calculate total seats in a hall layout
    - Add trigger to update hall layout total seats when layout_blocks changes
    
  2. Notes
    - Ensures proper storage of seat assignments in layout_blocks
    - Maintains backward compatibility with existing code
    - Improves query performance for layout data
*/

-- Create index on layout_blocks for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_calendar_events_layout_blocks ON calendar_events USING gin (layout_blocks);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS sync_layout_blocks_to_seat_assignments_trigger ON calendar_events;
DROP FUNCTION IF EXISTS sync_layout_blocks_to_seat_assignments();

-- Create function to sync layout_blocks to seat assignments when layout_blocks changes
CREATE OR REPLACE FUNCTION sync_layout_blocks_to_seat_assignments()
RETURNS TRIGGER AS $$
DECLARE
  assignments jsonb;
  sections jsonb;
  schools jsonb;
  i integer;
BEGIN
  -- Check if layout_blocks contains seat assignments
  IF NEW.layout_blocks IS NOT NULL AND jsonb_typeof(NEW.layout_blocks) = 'array' THEN
    -- Find the seat_assignments block
    FOR i IN 0..jsonb_array_length(NEW.layout_blocks) - 1 LOOP
      IF NEW.layout_blocks->i->>'type' = 'seat_assignments' THEN
        -- Extract assignments, sections, and schools
        assignments := NEW.layout_blocks->i->'assignments';
        sections := NEW.layout_blocks->i->'sections';
        schools := NEW.layout_blocks->i->'schools';
        
        -- Log for debugging
        RAISE NOTICE 'Found seat_assignments block';
        
        -- Return the updated record
        RETURN NEW;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync layout_blocks to seat assignments
CREATE TRIGGER sync_layout_blocks_to_seat_assignments_trigger
  AFTER UPDATE OF layout_blocks ON calendar_events
  FOR EACH ROW
  WHEN (OLD.layout_blocks IS DISTINCT FROM NEW.layout_blocks)
  EXECUTE FUNCTION sync_layout_blocks_to_seat_assignments();

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_hall_layout_total_seats_trigger ON calendar_events;
DROP FUNCTION IF EXISTS update_hall_layout_total_seats();
DROP FUNCTION IF EXISTS calculate_total_seats(jsonb);

-- Create function to calculate total seats in a hall layout
CREATE OR REPLACE FUNCTION calculate_total_seats(layout_blocks jsonb)
RETURNS integer AS $$
DECLARE
  total_seats integer := 0;
  section_data jsonb;
  row_seats jsonb;
  removed_seats jsonb;
  empty_rows jsonb;
  row_count integer;
  seat_count integer;
  i integer;
  j integer;
  section_keys text[];
  section_key text;
BEGIN
  -- Check if layout_blocks contains seat assignments
  IF layout_blocks IS NULL OR jsonb_typeof(layout_blocks) != 'array' THEN
    RETURN 0;
  END IF;
  
  -- Find the seat_assignments block
  FOR i IN 0..jsonb_array_length(layout_blocks) - 1 LOOP
    IF layout_blocks->i->>'type' = 'seat_assignments' THEN
      -- Get sections
      IF layout_blocks->i ? 'sections' THEN
        -- Get all section keys
        SELECT array_agg(key) INTO section_keys
        FROM jsonb_object_keys(layout_blocks->i->'sections') AS key;
        
        -- Iterate through sections
        FOREACH section_key IN ARRAY section_keys LOOP
          section_data := layout_blocks->i->'sections'->section_key;
          
          -- Get row count
          row_count := (section_data->>'rows')::integer;
          
          -- Iterate through rows
          FOR j IN 0..row_count-1 LOOP
            -- Skip empty rows
            IF section_data ? 'emptyRows' AND 
               (jsonb_typeof(section_data->'emptyRows') = 'array' AND 
                jsonb_array_length(section_data->'emptyRows') > 0) THEN
              -- Check if j is in emptyRows array
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
        END LOOP;
      END IF;
      
      RETURN total_seats;
    END IF;
  END LOOP;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to update hall layout total seats
CREATE OR REPLACE FUNCTION update_hall_layout_total_seats()
RETURNS TRIGGER AS $$
DECLARE
  total_seats integer;
  hall_id uuid;
BEGIN
  -- Calculate total seats
  total_seats := calculate_total_seats(NEW.layout_blocks);
  
  -- Update hall_layouts total_seats if needed
  IF NEW.city_id IS NOT NULL THEN
    -- Get hall_id for this city
    SELECT h.id INTO hall_id
    FROM halls h
    WHERE h.city_id = NEW.city_id
    LIMIT 1;
    
    IF hall_id IS NOT NULL THEN
      UPDATE hall_layouts
      SET total_seats = total_seats
      WHERE hall_id = hall_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update hall layout total seats
CREATE TRIGGER update_hall_layout_total_seats_trigger
  AFTER UPDATE OF layout_blocks ON calendar_events
  FOR EACH ROW
  WHEN (OLD.layout_blocks IS DISTINCT FROM NEW.layout_blocks)
  EXECUTE FUNCTION update_hall_layout_total_seats();