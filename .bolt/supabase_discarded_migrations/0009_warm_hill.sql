-- Drop all existing policies to start fresh
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

-- Enable RLS but allow service role to bypass
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO service_role;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- Basic read access for all authenticated users
CREATE POLICY "users_read_policy"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow service role to create users
CREATE POLICY "users_service_insert"
ON users FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow administrators to update any user
CREATE POLICY "users_admin_update"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'administrator'
  )
);

-- Allow users to update their own non-sensitive fields
CREATE POLICY "users_self_update"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  role IS NOT DISTINCT FROM (SELECT role FROM users WHERE id = auth.uid()) AND
  supervisor_id IS NOT DISTINCT FROM (SELECT supervisor_id FROM users WHERE id = auth.uid())
);

-- Allow supervisors to update their organizers
CREATE POLICY "users_supervisor_update"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users supervisor
    WHERE supervisor.id = auth.uid()
    AND supervisor.role = 'supervisor'
    AND users.role = 'organizator'
    AND users.id = ANY(supervisor.organizer_ids)
  )
)
WITH CHECK (
  role = 'organizator'
);

-- Update user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    active,
    assigned_city_ids,
    organizer_ids
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizator')::user_role,
    true,
    '{}',
    '{}'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;