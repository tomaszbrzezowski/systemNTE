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
DROP POLICY IF EXISTS "Enable delete for administrators" ON halls;
DROP POLICY IF EXISTS "Enable insert for administrators" ON halls;
DROP POLICY IF EXISTS "Enable update for administrators" ON halls;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON halls;

-- Create new policies
CREATE POLICY "Administrators can manage halls"
  ON halls
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Authenticated users can view halls"
  ON halls
  FOR SELECT
  TO authenticated
  USING (true);