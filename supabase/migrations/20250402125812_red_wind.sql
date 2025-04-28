/*
  # Fix layout_sections query error with ordinality
  
  1. Changes
    - Update the update_hall_seats function to avoid using the ordinality keyword
    - Replace the problematic query with a safer version that doesn't rely on ordinality
    - Maintain the same functionality while fixing the error
    
  2. Notes
    - The ordinality keyword is causing errors in the current implementation
    - This migration provides a safer alternative using array indexes
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_hall_seats_trigger_v5 ON layout_sections;

-- Drop the existing function
DROP FUNCTION IF EXISTS update_hall_seats();

-- Create a new version of the function that doesn't use ordinality
CREATE OR REPLACE FUNCTION update_hall_seats()
RETURNS TRIGGER AS $$
DECLARE
  total_seats integer := 0;
  row_count integer;
  seat_count integer;
  removed_count integer;
  gap_count integer;
  i integer;
BEGIN
  -- Calculate total seats for the section
  total_seats := 0;
  
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
      total_seats := total_seats + seat_count - removed_count - gap_count;
    END IF;
  END LOOP;
  
  -- Update total_seats in hall_layouts
  UPDATE hall_layouts
  SET total_seats = (
    SELECT COALESCE(SUM(total_seats), 0)
    FROM layout_sections
    WHERE layout_id = NEW.layout_id
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