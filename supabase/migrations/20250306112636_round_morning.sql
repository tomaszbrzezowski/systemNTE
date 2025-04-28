/*
  # Update RLS Policies for Agreements Tables
  
  1. Changes
    - Drops existing RLS policies
    - Creates new policies with proper access control
    - Ensures administrators can manage agreements
    - Allows authenticated users to view agreements
    
  2. Tables Affected
    - agreements
    - agreement_performances
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable update for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable delete for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreements;

-- Create new policies for agreements
CREATE POLICY "Enable insert for administrators"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable delete for administrators"
  ON agreements
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop existing policies for agreement_performances
DROP POLICY IF EXISTS "Enable insert for administrators" ON agreement_performances;
DROP POLICY IF EXISTS "Enable update for administrators" ON agreement_performances;
DROP POLICY IF EXISTS "Enable delete for administrators" ON agreement_performances;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreement_performances;

-- Create new policies for agreement_performances
CREATE POLICY "Enable insert for administrators"
  ON agreement_performances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON agreement_performances
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable delete for administrators"
  ON agreement_performances
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);