/*
  # Add show titles schema

  1. New Tables
    - `show_titles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `calendar_show_titles`
      - `calendar_id` (uuid, foreign key)
      - `show_title_id` (uuid, foreign key)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for administrators
*/

-- Create show_titles table
CREATE TABLE events.show_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create calendar_show_titles junction table
CREATE TABLE events.calendar_show_titles (
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE CASCADE,
  show_title_id uuid REFERENCES events.show_titles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (calendar_id, show_title_id)
);

-- Enable RLS
ALTER TABLE events.show_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.calendar_show_titles ENABLE ROW LEVEL SECURITY;

-- Create policies for show_titles
CREATE POLICY "Administrators can manage show titles"
ON events.show_titles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "All users can view show titles"
ON events.show_titles
FOR SELECT
TO authenticated
USING (true);

-- Create policies for calendar_show_titles
CREATE POLICY "Administrators can manage calendar show titles"
ON events.calendar_show_titles
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'administrator')
WITH CHECK (auth.jwt() ->> 'role' = 'administrator');

CREATE POLICY "All users can view calendar show titles"
ON events.calendar_show_titles
FOR SELECT
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_show_titles_updated_at
  BEFORE UPDATE ON events.show_titles
  FOR EACH ROW
  EXECUTE FUNCTION events.update_updated_at_column();