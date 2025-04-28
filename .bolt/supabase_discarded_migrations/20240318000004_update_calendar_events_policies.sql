-- Drop existing calendar events policies
DROP POLICY IF EXISTS "Calendar events are viewable by authenticated users" ON calendar_events;
DROP POLICY IF EXISTS "Calendar events can be created by administrators" ON calendar_events;
DROP POLICY IF EXISTS "Calendar events can be created by assigned users" ON calendar_events;
DROP POLICY IF EXISTS "Calendar events can be updated by administrators" ON calendar_events;
DROP POLICY IF EXISTS "Calendar events can be updated by owners" ON calendar_events;
DROP POLICY IF EXISTS "Calendar events can be deleted by administrators" ON calendar_events;

-- Create new calendar events policies
CREATE POLICY "Calendar events are viewable by authenticated users"
    ON calendar_events FOR SELECT
    TO authenticated
    USING (true);

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
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND (
                role = 'supervisor'
                OR role = 'organizator'
            )
        )
    );

-- Drop existing transfer requests policies
DROP POLICY IF EXISTS "Transfer requests are viewable by involved users" ON transfer_requests;
DROP POLICY IF EXISTS "Transfer requests can be created by event owners" ON transfer_requests;
DROP POLICY IF EXISTS "Transfer requests can be updated by involved users" ON transfer_requests;

-- Create new transfer requests policies
CREATE POLICY "Transfer requests are viewable by involved users"
    ON transfer_requests FOR SELECT
    TO authenticated
    USING (
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'administrator'
        )
    );

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
        from_user_id = auth.uid()
        OR to_user_id = auth.uid()
    );