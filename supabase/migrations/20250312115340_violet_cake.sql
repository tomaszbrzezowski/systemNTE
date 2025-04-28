/*
  # Fix halls RLS policies

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper administrator access
    - Add policies for insert, update, delete and select operations
    
  2. Security
    - Only administrators can modify halls
    - All authenticated users can view halls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Administrators can manage halls" ON halls;
DROP POLICY IF EXISTS "Authenticated users can view halls" ON halls;

-- Create new policies
CREATE POLICY "Enable delete for administrators"
  ON halls
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable insert for administrators"
  ON halls
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON halls
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON halls
  FOR SELECT
  TO authenticated
  USING (true);