-- Drop existing clients table if it exists
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table
CREATE TABLE clients (
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

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable delete for administrators"
  ON clients
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable insert for administrators"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable update for administrators"
  ON clients
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Enable read for authenticated users"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();