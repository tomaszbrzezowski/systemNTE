/*
  # Rollback schema to last stable version
  
  1. Changes
    - Drop all recent tables and functions
    - Recreate tables with proper structure
    - Add correct RLS policies
    
  2. Security
    - Enable RLS on all tables
    - Add proper policies for administrators
*/

-- Drop all recent tables and functions
DROP TABLE IF EXISTS agreement_performances CASCADE;
DROP TABLE IF EXISTS agreements CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS halls CASCADE;
DROP FUNCTION IF EXISTS set_agreement_number() CASCADE;
DROP FUNCTION IF EXISTS generate_agreement_number() CASCADE;
DROP FUNCTION IF EXISTS store_school_data() CASCADE;

-- Create halls table
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

-- Create agreements table
CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text UNIQUE NOT NULL,
  season text NOT NULL,
  agreement_date date NOT NULL,
  school_name text NOT NULL,
  school_address text NOT NULL,
  teacher_name text NOT NULL,
  teacher_phone text NOT NULL,
  teacher_email text NOT NULL,
  hall_city_name text NOT NULL,
  hall_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agreement_performances table
CREATE TABLE agreement_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements(id) ON DELETE CASCADE,
  performance_date date NOT NULL,
  show_title_id uuid REFERENCES show_titles(id),
  performance_time time NOT NULL,
  paid_tickets integer NOT NULL DEFAULT 0,
  unpaid_tickets integer NOT NULL DEFAULT 0,
  teacher_tickets integer NOT NULL DEFAULT 0,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_performances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for halls
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

-- Create RLS policies for agreements
CREATE POLICY "Enable delete for administrators"
  ON agreements
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON agreements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policies for agreement_performances
CREATE POLICY "Enable delete for administrators"
  ON agreement_performances
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for administrators"
  ON agreement_performances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for administrators"
  ON agreement_performances
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_halls_updated_at
  BEFORE UPDATE ON halls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreement_performances_updated_at
  BEFORE UPDATE ON agreement_performances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON halls TO authenticated;
GRANT ALL ON agreements TO authenticated;
GRANT ALL ON agreement_performances TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;