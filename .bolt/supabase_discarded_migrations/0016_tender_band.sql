/*
  # Disable Row Level Security for users table

  1. Changes
    - Disables Row Level Security (RLS) for the users table
    - Ensures service role maintains full access
*/

-- Disable RLS for users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Ensure service role still has full access
GRANT ALL ON users TO service_role;

-- Add comment explaining the change
COMMENT ON TABLE users IS 'User profiles with RLS disabled for development purposes.
WARNING: This table has no row-level security - all authenticated users have full access.';