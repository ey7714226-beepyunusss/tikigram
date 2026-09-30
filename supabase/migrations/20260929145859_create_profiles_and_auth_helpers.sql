/*
# Create profiles table and auth helpers

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique, not null, lowercase normalized)
  - `display_name` (text)
  - `bio` (text)
  - `avatar_url` (text)
  - `website_url` (text)
  - `is_private` (boolean, default false)
  - `is_admin` (boolean, default false)
  - `is_blocked` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `profiles`.
- Users can read all profiles (public directory).
- Users can update only their own profile.
- `is_admin` and `is_blocked` columns are protected via column-level privileges (users cannot set them via client).

3. Notes
- A trigger creates a profile row automatically when a new auth.users row is inserted.
- Username is normalized to lowercase and validated via CHECK constraint.
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text DEFAULT '',
  avatar_url text,
  website_url text,
  is_private boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9._]{3,30}$')
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read profiles (public directory)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Users can update only their own profile, but NOT is_admin/is_blocked columns
-- (column-level security enforced via a trigger that prevents client-side changes to those fields)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile row (for manual creation if needed)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger: automatically create a profile when a new auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    lower(NEW.raw_user_meta_data->>'username'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: prevent client from modifying is_admin or is_blocked
CREATE OR REPLACE FUNCTION public.protect_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow is_admin/is_blocked changes from server-side (service role bypasses RLS)
  -- If the update comes from a client (auth.uid() is set), preserve old values
  IF auth.uid() IS NOT NULL THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_blocked := OLD.is_blocked;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_admin_columns_trigger ON public.profiles;
CREATE TRIGGER protect_admin_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_admin_columns();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
