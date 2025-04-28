/*
  # Fix agreements RLS policies

  1. Changes
    - Drop existing policies
    - Create new policies with proper role checks
    - Add policies for both agreements and performances tables
    - Ensure proper access control based on user role

  2. Security
    - Administrators can manage all agreements
    - All authenticated users can view agreements
    - Proper role checks using auth.jwt()
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Administrators can manage agreements" ON agreements;
DROP POLICY IF EXISTS "Authenticated users can view agreements" ON agreements;
DROP POLICY IF EXISTS "Administrators can manage agreement performances" ON agreement_performances;
DROP POLICY IF EXISTS "Authenticated users can view agreement performances" ON agreement_performances;

-- Create new policies for agreements
CREATE POLICY "Administrators can manage agreements"
  ON agreements
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Authenticated users can view agreements"
  ON agreements
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

-- Create new policies for agreement performances
CREATE POLICY "Administrators can manage agreement performances"
  ON agreement_performances
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Authenticated users can view agreement performances"
  ON agreement_performances
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);