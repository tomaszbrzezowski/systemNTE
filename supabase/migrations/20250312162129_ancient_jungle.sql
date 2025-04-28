/*
  # Fix agreement RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper access control
    - Add policies for both agreements and agreement_performances tables
    
  2. Security
    - Enable RLS on both tables
    - Allow all authenticated users to read
    - Allow administrators to manage all records
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
CREATE POLICY "Enable delete for administrators"
  ON agreements
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable insert for administrators"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new policies for agreement_performances
CREATE POLICY "Enable delete for administrators"
  ON agreement_performances
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable insert for administrators"
  ON agreement_performances
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON agreement_performances
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);