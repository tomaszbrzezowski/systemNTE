/*
  # Lock Map View Files

  1. New Table
    - `locked_files`
      - `id` (uuid, primary key)
      - `file_path` (text, unique)
      - `locked_at` (timestamptz)
      - `locked_by` (text)
      - `reason` (text)

  2. Security
    - Enable RLS on `locked_files` table
    - Add policy for administrators to manage locked files
    - Add policy for authenticated users to view locked files

  3. Initial Data
    - Lock critical map view files
*/

-- Create locked files table
CREATE TABLE IF NOT EXISTS locked_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text UNIQUE NOT NULL,
  locked_at timestamptz DEFAULT now(),
  locked_by text NOT NULL,
  reason text
);

-- Enable RLS
ALTER TABLE locked_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Administrators can manage locked files"
  ON locked_files
  FOR ALL
  TO authenticated
  USING ((jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view locked files"
  ON locked_files
  FOR SELECT
  TO authenticated
  USING (true);

-- Lock critical map files
INSERT INTO locked_files (file_path, locked_by, reason) VALUES
  ('src/components/map/MapView.tsx', 'system', 'Critical map view component with complex business logic'),
  ('src/components/map/MapFilters.tsx', 'system', 'Map filters component with user role-based filtering'),
  ('src/components/map/SeasonSelector.tsx', 'system', 'Season selector component for map view');