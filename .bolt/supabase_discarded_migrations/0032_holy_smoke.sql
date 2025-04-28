/*
  # Update User Table and Policies

  1. Tables
    - Creates users table if it doesn't exist
  
  2. Security
    - Updates RLS policies with simplified rules
    - Adds service role bypass
    - Improves policy organization
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create service role policy for initial user creation
CREATE POLICY "users_insert_service"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

-- Create simplified user policies
CREATE POLICY "users_read_all"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE (
      -- Users can read their own profile
      u.id = auth.uid()
      -- Admins can read all profiles
      OR u.role = 'administrator'
      -- Supervisors can read their organizers
      OR (
        u.role = 'supervisor'
        AND u.id = auth.uid()
        AND users.role = 'organizator'
        AND users.supervisor_id = u.id
      )
    )
    AND u.id = auth.uid()
  )
);

CREATE POLICY "users_insert_admin"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "users_update_all"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE (
      -- Users can update their own profile
      u.id = auth.uid()
      -- Admins can update any user
      OR u.role = 'administrator'
      -- Supervisors can update their organizers
      OR (
        u.role = 'supervisor'
        AND u.id = auth.uid()
        AND users.role = 'organizator'
        AND users.supervisor_id = u.id
      )
    )
    AND u.id = auth.uid()
  )
)
WITH CHECK (
  CASE
    -- Users can't change their own role
    WHEN auth.uid() = id THEN
      role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid())
      AND supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid())
    -- Admins can do anything
    WHEN EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'administrator'
    ) THEN
      true
    -- Supervisors can only manage organizers
    WHEN EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'supervisor'
    ) THEN
      role = 'organizator'
    ELSE
      false
  END
);

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;