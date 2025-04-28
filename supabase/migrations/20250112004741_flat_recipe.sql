/*
  # Fix RLS Policies Recursion

  This migration fixes the infinite recursion issue in the users table policies
  while maintaining the same security model.

  1. Drop existing policies
  2. Create new non-recursive policies
  3. Add simplified supervisor access checks
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can do everything on users" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Admins can do everything on cities" ON cities;
DROP POLICY IF EXISTS "Users can read assigned cities" ON cities;
DROP POLICY IF EXISTS "Admins can do everything on calendars" ON calendars;
DROP POLICY IF EXISTS "All users can read calendars" ON calendars;
DROP POLICY IF EXISTS "Admins can do everything on calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "All users can read calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert events" ON calendar_events;

-- Users Table Policies (Fixed)
CREATE POLICY "Users full access policy"
ON users
FOR ALL
TO authenticated
USING (
  -- Admins can access all users
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can access their own data
  auth.uid() = id OR
  -- Supervisors can access users where they are listed as supervisor
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    auth.uid() = supervisor_id
  )
)
WITH CHECK (
  -- Only admins can modify user data
  auth.jwt() ->> 'role' = 'administrator'
);

-- Cities Table Policies
CREATE POLICY "Cities access policy"
ON cities
FOR ALL
TO authenticated
USING (
  -- Admins can access all cities
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can access their assigned cities
  id = ANY(COALESCE((
    SELECT assigned_city_ids 
    FROM users 
    WHERE id = auth.uid()
  ), '{}'))
)
WITH CHECK (
  -- Only admins can modify cities
  auth.jwt() ->> 'role' = 'administrator'
);

-- Calendars Table Policies
CREATE POLICY "Calendars access policy"
ON calendars
FOR ALL
TO authenticated
USING (
  -- Everyone can read calendars
  true
)
WITH CHECK (
  -- Only admins can modify calendars
  auth.jwt() ->> 'role' = 'administrator'
);

-- Calendar Events Table Policies
CREATE POLICY "Calendar events access policy"
ON calendar_events
FOR ALL
TO authenticated
USING (
  -- Everyone can read events
  true
)
WITH CHECK (
  -- Admins can modify any event
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can modify their own events
  auth.uid() = user_id OR
  -- Supervisors can modify their organizers' events
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = calendar_events.user_id 
      AND supervisor_id = auth.uid()
    )
  )
);