/*
  # Remove hall layout functionality
  
  1. Changes
    - Drop hall_layouts table
    - Drop layout_sections table
    - Remove layout_blocks column from calendar_events
    - Remove related functions and triggers
    
  2. Notes
    - This is a destructive migration that removes all hall layout functionality
    - All existing layout data will be lost
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS update_hall_layout_total_seats_trigger ON calendar_events;
DROP TRIGGER IF EXISTS sync_layout_blocks_to_seat_assignments_trigger ON calendar_events;
DROP TRIGGER IF EXISTS update_hall_seats_trigger_v5 ON layout_sections;

-- Drop functions
DROP FUNCTION IF EXISTS update_hall_layout_total_seats();
DROP FUNCTION IF EXISTS sync_layout_blocks_to_seat_assignments();
DROP FUNCTION IF EXISTS update_hall_seats();
DROP FUNCTION IF EXISTS calculate_section_seats(jsonb);
DROP FUNCTION IF EXISTS calculate_section_seats(integer[], jsonb, jsonb, integer[]);
DROP FUNCTION IF EXISTS calculate_total_seats(jsonb);

-- Drop tables
DROP TABLE IF EXISTS layout_sections CASCADE;
DROP TABLE IF EXISTS hall_layouts CASCADE;

-- Remove layout_blocks column from calendar_events
ALTER TABLE calendar_events DROP COLUMN IF EXISTS layout_blocks;

-- Drop index if it exists
DROP INDEX IF EXISTS idx_calendar_events_layout_blocks;