-- ==============================================
-- Fitur Anonim (Chat Messages)
-- ==============================================

-- 1. Tambahkan kolom author_is_anonymous ke tabel messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS author_is_anonymous BOOLEAN DEFAULT FALSE;

-- Update komentar kolom untuk dokumentasi
COMMENT ON COLUMN public.messages.author_is_anonymous IS 'Flag untuk menentukan apakah pesan dikirim dalam mode publik atau anonim';
