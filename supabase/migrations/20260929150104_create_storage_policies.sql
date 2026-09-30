/*
# Create storage bucket policies for avatars, posts, stories, messages

1. Storage Policies
- avatars: public read, users can upload/update/delete only their own folder (auth.uid()/filename)
- posts: public read, users can upload/update/delete only their own folder
- stories: public read, users can upload/update/delete only their own folder
- messages: public read, users can upload/update/delete only their own folder
*/

-- AVATARS bucket policies
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- POSTS bucket policies
DROP POLICY IF EXISTS "posts_public_read" ON storage.objects;
CREATE POLICY "posts_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "posts_insert_own" ON storage.objects;
CREATE POLICY "posts_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "posts_update_own" ON storage.objects;
CREATE POLICY "posts_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "posts_delete_own" ON storage.objects;
CREATE POLICY "posts_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- STORIES bucket policies
DROP POLICY IF EXISTS "stories_public_read" ON storage.objects;
CREATE POLICY "stories_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "stories_insert_own" ON storage.objects;
CREATE POLICY "stories_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "stories_delete_own" ON storage.objects;
CREATE POLICY "stories_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

-- MESSAGES bucket policies
DROP POLICY IF EXISTS "messages_public_read" ON storage.objects;
CREATE POLICY "messages_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'messages');

DROP POLICY IF EXISTS "messages_insert_own" ON storage.objects;
CREATE POLICY "messages_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'messages' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "messages_delete_own" ON storage.objects;
CREATE POLICY "messages_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'messages' AND (storage.foldername(name))[1] = auth.uid()::text);
