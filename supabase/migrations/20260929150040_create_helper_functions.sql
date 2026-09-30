/*
# Create notification helper function and admin management functions

1. Functions
- `create_notification()`: SECURITY DEFINER function to insert a notification.
  This is needed because notifications are created by the actor, but the recipient_id
  is a different user. RLS on notifications only allows selecting/updating own (recipient).
  This function runs with elevated privileges to insert on behalf of the actor.

2. Admin functions
- `admin_toggle_block()`: SECURITY DEFINER function for admins to block/unblock users.
- `admin_delete_post()`: SECURITY DEFINER function for admins to delete any post.
- `admin_update_report()`: SECURITY DEFINER function for admins to update report status.
*/

-- Create notification helper
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_post_id uuid DEFAULT NULL,
  p_comment_id uuid DEFAULT NULL,
  p_story_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't create self-notifications
  IF p_recipient_id = p_actor_id THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id, story_id)
  VALUES (p_recipient_id, p_actor_id, p_type, p_post_id, p_comment_id, p_story_id);
END;
$$;

-- Admin: toggle block status on a user
CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_user_id uuid,
  p_blocked boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT is_admin INTO is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  UPDATE public.profiles SET is_blocked = p_blocked WHERE id = p_user_id;
END;
$$;

-- Admin: delete any post
CREATE OR REPLACE FUNCTION public.admin_delete_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT is_admin INTO is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  DELETE FROM public.posts WHERE id = p_post_id;
END;
$$;

-- Admin: update report status
CREATE OR REPLACE FUNCTION public.admin_update_report_status(
  p_report_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT is_admin INTO is_admin FROM public.profiles WHERE id = auth.uid();
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Yetkisiz erişim';
  END IF;

  UPDATE public.reports SET status = p_status WHERE id = p_report_id;
END;
$$;

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_post TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_report_status TO authenticated;

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
