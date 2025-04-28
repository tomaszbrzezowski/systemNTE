/*
  # Fix agreement creation functionality
  
  1. Changes
    - Drop existing trigger and policies
    - Create new simplified agreement number generation
    - Fix RLS policies for agreements and performances
    
  2. Security
    - Maintain proper access control
    - Allow authenticated users to create agreements
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
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get current counter for this year
  SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
  INTO counter
  FROM agreements
  WHERE agreement_number LIKE year || '/%';
  
  -- Generate new number
  new_number := year || '/' || LPAD(counter::text, 4, '0');
  
  -- Set the new number only if it's not already set
  IF NEW.agreement_number IS NULL THEN
    NEW.agreement_number := new_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  WHEN (NEW.agreement_number IS NULL)
  EXECUTE FUNCTION set_agreement_number();

-- Drop all existing policies
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