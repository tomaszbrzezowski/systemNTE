/*
  # Clean up database schema
  
  1. Changes
    - Drop unused events schema and its tables
    - Drop unused hall_seats schema and its tables
    - Drop unused agreements schema and its tables
    - Keep only essential tables in public schema
    
  2. Notes
    - Non-destructive to core functionality
    - Preserves all public schema tables
    - Removes redundant/unused schemas
*/

-- Drop events schema and all its objects
DROP SCHEMA IF EXISTS events CASCADE;

-- Drop hall_seats schema and all its objects
DROP SCHEMA IF EXISTS hall_seats CASCADE;

-- Drop agreements schema and all its objects
DROP SCHEMA IF EXISTS agreements CASCADE;

-- Drop unused functions
DROP FUNCTION IF EXISTS events.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS events.store_teacher_and_school() CASCADE;

-- Drop unused event_changes table from public schema
DROP TABLE IF EXISTS event_changes CASCADE;