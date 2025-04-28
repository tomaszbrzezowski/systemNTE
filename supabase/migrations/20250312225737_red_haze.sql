/*
  # Fix agreement number generation
  
  1. Changes
    - Create sequence for agreement numbers per year
    - Simplify number generation to avoid race conditions
    - Remove complex locking mechanisms
    
  2. Security
    - Maintain unique constraint on agreement numbers
    - Use sequences for atomic operations
*/

-- Create function to get year-specific sequence name
CREATE OR REPLACE FUNCTION get_agreement_sequence_name(year text)
RETURNS text AS $$
BEGIN
  RETURN 'agreement_number_seq_' || year;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure year sequence exists
CREATE OR REPLACE FUNCTION ensure_year_sequence(year text)
RETURNS void AS $$
DECLARE
  seq_name text;
  max_num integer;
BEGIN
  seq_name := get_agreement_sequence_name(year);
  
  -- Create sequence if it doesn't exist
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS %I START WITH 1', 
    seq_name
  );
  
  -- Set sequence value based on existing agreements
  SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0)
  INTO max_num
  FROM agreements
  WHERE agreement_number LIKE year || '/%';
  
  IF max_num > 0 THEN
    EXECUTE format(
      'SELECT setval(%L, %s)',
      seq_name,
      max_num
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;
DROP FUNCTION IF EXISTS set_agreement_number();

-- Create new function for agreement number generation
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  year text;
  seq_name text;
  seq_val integer;
  new_number text;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Ensure sequence exists for current year
  PERFORM ensure_year_sequence(year);
  
  -- Get sequence name
  seq_name := get_agreement_sequence_name(year);
  
  -- Get next value from sequence
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO seq_val;
  
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

-- Ensure sequence exists for current year
SELECT ensure_year_sequence(to_char(CURRENT_DATE, 'YYYY'));