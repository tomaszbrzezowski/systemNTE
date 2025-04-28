/*
  # Fix agreement creation issues
  
  1. Changes
    - Drop and recreate agreement number generation function
    - Use a simpler approach without FOR UPDATE
    - Add proper error handling
    - Maintain existing RLS policies
*/

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();

-- Create new function for agreement number generation
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  counter integer;
  new_number text;
  max_attempts integer := 10;
  current_attempt integer := 0;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Get current counter for this year without FOR UPDATE
    SELECT COALESCE(
      (SELECT MAX(SUBSTRING(agreement_number FROM '\d+')::integer)
       FROM agreements 
       WHERE agreement_number LIKE year || '/%'), 
      0
    ) + 1 INTO counter;
    
    -- Generate new number
    new_number := year || '/' || LPAD(counter::text, 4, '0');
    
    -- Try to use the number
    BEGIN
      -- Check if number exists
      IF NOT EXISTS (
        SELECT 1 FROM agreements 
        WHERE agreement_number = new_number
      ) THEN
        NEW.agreement_number := new_number;
        RETURN NEW;
      END IF;
    EXCEPTION 
      WHEN unique_violation THEN
        -- Only retry up to max_attempts times
        IF current_attempt >= max_attempts THEN
          RAISE EXCEPTION 'Failed to generate unique agreement number after % attempts', max_attempts;
        END IF;
        -- Continue to next iteration
        CONTINUE;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that only fires when agreement_number is NULL
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  WHEN (NEW.agreement_number IS NULL)
  EXECUTE FUNCTION set_agreement_number();

-- Ensure agreement_number column has no default value
ALTER TABLE agreements 
  ALTER COLUMN agreement_number DROP DEFAULT;