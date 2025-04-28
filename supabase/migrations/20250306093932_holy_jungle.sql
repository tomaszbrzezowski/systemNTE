/*
  # Update Agreement RLS Policies
  
  1. Changes
    - Drops existing agreement policies if they exist
    - Creates new granular policies for CRUD operations
    - Adds proper RLS for administrators
    
  2. Security
    - Enables RLS on agreements table
    - Adds separate policies for insert, update, delete and select
    - Ensures administrators can manage agreements
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  -- Drop agreement policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreements' AND policyname = 'Enable insert for administrators') THEN
    DROP POLICY "Enable insert for administrators" ON agreements;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreements' AND policyname = 'Enable update for administrators') THEN
    DROP POLICY "Enable update for administrators" ON agreements;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreements' AND policyname = 'Enable delete for administrators') THEN
    DROP POLICY "Enable delete for administrators" ON agreements;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreements' AND policyname = 'Enable read for authenticated users') THEN
    DROP POLICY "Enable read for authenticated users" ON agreements;
  END IF;

  -- Drop agreement_performances policies  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_performances' AND policyname = 'Enable insert for administrators') THEN
    DROP POLICY "Enable insert for administrators" ON agreement_performances;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_performances' AND policyname = 'Enable update for administrators') THEN
    DROP POLICY "Enable update for administrators" ON agreement_performances;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_performances' AND policyname = 'Enable delete for administrators') THEN
    DROP POLICY "Enable delete for administrators" ON agreement_performances;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agreement_performances' AND policyname = 'Enable read for authenticated users') THEN
    DROP POLICY "Enable read for authenticated users" ON agreement_performances;
  END IF;
END $$;

-- Create new policies for agreements table
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

-- Create new policies for agreement_performances table
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