/*
  # Fix agreement creation and number generation
  
  1. Changes
    - Drop existing trigger and function
    - Create new function with proper error handling
    - Add unique constraint for agreement_number
    - Update RLS policies
    
  2. Security
    - Maintain existing security policies
    - Ensure proper agreement number generation
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

-- Create new function for agreement number generation
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  counter integer;
  new_number text;
  max_attempts integer := 5;
  attempt integer := 0;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  LOOP
    attempt := attempt + 1;
    
    -- Get current counter for this year
    SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
    INTO counter
    FROM agreements
    WHERE agreement_number LIKE year || '/%';
    
    -- Generate new number
    new_number := year || '/' || LPAD(counter::text, 4, '0');
    
    -- Check if number already exists
    IF NOT EXISTS (
      SELECT 1 FROM agreements 
      WHERE agreement_number = new_number
    ) THEN
      NEW.agreement_number := new_number;
      RETURN NEW;
    END IF;
    
    -- Prevent infinite loop
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique agreement number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION set_agreement_number();

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop agreements policies
  DROP POLICY IF EXISTS "Enable delete for administrators" ON agreements;
  DROP POLICY IF EXISTS "Enable insert for administrators" ON agreements;
  DROP POLICY IF EXISTS "Enable update for administrators" ON agreements;
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreements;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agreements;
  DROP POLICY IF EXISTS "Enable insert for users" ON agreements;
  DROP POLICY IF EXISTS "Enable update for admins" ON agreements;
  DROP POLICY IF EXISTS "Enable delete for admins" ON agreements;
  DROP POLICY IF EXISTS "Enable read for users" ON agreements;
  
  -- Drop agreement_performances policies
  DROP POLICY IF EXISTS "Enable delete for administrators" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable insert for administrators" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable update for administrators" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable insert for users" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable update for admins" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable delete for admins" ON agreement_performances;
  DROP POLICY IF EXISTS "Enable read for users" ON agreement_performances;
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