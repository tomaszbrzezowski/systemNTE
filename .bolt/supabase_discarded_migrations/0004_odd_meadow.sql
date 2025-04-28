/*
  # Fix User Creation Process

  1. Changes
    - Add trigger to automatically create user record after auth.users insert
    - Add policy for auth service to read users
    - Ensure proper role assignment for new users
    
  2. Security
    - Maintain RLS policies
    - Allow service role access for auth operations
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'organizator')::user_role,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add policy for service role to read users
CREATE POLICY "users_read_service"
ON users FOR SELECT
TO service_role
USING (true);

-- Ensure proper default values
ALTER TABLE public.users
ALTER COLUMN assigned_city_ids SET DEFAULT '{}',
ALTER COLUMN organizer_ids SET DEFAULT '{}',
ALTER COLUMN role SET DEFAULT 'organizator';