/*
  # Create clients table and related schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text) - Client name
      - `address` (text) - Client address
      - `city` (text) - Client city
      - `postal_code` (text) - Client postal code
      - `nip` (text) - Client NIP number
      - `phone` (text) - Client phone number
      - `email` (text) - Client email
      - `contact_person` (text) - Contact person name
      - `notes` (text) - Additional notes
      - `active` (boolean) - Client status
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `clients` table
    - Add policies for administrators to manage clients
    - Add policies for authenticated users to view clients
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
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

-- Create policies
CREATE POLICY "Administrators can manage clients"
  ON clients
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();