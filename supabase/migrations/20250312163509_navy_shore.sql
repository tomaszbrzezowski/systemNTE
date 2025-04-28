/*
  # Fix agreement RLS and number generation
  
  1. Changes
    - Drop existing policies and triggers
    - Create new RLS policies that allow insert
    - Fix agreement number generation
    
  2. Security
    - Allow authenticated users to insert agreements
    - Maintain administrator access for updates/deletes
    - Ensure proper agreement number generation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable insert for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable update for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON agreements;

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();
DROP FUNCTION IF EXISTS generate_agreement_number();

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
  
  -- Set the new number
  NEW.agreement_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION set_agreement_number();

-- Create new RLS policies
CREATE POLICY "Enable insert for authenticated users"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable delete for administrators"
  ON agreements
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure agreement_number column has no default value
ALTER TABLE agreements 
  ALTER COLUMN agreement_number DROP DEFAULT;