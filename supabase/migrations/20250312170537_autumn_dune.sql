/*
  # Fix agreement creation issues
  
  1. Changes
    - Drop existing trigger and function
    - Create new trigger function with proper error handling
    - Update RLS policies to allow agreement creation
    - Fix unique constraint handling
    
  2. Security
    - Maintain RLS policies
    - Fix permission issues for agreement creation
*/

-- Drop existing trigger and functions
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_agreement_number') THEN
    DROP TRIGGER set_agreement_number ON agreements;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_agreement_number') THEN
    DROP FUNCTION set_agreement_number();
  END IF;
END $$;

-- Create new function for agreement number generation with better error handling
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
    
    -- Get current counter for this year with row lock
    SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
    INTO counter
    FROM agreements
    WHERE agreement_number LIKE year || '/%'
    FOR UPDATE;
    
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

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop agreements policies
  DROP POLICY IF EXISTS "Agreements insert policy" ON agreements;
  DROP POLICY IF EXISTS "Agreements update policy" ON agreements;
  DROP POLICY IF EXISTS "Agreements delete policy" ON agreements;
  DROP POLICY IF EXISTS "Agreements select policy" ON agreements;
  
  -- Drop agreement_performances policies
  DROP POLICY IF EXISTS "Performances insert policy" ON agreement_performances;
  DROP POLICY IF EXISTS "Performances update policy" ON agreement_performances;
  DROP POLICY IF EXISTS "Performances delete policy" ON agreement_performances;
  DROP POLICY IF EXISTS "Performances select policy" ON agreement_performances;
END $$;

-- Create new policies for agreements
CREATE POLICY "Agreements insert policy"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agreements update policy"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Agreements delete policy"
  ON agreements
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Agreements select policy"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new policies for agreement_performances
CREATE POLICY "Performances insert policy"
  ON agreement_performances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Performances update policy"
  ON agreement_performances
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Performances delete policy"
  ON agreement_performances
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Performances select policy"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure agreement_number column has no default value
ALTER TABLE agreements 
  ALTER COLUMN agreement_number DROP DEFAULT;

-- Add explicit unique constraint on agreement_number
ALTER TABLE agreements
  DROP CONSTRAINT IF EXISTS agreements_agreement_number_key,
  ADD CONSTRAINT agreements_agreement_number_key UNIQUE (agreement_number);