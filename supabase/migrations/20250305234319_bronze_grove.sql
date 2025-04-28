/*
  # Add sample agreements data and fix RLS policies

  1. Changes
    - Fix RLS policies for agreements and performances tables
    - Add sample agreements data
    - Add sample show titles
    - Add sample performances data

  2. Security
    - Enable RLS on all tables
    - Add proper policies for administrators and authenticated users
*/

-- First create some sample show titles
INSERT INTO show_titles (id, name, active) VALUES
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Zemsta', true),
  ('d290f1ee-6c54-4b01-90e6-d701748f0852', 'Dziady', true),
  ('d290f1ee-6c54-4b01-90e6-d701748f0853', 'Balladyna', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample agreements
INSERT INTO agreements (
  id,
  agreement_number,
  season,
  agreement_date,
  school_name,
  school_address,
  teacher_name,
  teacher_phone,
  teacher_email,
  hall_city_name,
  hall_name
) VALUES
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0854',
    '2024/0001',
    '2024/2025',
    '2024-03-05',
    'Szkoła Podstawowa nr 1',
    'ul. Szkolna 1, 00-001 Warszawa',
    'Anna Kowalska',
    '123-456-789',
    'anna.kowalska@szkola.pl',
    'Warszawa',
    'Dom Kultury Świt'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0855',
    '2024/0002', 
    '2024/2025',
    '2024-03-05',
    'Szkoła Podstawowa nr 2',
    'ul. Edukacyjna 2, 00-002 Kraków',
    'Jan Nowak',
    '987-654-321',
    'jan.nowak@szkola.pl',
    'Kraków',
    'Teatr Ludowy'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample performances
INSERT INTO agreement_performances (
  id,
  agreement_id,
  performance_date,
  show_title_id,
  performance_time,
  paid_tickets,
  unpaid_tickets,
  teacher_tickets,
  cost,
  notes
) VALUES
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0856',
    'd290f1ee-6c54-4b01-90e6-d701748f0854',
    '2024-05-15',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    '10:00',
    150,
    10,
    5,
    3000.00,
    'Spektakl poranny'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0857',
    'd290f1ee-6c54-4b01-90e6-d701748f0854',
    '2024-05-15',
    'd290f1ee-6c54-4b01-90e6-d701748f0852',
    '12:00',
    120,
    8,
    4,
    2400.00,
    'Spektakl południowy'
  ),
  (
    'd290f1ee-6c54-4b01-90e6-d701748f0858',
    'd290f1ee-6c54-4b01-90e6-d701748f0855',
    '2024-06-01',
    'd290f1ee-6c54-4b01-90e6-d701748f0853',
    '11:00',
    200,
    15,
    8,
    4000.00,
    'Spektakl z okazji Dnia Dziecka'
  )
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Administrators can manage agreements" ON agreements;
DROP POLICY IF EXISTS "Authenticated users can view agreements" ON agreements;
DROP POLICY IF EXISTS "Administrators can manage agreement performances" ON agreement_performances;
DROP POLICY IF EXISTS "Authenticated users can view agreement performances" ON agreement_performances;

-- Create new policies for agreements
CREATE POLICY "Enable read for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable delete for administrators"
  ON agreements
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator');

-- Create new policies for agreement performances
CREATE POLICY "Enable read for authenticated users"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON agreement_performances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON agreement_performances
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Enable delete for administrators"
  ON agreement_performances
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator');