-- ==============================================
-- HopeApp — Fix Cici AI Bot Account
-- Jalankan di Supabase Dashboard → SQL Editor
-- ==============================================

-- STEP 1: Hapus sisa-sisa data Cici yang corrupt (jika ada)
DELETE FROM public.messages WHERE user_id = '00000000-0000-0000-0000-00000000c1c1';
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-00000000c1c1';
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-00000000c1c1';

-- STEP 2: Buat ulang akun Cici di auth.users (HARUS ada dulu sebelum profiles)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  aud,
  role,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-00000000c1c1',
  '00000000-0000-0000-0000-000000000000',
  'cici@hopeapp.ai',
  'authenticated',
  'authenticated',
  '',
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Cici 希"}'
);

-- STEP 3: Buat profil Cici
INSERT INTO public.profiles (id, full_name, email, roles, is_registered)
VALUES (
  '00000000-0000-0000-0000-00000000c1c1',
  'Cici 希',
  'cici@hopeapp.ai',
  '{ai_assistant}',
  true
);

-- STEP 4: Tambah RLS policy agar pesan bisa di-INSERT sebagai Cici
-- Drop dulu jika sudah ada (dari percobaan sebelumnya)
DROP POLICY IF EXISTS "messages_insert_ai_bot" ON messages;

-- Policy baru: izinkan INSERT ke messages jika user_id = Cici
-- (Edge Function menggunakan service_role_key yang bypass RLS, 
--  tapi ini sebagai fallback keamanan)
CREATE POLICY "messages_insert_ai_bot"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-00000000c1c1'::uuid
  );

-- STEP 5: Verifikasi
SELECT id, full_name, email, roles FROM profiles 
WHERE id = '00000000-0000-0000-0000-00000000c1c1';
