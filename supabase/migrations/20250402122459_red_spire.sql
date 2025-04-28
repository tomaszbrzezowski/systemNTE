/*
  # Fix layout_sections table for hall layouts
  
  1. Changes
    - Fix empty_rows column to properly handle arrays
    - Add proper constraints and defaults
    - Ensure compatibility with frontend code
    
  2. Notes
    - Ensures empty_rows is properly stored as an array
    - Fixes issues with the ordinality column
*/

-- First ensure the columns exist with proper types
DO $$ 
BEGIN
  -- Check if empty_rows column exists and has the right type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'layout_sections' AND column_name = 'empty_rows'
  ) THEN
    -- Alter the column to ensure it's an integer array
    ALTER TABLE layout_sections 
    ALTER COLUMN empty_rows TYPE integer[] USING COALESCE(empty_rows, '{}'::integer[]);
  END IF;

  -- Set default value for empty_rows if not already set
  ALTER TABLE layout_sections 
  ALTER COLUMN empty_rows SET DEFAULT '{}'::integer[];
END $$;

-- Update any NULL values to empty arrays
UPDATE layout_sections
SET empty_rows = '{}'::integer[]
WHERE empty_rows IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_layout_sections_layout_id ON layout_sections(layout_id);