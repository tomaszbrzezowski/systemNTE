/*
  # Fix ambiguous total_seats column reference
  
  1. Changes
    - Update the update_hall_seats function to fix the ambiguous column reference
    - Explicitly specify the table for total_seats in the query
    - Maintain the same functionality while fixing the error
    
  2. Notes
    - The ambiguous column reference was causing errors when saving hall layouts
    - This migration provides a safer implementation that specifies which table's total_seats to use
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_hall_seats_trigger_v5 ON layout_sections;

-- Drop the existing function
DROP FUNCTION IF EXISTS update_hall_seats();

-- Create a new version of the function that avoids ambiguous column references
CREATE OR REPLACE FUNCTION update_hall_seats()
RETURNS TRIGGER AS $$
DECLARE
  section_total_seats integer := 0;
  row_count integer;
  seat_count integer;
  removed_count integer;
  gap_count integer;
  i integer;
BEGIN
  -- Calculate total seats for the section
  section_total_seats := 0;
  
  -- Loop through each row in row_seats array
  FOR i IN 1..array_length(NEW.row_seats, 1) LOOP
    -- Skip if this row is in empty_rows
    IF NOT (i - 1) = ANY(NEW.empty_rows) THEN
      -- Get number of seats in this row
      seat_count := NEW.row_seats[i];
      
      -- Count removed seats in this row
      SELECT COALESCE(jsonb_array_length(NEW.removed_seats->(i-1)::text), 0) INTO removed_count;
      
      -- Count seat gaps in this row
      SELECT COALESCE(jsonb_array_length(NEW.seat_gaps->(i-1)::text), 0) INTO gap_count;
      
      -- Add to total (seats minus removed seats and gaps)
      section_total_seats := section_total_seats + seat_count - removed_count - gap_count;
    END IF;
  END LOOP;
  
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

-- Create a helper function to calculate seats for a section
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
BEGIN
  -- Loop through each row
  FOR i IN 1..array_length(p_row_seats, 1) LOOP
    -- Skip if this row is in empty_rows
    IF NOT (i - 1) = ANY(p_empty_rows) THEN
      -- Get number of seats in this row
      seat_count := p_row_seats[i];
      
      -- Count removed seats in this row
      SELECT COALESCE(jsonb_array_length(p_removed_seats->(i-1)::text), 0) INTO removed_count;
      
      -- Count seat gaps in this row
      SELECT COALESCE(jsonb_array_length(p_seat_gaps->(i-1)::text), 0) INTO gap_count;
      
      -- Add to total (seats minus removed seats and gaps)
      total := total + seat_count - removed_count - gap_count;
    END IF;
  END LOOP;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger again
CREATE TRIGGER update_hall_seats_trigger_v5
  AFTER INSERT OR DELETE OR UPDATE ON layout_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_seats();