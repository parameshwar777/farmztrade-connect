CREATE POLICY "listing photos readable" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'listing-photos');
CREATE POLICY "listing photos own write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing photos own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars readable" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'avatars');
CREATE POLICY "avatars own write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "docs owner or admin read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'verification-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
CREATE POLICY "docs owner write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "docs owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);