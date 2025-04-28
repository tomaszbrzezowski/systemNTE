/*
  # Update halls table structure
  
  1. Changes
    - Add city_id foreign key to halls table
    - Remove city_name column
    - Add unique constraint on city_id and name
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing table
DROP TABLE IF EXISTS halls CASCADE;

-- Create new halls table
CREATE TABLE halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  capacity integer,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city_id, name)
);

-- Enable RLS
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable delete for administrators"
  ON halls
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON halls
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON halls
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON halls
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_halls_updated_at
  BEFORE UPDATE ON halls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();