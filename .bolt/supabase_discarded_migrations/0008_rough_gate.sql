/*
  # Fix user policies - Final revision

  1. Changes
    - Drop all existing policies first
    - Create new comprehensive policies
    - Add validation function
    - Fix policy naming conflicts
  
  2. Security
    - Maintain strict access control
    - Prevent unauthorized updates
    - Allow necessary operations per role
*/

-- First drop ALL existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop all policies for users table
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON users', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'users'
  );
END $$;

-- Create new comprehensive policies with unique names
CREATE POLICY "users_select_20240319"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_insert_service_20240319"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "users_admin_update_20240319"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  )
);

CREATE POLICY "users_self_update_20240319"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid() AND
  role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid()) AND
  organizer_ids IS NOT DISTINCT FROM (SELECT organizer_ids FROM users WHERE id = auth.uid())
);

CREATE POLICY "users_supervisor_organizers_20240319"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.role = 'organizator'
    AND users.id = ANY(supervisor.organizer_ids)
  )
)
WITH CHECK (
  role = 'organizator'
);

-- Ensure proper grants
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Add function to validate user updates
CREATE OR REPLACE FUNCTION check_user_update_permission(updating_user_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if updating user is administrator
  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = updating_user_id
    AND role = 'administrator'
  ) THEN
    RETURN true;
  END IF;

  -- Check if user is updating their own profile
  IF updating_user_id = target_user_id THEN
    RETURN true;
  END IF;

  -- Check if updating user is supervisor updating their organizer
  IF EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = updating_user_id
    AND supervisor.role = 'supervisor'
    AND EXISTS (
      SELECT 1 FROM users organizer
      WHERE organizer.id = target_user_id
      AND organizer.role = 'organizator'
      AND organizer.id = ANY(supervisor.organizer_ids)
    )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;