/*
  # Disable RLS for Development
  
  This migration safely disables RLS on all tables if they exist.
  
  1. Changes
    - Disables RLS on all tables
    - Adds warning comments about disabled RLS
  
  2. Safety
    - Checks for table existence before modifications
    - Uses DO block for conditional execution
*/

DO $$ 
BEGIN
    -- Disable RLS on tables if they exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE users IS 'WARNING: RLS temporarily disabled for development';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cities') THEN
        ALTER TABLE cities DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE cities IS 'WARNING: RLS temporarily disabled for development';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'calendars') THEN
        ALTER TABLE calendars DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE calendars IS 'WARNING: RLS temporarily disabled for development';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'calendar_events') THEN
        ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE calendar_events IS 'WARNING: RLS temporarily disabled for development';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transfer_requests') THEN
        ALTER TABLE transfer_requests DISABLE ROW LEVEL SECURITY;
        COMMENT ON TABLE transfer_requests IS 'WARNING: RLS temporarily disabled for development';
    END IF;
END $$;