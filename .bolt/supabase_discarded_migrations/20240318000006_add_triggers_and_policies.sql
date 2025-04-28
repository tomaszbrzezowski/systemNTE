-- Drop existing policies
DROP POLICY IF EXISTS "Calendar events can be managed by administrators" ON calendar_events;
DROP POLICY IF EXISTS "Calendar events can be managed by assigned users" ON calendar_events;
DROP POLICY IF EXISTS "Transfer requests can be managed by administrators" ON transfer_requests;
DROP POLICY IF EXISTS "Transfer requests can be managed by involved users" ON transfer_requests;

-- Create new calendar events policies with status restrictions
CREATE POLICY "Calendar events can be managed by administrators"
    ON calendar_events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Calendar events can be managed by assigned users"
    ON calendar_events FOR ALL
    TO authenticated
    USING (
        (user_id = auth.uid() OR user_id IS NULL)
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (
                role = 'supervisor'
                OR role = 'organizator'
            )
            AND (
                -- Allow status changes based on role
                CASE 
                    WHEN role = 'administrator' THEN true
                    WHEN role IN ('supervisor', 'organizator') THEN
                        status IN ('zrobiony', 'do_przekazania', 'do_przejęcia', 'w_trakcie')
                    ELSE false
                END
            )
        )
    );

-- Create transfer request policies
CREATE POLICY "Transfer requests can be managed by administrators"
    ON transfer_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

CREATE POLICY "Transfer requests can be managed by involved users"
    ON transfer_requests FOR ALL
    TO authenticated
    USING (
        (from_user_id = auth.uid() OR to_user_id = auth.uid())
        AND from_user_id != to_user_id  -- Prevent self-transfers
    )
    WITH CHECK (
        (from_user_id = auth.uid() OR to_user_id = auth.uid())
        AND from_user_id != to_user_id  -- Prevent self-transfers
    );

-- Create trigger function for status changes
CREATE OR REPLACE FUNCTION handle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes to 'wydany', delete related transfer requests
    IF NEW.status = 'wydany' THEN
        DELETE FROM transfer_requests WHERE event_id = NEW.id;
    END IF;

    -- When status changes from 'do_przekazania', delete related transfer requests
    IF OLD.status = 'do_przekazania' AND NEW.status != 'do_przekazania' THEN
        DELETE FROM transfer_requests WHERE event_id = NEW.id;
    END IF;

    -- When administrator changes status to 'wydany'
    IF NEW.status = 'wydany' AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'administrator'
    ) THEN
        -- First set to 'niewydany' and clear data
        UPDATE calendar_events
        SET status = 'niewydany',
            user_id = NULL,
            city_id = NULL,
            previous_user_id = NULL
        WHERE id = NEW.id;
        
        -- Then update with new data
        NEW.status := 'wydany';
        NEW.previous_user_id := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS handle_status_change_trigger ON calendar_events;
CREATE TRIGGER handle_status_change_trigger
    BEFORE UPDATE OF status ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_status_change();

-- Create function to validate status changes
CREATE OR REPLACE FUNCTION validate_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Get user role
    DECLARE
        user_role text;
    BEGIN
        SELECT role INTO user_role
        FROM users
        WHERE id = auth.uid();

        -- Validate status changes based on role
        IF user_role IN ('supervisor', 'organizator') THEN
            -- Check if new status is allowed
            IF NEW.status NOT IN ('zrobiony', 'do_przekazania', 'do_przejęcia', 'w_trakcie') THEN
                RAISE EXCEPTION 'Invalid status change for role %', user_role;
            END IF;

            -- Check specific status change rules
            IF OLD.status = 'wydany' AND NEW.status NOT IN ('w_trakcie', 'do_przekazania') THEN
                RAISE EXCEPTION 'Invalid status change from wydany';
            END IF;

            IF OLD.status = 'w_trakcie' AND NEW.status NOT IN ('zrobiony', 'do_przekazania') THEN
                RAISE EXCEPTION 'Invalid status change from w_trakcie';
            END IF;
        END IF;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status validation
DROP TRIGGER IF EXISTS validate_status_change_trigger ON calendar_events;
CREATE TRIGGER validate_status_change_trigger
    BEFORE UPDATE OF status ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION validate_status_change();

-- Create function to handle transfer requests
CREATE OR REPLACE FUNCTION handle_transfer_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Update event status when transfer request is created
    IF TG_OP = 'INSERT' THEN
        UPDATE calendar_events
        SET status = 'przekazywany'
        WHERE id = NEW.event_id;
    END IF;

    -- Handle transfer request acceptance
    IF TG_OP = 'UPDATE' AND NEW.accepted = true THEN
        UPDATE calendar_events
        SET status = 'wydany',
            user_id = NEW.to_user_id,
            previous_user_id = (SELECT user_id FROM calendar_events WHERE id = NEW.event_id)
        WHERE id = NEW.event_id;
    END IF;

    -- Handle transfer request rejection
    IF TG_OP = 'UPDATE' AND NEW.accepted = false THEN
        UPDATE calendar_events
        SET status = (SELECT status FROM calendar_events WHERE id = NEW.event_id)
        WHERE id = NEW.event_id;
        
        DELETE FROM transfer_requests WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transfer requests
DROP TRIGGER IF EXISTS handle_transfer_request_trigger ON transfer_requests;
CREATE TRIGGER handle_transfer_request_trigger
    AFTER INSERT OR UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_transfer_request();