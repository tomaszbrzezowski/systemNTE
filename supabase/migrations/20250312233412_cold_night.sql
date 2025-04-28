/*
  # Fix agreements storage and permissions
  
  1. Changes
    - Drop and recreate tables with proper structure
    - Add agreement number generation
    - Fix RLS policies and permissions
    - Grant proper access to authenticated users
    
  2. Security
    - Enable RLS on all tables
    - Allow authenticated users to create agreements
    - Maintain proper access control
*/

-- Drop existing tables and functions
DROP TABLE IF EXISTS agreement_performances CASCADE;
DROP TABLE IF EXISTS agreements CASCADE;
DROP FUNCTION IF EXISTS set_agreement_number() CASCADE;

-- Create agreements table
CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text UNIQUE,
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

-- Create function for agreement number generation
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  counter integer;
  new_number text;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get current counter for this year
  SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
  INTO counter
  FROM agreements
  WHERE agreement_number LIKE year || '/%';
  
  -- Generate new number
  new_number := year || '/' || LPAD(counter::text, 4, '0');
  
  -- Set the new number
  NEW.agreement_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agreement number generation
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  WHEN (NEW.agreement_number IS NULL)
  EXECUTE FUNCTION set_agreement_number();

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_performances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agreements
CREATE POLICY "Enable all operations for authenticated users"
  ON agreements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for agreement_performances
CREATE POLICY "Enable all operations for authenticated users"
  ON agreement_performances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at triggers
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
GRANT ALL ON agreements TO authenticated;
GRANT ALL ON agreement_performances TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke public access
REVOKE ALL ON agreements FROM public;
REVOKE ALL ON agreement_performances FROM public;