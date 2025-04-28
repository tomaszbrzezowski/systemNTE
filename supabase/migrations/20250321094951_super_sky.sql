/*
  # Rollback schools schema and create schools_list table
  
  1. Changes
    - Drop schools schema and all its tables
    - Create single schools_list table
    - Add proper indexes and RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for administrators and read access
*/

-- Drop schools schema
DROP SCHEMA IF EXISTS schools CASCADE;

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing table if it exists
DROP TABLE IF EXISTS schools_list CASCADE;

-- Create schools_list table
CREATE TABLE schools_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voivodeship text NOT NULL,
  city text NOT NULL,
  school_name text NOT NULL,
  street text NOT NULL,
  home_number text NOT NULL,
  local_number text,
  postcode text NOT NULL,
  post text NOT NULL,
  website text,
  search_text text GENERATED ALWAYS AS (
    school_name || ' ' || 
    city || ' ' || 
    voivodeship || ' ' || 
    street || ' ' || 
    home_number || ' ' || 
    COALESCE(local_number, '') || ' ' || 
    postcode || ' ' || 
    post || ' ' || 
    COALESCE(website, '')
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE schools_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for administrators"
  ON schools_list
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read access for authenticated users"
  ON schools_list
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better search performance
CREATE INDEX idx_schools_list_search ON schools_list USING gin (search_text gin_trgm_ops);
CREATE INDEX idx_schools_list_voivodeship ON schools_list(voivodeship);
CREATE INDEX idx_schools_list_city ON schools_list(city);
CREATE INDEX idx_schools_list_postcode ON schools_list(postcode);

-- Create trigger for updated_at
CREATE TRIGGER update_schools_list_updated_at
  BEFORE UPDATE ON schools_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();