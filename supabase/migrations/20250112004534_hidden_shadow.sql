/*
  # Add Row Level Security Policies

  This migration adds RLS policies to protect data access while maintaining app functionality.

  1. Enable RLS
    - Enable RLS on all tables
    - Disable direct table access
  
  2. Users Table Policies
    - Admins can do everything
    - Users can read their own data and assigned organizers
    - Supervisors can read their organizers' data
  
  3. Cities Table Policies
    - Admins can do everything
    - Users can read cities assigned to them
    - Users can read cities assigned to their organizers
  
  4. Calendars Table Policies
    - Admins can do everything
    - All authenticated users can read
    - Only admins can create/update/delete
  
  5. Calendar Events Table Policies
    - Admins can do everything
    - Users can read all events
    - Users can update their own events
    - Users can update events assigned to their organizers
*/

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Admins can do everything on users"
ON users
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  -- Supervisors can read their organizers' data
  (
    auth.jwt() ->> 'role' = 'supervisor' AND
    id = ANY(COALESCE((
      SELECT organizer_ids 
      FROM users 
      WHERE id = auth.uid()
    ), '{}'))
  )
);

-- Cities Table Policies
CREATE POLICY "Admins can do everything on cities"
ON cities
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "Users can read assigned cities"
ON cities
FOR SELECT
TO authenticated
USING (
  -- Admin can read all
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can read their assigned cities
  id = ANY(COALESCE((
    SELECT assigned_city_ids 
    FROM users 
    WHERE id = auth.uid()
  ), '{}')) OR
  -- Supervisors can read their organizers' assigned cities
  EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'supervisor'
    AND id = ANY(
      SELECT unnest(assigned_city_ids)
      FROM users
      WHERE id = ANY(u.organizer_ids)
    )
  )
);

-- Calendars Table Policies
CREATE POLICY "Admins can do everything on calendars"
ON calendars
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "All users can read calendars"
ON calendars
FOR SELECT
TO authenticated
USING (true);

-- Calendar Events Table Policies
CREATE POLICY "Admins can do everything on calendar_events"
ON calendar_events
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "All users can read calendar events"
ON calendar_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own events"
ON calendar_events
FOR UPDATE
TO authenticated
USING (
  -- User owns the event
  auth.uid() = user_id OR
  -- Supervisor can update their organizers' events
  (
    EXISTS (
      SELECT 1 
      FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'supervisor'
      AND user_id = ANY(u.organizer_ids)
    )
  )
)
WITH CHECK (
  -- User owns the event
  auth.uid() = user_id OR
  -- Supervisor can update their organizers' events
  (
    EXISTS (
      SELECT 1 
      FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'supervisor'
      AND user_id = ANY(u.organizer_ids)
    )
  )
);

CREATE POLICY "Users can insert events"
ON calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can insert any event
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can only insert events for themselves
  auth.uid() = user_id OR
  -- Supervisors can insert events for their organizers
  (
    EXISTS (
      SELECT 1 
      FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'supervisor'
      AND user_id = ANY(u.organizer_ids)
    )
  )
);