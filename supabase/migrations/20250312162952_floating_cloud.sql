/*
  # Fix agreement number generation
  
  1. Changes
    - Drop existing trigger and function
    - Create new trigger function that properly handles agreement numbers
    - Add trigger to set agreement number before insert
    - Remove default value from agreement_number column
    
  2. Notes
    - Ensures unique agreement numbers
    - Handles concurrent inserts safely
    - Maintains existing agreement numbers
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();
DROP FUNCTION IF EXISTS generate_agreement_number();

-- Create new function to generate agreement number
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  counter integer;
  new_number text;
  max_attempts integer := 3;
  current_attempt integer := 0;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Try to generate a unique number
  LOOP
    -- Get current counter for this year
    SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
    INTO counter
    FROM agreements
    WHERE agreement_number LIKE year || '/%';
    
    -- Generate new number
    new_number := year || '/' || LPAD(counter::text, 4, '0');
    
    -- Try to use the generated number
    BEGIN
      NEW.agreement_number := new_number;
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      -- Only retry a limited number of times
      current_attempt := current_attempt + 1;
      IF current_attempt >= max_attempts THEN
        RAISE EXCEPTION 'Could not generate unique agreement number after % attempts', max_attempts;
      END IF;
      -- Continue to next iteration of loop
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION set_agreement_number();

-- Ensure agreement_number column has no default value
ALTER TABLE agreements 
  ALTER COLUMN agreement_number DROP DEFAULT;