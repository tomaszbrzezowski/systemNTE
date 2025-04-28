/*
  # Add performance types data and relationships

  1. Changes
    - Add type_id to show_titles if not exists
    - Insert default performance types if not exists
    - No table creation (already exists)
    
  2. Notes
    - Safe to run multiple times
    - Preserves existing data
*/

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
  unnest(ARRAY['Dla młodszych', 'Dla starszych', 'Dla młodzieży', 'Dla dorosłych']),
  unnest(ARRAY[7, 13, 16, 18]),
  unnest(ARRAY[12, 15, 18, null]),
  unnest(ARRAY[
    'Spektakle dedykowane dla uczniów szkół podstawowych (klasy 1-6)',
    'Spektakle dedykowane dla uczniów szkół podstawowych (klasy 7-8)',
    'Spektakle dedykowane dla uczniów szkół ponadpodstawowych',
    'Spektakle dedykowane dla widzów dorosłych'
  ])
WHERE NOT EXISTS (
  SELECT 1 FROM performance_types
);