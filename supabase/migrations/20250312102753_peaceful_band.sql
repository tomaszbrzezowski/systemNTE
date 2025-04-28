/*
  # Create halls table with city reference
  
  1. Changes
    - Create halls table with city reference
    - Add capacity tracking
    - Add active status
    - Add RLS policies
    
  2. Security
    - Enable RLS
    - Only administrators can manage halls
    - All authenticated users can view halls
*/

-- Create halls table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS halls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id uuid REFERENCES cities(id) NOT NULL,
    name text NOT NULL,
    capacity integer NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(city_id, name)
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable delete for administrators" ON halls;
  DROP POLICY IF EXISTS "Enable insert for administrators" ON halls;
  DROP POLICY IF EXISTS "Enable update for administrators" ON halls;
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON halls;
END $$;

-- Create policies
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

-- Create trigger for updated_at if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_halls_updated_at'
  ) THEN
    CREATE TRIGGER update_halls_updated_at
      BEFORE UPDATE ON halls
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;