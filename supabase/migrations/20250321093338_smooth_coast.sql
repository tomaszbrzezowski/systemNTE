/*
  # Create schools schema with voivodeship tables
  
  1. Changes
    - Create new schools schema
    - Create table for each voivodeship
    - Add proper indexes and RLS policies
    - Add triggers for updated_at
    
  2. Security
    - Enable RLS on all tables
    - Add policies for read access
*/

-- Create new schema
CREATE SCHEMA schools;

-- Create base table template function
CREATE OR REPLACE FUNCTION schools.create_voivodeship_table(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE schools.%I (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_name text NOT NULL,
      street text NOT NULL,
      home_number text NOT NULL,
      local_number text,
      postcode text NOT NULL,
      post text NOT NULL,
      city text NOT NULL,
      website text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )', table_name);

  -- Enable RLS
  EXECUTE format('ALTER TABLE schools.%I ENABLE ROW LEVEL SECURITY', table_name);

  -- Create read policy
  EXECUTE format('
    CREATE POLICY "Enable read access for authenticated users"
    ON schools.%I
    FOR SELECT
    TO authenticated
    USING (true)
  ', table_name);

  -- Create search indexes
  EXECUTE format('
    CREATE INDEX idx_%I_name ON schools.%I USING gin (school_name gin_trgm_ops)
  ', table_name, table_name);
  
  EXECUTE format('
    CREATE INDEX idx_%I_city ON schools.%I(city)
  ', table_name, table_name);

  -- Create updated_at trigger
  EXECUTE format('
    CREATE TRIGGER update_%I_updated_at
    BEFORE UPDATE ON schools.%I
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  ', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Create tables for each voivodeship
SELECT schools.create_voivodeship_table('dolnoslaskie');
SELECT schools.create_voivodeship_table('kujawsko_pomorskie');
SELECT schools.create_voivodeship_table('lubelskie');
SELECT schools.create_voivodeship_table('lubuskie');
SELECT schools.create_voivodeship_table('mazowieckie');
SELECT schools.create_voivodeship_table('malopolskie');
SELECT schools.create_voivodeship_table('opolskie');
SELECT schools.create_voivodeship_table('podkarpackie');
SELECT schools.create_voivodeship_table('podlaskie');
SELECT schools.create_voivodeship_table('pomorskie');
SELECT schools.create_voivodeship_table('warminsko_mazurskie');
SELECT schools.create_voivodeship_table('wielkopolskie');
SELECT schools.create_voivodeship_table('zachodniopomorskie');
SELECT schools.create_voivodeship_table('lodzkie');
SELECT schools.create_voivodeship_table('slaskie');
SELECT schools.create_voivodeship_table('swietokrzyskie');

-- Drop the helper function
DROP FUNCTION schools.create_voivodeship_table(text);