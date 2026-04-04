-- Add author_is_anonymous column to messages table for consistency with Profiles

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS author_is_anonymous BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.messages.author_is_anonymous IS 'Flag untuk menyembunyikan identitas pengirim di grup chat';
