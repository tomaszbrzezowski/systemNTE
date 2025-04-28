/*
  # Fix hall layout seat count calculation
  
  1. Changes
    - Update the update_hall_seats function to correctly calculate total seats
    - Fix issues with the calculate_section_seats helper function
    - Ensure proper handling of null values and empty arrays
    
  2. Notes
    - Resolves the issue where hall layouts show incorrect seat counts
    - Ensures accurate seat counting for all section types
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
  row_count integer;
  seat_count integer;
  removed_count integer;
  gap_count integer;
  i integer;
  row_length integer;
  removed_seats_array integer[];
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
  
  -- Update total_seats in hall_layouts
  UPDATE hall_layouts
  SET total_seats = section_total_seats
  WHERE id = NEW.layout_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER update_hall_seats_trigger_v5
  AFTER INSERT OR DELETE OR UPDATE ON layout_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_seats();

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