/*
  # Create teachers and schools tables

  1. New Tables
    - `schools`
      - `id` (uuid, primary key)
      - `name` (text) - School name
      - `address` (text) - School address
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

    - `teachers`
      - `id` (uuid, primary key)
      - `name` (text) - Teacher name
      - `phone` (text) - Teacher phone
      - `email` (text) - Teacher email
      - `school_id` (uuid) - Reference to school
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for administrators to manage records
    - Add policies for authenticated users to view records

  3. Triggers
    - Add updated_at triggers for both tables
*/

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Administrators can manage schools"
  ON schools
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view schools"
  ON schools
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for teachers
CREATE POLICY "Administrators can manage teachers"
  ON teachers
  TO authenticated
  USING ((auth.jwt() ->> 'role'::text) = 'administrator'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'administrator'::text);

CREATE POLICY "Authenticated users can view teachers"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to store teacher and school from agreement
CREATE OR REPLACE FUNCTION store_teacher_and_school() 
RETURNS TRIGGER AS $$
DECLARE
  school_id uuid;
  teacher_id uuid;
BEGIN
  -- Insert or update school
  INSERT INTO schools (name, address)
  VALUES (NEW.school_name, NEW.school_address)
  ON CONFLICT (name, address) DO UPDATE
  SET updated_at = now()
  RETURNING id INTO school_id;

  -- Insert or update teacher
  INSERT INTO teachers (name, phone, email, school_id)
  VALUES (NEW.teacher_name, NEW.teacher_phone, NEW.teacher_email, school_id)
  ON CONFLICT (name, phone, email) DO UPDATE
  SET updated_at = now(), school_id = EXCLUDED.school_id
  RETURNING id INTO teacher_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on agreements table
CREATE TRIGGER store_teacher_and_school_trigger
  AFTER INSERT OR UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION store_teacher_and_school();