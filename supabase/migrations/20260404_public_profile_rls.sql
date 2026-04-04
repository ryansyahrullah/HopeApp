-- Mengizinkan semua user yang login untuk melihat profil user lain
-- Ini diperlukan untuk fitur "Pop-up Profil" di Chat
CREATE POLICY "profiles_select_all_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Hapus policy lama yang mungkin bentrok (jika ada yang manual ditambahkan)
-- DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
-- DROP POLICY IF EXISTS "profiles_select_admin_dosen" ON profiles;
