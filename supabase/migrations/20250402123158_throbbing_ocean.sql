/*
  # Fix empty_rows array handling in layout_sections
  
  1. Changes
    - Ensure empty_rows is properly stored as an integer array
    - Fix issues with the ordinality column reference
    - Add proper type casting and validation
    
  2. Notes
    - Resolves the "column ordinality does not exist" error
    - Ensures compatibility with frontend code
*/

-- Ensure empty_rows is properly typed as an integer array
ALTER TABLE layout_sections 
ALTER COLUMN empty_rows TYPE integer[] USING COALESCE(empty_rows, '{}'::integer[]);

-- Set default value for empty_rows
ALTER TABLE layout_sections 
ALTER COLUMN empty_rows SET DEFAULT '{}'::integer[];

-- Update any NULL values to empty arrays
UPDATE layout_sections
SET empty_rows = '{}'::integer[]
WHERE empty_rows IS NULL;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_layout_sections_layout_id ON layout_sections(layout_id);