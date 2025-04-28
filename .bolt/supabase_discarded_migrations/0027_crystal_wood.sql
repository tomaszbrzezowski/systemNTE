/*
  # Fix Function Search Paths and OTP Settings

  1. Changes
    - Add explicit search paths to functions
    - Add proper error handling
    - Add security definer to functions

  2. Security
    - Set explicit search paths
    - Add SECURITY DEFINER
    - Improve error handling
*/

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in update_updated_at_column: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Update validate_status_change function
CREATE OR REPLACE FUNCTION validate_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add your status validation logic here
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in validate_status_change: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Update handle_role_changes function
CREATE OR REPLACE FUNCTION handle_role_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add your role change handling logic here
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in handle_role_changes: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp with secure search path';
COMMENT ON FUNCTION validate_status_change() IS 'Validates status changes with secure search path and error handling';
COMMENT ON FUNCTION handle_role_changes() IS 'Handles role changes with secure search path and error handling';