/*
  # Fix hall layout preview and PDF export
  
  1. Changes
    - Ensure proper handling of null values in layout sections
    - Fix calculation of total seats
    - Prevent "upper bound of FOR loop cannot be null" errors
    
  2. Notes
    - Maintains the same functionality while adding proper error handling
    - Ensures backward compatibility with existing data
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_hall_seats_trigger_v5 ON layout_sections;

-- Drop the existing functions
DROP FUNCTION IF EXISTS update_hall_seats();
DROP FUNCTION IF EXISTS calculate_section_seats(integer[], jsonb, jsonb, integer[]);

-- Create a helper function to calculate seats for a section with null checks
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
      IF p_removed_seats IS NULL THEN
        removed_count := 0;
      ELSE
        SELECT COALESCE(jsonb_array_length(p_removed_seats->(i-1)::text), 0) INTO removed_count;
      END IF;
      
      -- Count seat gaps in this row
      IF p_seat_gaps IS NULL THEN
        gap_count := 0;
      ELSE
        SELECT COALESCE(jsonb_array_length(p_seat_gaps->(i-1)::text), 0) INTO gap_count;
      END IF;
      
      -- Add to total (seats minus removed seats and gaps)
      total := total + COALESCE(seat_count, 0) - removed_count - gap_count;
    END IF;
  END LOOP;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Create a new version of the function with proper null checks
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
        IF NEW.removed_seats IS NULL THEN
          removed_count := 0;
        ELSE
          SELECT COALESCE(jsonb_array_length(NEW.removed_seats->(i-1)::text), 0) INTO removed_count;
        END IF;
        
        -- Count seat gaps in this row
        IF NEW.seat_gaps IS NULL THEN
          gap_count := 0;
        ELSE
          SELECT COALESCE(jsonb_array_length(NEW.seat_gaps->(i-1)::text), 0) INTO gap_count;
        END IF;
        
        -- Add to total (seats minus removed seats and gaps)
        section_total_seats := section_total_seats + COALESCE(seat_count, 0) - removed_count - gap_count;
      END IF;
    END LOOP;
  END IF;
  
  -- Update total_seats in hall_layouts with explicit table reference
  UPDATE hall_layouts
  SET total_seats = (
    SELECT COALESCE(SUM(ls.section_total_seats), 0)
    FROM (
      SELECT 
        layout_id,
        CASE 
          WHEN id = NEW.id THEN section_total_seats
          ELSE calculate_section_seats(row_seats, removed_seats, seat_gaps, empty_rows)
        END AS section_total_seats
      FROM layout_sections
      WHERE layout_id = NEW.layout_id
    ) ls
  )
  WHERE id = NEW.layout_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER update_hall_seats_trigger_v5
  AFTER INSERT OR DELETE OR UPDATE ON layout_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_seats();