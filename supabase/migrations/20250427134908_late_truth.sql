/*
  # Fix halls table API access
  
  1. Changes
    - Create a new policy to allow public SELECT access to halls table
    - Ensure the halls table is properly exposed to the REST API
    - Fix foreign key relationship between halls and cities
    
  2. Security
    - Allow public SELECT access while maintaining write protection
    - Ensure proper data access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable delete for administrators" ON halls;
DROP POLICY IF EXISTS "Enable insert for administrators" ON halls;
DROP POLICY IF EXISTS "Enable update for administrators" ON halls;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON halls;
DROP POLICY IF EXISTS "Allow select for everyone" ON halls;

-- Create new policies for halls
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

-- Create a policy that allows everyone to SELECT from the halls table
CREATE POLICY "Allow select for everyone"
  ON halls
  FOR SELECT
  USING (true);

-- Ensure the foreign key relationship is correct
DO $$ 
BEGIN
  -- Check if the foreign key exists and is correct
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'halls'
    AND ccu.table_name = 'cities'
    AND ccu.column_name = 'id'
  ) THEN
    -- If the foreign key doesn't exist or is incorrect, recreate it
    ALTER TABLE halls DROP CONSTRAINT IF EXISTS halls_city_id_fkey;
    ALTER TABLE halls ADD CONSTRAINT halls_city_id_fkey 
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_halls_city_id ON halls(city_id);

-- Analyze the table for better query planning
ANALYZE halls;