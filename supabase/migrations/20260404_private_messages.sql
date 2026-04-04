-- ==============================================
-- 8. Private Messages (Chat 1-on-1)
-- ==============================================

CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  author_name TEXT NOT NULL DEFAULT 'Unknown',
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing untuk mempercepat pencarian percakapan
CREATE INDEX IF NOT EXISTS idx_pm_sender_recipient ON private_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_pm_recipient_sender ON private_messages(recipient_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_pm_created_at ON private_messages(created_at);

ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Select: Hanya pengirim atau penerima yang bisa melihat pesan
CREATE POLICY "pm_select_participants"
  ON private_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Insert: Hanya bisa mengirim sebagai diri sendiri
CREATE POLICY "pm_insert_sender"
  ON private_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Update: Hanya penerima yang bisa mengubah status 'is_read'
CREATE POLICY "pm_update_is_read"
  ON private_messages FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Delete: User bisa menghapus pesan yang dikirimnya sendiri
CREATE POLICY "pm_delete_own"
  ON private_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- Aktifkan Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
