/*
  # Update User Policies

  1. Tables
    - Creates users table if it doesn't exist
  
  2. Security
    - Updates RLS policies with simplified rules
    - Improves policy organization and naming
*/

-- Create enum type if it doesn't exist
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('administrator', 'supervisor', 'organizator');

-- Create users table if it doesn't exist
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

-- Drop existing policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON users', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'users'
  );
END $$;

-- Create simplified policies
CREATE POLICY "users_read_self"
ON users FOR SELECT
TO authenticated
USING (
  -- Users can always read their own profile
  auth.uid() = id
);

CREATE POLICY "users_read_admin"
ON users FOR SELECT
TO authenticated
USING (
  -- Admins can read all profiles
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "users_read_supervisor"
ON users FOR SELECT
TO authenticated
USING (
  -- Supervisors can read their assigned organizers
  EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.role = 'organizator'
    AND users.supervisor_id = supervisor.id
  )
);

CREATE POLICY "users_insert_admin"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can create users
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "users_update_self"
ON users FOR UPDATE
TO authenticated
USING (
  -- Users can update their own non-sensitive fields
  auth.uid() = id
)
WITH CHECK (
  -- Cannot change role or supervisor
  role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "users_update_admin"
ON users FOR UPDATE
TO authenticated
USING (
  -- Admins can update any user
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "users_update_supervisor"
ON users FOR UPDATE
TO authenticated
USING (
  -- Supervisors can update their organizers
  EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.role = 'organizator'
    AND users.supervisor_id = supervisor.id
  )
)
WITH CHECK (
  -- Cannot change organizer's role
  role = 'organizator'
);

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;