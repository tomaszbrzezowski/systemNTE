/*
  # Fix show titles permissions

  1. Changes
    - Drop existing policies
    - Create new comprehensive policies for show_titles and calendar_show_titles
    - Add block anonymous access policies
  
  2. Security
    - Enable RLS on all tables
    - Add policies for administrators to manage titles
    - Add policies for all authenticated users to view titles
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop show_titles policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'show_titles' AND schemaname = 'public'
  ) THEN
    DROP POLICY IF EXISTS "Administrators can manage show titles" ON public.show_titles;
    DROP POLICY IF EXISTS "All users can view show titles" ON public.show_titles;
  END IF;

  -- Drop calendar_show_titles policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calendar_show_titles' AND schemaname = 'public'
  ) THEN
    DROP POLICY IF EXISTS "Administrators can manage calendar show titles" ON public.calendar_show_titles;
    DROP POLICY IF EXISTS "All users can view calendar show titles" ON public.calendar_show_titles;
  END IF;
END $$;

-- Create new policies for show_titles
CREATE POLICY "Show titles admin access"
ON public.show_titles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'administrator'
);

CREATE POLICY "Show titles view access"
ON public.show_titles
FOR SELECT
TO authenticated
USING (true);

-- Create new policies for calendar_show_titles
CREATE POLICY "Calendar show titles admin access"
ON public.calendar_show_titles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'administrator'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'administrator'
);

CREATE POLICY "Calendar show titles view access"
ON public.calendar_show_titles
FOR SELECT
TO authenticated
USING (true);

-- Block anonymous access
CREATE POLICY "block_anonymous_show_titles"
ON public.show_titles
FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "block_anonymous_calendar_show_titles"
ON public.calendar_show_titles
FOR ALL
USING (auth.role() = 'authenticated');