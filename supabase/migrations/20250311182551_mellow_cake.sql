/*
  # Create Agreements Schema

  1. New Schema
    - Creates dedicated `agreements` schema
    - Sets up tables for clients and agreements
    - Links with existing calendar_events table
    
  2. Tables
    - clients: Store client information
    - agreements: Main agreements table
    - agreement_items: Line items for agreements
    - payment_terms: Payment schedules
*/

-- Create new schema
CREATE SCHEMA agreements;

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
  calendar_event_id uuid REFERENCES public.calendar_events(id),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agreement_items table
CREATE TABLE agreements.agreement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements.agreements(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_terms table
CREATE TABLE agreements.payment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid REFERENCES agreements.agreements(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agreements.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements.agreement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements.payment_terms ENABLE ROW LEVEL SECURITY;

-- Create updated_at function
CREATE OR REPLACE FUNCTION agreements.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON agreements.clients
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements.agreements
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();

CREATE TRIGGER update_agreement_items_updated_at
  BEFORE UPDATE ON agreements.agreement_items
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();

CREATE TRIGGER update_payment_terms_updated_at
  BEFORE UPDATE ON agreements.payment_terms
  FOR EACH ROW
  EXECUTE FUNCTION agreements.update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Administrators can manage clients"
  ON agreements.clients
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
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view agreements"
  ON agreements.agreements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage agreement items"
  ON agreements.agreement_items
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view agreement items"
  ON agreements.agreement_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators can manage payment terms"
  ON agreements.payment_terms
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'administrator')
  WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can view payment terms"
  ON agreements.payment_terms
  FOR SELECT
  TO authenticated
  USING (true);