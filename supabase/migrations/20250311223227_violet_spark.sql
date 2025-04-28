/*
  # Fix performance types table

  1. Changes
    - Drop existing table and recreate without age columns
    - Insert new performance types without age ranges
    - Update show_titles references
*/

-- Drop existing table and recreate
DROP TABLE IF EXISTS performance_types CASCADE;

CREATE TABLE performance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE performance_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Administrators can manage performance types"
  ON performance_types
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view performance types"
  ON performance_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_performance_types_updated_at
  BEFORE UPDATE ON performance_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert new types without age ranges
INSERT INTO performance_types (name, description)
VALUES 
  ('Dzieci Młodsze', 'Spektakle dedykowane dla młodszych dzieci'),
  ('Dzieci Starsze', 'Spektakle dedykowane dla starszych dzieci'),
  ('Młodzież', 'Spektakle dedykowane dla młodzieży'),
  ('Szkoły średnie', 'Spektakle dedykowane dla szkół średnich');

-- Add type_id to show_titles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'show_titles' AND column_name = 'type_id'
  ) THEN
    ALTER TABLE show_titles
    ADD COLUMN type_id uuid REFERENCES performance_types(id);
  END IF;
END $$;