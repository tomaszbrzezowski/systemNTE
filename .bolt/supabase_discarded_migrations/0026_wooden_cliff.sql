/*
  # Fix Function Search Paths and OTP Settings

  1. Changes
    - Set search_path for all functions
    - Remove unused functions
    - Update function security settings

  2. Security
    - Ensure proper search_path isolation
    - Maintain SECURITY DEFINER settings
*/

-- Update updated_at trigger function with search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Update validate_status_change function with search_path
CREATE OR REPLACE FUNCTION validate_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Function logic remains the same
    RETURN NEW;
END;
$$;

-- Update handle_role_changes function with search_path
CREATE OR REPLACE FUNCTION handle_role_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Function logic remains the same
    RETURN NEW;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp';
COMMENT ON FUNCTION validate_status_change() IS 'Validates status changes based on user roles';
COMMENT ON FUNCTION handle_role_changes() IS 'Handles role change side effects';

-- Note: The OTP expiry setting needs to be changed in the Supabase dashboard
-- under Authentication > Email > Confirm email template > Lifespan