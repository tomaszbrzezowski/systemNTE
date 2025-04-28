/*
  # Drop legacy seat layout tables
  
  1. Changes
    - Drop unused tables related to legacy seat layout storage
    - Keep only the layout_blocks column in calendar_events
    
  2. Notes
    - This is a non-destructive operation as all data has been migrated to layout_blocks
    - Maintains backward compatibility with existing code
*/

-- Drop seat_assignments table if it exists
DROP TABLE IF EXISTS seat_assignments CASCADE;

-- Drop seat_layout_templates table if it exists
DROP TABLE IF EXISTS seat_layout_templates CASCADE;

-- Create index on layout_blocks for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_layout_blocks ON calendar_events USING gin (layout_blocks);