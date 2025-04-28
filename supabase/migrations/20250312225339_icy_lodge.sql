/*
  # Fix agreement number generation timeout
  
  1. Changes
    - Remove all locking mechanisms that cause timeouts
    - Use simple counter-based approach
    - Add proper error handling
    - Set very short timeouts
    
  2. Performance
    - Uses direct queries without complex logic
    - Minimizes database load
    - Fails fast instead of timing out
*/

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();

-- Create optimized function for agreement number generation
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
  
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Simple query to get the next number
    SELECT COALESCE(
      (
        SELECT (SUBSTRING(agreement_number FROM '\d+')::integer) + 1
        FROM agreements 
        WHERE agreement_number LIKE year || '/%'
        ORDER BY SUBSTRING(agreement_number FROM '\d+')::integer DESC
        LIMIT 1
      ),
      1
    ) INTO counter;
    
    -- Generate new number
    new_number := year || '/' || LPAD(counter::text, 4, '0');
    
    -- Try to use the number
    BEGIN
      -- Simple existence check
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
$$ LANGUAGE plpgsql 
   SET statement_timeout = '1s';  -- Very short timeout to fail fast

-- Create trigger that only fires when agreement_number is NULL
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  WHEN (NEW.agreement_number IS NULL)
  EXECUTE FUNCTION set_agreement_number();

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_number ON agreements(agreement_number);

-- Analyze table for better query planning
ANALYZE agreements;