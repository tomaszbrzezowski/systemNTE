/*
  # Add performance types and update show titles

  1. Changes
    - Safely create performance_types table if it doesn't exist
    - Add type_id to show_titles if needed
    - Insert default performance types
    - Add RLS policies
*/

-- First check if table exists and create if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'performance_types'
  ) THEN
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
  END IF;
END $$;

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

-- Insert default performance types if they don't exist
INSERT INTO performance_types (name, min_age, max_age, description)
SELECT 
  t.name, t.min_age, t.max_age, t.description
FROM (
  VALUES 
    ('Dla młodszych', 7, 12, 'Spektakle dedykowane dla uczniów szkół podstawowych (klasy 1-6)'),
    ('Dla starszych', 13, 15, 'Spektakle dedykowane dla uczniów szkół podstawowych (klasy 7-8)'),
    ('Dla młodzieży', 16, 18, 'Spektakle dedykowane dla uczniów szkół ponadpodstawowych'),
    ('Dla dorosłych', 18, null, 'Spektakle dedykowane dla widzów dorosłych')
) AS t(name, min_age, max_age, description)
WHERE NOT EXISTS (
  SELECT 1 FROM performance_types 
  WHERE name = t.name
);