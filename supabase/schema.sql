-- ==============================================
-- HopeApp - POLIBAN | Database Schema v2
-- Jalankan SQL ini di Supabase SQL Editor
-- ==============================================

-- 1. Profiles (extend Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  nim TEXT,
  student_number TEXT,
  jurusan TEXT,
  prodi TEXT,
  semester INT,
  phone TEXT,
  roles TEXT[] NOT NULL DEFAULT '{mahasiswa}',
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Meetings (Pertemuan)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_number INT NOT NULL,
  title TEXT NOT NULL,
  topic TEXT,
  meeting_date DATE NOT NULL,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Attendances (Absensi)
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_present BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT DEFAULT 'alfa' CHECK (status IN ('hadir', 'alfa', 'sakit', 'izin')),
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, student_id)
);

-- 4. Resumes (Rangkuman Mahasiswa)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, student_id)
);

-- 5. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default registration toggle
INSERT INTO system_settings (key, value)
VALUES ('is_registration_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- ==============================================
-- Trigger: Auto-create profile saat user signup
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, roles)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    '{mahasiswa}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- Row Level Security (RLS) Policies
-- ==============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper: Check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT check_role = ANY(
    SELECT unnest(roles) FROM public.profiles WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_select_admin_dosen"
  ON profiles FOR SELECT TO authenticated USING (public.has_role('admin') OR public.has_role('dosen'));

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE TO authenticated USING (public.has_role('admin'));

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE TO authenticated USING (public.has_role('admin'));

-- ---- MEETINGS ----
CREATE POLICY "meetings_select_authenticated"
  ON meetings FOR SELECT TO authenticated USING (true);

CREATE POLICY "meetings_insert_admin"
  ON meetings FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));

CREATE POLICY "meetings_update_admin"
  ON meetings FOR UPDATE TO authenticated USING (public.has_role('admin'));

CREATE POLICY "meetings_delete_admin"
  ON meetings FOR DELETE TO authenticated USING (public.has_role('admin'));

-- ---- ATTENDANCES ----
CREATE POLICY "attendances_select_admin_dosen"
  ON attendances FOR SELECT TO authenticated
  USING (public.has_role('admin') OR public.has_role('dosen'));

CREATE POLICY "attendances_select_own"
  ON attendances FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "attendances_insert_admin"
  ON attendances FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));

CREATE POLICY "attendances_update_admin"
  ON attendances FOR UPDATE TO authenticated USING (public.has_role('admin'));

CREATE POLICY "attendances_delete_admin"
  ON attendances FOR DELETE TO authenticated USING (public.has_role('admin'));

-- ---- RESUMES ----
CREATE POLICY "resumes_select_admin_dosen"
  ON resumes FOR SELECT TO authenticated
  USING (public.has_role('admin') OR public.has_role('dosen'));

CREATE POLICY "resumes_select_own"
  ON resumes FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "resumes_insert_own"
  ON resumes FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "resumes_update_own"
  ON resumes FOR UPDATE TO authenticated USING (student_id = auth.uid());

CREATE POLICY "resumes_delete_own"
  ON resumes FOR DELETE TO authenticated USING (student_id = auth.uid());

CREATE POLICY "resumes_delete_admin"
  ON resumes FOR DELETE TO authenticated USING (public.has_role('admin'));

-- ---- SYSTEM SETTINGS ----
CREATE POLICY "settings_select_authenticated"
  ON system_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "settings_insert_admin"
  ON system_settings FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));

CREATE POLICY "settings_update_admin"
  ON system_settings FOR UPDATE TO authenticated USING (public.has_role('admin'));

CREATE POLICY "settings_delete_admin"
  ON system_settings FOR DELETE TO authenticated USING (public.has_role('admin'));

-- ==============================================
-- 6. Feedbacks (Masukan Sistem)
-- ==============================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Select: Bisa diakses oleh siapapun untuk halaman publik (termasuk anonim dan terautentikasi)
CREATE POLICY "feedbacks_select_public"
  ON feedbacks FOR SELECT USING (true);

-- Insert: Hanya bisa oleh mahasiswa yang login
CREATE POLICY "feedbacks_insert_mahasiswa"
  ON feedbacks FOR INSERT TO authenticated WITH CHECK (public.has_role('mahasiswa'));

-- Delete: Hanya bisa dihapus oleh admin
CREATE POLICY "feedbacks_delete_admin"
  ON feedbacks FOR DELETE TO authenticated USING (public.has_role('admin'));

-- ==============================================
-- 7. Messages (Obrolan Grup Mahasiswa)
-- ==============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Unknown',
  author_number TEXT,
  author_roles TEXT[] DEFAULT '{mahasiswa}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Select: Semua user login bisa baca (perlu untuk realtime)
CREATE POLICY "messages_select_authenticated"
  ON messages FOR SELECT TO authenticated USING (true);

-- Insert: Hanya mahasiswa yang bisa kirim pesan
CREATE POLICY "messages_insert_mahasiswa"
  ON messages FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND public.has_role('mahasiswa')
  );

-- Delete: User bisa hapus pesannya sendiri
CREATE POLICY "messages_delete_own"
  ON messages FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Delete: Admin bisa hapus semua pesan
CREATE POLICY "messages_delete_admin"
  ON messages FOR DELETE TO authenticated USING (public.has_role('admin'));

-- Aktifkan Supabase Realtime untuk tabel messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
