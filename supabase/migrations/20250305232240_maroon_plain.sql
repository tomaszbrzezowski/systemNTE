/*
  # Create agreements and related tables

  1. New Tables
    - `agreements`
      - Basic agreement information
      - Season selection
      - School and teacher details
      - Hall information
    - `agreement_performances`
      - Performance details for each agreement
      - Ticket counts and pricing
      - Time and title information

  2. Security
    - Enable RLS on all tables
    - Only administrators can manage agreements
    - Authenticated users can view agreements
*/

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text NOT NULL UNIQUE,
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

-- Create agreement performances table
CREATE TABLE IF NOT EXISTS agreement_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  performance_date date NOT NULL,
  show_title_id uuid NOT NULL REFERENCES show_titles(id),
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
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_performances ENABLE ROW LEVEL SECURITY;

-- Create policies for agreements
CREATE POLICY "Administrators can manage agreements"
  ON agreements
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view agreements"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for agreement performances
CREATE POLICY "Administrators can manage agreement performances"
  ON agreement_performances
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view agreement performances"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreement_performances_updated_at
  BEFORE UPDATE ON agreement_performances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate agreement number
CREATE OR REPLACE FUNCTION generate_agreement_number()
RETURNS text AS $$
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
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;