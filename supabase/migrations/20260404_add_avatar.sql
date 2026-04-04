-- 1. Tambahkan kolom avatar_url ke profil dan author_avatar ke pesan
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS author_avatar TEXT;


-- 2. Buat bucket avatars (jika belum ada)
-- Catatan: Biasanya dilakukan di Dashboard UI, tapi ini SQL-nya untuk referensi
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 3. RLS untuk Storage Avatars
-- Mengizinkan semua orang melihat (SELECT)
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Mengizinkan user mengunggah fotonya sendiri
CREATE POLICY "User Upload Avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Mengizinkan user menghapus fotonya sendiri
CREATE POLICY "User Delete Avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
