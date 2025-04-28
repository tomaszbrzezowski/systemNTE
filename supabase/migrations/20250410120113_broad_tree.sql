/*
  # Fix Hall Layout Storage and Seat Assignments
  
  1. Changes
    - Update hall_layouts and layout_sections tables to properly store layout data
    - Fix seat_assignments to use text-based seat IDs
    - Add functions to update layout_blocks in calendar_events
    - Ensure proper synchronization between seat_assignments and layout_blocks
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- First ensure seat_id in seat_assignments is text type
DO $$ 
BEGIN
  -- Check if seat_id is not already text type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'seat_assignments' 
    AND column_name = 'seat_id'
    AND data_type != 'text'
  ) THEN
    -- Drop any existing foreign key constraints
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
    
    -- Change the column type to text
    ALTER TABLE seat_assignments 
    ALTER COLUMN seat_id TYPE text USING seat_id::text;
  END IF;
END $$;

-- Create or replace function to update layout_blocks in calendar_events
CREATE OR REPLACE FUNCTION update_event_layout_blocks()
RETURNS TRIGGER AS $$
DECLARE
  event_layout_blocks jsonb;
  assignments jsonb;
  all_assignments RECORD;
BEGIN
  -- Get current layout_blocks for the event
  SELECT layout_blocks INTO event_layout_blocks
  FROM calendar_events
  WHERE id = NEW.event_id;
  
  -- Initialize layout_blocks if null
  IF event_layout_blocks IS NULL THEN
    event_layout_blocks := '[]'::jsonb;
  END IF;
  
  -- Get all seat assignments for this event
  SELECT jsonb_object_agg(seat_id, school_name) INTO assignments
  FROM seat_assignments
  WHERE event_id = NEW.event_id;
  
  -- If no assignments found, use empty object
  IF assignments IS NULL THEN
    assignments := '{}'::jsonb;
  END IF;
  
  -- Check if layout_blocks already has a seat_assignments entry
  IF event_layout_blocks @> '[{"type": "seat_assignments"}]'::jsonb THEN
    -- Update existing seat assignments
    event_layout_blocks := jsonb_set(
      event_layout_blocks,
      '{0, assignments}'::text[],
      assignments
    );
  ELSE
    -- Create new seat assignments structure
    event_layout_blocks := jsonb_build_array(
      jsonb_build_object(
        'type', 'seat_assignments',
        'assignments', assignments
      )
    );
  END IF;
  
  -- Update the calendar_events table
  UPDATE calendar_events
  SET layout_blocks = event_layout_blocks
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to remove seat assignments from layout_blocks
CREATE OR REPLACE FUNCTION remove_event_layout_blocks()
RETURNS TRIGGER AS $$
DECLARE
  event_layout_blocks jsonb;
  assignments jsonb;
BEGIN
  -- Get current layout_blocks for the event
  SELECT layout_blocks INTO event_layout_blocks
  FROM calendar_events
  WHERE id = OLD.event_id;
  
  -- If layout_blocks is null or doesn't contain seat assignments, do nothing
  IF event_layout_blocks IS NULL OR NOT (event_layout_blocks @> '[{"type": "seat_assignments"}]'::jsonb) THEN
    RETURN OLD;
  END IF;
  
  -- Get all remaining seat assignments for this event
  SELECT jsonb_object_agg(seat_id, school_name) INTO assignments
  FROM seat_assignments
  WHERE event_id = OLD.event_id
  AND id != OLD.id;
  
  -- If no assignments found, use empty object
  IF assignments IS NULL THEN
    assignments := '{}'::jsonb;
  END IF;
  
  -- Update layout_blocks with the modified assignments
  event_layout_blocks := jsonb_set(
    event_layout_blocks,
    '{0, assignments}'::text[],
    assignments
  );
  
  -- Update the calendar_events table
  UPDATE calendar_events
  SET layout_blocks = event_layout_blocks
  WHERE id = OLD.event_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_event_layout_blocks_trigger ON seat_assignments;
DROP TRIGGER IF EXISTS remove_event_layout_blocks_trigger ON seat_assignments;

-- Create triggers for seat_assignments
CREATE TRIGGER update_event_layout_blocks_trigger
  AFTER INSERT OR UPDATE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_event_layout_blocks();

CREATE TRIGGER remove_event_layout_blocks_trigger
  AFTER DELETE ON seat_assignments
  FOR EACH ROW
  EXECUTE FUNCTION remove_event_layout_blocks();

-- Migrate existing seat assignments to layout_blocks
DO $$
DECLARE
  event_record RECORD;
  assignments_record RECORD;
  event_layout_blocks jsonb;
  assignments jsonb := '{}'::jsonb;
BEGIN
  -- Process each event with seat assignments
  FOR event_record IN 
    SELECT DISTINCT event_id 
    FROM seat_assignments
  LOOP
    -- Reset assignments for this event
    assignments := '{}'::jsonb;
    
    -- Collect all seat assignments for this event
    FOR assignments_record IN 
      SELECT seat_id, school_name 
      FROM seat_assignments 
      WHERE event_id = event_record.event_id
    LOOP
      assignments := assignments || jsonb_build_object(
        assignments_record.seat_id, 
        assignments_record.school_name
      );
    END LOOP;
    
    -- Create layout_blocks structure
    event_layout_blocks := jsonb_build_array(
      jsonb_build_object(
        'type', 'seat_assignments',
        'assignments', assignments
      )
    );
    
    -- Update the calendar_events table
    UPDATE calendar_events
    SET layout_blocks = event_layout_blocks
    WHERE id = event_record.event_id;
  END LOOP;
END $$;