/*
  # Fix seat assignments and layout blocks synchronization
  
  1. Changes
    - Create functions to update layout_blocks in calendar_events when seat assignments change
    - Create functions to remove seat assignments from layout_blocks when deleted
    - Add trigger to sync layout_blocks to seat_assignments
    - Fix ambiguous column references in SQL queries
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper data synchronization
*/

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

-- Create function to sync layout_blocks to seat_assignments
CREATE OR REPLACE FUNCTION sync_layout_blocks_to_seat_assignments()
RETURNS TRIGGER AS $$
DECLARE
  assignments jsonb;
  assignment_key text;
  assignment_value text;
BEGIN
  -- Check if layout_blocks contains seat assignments
  IF NEW.layout_blocks IS NOT NULL AND NEW.layout_blocks @> '[{"type": "seat_assignments"}]'::jsonb THEN
    -- Get assignments from layout_blocks
    assignments := NEW.layout_blocks -> 0 -> 'assignments';
    
    -- Delete existing seat assignments for this event
    DELETE FROM seat_assignments WHERE event_id = NEW.id;
    
    -- Insert new seat assignments from layout_blocks
    FOR assignment_key, assignment_value IN 
      SELECT * FROM jsonb_each_text(assignments)
    LOOP
      INSERT INTO seat_assignments (
        seat_id,
        event_id,
        school_name,
        status
      ) VALUES (
        assignment_key,
        NEW.id,
        assignment_value,
        'reserved'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync layout_blocks to seat_assignments
CREATE TRIGGER sync_layout_blocks_to_seat_assignments_trigger
  AFTER UPDATE OF layout_blocks ON calendar_events
  FOR EACH ROW
  WHEN (OLD.layout_blocks IS DISTINCT FROM NEW.layout_blocks)
  EXECUTE FUNCTION sync_layout_blocks_to_seat_assignments();

-- Create function to load hall layout from layout_sections
CREATE OR REPLACE FUNCTION load_hall_layout_for_event(p_event_id uuid)
RETURNS jsonb AS $$
DECLARE
  hall_id uuid;
  layout_id uuid;
  layout_data jsonb;
  sections jsonb;
BEGIN
  -- Get hall_id for the event
  SELECT h.id INTO hall_id
  FROM calendar_events ce
  JOIN halls h ON h.city_id = ce.city_id
  WHERE ce.id = p_event_id
  LIMIT 1;
  
  IF hall_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get layout_id for the hall
  SELECT id INTO layout_id
  FROM hall_layouts
  WHERE hall_id = hall_id
  LIMIT 1;
  
  IF layout_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if there's a saved template for this event
  SELECT layout_data INTO layout_data
  FROM seat_layout_templates
  WHERE hall_id = hall_id
  AND event_id = p_event_id
  LIMIT 1;
  
  IF layout_data IS NOT NULL THEN
    RETURN layout_data;
  END IF;
  
  -- If no template exists, build layout data from layout_sections
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'x', x,
      'y', y,
      'width', width,
      'height', height,
      'rotation', rotation,
      'rows', rows,
      'rowSeats', row_seats,
      'removedSeats', removed_seats,
      'seatGaps', seat_gaps,
      'emptyRows', empty_rows,
      'orientation', orientation,
      'numberingStyle', numbering_style,
      'numberingDirection', numbering_direction,
      'alignment', alignment,
      'position', position
    )
  ) INTO sections
  FROM layout_sections
  WHERE layout_id = layout_id;
  
  -- Return layout data
  RETURN jsonb_build_object(
    'sections', sections,
    'assignments', '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to update event layout blocks from seat assignments
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