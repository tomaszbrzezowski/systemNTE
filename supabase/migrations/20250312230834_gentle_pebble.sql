/*
  # Fix agreement policies and permissions
  
  1. Changes
    - Drop existing policies
    - Create new policies with unique names
    - Grant necessary permissions
    
  2. Security
    - Maintain RLS security
    - Fix permission issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Agreements CRUD policy" ON agreements;
DROP POLICY IF EXISTS "Performances CRUD policy" ON agreement_performances;

-- Create new policies with unique names
CREATE POLICY "agreements_crud_policy_v2"
  ON agreements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "performances_crud_policy_v2"
  ON agreement_performances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agreements TO authenticated;
GRANT ALL ON agreement_performances TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

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