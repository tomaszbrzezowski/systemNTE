/*
  # Fix agreement number generation

  1. Changes
    - Create function to generate agreement numbers
    - Create trigger function to set agreement number
    - Add trigger to agreements table
    
  2. Notes
    - Numbers will be in format YYYY/NNNN where NNNN is sequential
    - Numbers are unique per year
*/

-- Create function to generate agreement number
CREATE OR REPLACE FUNCTION generate_agreement_number()
RETURNS text AS $$
DECLARE
  year text;
  counter integer;
  new_number text;
BEGIN
  -- Get current year
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get current counter for this year
  SELECT COALESCE(MAX(SUBSTRING(agreement_number FROM '\d+')::integer), 0) + 1
  INTO counter
  FROM agreements
  WHERE agreement_number LIKE year || '/%';
  
  -- Generate new number
  new_number := year || '/' || LPAD(counter::text, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agreement_number IS NULL THEN
    NEW.agreement_number := generate_agreement_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_agreement_number ON agreements;

-- Create trigger
CREATE TRIGGER set_agreement_number
  BEFORE INSERT ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION set_agreement_number();