/*
  # Fix agreement RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new simplified policies
    - Allow all authenticated users to insert agreements
    - Maintain read access for all authenticated users
    
  2. Security
    - Authenticated users can create agreements
    - Administrators can manage all agreements
    - All authenticated users can view agreements
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable insert for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable update for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreements;

DROP POLICY IF EXISTS "Enable delete for administrators" ON agreement_performances;
DROP POLICY IF EXISTS "Enable insert for administrators" ON agreement_performances;
DROP POLICY IF EXISTS "Enable update for administrators" ON agreement_performances;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreement_performances;

-- Create new policies for agreements
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

-- Create new policies for agreement_performances
CREATE POLICY "Enable insert for authenticated users"
  ON agreement_performances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON agreement_performances
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable delete for administrators"
  ON agreement_performances
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);