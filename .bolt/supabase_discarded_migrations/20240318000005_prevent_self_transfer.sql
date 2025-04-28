-- Drop existing transfer requests policies
DROP POLICY IF EXISTS "Transfer requests can be managed by administrators" ON transfer_requests;
DROP POLICY IF EXISTS "Transfer requests can be managed by involved users" ON transfer_requests;

-- Create updated transfer requests policies
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

-- Add constraint to prevent self-transfers at database level
ALTER TABLE transfer_requests
ADD CONSTRAINT prevent_self_transfer
CHECK (from_user_id != to_user_id);