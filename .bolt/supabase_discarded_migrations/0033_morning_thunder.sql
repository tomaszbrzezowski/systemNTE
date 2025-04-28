/*
  # Safe schema migrations cleanup
  
  1. Changes
    - Safely handle schema_migrations cleanup
    - Only attempt deletion if table exists
*/

DO $$ 
BEGIN
  -- Only attempt to delete if the table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'schema_migrations'
  ) THEN
    EXECUTE 'DELETE FROM schema_migrations';
  END IF;
END $$;