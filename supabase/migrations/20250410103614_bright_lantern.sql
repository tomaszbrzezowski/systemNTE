/*
  # Fix seat_id column type in seat_assignments table
  
  1. Changes
    - Alter seat_id column in seat_assignments table from integer to text
    - This change is required because seat IDs are generated as strings in the format "sectionId-rowIndex-seatIndex"
    
  2. Security
    - No changes to RLS policies
    - Existing policies remain in effect
*/

-- First drop any existing foreign key constraints that might reference this column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'seat_assignments'
    AND constraint_name LIKE '%seat_id%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE seat_assignments DROP CONSTRAINT ' || quote_ident(constraint_name)
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'seat_assignments'
      AND constraint_name LIKE '%seat_id%'
      LIMIT 1
    );
  END IF;
END $$;

-- Change the column type from integer to text
ALTER TABLE seat_assignments 
ALTER COLUMN seat_id TYPE text USING seat_id::text;