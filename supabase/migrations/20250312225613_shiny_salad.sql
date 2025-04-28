/*
  # Fix agreement storage and number generation
  
  1. Changes
    - Remove all locking and complex queries
    - Use simple sequence for agreement numbers
    - Add function to generate formatted agreement numbers
    - Add proper indexes for performance
    
  2. Performance
    - Uses sequence instead of querying max value
    - No locking or complex queries
    - Fast, atomic operations
*/

-- Create sequence for agreement numbers
CREATE SEQUENCE IF NOT EXISTS agreement_number_seq;

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();

-- Create simple function for agreement number generation
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  seq_val integer;
  new_number text;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get next value from sequence
  seq_val := nextval('agreement_number_seq');
  
  -- Generate new number
  new_number := year || '/' || LPAD(seq_val::text, 4, '0');
  
  -- Set the new number
  NEW.agreement_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  WHEN (NEW.agreement_number IS NULL)
  EXECUTE FUNCTION set_agreement_number();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_number ON agreements(agreement_number);
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_date ON agreements(agreement_date);
CREATE INDEX IF NOT EXISTS idx_agreements_season ON agreements(season);

-- Set current sequence value based on existing agreements
DO $$
DECLARE
  max_num integer;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0)
  INTO max_num
  FROM agreements;
  
  -- Set sequence to start after highest existing number
  PERFORM setval('agreement_number_seq', max_num, true);
END $$;