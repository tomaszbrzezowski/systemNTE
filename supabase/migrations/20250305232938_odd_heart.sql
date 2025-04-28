/*
  # Create agreements and related tables

  1. New Tables
    - `agreements`
      - Basic agreement information including:
        - Agreement number (auto-generated)
        - Season
        - School and teacher details
        - Hall information
    - `agreement_performances`
      - Performance details linked to agreements
      - Ticket counts and pricing
      - Show title reference

  2. Security
    - Enable RLS on all tables
    - Administrators can manage agreements
    - All authenticated users can view agreements
*/

-- Create function to generate agreement number if it doesn't exist
DO $$ BEGIN
  CREATE OR REPLACE FUNCTION generate_agreement_number()
  RETURNS text AS $func$
  DECLARE
    year text;
    counter integer;
    new_number text;
  BEGIN
    year := to_char(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
    INTO counter
    FROM agreements
    WHERE agreement_number LIKE year || '/%';
    
    new_number := year || '/' || LPAD(counter::text, 4, '0');
    
    RETURN new_number;
  END;
  $func$ LANGUAGE plpgsql;
END $$;

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text NOT NULL UNIQUE DEFAULT generate_agreement_number(),
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

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Administrators can manage agreements" ON agreements;
  DROP POLICY IF EXISTS "Authenticated users can view agreements" ON agreements;
  DROP POLICY IF EXISTS "Administrators can manage agreement performances" ON agreement_performances;
  DROP POLICY IF EXISTS "Authenticated users can view agreement performances" ON agreement_performances;
END $$;

-- Create policies for agreements
CREATE POLICY "Administrators can manage agreements"
  ON agreements
  TO authenticated
  USING ((current_user = 'authenticated' AND auth.jwt() ->> 'role' = 'administrator'))
  WITH CHECK ((current_user = 'authenticated' AND auth.jwt() ->> 'role' = 'administrator'));

CREATE POLICY "Authenticated users can view agreements"
  ON agreements
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for agreement performances
CREATE POLICY "Administrators can manage agreement performances"
  ON agreement_performances
  TO authenticated
  USING ((current_user = 'authenticated' AND auth.jwt() ->> 'role' = 'administrator'))
  WITH CHECK ((current_user = 'authenticated' AND auth.jwt() ->> 'role' = 'administrator'));

CREATE POLICY "Authenticated users can view agreement performances"
  ON agreement_performances
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at triggers if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_agreements_updated_at'
  ) THEN
    CREATE TRIGGER update_agreements_updated_at
      BEFORE UPDATE ON agreements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_agreement_performances_updated_at'
  ) THEN
    CREATE TRIGGER update_agreement_performances_updated_at
      BEFORE UPDATE ON agreement_performances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;