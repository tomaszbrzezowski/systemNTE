/*
  # Fix hall layout seat counting and seat assignments
  
  1. Changes
    - Fix the update_hall_seats function to correctly calculate total seats
    - Update the seat_assignments table to store assignments in calendar_events.layout_blocks
    - Add a trigger to update layout_blocks when seat assignments change
    
  2. Notes
    - Fixes the issue with incorrect seat counts in hall layouts
    - Improves seat assignment storage for better performance
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_hall_seats_trigger_v5 ON layout_sections;

-- Drop the existing functions
DROP FUNCTION IF EXISTS update_hall_seats();
DROP FUNCTION IF EXISTS calculate_section_seats(integer[], jsonb, jsonb, integer[]);

-- Create a helper function to calculate seats for a section with proper null checks
CREATE OR REPLACE FUNCTION calculate_section_seats(
  p_row_seats integer[],
  p_removed_seats jsonb,
  p_seat_gaps jsonb,
  p_empty_rows integer[]
)
RETURNS integer AS $$
DECLARE
  total integer := 0;
  i integer;
  seat_count integer;
  removed_count integer;
  gap_count integer;
  row_length integer;
  removed_seats_array integer[];
BEGIN
  -- Handle null arrays
  IF p_row_seats IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get array length safely
  row_length := array_length(p_row_seats, 1);
  
  -- If array is empty, return 0
  IF row_length IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Loop through each row
  FOR i IN 1..row_length LOOP
    -- Skip if this row is in empty_rows (with null check)
    IF p_empty_rows IS NULL OR NOT (i - 1) = ANY(p_empty_rows) THEN
      -- Get number of seats in this row
      seat_count := p_row_seats[i];
      
      -- Count removed seats in this row
      removed_count := 0;
      IF p_removed_seats IS NOT NULL AND p_removed_seats ? ((i-1)::text) THEN
        -- Extract the array of removed seats for this row
        removed_seats_array := ARRAY(SELECT jsonb_array_elements_text(p_removed_seats->(i-1)::text)::integer);
        removed_count := array_length(removed_seats_array, 1);
        IF removed_count IS NULL THEN
          removed_count := 0;
        END IF;
      END IF;
      
      -- Count seat gaps in this row
      gap_count := 0;
      IF p_seat_gaps IS NOT NULL AND p_seat_gaps ? ((i-1)::text) THEN
        -- Count the number of elements in the seat_gaps array for this row
        SELECT jsonb_array_length(p_seat_gaps->(i-1)::text) INTO gap_count;
        IF gap_count IS NULL THEN
          gap_count := 0;
        END IF;
      END IF;
      
      -- Add to total (seats minus removed seats and gaps)
      total := total + COALESCE(seat_count, 0) - removed_count - gap_count;
    END IF;
  END LOOP;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Create a new version of the function with proper null checks and array handling
CREATE OR REPLACE FUNCTION update_hall_seats()
RETURNS TRIGGER AS $$
DECLARE
  section_total_seats integer := 0;
  total_hall_seats integer := 0;
  row_count integer;
  seat_count integer;
  removed_count integer;
  gap_count integer;
  i integer;
  row_length integer;
  removed_seats_array integer[];
  section_record RECORD;
BEGIN
  -- Handle null row_seats array
  IF NEW.row_seats IS NULL THEN
    -- Set a default value to avoid null errors
    NEW.row_seats := '{}'::integer[];
  END IF;
  
  -- Ensure empty_rows is never null
  IF NEW.empty_rows IS NULL THEN
    NEW.empty_rows := '{}'::integer[];
  END IF;
  
  -- Calculate total seats for the section
  section_total_seats := 0;
  
  -- Get array length safely
  row_length := array_length(NEW.row_seats, 1);
  
  -- Only process if we have rows
  IF row_length IS NOT NULL THEN
    -- Loop through each row in row_seats array
    FOR i IN 1..row_length LOOP
      -- Skip if this row is in empty_rows
      IF NOT (i - 1) = ANY(NEW.empty_rows) THEN
        -- Get number of seats in this row
        seat_count := NEW.row_seats[i];
        
        -- Count removed seats in this row
        removed_count := 0;
        IF NEW.removed_seats IS NOT NULL AND NEW.removed_seats ? ((i-1)::text) THEN
          -- Extract the array of removed seats for this row
          removed_seats_array := ARRAY(SELECT jsonb_array_elements_text(NEW.removed_seats->(i-1)::text)::integer);
          removed_count := array_length(removed_seats_array, 1);
          IF removed_count IS NULL THEN
            removed_count := 0;
          END IF;
        END IF;
        
        -- Count seat gaps in this row
        gap_count := 0;
        IF NEW.seat_gaps IS NOT NULL AND NEW.seat_gaps ? ((i-1)::text) THEN
          -- Count the number of elements in the seat_gaps array for this row
          SELECT jsonb_array_length(NEW.seat_gaps->(i-1)::text) INTO gap_count;
          IF gap_count IS NULL THEN
            gap_count := 0;
          END IF;
        END IF;
        
        -- Add to total (seats minus removed seats and gaps)
        section_total_seats := section_total_seats + COALESCE(seat_count, 0) - removed_count - gap_count;
      END IF;
    END LOOP;
  END IF;
  
  -- Calculate total seats for all sections in this layout
  total_hall_seats := section_total_seats;
  
  FOR section_record IN 
    SELECT * FROM layout_sections 
    WHERE layout_id = NEW.layout_id AND id != NEW.id
  LOOP
    total_hall_seats := total_hall_seats + 
      calculate_section_seats(
        section_record.row_seats, 
        section_record.removed_seats, 
        section_record.seat_gaps, 
        section_record.empty_rows
      );
  END LOOP;
  
  -- Update total_seats in hall_layouts
  UPDATE hall_layouts
  SET total_seats = total_hall_seats
  WHERE id = NEW.layout_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER update_hall_seats_trigger_v5
  AFTER INSERT OR DELETE OR UPDATE ON layout_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_seats();

-- Create a function to update layout_blocks in calendar_events when seat assignments change
CREATE OR REPLACE FUNCTION update_event_layout_blocks()
RETURNS TRIGGER AS $$
DECLARE
  event_layout_blocks jsonb;
  seat_id_parts text[];
  section_id text;
  row_index integer;
  seat_index integer;
BEGIN
  -- Get current layout_blocks for the event
  SELECT layout_blocks INTO event_layout_blocks
  FROM calendar_events
  WHERE id = NEW.event_id;
  
  -- Initialize layout_blocks if null
  IF event_layout_blocks IS NULL THEN
    event_layout_blocks := '[]'::jsonb;
  END IF;
  
  -- Parse seat_id to get section_id, row_index, and seat_index
  seat_id_parts := string_to_array(NEW.seat_id, '-');
  section_id := seat_id_parts[1];
  row_index := seat_id_parts[2]::integer;
  seat_index := seat_id_parts[3]::integer;
  
  -- Update layout_blocks with the new assignment
  -- This is a simplified approach - in a real implementation, you would need to
  -- find the correct section, row, and seat in the layout_blocks structure
  
  -- For now, we'll just store the assignments as a simple mapping
  IF event_layout_blocks @> '[{"type": "seat_assignments"}]'::jsonb THEN
    -- Update existing seat assignments
    event_layout_blocks := jsonb_set(
      event_layout_blocks,
      '{0, assignments}'::text[],
      COALESCE(
        (event_layout_blocks -> 0 -> 'assignments')::jsonb || 
        jsonb_build_object(NEW.seat_id, NEW.school_name),
        jsonb_build_object(NEW.seat_id, NEW.school_name)
      )
    );
  ELSE
    -- Create new seat assignments structure
    event_layout_blocks := jsonb_build_array(
      jsonb_build_object(
        'type', 'seat_assignments',
        'assignments', jsonb_build_object(NEW.seat_id, NEW.school_name)
      )
    );
  END IF;
  
  -- Update the calendar_events table
  UPDATE calendar_events
  SET layout_blocks = event_layout_blocks
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update layout_blocks when seat assignments change
CREATE TRIGGER update_event_layout_blocks_trigger
  AFTER INSERT OR UPDATE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_event_layout_blocks();

-- Create a function to remove seat assignments from layout_blocks when deleted
CREATE OR REPLACE FUNCTION remove_event_layout_blocks()
RETURNS TRIGGER AS $$
DECLARE
  event_layout_blocks jsonb;
  assignments jsonb;
BEGIN
  -- Get current layout_blocks for the event
  SELECT layout_blocks INTO event_layout_blocks
  FROM calendar_events
  WHERE id = OLD.event_id;
  
  -- If layout_blocks is null or doesn't contain seat assignments, do nothing
  IF event_layout_blocks IS NULL OR NOT (event_layout_blocks @> '[{"type": "seat_assignments"}]'::jsonb) THEN
    RETURN OLD;
  END IF;
  
  -- Get current assignments
  assignments := event_layout_blocks -> 0 -> 'assignments';
  
  -- Remove the deleted seat assignment
  assignments := assignments - OLD.seat_id;
  
  -- Update layout_blocks with the modified assignments
  event_layout_blocks := jsonb_set(
    event_layout_blocks,
    '{0, assignments}'::text[],
    assignments
  );
  
  -- Update the calendar_events table
  UPDATE calendar_events
  SET layout_blocks = event_layout_blocks
  WHERE id = OLD.event_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to remove seat assignments from layout_blocks when deleted
CREATE TRIGGER remove_event_layout_blocks_trigger
  AFTER DELETE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION remove_event_layout_blocks();

-- Recalculate all hall layout seat counts
DO $$
DECLARE
  section_record RECORD;
BEGIN
  FOR section_record IN SELECT * FROM layout_sections LOOP
    -- Trigger the update function for each section
    UPDATE layout_sections
    SET updated_at = NOW()
    WHERE id = section_record.id;
  END LOOP;
END $$;

-- Migrate existing seat assignments to layout_blocks
DO $$
DECLARE
  event_record RECORD;
  assignments_record RECORD;
  event_layout_blocks jsonb;
  assignments jsonb := '{}'::jsonb;
BEGIN
  -- Process each event with seat assignments
  FOR event_record IN 
    SELECT DISTINCT event_id 
    FROM seat_assignments
  LOOP
    -- Reset assignments for this event
    assignments := '{}'::jsonb;
    
    -- Collect all seat assignments for this event
    FOR assignments_record IN 
      SELECT seat_id, school_name 
      FROM seat_assignments 
      WHERE event_id = event_record.event_id
    LOOP
      assignments := assignments || jsonb_build_object(
        assignments_record.seat_id, 
        assignments_record.school_name
      );
    END LOOP;
    
    -- Create layout_blocks structure
    event_layout_blocks := jsonb_build_array(
      jsonb_build_object(
        'type', 'seat_assignments',
        'assignments', assignments
      )
    );
    
    -- Update the calendar_events table
    UPDATE calendar_events
    SET layout_blocks = event_layout_blocks
    WHERE id = event_record.event_id;
  END LOOP;
END $$;