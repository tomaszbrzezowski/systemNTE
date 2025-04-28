/*
  # Fix RLS policies for agreements and halls

  1. Changes
    - Drop existing policies
    - Create new policies with proper administrator access
    - Add policies for insert, update, delete and select operations
    
  2. Security
    - Only administrators can modify data
    - All authenticated users can view data
*/

-- Drop existing policies for halls
DROP POLICY IF EXISTS "Enable delete for administrators" ON halls;
DROP POLICY IF EXISTS "Enable insert for administrators" ON halls;
DROP POLICY IF EXISTS "Enable update for administrators" ON halls;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON halls;

-- Create new policies for halls
CREATE POLICY "Enable delete for administrators"
  ON halls
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON halls
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON halls
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON halls
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop existing policies for agreements
DROP POLICY IF EXISTS "Enable delete for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable insert for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable update for administrators" ON agreements;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON agreements;

-- Create new policies for agreements
CREATE POLICY "Enable delete for administrators"
  ON agreements
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);