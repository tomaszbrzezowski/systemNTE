/*
  # Create halls table and add sample data

  1. New Tables
    - `halls`
      - `id` (uuid, primary key)
      - `name` (text) - Hall name
      - `city_name` (text) - City name
      - `address` (text) - Hall address
      - `capacity` (integer) - Seating capacity
      - `notes` (text) - Additional notes
      - `active` (boolean) - Hall status
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS
    - Add policies for administrators to manage records
    - Add policies for authenticated users to view records

  3. Sample Data
    - Add sample halls for testing
*/

-- Create halls table
CREATE TABLE IF NOT EXISTS halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_name text NOT NULL,
  address text NOT NULL,
  capacity integer,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Administrators can manage halls"
  ON halls
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view halls"
  ON halls
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_halls_updated_at
  BEFORE UPDATE ON halls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO halls (name, city_name, address, capacity, notes, active) VALUES
  (
    'Sala Widowiskowa MOK',
    'Warszawa',
    'ul. Kulturalna 5',
    500,
    'Pełne wyposażenie techniczne, duża scena',
    true
  ),
  (
    'Teatr Miejski',
    'Kraków',
    'ul. Teatralna 10',
    300,
    'Klimatyzowana sala, dobra akustyka',
    true
  ),
  (
    'Dom Kultury "Świt"',
    'Wrocław',
    'ul. Artystyczna 15',
    250,
    'Parking dla autokarów, łatwy dojazd',
    true
  ),
  (
    'Centrum Kultury i Sztuki',
    'Poznań',
    'ul. Sceniczna 8',
    400,
    'Nowoczesne nagłośnienie i oświetlenie',
    true
  ),
  (
    'Sala Koncertowa',
    'Gdańsk',
    'ul. Muzyczna 20',
    350,
    'Wymaga remontu, tymczasowo niedostępna',
    false
  );