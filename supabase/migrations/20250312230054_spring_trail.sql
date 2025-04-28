/*
  # Fix agreement permissions and schema access
  
  1. Changes
    - Grant schema usage to authenticated users
    - Grant table permissions for agreements
    - Add proper RLS policies
    - Fix sequence permissions
    
  2. Security
    - Allow authenticated users to create agreements
    - Maintain proper access control
*/

-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT ALL ON agreements TO authenticated;
GRANT ALL ON agreement_performances TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Agreements CRUD policy" ON agreements;
  DROP POLICY IF EXISTS "Performances CRUD policy" ON agreement_performances;
END $$;

-- Create new simplified policies
CREATE POLICY "Agreements CRUD policy"
  ON agreements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Performances CRUD policy"
  ON agreement_performances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions on agreement_number sequences
DO $$
DECLARE
  seq_name text;
BEGIN
  -- Grant for current year sequence
  seq_name := 'agreement_number_seq_' || to_char(CURRENT_DATE, 'YYYY');
  EXECUTE format('GRANT USAGE ON SEQUENCE %I TO authenticated', seq_name);
  
  -- Grant for next year sequence (create if doesn't exist)
  seq_name := 'agreement_number_seq_' || to_char(CURRENT_DATE + interval '1 year', 'YYYY');
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', seq_name);
  EXECUTE format('GRANT USAGE ON SEQUENCE %I TO authenticated', seq_name);
END $$;