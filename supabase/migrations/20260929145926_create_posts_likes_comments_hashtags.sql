/*
# Create posts, likes, comments, and hashtags tables

1. New Tables
- `posts`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `caption` (text)
  - `media_type` (text: 'image' or 'video')
  - `media_url` (text)
  - `thumbnail_url` (text)
  - `location` (text)
  - `view_count` (integer, default 0)
  - `created_at`, `updated_at` (timestamptz)
- `post_likes`
  - `id`, `post_id`, `user_id`, `created_at`
  - UNIQUE(post_id, user_id)
- `comments`
  - `id`, `post_id`, `user_id`, `content`, `parent_id` (for replies), `created_at`, `updated_at`
- `hashtags`
  - `id`, `name` (unique)
- `post_hashtags`
  - `id`, `post_id`, `hashtag_id`

2. Security
- RLS enabled on all tables.
- Public posts readable by all authenticated users.
- Users can only create/update/delete their own posts.
- Likes: users can read all, create/delete only their own.
- Comments: users can read all, create only their own, delete only their own.
- Hashtags: readable by all, managed via a SECURITY DEFINER function (extract_hashtags).
*/

-- POSTS
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption text DEFAULT '',
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  thumbnail_url text,
  location text,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_all" ON public.posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
CREATE POLICY "posts_delete_own" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- POST_LIKES
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes_select_all" ON public.post_likes;
CREATE POLICY "post_likes_select_all" ON public.post_likes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "post_likes_insert_own" ON public.post_likes;
CREATE POLICY "post_likes_insert_own" ON public.post_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_delete_own" ON public.post_likes;
CREATE POLICY "post_likes_delete_own" ON public.post_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
CREATE POLICY "comments_select_all" ON public.comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- HASHTAGS
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hashtags_select_all" ON public.hashtags;
CREATE POLICY "hashtags_select_all" ON public.hashtags
  FOR SELECT TO authenticated USING (true);

-- POST_HASHTAGS
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  UNIQUE(post_id, hashtag_id)
);

ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_hashtags_select_all" ON public.post_hashtags;
CREATE POLICY "post_hashtags_select_all" ON public.post_hashtags
  FOR SELECT TO authenticated USING (true);

-- SECURITY DEFINER function to extract and save hashtags from a post caption
-- Called after a post is created/updated; runs with elevated privileges
CREATE OR REPLACE FUNCTION public.extract_hashtags(p_post_id uuid, p_caption text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tag text;
BEGIN
  -- Extract hashtags from caption using regex
  -- Pattern: # followed by word characters
  FOR tag IN SELECT lower(match) FROM regexp_matches(p_caption, '#([a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+)', 'g') AS t(match)
  LOOP
    -- Insert hashtag if not exists
    INSERT INTO public.hashtags (name) VALUES (tag) ON CONFLICT (name) DO NOTHING;
    -- Link hashtag to post
    INSERT INTO public.post_hashtags (post_id, hashtag_id)
    SELECT p_post_id, id FROM public.hashtags WHERE name = tag
    ON CONFLICT (post_id, hashtag_id) DO NOTHING;
  END LOOP;
END;
$$;
