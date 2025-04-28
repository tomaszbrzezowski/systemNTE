/*
  # Fix agreement permissions and policies
  
  1. Changes
    - Drop existing policies
    - Create new simplified policies
    - Grant explicit permissions to authenticated users
    - Fix schema access issues
    
  2. Security
    - Allow authenticated users to create agreements
    - Maintain proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "agreements_crud_policy_v2" ON agreements;
DROP POLICY IF EXISTS "performances_crud_policy_v2" ON agreement_performances;

-- Create new simplified policies
CREATE POLICY "agreements_crud_policy_v3"
  ON agreements
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "performances_crud_policy_v3"
  ON agreement_performances
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Grant schema access
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table access
GRANT ALL ON agreements TO anon;
GRANT ALL ON agreements TO authenticated;
GRANT ALL ON agreements TO service_role;

GRANT ALL ON agreement_performances TO anon;
GRANT ALL ON agreement_performances TO authenticated;
GRANT ALL ON agreement_performances TO service_role;

-- Grant sequence access
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;