-- Drop existing policies
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON users', policyname),
      '; '
    )
    FROM pg_policies 
    WHERE tablename = 'users'
  );
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Basic read policy for authenticated users
CREATE POLICY "users_read_all"
ON users FOR SELECT
TO authenticated
USING (true);

-- Service role insert policy
CREATE POLICY "users_service_insert"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role update policy
CREATE POLICY "users_service_update"
ON users FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to handle user updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Administrators can update anything
  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'administrator'
  ) THEN
    RETURN NEW;
  END IF;

  -- Users can update their own non-sensitive fields
  IF auth.uid() = NEW.id THEN
    -- Ensure role and supervisor_id don't change
    IF NEW.role != OLD.role OR NEW.supervisor_id IS DISTINCT FROM OLD.supervisor_id THEN
      RAISE EXCEPTION 'Cannot modify role or supervisor';
    END IF;
    RETURN NEW;
  END IF;

  -- Supervisors can update their organizers
  IF EXISTS (
    SELECT 1 FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND OLD.role = 'organizator'
    AND OLD.id = ANY(supervisor.organizer_ids)
  ) THEN
    -- Ensure organizer role doesn't change
    IF NEW.role != 'organizator' THEN
      RAISE EXCEPTION 'Cannot change organizer role';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Insufficient permissions';
END;
$$;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS before_user_update ON users;
CREATE TRIGGER before_user_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_update();

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles with role-based permissions:
- All authenticated users can read user data
- Service role has full access
- Administrators can update any user
- Users can update their own non-sensitive fields
- Supervisors can update their assigned organizers
Updates are validated through the handle_user_update trigger function.';