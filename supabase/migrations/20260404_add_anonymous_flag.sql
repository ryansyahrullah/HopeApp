-- ==============================================
-- Fitur Anonim (Privacy Mode)
-- ==============================================

-- 1. Tambahkan kolom is_anonymous ke tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- 2. Update RLS (opsional, karena profiles sudah public read)
-- Namun kita bisa membatasi update hanya oleh pemilik
-- Policy "Users can update own profile" biasanya sudah ada.

-- Update komentar kolom untuk dokumentasi
COMMENT ON COLUMN public.profiles.is_anonymous IS 'Flag untuk menyembunyikan identitas di grup chat dan sensor data profil dari mahasiswa lain';
