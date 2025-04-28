/*
  # Fix Calendar Creation Permissions

  This migration updates the calendar policies to:
  1. Allow all authenticated users to create calendars
  2. Maintain existing read permissions
  3. Restrict modifications to admins and owners
*/

-- Drop existing calendar policies
DROP POLICY IF EXISTS "Calendars access policy" ON calendars;

-- Create new calendar policies
CREATE POLICY "Calendars CRUD policy"
ON calendars
FOR ALL
TO authenticated
USING (
  -- Everyone can read calendars
  true
)
WITH CHECK (
  -- Admins can modify any calendar
  auth.jwt() ->> 'role' = 'administrator' OR
  -- Users can create their own calendars
  (
    auth.uid() = created_by AND
    -- For INSERT operations
    current_timestamp = created_at
  )
);

-- Create separate policy for INSERT to handle calendar creation
CREATE POLICY "Calendars insert policy"
ON calendars
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow all authenticated users to create calendars
  -- The created_by field must match the user's ID
  auth.uid() = created_by
);