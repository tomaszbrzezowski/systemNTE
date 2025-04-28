/*
  # Enable realtime for existing tables
  
  This migration enables realtime functionality for the calendar application tables
  by adding them to the supabase_realtime publication if they exist.
*/

-- Create publication if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add existing tables to publication
DO $$
BEGIN
  -- calendar_events
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'calendar_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
  END IF;

  -- calendars
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'calendars'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE calendars;
  END IF;

  -- users
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;

  -- cities
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'cities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cities;
  END IF;
END
$$;

-- Add helpful comment
COMMENT ON PUBLICATION supabase_realtime IS 'Realtime enabled for calendar application tables';