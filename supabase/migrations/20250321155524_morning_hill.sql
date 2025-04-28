/*
  # Remove all agreements data
  
  1. Changes
    - Truncate agreement_performances table
    - Truncate agreements table
    - Reset agreement number sequence
    
  2. Notes
    - Uses CASCADE to handle foreign key relationships
    - Maintains table structure and policies
*/

-- Remove all data from agreement_performances and agreements
TRUNCATE TABLE agreement_performances CASCADE;
TRUNCATE TABLE agreements CASCADE;

-- Reset any sequences used by these tables
ALTER SEQUENCE IF EXISTS agreement_number_seq RESTART;
DO $$
DECLARE
  year text;
  seq_name text;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Reset sequence for current year if it exists
  seq_name := 'agreement_number_seq_' || year;
  IF EXISTS (
    SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = seq_name
  ) THEN
    EXECUTE format('ALTER SEQUENCE %I RESTART', seq_name);
  END IF;
END $$;