/*
  # Fix agreement number format
  
  1. Changes
    - Update agreement number format to NTE {number}/MM/YYYY
    - Fix number generation function
    - Maintain existing RLS policies
    
  2. Security
    - No changes to security policies
*/

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();

-- Create new function for agreement number generation
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  month text;
  counter integer;
  new_number text;
  max_attempts integer := 3;
  current_attempt integer := 0;
BEGIN
  -- Get current year and month
  year := to_char(NEW.agreement_date, 'YYYY');
  month := to_char(NEW.agreement_date, 'MM');
  
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Get current counter for this month/year
    WITH current_numbers AS (
      SELECT 
        SUBSTRING(agreement_number FROM 'NTE (\d+)/') AS num_str
      FROM agreements 
      WHERE agreement_number LIKE 'NTE %/' || month || '/' || year
    )
    SELECT COALESCE(
      MAX(NULLIF(num_str, '')::integer),
      0
    ) + 1 INTO counter
    FROM current_numbers;
    
    -- Generate new number
    new_number := 'NTE ' || counter || '/' || month || '/' || year;
    
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_number_pattern 
ON agreements(agreement_number text_pattern_ops);