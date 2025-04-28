/*
  # Disable RLS for Events Schema Tables
  
  1. Changes
    - Disables RLS on all tables in events schema
    - Drops existing RLS policies
    - Ensures direct table access without RLS restrictions
    
  2. Tables Affected
    - show_titles
    - halls  
    - clients
    - agreements
    - agreement_performances
*/

-- Drop existing policies
DO $$ BEGIN
  -- Drop show_titles policies
  DROP POLICY IF EXISTS "Administrators can manage show titles" ON events.show_titles;
  DROP POLICY IF EXISTS "Authenticated users can view show titles" ON events.show_titles;
  
  -- Drop halls policies
  DROP POLICY IF EXISTS "Administrators can manage halls" ON events.halls;
  DROP POLICY IF EXISTS "Authenticated users can view halls" ON events.halls;
  
  -- Drop clients policies
  DROP POLICY IF EXISTS "Administrators can manage clients" ON events.clients;
  DROP POLICY IF EXISTS "Authenticated users can view clients" ON events.clients;
  
  -- Drop agreements policies
  DROP POLICY IF EXISTS "Administrators can manage agreements" ON events.agreements;
  DROP POLICY IF EXISTS "Authenticated users can view agreements" ON events.agreements;
  DROP POLICY IF EXISTS "Enable insert for administrators" ON events.agreements;
  DROP POLICY IF EXISTS "Enable update for administrators" ON events.agreements;
  DROP POLICY IF EXISTS "Enable delete for administrators" ON events.agreements;
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON events.agreements;
  
  -- Drop agreement_performances policies
  DROP POLICY IF EXISTS "Administrators can manage agreement performances" ON events.agreement_performances;
  DROP POLICY IF EXISTS "Authenticated users can view agreement performances" ON events.agreement_performances;
  DROP POLICY IF EXISTS "Enable insert for administrators" ON events.agreement_performances;
  DROP POLICY IF EXISTS "Enable update for administrators" ON events.agreement_performances;
  DROP POLICY IF EXISTS "Enable delete for administrators" ON events.agreement_performances;
  DROP POLICY IF EXISTS "Enable read for authenticated users" ON events.agreement_performances;
END $$;

-- Disable RLS on all tables
ALTER TABLE events.show_titles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events.halls DISABLE ROW LEVEL SECURITY;
ALTER TABLE events.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE events.agreements DISABLE ROW LEVEL SECURITY;
ALTER TABLE events.agreement_performances DISABLE ROW LEVEL SECURITY;