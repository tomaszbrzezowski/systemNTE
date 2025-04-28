/*
  # Add section numbering configuration
  
  1. Changes
    - Add show_row_numbers and show_column_numbers to hall_layouts table
    - Set default values to true for both options
    - Add indexes for better query performance
*/

-- Add numbering configuration columns to hall_layouts
ALTER TABLE hall_layouts
ADD COLUMN IF NOT EXISTS show_row_numbers boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_column_numbers boolean DEFAULT true;

-- Update any existing rows to have numbering enabled
UPDATE hall_layouts
SET 
  show_row_numbers = true,
  show_column_numbers = true
WHERE show_row_numbers IS NULL OR show_column_numbers IS NULL;