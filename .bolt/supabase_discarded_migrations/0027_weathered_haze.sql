/*
  # Create Calendar Events Table and Policies
  
  1. Tables
    - Creates users table if not exists
    - Creates calendar_events table if not exists
  
  2. Policies
    - Adds policy for managing calendar events
*/

-- Create required tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('administrator', 'supervisor', 'organizator')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'niewydany',
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create or replace the policy
DROP POLICY IF EXISTS "Calendar events can be managed by assigned users" ON calendar_events;

CREATE POLICY "Calendar events can be managed by assigned users"
    ON calendar_events FOR ALL
    TO authenticated
    USING (
        (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND (
                    role = 'supervisor'
                    OR role = 'organizator'
                )
            )
        )
        OR
        (
            status = 'do_przejęcia'
            AND EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND active = true
            )
        )
    )
    WITH CHECK (
        (
            user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND (
                    role = 'supervisor'
                    OR role = 'organizator'
                )
            )
        )
        OR
        (
            status = 'do_przejęcia'
            AND EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND active = true
            )
        )
    );