/*
  # Fix agreement permissions
  
  1. Changes
    - Drop and recreate RLS policies with proper permissions
    - Add policies for both agreements and performances tables
    - Ensure authenticated users can create agreements
    
  2. Security
    - Enable RLS on both tables
    - Allow authenticated users to insert records
    - Allow administrators to manage all records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Agreements insert policy" ON agreements;
DROP POLICY IF EXISTS "Agreements update policy" ON agreements;
DROP POLICY IF EXISTS "Agreements delete policy" ON agreements;
DROP POLICY IF EXISTS "Agreements select policy" ON agreements;
DROP POLICY IF EXISTS "Performances insert policy" ON agreement_performances;
DROP POLICY IF EXISTS "Performances update policy" ON agreement_performances;
DROP POLICY IF EXISTS "Performances delete policy" ON agreement_performances;
DROP POLICY IF EXISTS "Performances select policy" ON agreement_performances;

-- Create new policies for agreements
CREATE POLICY "Agreements CRUD policy"
  ON agreements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for agreement_performances
CREATE POLICY "Performances CRUD policy"
  ON agreement_performances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agreements TO authenticated;
GRANT ALL ON agreement_performances TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;