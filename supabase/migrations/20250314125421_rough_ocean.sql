/*
  # Create schools list table and policies
  
  1. Changes
    - Create schools_list table if not exists
    - Add indexes for better search performance
    - Add RLS policies with proper checks
    
  2. Security
    - Enable RLS
    - Add policies for read access
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create schools_list table if it doesn't exist
CREATE TABLE IF NOT EXISTS schools_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  voivodeship text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better search performance
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

-- Enable RLS
ALTER TABLE schools_list ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON schools_list;
  DROP POLICY IF EXISTS "Schools list read policy" ON schools_list;
END $$;

-- Create new RLS policy
CREATE POLICY "Schools list read policy"
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