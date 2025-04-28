/*
  # Fix event_id ambiguity in SQL migration
  
  1. Changes
    - Fix ambiguous column reference in update_event_layout_blocks_from_assignments function
    - Properly qualify column references with table aliases
    - Maintain the same functionality while fixing the error
    
  2. Security
    - No changes to security policies
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_event_layout_blocks_from_assignments(uuid);

-- Create function to update event layout blocks from seat assignments with fixed column references
CREATE OR REPLACE FUNCTION update_event_layout_blocks_from_assignments(p_event_id uuid)
RETURNS void AS $$
DECLARE
  event_layout_blocks jsonb;
  assignments jsonb;
BEGIN
  -- Get current layout_blocks for the event
  SELECT layout_blocks INTO event_layout_blocks
  FROM calendar_events
  WHERE id = p_event_id;
  
  -- Initialize layout_blocks if null
  IF event_layout_blocks IS NULL THEN
    event_layout_blocks := '[]'::jsonb;
  END IF;
  
  -- Get all seat assignments for this event using table alias to avoid ambiguity
  SELECT jsonb_object_agg(sa.seat_id, sa.school_name) INTO assignments
  FROM seat_assignments sa
  WHERE sa.event_id = p_event_id;
  
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
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Update all events with seat assignments
DO $$
DECLARE
  event_record RECORD;
BEGIN
  FOR event_record IN 
    SELECT DISTINCT event_id 
    FROM seat_assignments
  LOOP
    PERFORM update_event_layout_blocks_from_assignments(event_record.event_id);
  END LOOP;
END $$;

-- Create or replace function to update layout_blocks in calendar_events
CREATE OR REPLACE FUNCTION update_event_layout_blocks()
RETURNS TRIGGER AS $$
DECLARE
  event_layout_blocks jsonb;
  assignments jsonb;
BEGIN
  -- Get current layout_blocks for the event
  SELECT layout_blocks INTO event_layout_blocks
  FROM calendar_events
  WHERE id = NEW.event_id;
  
  -- Initialize layout_blocks if null
  IF event_layout_blocks IS NULL THEN
    event_layout_blocks := '[]'::jsonb;
  END IF;
  
  -- Get all seat assignments for this event using table alias to avoid ambiguity
  SELECT jsonb_object_agg(sa.seat_id, sa.school_name) INTO assignments
  FROM seat_assignments sa
  WHERE sa.event_id = NEW.event_id;
  
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
  
  -- Get all remaining seat assignments for this event using table alias to avoid ambiguity
  SELECT jsonb_object_agg(sa.seat_id, sa.school_name) INTO assignments
  FROM seat_assignments sa
  WHERE sa.event_id = OLD.event_id
  AND sa.id != OLD.id;
  
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