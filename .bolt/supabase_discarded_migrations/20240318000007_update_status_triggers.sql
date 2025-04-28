-- Create or replace the status change trigger function
CREATE OR REPLACE FUNCTION handle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes to 'wydany', clear previous data first
    IF NEW.status = 'wydany' THEN
        -- Store the new user_id temporarily
        DECLARE temp_user_id UUID := NEW.user_id;
        
        -- Clear all data
        NEW.user_id := NULL;
        NEW.city_id := NULL;
        NEW.previous_user_id := NULL;
        
        -- Set the new user_id back
        NEW.user_id := temp_user_id;
    END IF;

    -- When status changes to 'do_przejęcia'
    IF NEW.status = 'do_przejęcia' THEN
        -- Clear city data but keep the user
        NEW.city_id := NULL;
    END IF;

    -- When status changes to 'do_przekazania'
    IF NEW.status = 'do_przekazania' THEN
        -- Keep the current user_id but clear city
        NEW.city_id := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_status_change_trigger ON calendar_events;

-- Create new trigger
CREATE TRIGGER handle_status_change_trigger
    BEFORE UPDATE OF status ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_status_change();

-- Add constraint to prevent invalid status transitions
ALTER TABLE calendar_events
    ADD CONSTRAINT valid_status_transition
    CHECK (
        status IN ('wydany', 'zrobiony', 'do_przekazania', 'przekazywany', 
                  'do_przejęcia', 'w_trakcie', 'wolne', 'niewydany')
    );