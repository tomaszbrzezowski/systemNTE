/*
  # Store school and teacher data in clients table
  
  1. Changes
    - Create trigger to store school and teacher data in clients table
    - Add function to handle data storage
    - Update RLS policies for clients table
*/

-- Create function to store school and teacher data
CREATE OR REPLACE FUNCTION store_school_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update client record
  INSERT INTO clients (
    name,
    address,
    city,
    postal_code,
    nip,
    phone,
    email,
    contact_person,
    notes,
    active
  )
  VALUES (
    NEW.school_name,
    NEW.school_address,
    NEW.hall_city_name, -- Using hall city as the client city
    COALESCE(SUBSTRING(NEW.school_address FROM '\d{2}-\d{3}'), '00-000'), -- Extract postal code or use default
    '0000000000', -- Default NIP since it's required but not provided
    NEW.teacher_phone,
    NEW.teacher_email,
    NEW.teacher_name,
    'Dodano automatycznie z umowy nr ' || NEW.agreement_number,
    true
  )
  ON CONFLICT (name, address) DO UPDATE
  SET
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    contact_person = EXCLUDED.contact_person,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER store_school_data_trigger
  AFTER INSERT OR UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION store_school_data();

-- Update RLS policies for clients table
DROP POLICY IF EXISTS "Enable delete for administrators" ON clients;
DROP POLICY IF EXISTS "Enable insert for administrators" ON clients;
DROP POLICY IF EXISTS "Enable update for administrators" ON clients;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON clients;

CREATE POLICY "Clients delete policy"
  ON clients
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Clients insert policy"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Clients update policy"
  ON clients
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'administrator')
  WITH CHECK ((auth.jwt() ->> 'role') = 'administrator');

CREATE POLICY "Clients select policy"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);