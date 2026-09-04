-- ============================================================================
-- Malika Market — 0020: Storage buckets & policies
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('store-branding', 'store-branding', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('review-images', 'review-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-attachments', 'chat-attachments', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('verification-documents', 'verification-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('warranty-documents', 'warranty-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('import-files', 'import-files', false, 10485760, array['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;

-- Public buckets: anyone can read; only the authenticated owner (folder name
-- convention: first path segment = auth.uid() or store_id they belong to)
-- may write. Uploads are additionally re-validated server-side (type/size).

create policy "public read: avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "own avatar write" on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "own avatar update" on storage.objects for update using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "own avatar delete" on storage.objects for delete using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "public read: store branding" on storage.objects for select using (bucket_id = 'store-branding');
create policy "store member write branding" on storage.objects for insert with check (
  bucket_id = 'store-branding' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);
create policy "store member update branding" on storage.objects for update using (
  bucket_id = 'store-branding' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);
create policy "store member delete branding" on storage.objects for delete using (
  bucket_id = 'store-branding' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);

create policy "public read: product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "store member write product images" on storage.objects for insert with check (
  bucket_id = 'product-images' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);
create policy "store member update product images" on storage.objects for update using (
  bucket_id = 'product-images' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);
create policy "store member delete product images" on storage.objects for delete using (
  bucket_id = 'product-images' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);

create policy "public read: banners" on storage.objects for select using (bucket_id = 'banners');
create policy "admin write banners" on storage.objects for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "admin update banners" on storage.objects for update using (bucket_id = 'banners' and public.is_admin());
create policy "admin delete banners" on storage.objects for delete using (bucket_id = 'banners' and public.is_admin());

create policy "public read: review images" on storage.objects for select using (bucket_id = 'review-images');
create policy "own review image write" on storage.objects for insert with check (
  bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Private buckets: only the folder-owning participant(s) may read/write.
create policy "chat attachment participants" on storage.objects for select using (
  bucket_id = 'chat-attachments' and (
    (storage.foldername(name))[1] = auth.uid()::text or public.is_moderator_or_admin()
  )
);
create policy "chat attachment upload" on storage.objects for insert with check (
  bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "verification docs participants" on storage.objects for select using (
  bucket_id = 'verification-documents' and (
    public.is_store_member(((storage.foldername(name))[1])::uuid) or public.is_moderator_or_admin()
  )
);
create policy "verification docs upload" on storage.objects for insert with check (
  bucket_id = 'verification-documents' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);

create policy "warranty docs participants" on storage.objects for select using (
  bucket_id = 'warranty-documents' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_store_member(((storage.foldername(name))[2])::uuid)
    or public.is_admin()
  )
);
create policy "warranty docs upload" on storage.objects for insert with check (
  bucket_id = 'warranty-documents' and public.is_store_member(((storage.foldername(name))[2])::uuid)
);

create policy "import files store" on storage.objects for select using (
  bucket_id = 'import-files' and (
    public.is_store_member(((storage.foldername(name))[1])::uuid) or public.is_admin()
  )
);
create policy "import files upload" on storage.objects for insert with check (
  bucket_id = 'import-files' and public.is_store_member(((storage.foldername(name))[1])::uuid)
);
