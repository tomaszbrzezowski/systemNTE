/*
  # Add performance types

  1. Changes
    - Create performance_types table
    - Add type_id to show_titles table
    - Add default performance types
    - Update RLS policies
    
  2. Types
    - For younger audiences (ages 7-12)
    - For older audiences (ages 13-15)
    - For regular audiences (ages 16-18)
    - For adult audiences (ages 18+)
*/

-- Create performance_types table
CREATE TABLE performance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_age integer NOT NULL,
  max_age integer,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add type_id to show_titles
ALTER TABLE show_titles
ADD COLUMN type_id uuid REFERENCES performance_types(id);

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

-- Insert default performance types
INSERT INTO performance_types (name, min_age, max_age, description) VALUES
  ('Dla młodszych', 7, 12, 'Spektakle dedykowane dla uczniów szkół podstawowych (klasy 1-6)'),
  ('Dla starszych', 13, 15, 'Spektakle dedykowane dla uczniów szkół podstawowych (klasy 7-8)'),
  ('Dla młodzieży', 16, 18, 'Spektakle dedykowane dla uczniów szkół ponadpodstawowych'),
  ('Dla dorosłych', 18, null, 'Spektakle dedykowane dla widzów dorosłych');