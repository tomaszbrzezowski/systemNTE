/*
  # Add schools list table and search optimization
  
  1. Changes
    - Create schools_list table if it doesn't exist
    - Add search indexes for better performance
    - Add RLS policies
    
  2. Security
    - Enable RLS
    - Add policies for read access
*/

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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE schools_list ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Schools list read policy"
  ON schools_list
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better search performance
CREATE INDEX idx_schools_list_name ON schools_list USING gin (school_name gin_trgm_ops);
CREATE INDEX idx_schools_list_city ON schools_list USING btree (city);
CREATE INDEX idx_schools_list_voivodeship ON schools_list USING btree (voivodeship);

-- Create trigger for updated_at
CREATE TRIGGER update_schools_list_updated_at
  BEFORE UPDATE ON schools_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();