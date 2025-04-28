/*
  # Block Anonymous Access Policy

  1. Changes
     - Add policies to block anonymous access to all tables
     - Ensures only authenticated users can access data

  2. Security
     - Blocks all anonymous access
     - Requires authentication for any operation
     - Applies to all tables in public schema
*/

-- Block anonymous access to users table
CREATE POLICY "block_anonymous_users"
ON users
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to cities table
CREATE POLICY "block_anonymous_cities"
ON cities
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to calendars table
CREATE POLICY "block_anonymous_calendars"
ON calendars
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to calendar_events table
CREATE POLICY "block_anonymous_calendar_events"
ON calendar_events
FOR ALL
USING (auth.uid() IS NOT NULL);