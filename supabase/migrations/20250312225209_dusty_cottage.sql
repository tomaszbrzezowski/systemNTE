/*
  # Optimize agreement number generation
  
  1. Changes
    - Use a simpler, more efficient query without window functions
    - Remove unnecessary locking and transaction complexity
    - Set shorter statement timeout
    - Add proper error handling
    
  2. Performance
    - Uses direct MAX query instead of subqueries
    - Minimizes lock contention
    - Reduces execution time
*/

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_number ON agreements(agreement_number);
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_date ON agreements(agreement_date);
CREATE INDEX IF NOT EXISTS idx_agreements_season ON agreements(season);

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
  
  -- Use advisory lock to prevent concurrent number generation
  PERFORM pg_advisory_xact_lock(hashtext('agreement_number_lock'));
  
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Simple direct MAX query without subqueries or window functions
    SELECT COALESCE(
      MAX(NULLIF(SUBSTRING(agreement_number FROM '\d+'), '')::integer),
      0
    ) + 1 INTO counter
    FROM agreements
    WHERE agreement_number LIKE year || '/%';
    
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
   SET statement_timeout = '2s'  -- Short timeout to fail fast
   SET lock_timeout = '1s';      -- Short lock timeout

-- Create trigger that only fires when agreement_number is NULL
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  WHEN (NEW.agreement_number IS NULL)
  EXECUTE FUNCTION set_agreement_number();

-- Analyze tables for better query planning
ANALYZE agreements;
ANALYZE agreement_performances;