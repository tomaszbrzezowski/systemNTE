/*
  # Initial Schema Setup

  1. Tables
    - Creates users table with required columns and constraints
  
  2. Security
    - Enables RLS
    - Sets up access policies for different user roles
*/

-- Create enum type for user roles if it doesn't exist
CREATE TYPE user_role AS ENUM ('administrator', 'supervisor', 'organizator');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'organizator',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_city_ids UUID[] DEFAULT '{}',
  supervisor_id UUID REFERENCES users(id),
  organizer_ids UUID[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_read_own_profile"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "allow_read_as_admin"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "allow_read_as_supervisor"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.id = ANY(supervisor.organizer_ids)
  )
);

CREATE POLICY "allow_insert_as_admin"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "allow_update_own_profile"
ON users FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid()) AND
  organizer_ids IS NOT DISTINCT FROM (SELECT organizer_ids FROM users WHERE id = auth.uid())
);

CREATE POLICY "allow_update_as_admin"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "allow_update_organizers_as_supervisor"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.id = ANY(supervisor.organizer_ids)
  )
)
WITH CHECK (
  role = 'organizator'
);

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;