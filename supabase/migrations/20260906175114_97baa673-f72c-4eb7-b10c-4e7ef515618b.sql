ALTER TABLE public.user_verifications ADD COLUMN IF NOT EXISTS id_doc_type text;

GRANT INSERT, DELETE ON public.user_roles TO authenticated;

CREATE POLICY "admins grant roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admins revoke roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin() AND user_id <> auth.uid());