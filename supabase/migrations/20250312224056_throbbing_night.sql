-- Add indexes for better performance
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
  PERFORM pg_advisory_xact_lock(1);
  
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Get current counter for this year without using aggregates or FOR UPDATE
    WITH numbered_agreements AS (
      SELECT 
        agreement_number,
        SUBSTRING(agreement_number FROM '\d+')::integer AS num,
        ROW_NUMBER() OVER (ORDER BY SUBSTRING(agreement_number FROM '\d+')::integer DESC) AS rn
      FROM agreements 
      WHERE agreement_number LIKE year || '/%'
    )
    SELECT COALESCE(
      (SELECT num FROM numbered_agreements WHERE rn = 1),
      0
    ) + 1 INTO counter;
    
    -- Generate new number
    new_number := year || '/' || LPAD(counter::text, 4, '0');
    
    -- Try to use the number
    BEGIN
      -- Check if number exists using a transaction
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

-- Analyze tables for better query planning
ANALYZE agreements;
ANALYZE agreement_performances;