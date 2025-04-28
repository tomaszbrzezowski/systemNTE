/*
  # Add search optimization to schools list table
  
  1. Changes
    - Add search indexes if they don't exist
    - Add RLS policies if they don't exist
    - Add updated_at trigger if it doesn't exist
    
  2. Notes
    - Safe to run even if table exists
    - Preserves existing data
    - Improves search performance
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_schools_list_name'
  ) THEN
    CREATE INDEX idx_schools_list_name ON schools_list USING gin (name gin_trgm_ops);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_schools_list_city'
  ) THEN
    CREATE INDEX idx_schools_list_city ON schools_list USING btree (city);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_schools_list_voivodeship'
  ) THEN
    CREATE INDEX idx_schools_list_voivodeship ON schools_list USING btree (voivodeship);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE schools_list ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON schools_list;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
  ON schools_list
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_schools_list_updated_at'
  ) THEN
    CREATE TRIGGER update_schools_list_updated_at
      BEFORE UPDATE ON schools_list
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;