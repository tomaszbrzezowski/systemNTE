/*
  # Create agreements schema and tables

  1. New Schema
    - Creates dedicated `agreements` schema
    - Adds tables for clients and agreements
    - Sets up proper RLS policies and security

  2. New Tables
    - `agreements.clients`: Store client information
    - `agreements.agreements`: Store agreement details
    - `agreements.performances`: Store performance details
*/

-- Create schema
CREATE SCHEMA IF NOT EXISTS agreements;

-- Create clients table
CREATE TABLE agreements.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  nip text NOT NULL,
  phone text,
  email text,
  contact_person text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agreements table
CREATE TABLE agreements.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES agreements.clients(id),
  agreement_number text UNIQUE NOT NULL,
  agreement_date date NOT NULL,
  season text NOT NULL,
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

-- Create performances table
CREATE TABLE agreements.performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements.agreements(id) ON DELETE CASCADE,
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
ALTER TABLE agreements.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements.performances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Administrators can manage clients"
  ON agreements.clients
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view clients"
  ON agreements.clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage agreements"
  ON agreements.agreements
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view agreements"
  ON agreements.agreements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage performances"
  ON agreements.performances
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view performances"
  ON agreements.performances
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at function
CREATE OR REPLACE FUNCTION agreements.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON agreements.clients
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements.agreements
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();

CREATE TRIGGER update_performances_updated_at
  BEFORE UPDATE ON agreements.performances
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();