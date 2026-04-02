# HopeApp — Core System Documentation

> **Versi:** 1.4.0  
> **Terakhir diperbarui:** 3 April 2026  
> **Stack:** Vue 3 + Vite + Supabase + Vercel  
> **Tujuan:** Portal koordinasi kelas Bahasa Mandarin program HOPE — POLIBAN

---

## 1. Gambaran Umum

HopeApp adalah web application untuk mengelola kelas Bahasa Mandarin di POLIBAN. Aplikasi ini mencakup:

- **Manajemen Pertemuan** (CRUD sesi kelas)
- **Presensi / Absensi** (matriks kehadiran per sesi)
- **Resume Mahasiswa** (catatan rangkuman per sesi, ditulis mahasiswa)
- **Dashboard Statistik** (ringkasan kehadiran, resume, jumlah mahasiswa)
- **Manajemen Pengguna** (multi-role, toggle registrasi, CRUD user oleh admin)
- **Profil & Pengaturan Akun** (edit data diri, ubah email/password)

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (Vue 3 + Vite)            │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Views   │──│Components│──│  Router  │              │
│  │ (13 hal) │  │(reusable)│  │(vue-rtr) │              │
│  └────┬─────┘  └──────────┘  └──────────┘              │
│       │                                                 │
│  ┌────▼─────────────────────────────┐                   │
│  │       Service Layer (4 files)    │                   │
│  │  meetingService.js               │                   │
│  │  presensiService.js              │                   │
│  │  resumeService.js                │                   │
│  │  dashboardService.js             │                   │
│  └────┬─────────────────────────────┘                   │
│       │                                                 │
│  ┌────▼─────────────────────────────┐                   │
│  │       Composable: useAuth.js     │                   │
│  │  (auth state, role guard, user)  │                   │
│  └────┬─────────────────────────────┘                   │
│       │                                                 │
│  ┌────▼─────────────────────────────┐                   │
│  │     Supabase Client (lib/)       │                   │
│  │  supabase.js → createClient()    │                   │
│  └────┬─────────────────────────────┘                   │
│       │                                                 │
└───────┼─────────────────────────────────────────────────┘
        │ HTTPS (REST + Realtime)
        ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                    │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │ Database │  │   RLS    │              │
│  │(Google+  │  │(Postgres)│  │(Row Level│              │
│  │ Email)   │  │          │  │Security) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  Tables: profiles, meetings, attendances, resumes,      │
│          system_settings                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                   VERCEL (Hosting)                       │
│  Static SPA deployment, auto-deploy from GitHub         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure

```
d:\HopeApp\
├── Core/
│   └── core.md                    ← Dokumentasi ini
├── public/
│   ├── favicon.png                ← Favicon (logo Barongsai)
│   ├── logo-192x192.png           ← PWA icon 192px
│   ├── logo-512x512.png           ← PWA icon 512px
│   └── login-bg.png               ← Background gambar login page
├── src/
│   ├── main.js                    ← Entry point Vue app
│   ├── App.vue                    ← Root component (sidebar + header + router-view)
│   ├── assets/
│   │   └── index.css              ← Global CSS (design tokens, reset, utilities, native mobile fixes)
│   ├── lib/
│   │   └── supabase.js            ← Supabase client instance
│   ├── composables/
│   │   └── useAuth.js             ← Auth state management (login, logout, role guards)
│   ├── services/
│   │   ├── meetingService.js      ← CRUD meetings via Supabase
│   │   ├── presensiService.js     ← CRUD attendances via Supabase
│   │   ├── resumeService.js       ← CRUD resumes via Supabase
│   │   ├── profileService.js      ← CRUD profiles via Supabase
│   │   └── dashboardService.js    ← Aggregate stats queries
│   ├── router/
│   │   └── index.js               ← Vue Router config + auth navigation guard (cached profile)
│   ├── components/
│   │   ├── common/                ← Reusable UI components
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseCard.vue
│   │   │   ├── BaseModal.vue
│   │   │   ├── BaseSelect.vue
│   │   │   ├── ContactModal.vue
│   │   │   ├── EmptyState.vue
│   │   │   └── StatusBadge.vue
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue     ← Sidebar kiri (desktop) / bottom nav (mobile)
│   │   │   └── AppHeader.vue      ← Top bar + user avatar popup menu
│   │   ├── meeting/
│   │   │   ├── MeetingCard.vue    ← Card pertemuan di grid
│   │   │   └── YouTubeEmbed.vue   ← Embed video YouTube
│   │   ├── presensi/
│   │   │   └── PresensiCheckList.vue ← Checklist absensi per sesi
│   │   └── resume/
│   │       ├── MeetingResumeManager.vue ← Manager resume per sesi
│   │       └── RichTextEditor.vue ← TipTap rich text editor
│   └── views/                     ← Halaman-halaman utama
│       ├── LoginView.vue          ← Login (email + Google OAuth + forgot password + versi app)
│       ├── CompleteProfileView.vue← Onboarding profil mahasiswa baru
│       ├── DashboardView.vue      ← Dashboard utama (optimistic UI, bento grid stats)
│       ├── MeetingsView.vue       ← List pertemuan (grid + mobile list)
│       ├── MeetingDetailView.vue  ← Detail 1 pertemuan (materi + presensi + resume)
│       ├── PresensiView.vue       ← Matriks rekap presensi semua mahasiswa
│       ├── ResumesView.vue        ← Rekap resume semua mahasiswa per sesi
│       ├── MyResumesView.vue      ← Resume milik mahasiswa sendiri
│       ├── SummaryView.vue        ← Ringkasan eksekutif (presensi + resume)
│       ├── MahasiswaView.vue      ← Daftar semua mahasiswa
│       ├── MahasiswaDetailView.vue← Detail 1 mahasiswa (data diri + WhatsApp)
│       ├── UsersView.vue          ← Manajemen pengguna (admin only)
│       ├── ProfileView.vue        ← Profil user yang sedang login
│       └── SettingsView.vue       ← Pengaturan akun (email, password, Supabase Auth)
├── supabase/
│   └── schema.sql                 ← Database schema untuk Supabase SQL Editor
├── .env.example                   ← Template environment variables
├── index.html                     ← Entry HTML (PWA meta tags, viewport lock, theme-color)
├── package.json
├── vite.config.js                 ← Vite config (PWA plugin, chunk splitting)
└── vercel.json                    ← Konfigurasi deploy Vercel (SPA rewrite)
```

---

## 4. Authentication & Authorization

### 4.1 Auth Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐
│  Login   │────▶│ Supabase Auth│────▶│ Auto-create  │
│  Page    │     │ (Email/Google│     │ Profile via  │
│          │     │  OAuth)      │     │ DB Trigger   │
└─────────┘     └──────────────┘     └──────┬───────┘
                                            │
                              ┌─────────────▼──────────────┐
                              │  profiles table            │
                              │  - id (= auth.users.id)    │
                              │  - full_name               │
                              │  - email                   │
                              │  - roles: ['mahasiswa']    │
                              │  - is_registered: false    │
                              └────────────────────────────┘
```

**Login Methods:**
1. **Email + Password** — `supabase.auth.signInWithPassword()`
2. **Google OAuth** — `supabase.auth.signInWithOAuth({ provider: 'google' })`

**Forgot Password:**
- Menggunakan Supabase built-in: `supabase.auth.resetPasswordForEmail(email)`
- User menerima link reset via email, bukan OTP

**Logout:**
- `supabase.auth.signOut()` → redirect ke `/login`

### 4.2 Role System (Multi-Role)

Setiap user memiliki array `roles` di tabel `profiles`:

```sql
roles TEXT[] NOT NULL DEFAULT '{mahasiswa}'
```

Kemungkinan nilai: `admin`, `dosen`, `mahasiswa`

Satu user bisa punya lebih dari 1 role, contoh: `'{admin, dosen}'`

### 4.3 Role Guards

```javascript
// composables/useAuth.js
const isAdmin    = computed(() => profile.value?.roles?.includes('admin'))
const isDosen    = computed(() => profile.value?.roles?.includes('dosen'))
const isMahasiswa = computed(() => profile.value?.roles?.includes('mahasiswa'))
```

### 4.4 Akses Per Halaman

| Halaman | Admin | Dosen | Mahasiswa |
|---------|:-----:|:-----:|:---------:|
| Dashboard | ✅ | ✅ | ✅ |
| Meetings | ✅ (CRUD) | ✅ (Read) | ✅ (Read) |
| Meeting Detail | ✅ (CRUD + Presensi) | ✅ (Read + Presensi) | ✅ (Read + Resume) |
| Presensi Rekap | ✅ | ✅ | ❌ |
| Resume Rekap | ✅ | ✅ | ❌ |
| My Resumes | ❌ | ❌ | ✅ |
| Summary | ✅ | ✅ | ❌ |
| Mahasiswa List | ✅ | ✅ | ❌ |
| Mahasiswa Detail | ✅ (Edit+Hapus) | ✅ (Read) | ❌ |
| Users Management | ✅ | ❌ | ❌ |
| Profile | ✅ (Edit) | ✅ (Edit) | ✅ (Edit) |
| Settings | ✅ | ✅ | ✅ |

### 4.5 Registration Toggle

- Disimpan di tabel `system_settings` di Supabase
- Admin bisa on/off via switch di halaman Users
- Jika **OFF**: user baru yang mencoba signup akan **ditolak langsung** (blocked di frontend)
- Admin pertama: `syahrullahryan@gmail.com`

### 4.6 Navigation Guard (Router) — Optimized

```javascript
// router/index.js
router.beforeEach(async (to, from, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (to.path === '/login') {
      return session ? next('/') : next()
    }
    if (!session) return next('/login')

    // OPTIMASI: Gunakan profile dari memory cache (useAuth),
    // hanya fetch DB jika cache kosong (pertama kali / refresh browser)
    const { profile } = useAuth()
    let currentProfile = profile.value
    if (!currentProfile) {
      const { data } = await supabase
        .from('profiles').select('is_registered, roles')
        .eq('id', session.user.id).single()
      currentProfile = data
    }

    // Redirect onboarding mahasiswa baru
    if (currentProfile?.roles?.includes('mahasiswa') && ...) { ... }
    
    next()
  } catch (err) {
    // Anti-stuck: Wajib jalankan next apa pun yang terjadi
    next()
  }
})
```

**Penting:** Navigation guard menggunakan **memory caching** dari `useAuth()` sehingga perpindahan menu INSTAN tanpa menunggu response Supabase. Fetch database hanya terjadi 1x saat pertama kali load / refresh browser.

---

## 5. Database Schema (Supabase / PostgreSQL)

### 5.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│  auth.users  │       │  profiles    │
│  (Supabase)  │──1:1──│              │
│              │       │  id (FK)     │
└──────────────┘       │  full_name   │
                       │  email       │
                       │  nim         │
                       │  student_num │
                       │  jurusan     │
                       │  prodi       │
                       │  semester    │
                       │  phone       │
                       │  roles[]     │
                       │  is_registered│
                       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼───────┐ ┌────▼────────┐ ┌────▼────────┐
     │  attendances   │ │   resumes   │ │  (profile   │
     │                │ │             │ │   queries)  │
     │  meeting_id(FK)│ │ meeting_id  │ │             │
     │  student_id(FK)│ │ student_id  │ └─────────────┘
     │  is_present    │ │ content     │
     │  status        │ │ submitted_at│
     │  note          │ └─────────────┘
     └────────┬───────┘        ▲
              │                │
     ┌────────▼───────────────┬┘
     │     meetings           │
     │                        │
     │  id                    │
     │  meeting_number        │
     │  title                 │
     │  topic                 │
     │  meeting_date          │
     │  video_url             │
     └────────────────────────┘

     ┌────────────────────────┐
     │   system_settings      │
     │                        │
     │  key (PK)              │
     │  value                 │
     └────────────────────────┘
```

### 5.2 Tabel Detail

#### `profiles`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID (PK, FK → auth.users) | Auto-linked saat signup |
| full_name | TEXT | Nama lengkap |
| email | TEXT | Email user |
| nim | TEXT | Nomor Induk Mahasiswa |
| student_number | TEXT | Nomor Anggota HOPE (H-001, dll) |
| jurusan | TEXT | Jurusan kuliah |
| prodi | TEXT | Program studi |
| semester | INT | Semester aktif |
| phone | TEXT | No. HP / WhatsApp |
| roles | TEXT[] | Array role: `{mahasiswa}`, `{admin,dosen}` |
| is_registered | BOOLEAN | Status registrasi (default: false) |
| created_at | TIMESTAMPTZ | Waktu pembuatan akun |

#### `meetings`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID (PK) | Auto-generated |
| meeting_number | INT | Nomor sesi (1, 2, 3, ...) |
| title | TEXT | Judul sesi, cth: "Pengenalan Pinyin" |
| topic | TEXT | Deskripsi topik bahasan |
| meeting_date | DATE | Tanggal pertemuan |
| video_url | TEXT | Link YouTube (opsional) |
| created_at | TIMESTAMPTZ | Waktu dibuat |

#### `attendances`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID (PK) | Auto-generated |
| meeting_id | UUID (FK → meetings) | Sesi mana |
| student_id | UUID (FK → profiles) | Mahasiswa mana |
| is_present | BOOLEAN | Hadir atau tidak |
| status | TEXT | 'hadir', 'alfa', 'sakit', 'izin' |
| note | TEXT | Catatan tambahan |
| updated_at | TIMESTAMPTZ | Terakhir diupdate |
| | | **UNIQUE(meeting_id, student_id)** |

#### `resumes`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID (PK) | Auto-generated |
| meeting_id | UUID (FK → meetings) | Sesi mana |
| student_id | UUID (FK → profiles) | Mahasiswa mana |
| content | TEXT | Isi resume (HTML dari rich text editor) |
| submitted_at | TIMESTAMPTZ | Waktu pertama submit |
| updated_at | TIMESTAMPTZ | Terakhir diupdate |
| | | **UNIQUE(meeting_id, student_id)** |

#### `system_settings`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| key | TEXT (PK) | Nama setting, cth: `is_registration_open` |
| value | TEXT | Nilai setting, cth: `true` / `false` |

### 5.3 Row Level Security (RLS)

Semua tabel menggunakan RLS. Akses dikontrol per-baris berdasarkan role user:

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Semua authenticated | Trigger auto | Own + Admin | Admin |
| meetings | Semua authenticated | Admin | Admin | Admin |
| attendances | Admin+Dosen (semua), Mahasiswa (sendiri) | Admin | Admin | Admin |
| resumes | Admin+Dosen (semua), Mahasiswa (sendiri) | Mahasiswa (sendiri) | Mahasiswa (sendiri) | Mahasiswa (sendiri) + Admin |
| system_settings | Semua authenticated | Admin | Admin | Admin |

### 5.4 Database Trigger

Saat user baru signup di Supabase Auth, trigger `on_auth_user_created` otomatis membuat baris di tabel `profiles`:

```sql
-- Mengambil nama dari Google metadata atau kosong
INSERT INTO profiles (id, full_name, email, roles)
VALUES (NEW.id, COALESCE(metadata->>'name', ''), NEW.email, '{mahasiswa}');
```

---

## 6. Service Layer (Clean Architecture)

Semua akses data melewati **service files**. Views **tidak pernah** memanggil Supabase langsung. Ini mempermudah maintenance dan testing.

### 6.1 meetingService.js

```
getMeetings()          → SELECT * FROM meetings ORDER BY meeting_number
getMeetingById(id)     → SELECT * FROM meetings WHERE id = ?
createMeeting(data)    → INSERT INTO meetings
updateMeeting(id,data) → UPDATE meetings SET ... WHERE id = ?
deleteMeeting(id)      → DELETE FROM meetings WHERE id = ?
```

### 6.2 presensiService.js

```
getAllPresensi()                    → SELECT * FROM attendances
getPresensiByMeeting(meetingId)    → SELECT attendances + JOIN profiles (enriched)
savePresensiBatch(meetingId, data) → UPSERT attendances (bulk)
```

### 6.3 resumeService.js

```
getMyResumeByMeeting(meetingId, studentId) → SELECT WHERE meeting_id AND student_id
saveResume(meetingId, studentId, content)  → UPSERT (insert or update)
getAllResumesByMeeting(meetingId)           → SELECT WHERE meeting_id (admin view)
getMyAllResumes(studentId)                 → SELECT WHERE student_id (mahasiswa)
getAllResumes()                             → SELECT * (for summary matrix)
```

### 6.4 dashboardService.js

```
getAdminStats()              → Aggregate: total meetings, students, avg attendance
getMahasiswaStats(studentId) → Aggregate: attendance %, hadir count, missing resumes
```

---

## 7. Modul & Fitur per View

### 7.1 LoginView (`/login`)

- **Form Login**: Email + Password → `supabase.auth.signInWithPassword()`
- **Google OAuth**: Tombol "Google" → `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Forgot Password**: Input email → `supabase.auth.resetPasswordForEmail()` → link reset dikirim ke email
- **Cek Registrasi**: Jika toggle registrasi OFF, signup diblokir
- **Versi Aplikasi**: Menampilkan teks "Versi X.X.X" di bawah tombol Google
- **UI**: Split layout (banner kiri + form kanan), mobile responsive (banner atas + form bawah rounded)

### 7.2 DashboardView (`/`)

- **Admin/Dosen**: Bento grid stats (rata kehadiran %, jumlah mahasiswa, total sesi), app shortcuts
- **Mahasiswa**: Tingkat kehadiran %, resume tertunda, link ke materi terbaru
- **Mobile**: Wallet-style header (gradient merah), horizontal scroll stat cards, app shortcuts grid 4 kolom
- **Optimistic UI**: Shortcut menu dan stat cards muncul INSTAN dengan nilai default 0, lalu angka asli muncul reaktif saat data Supabase tiba. Tidak ada loading spinner yang memblokir konten.

### 7.3 MeetingsView (`/meetings`)

- **Semua Role**: Lihat daftar pertemuan, sorting (terbaru/terlama)
- **Admin**: Tambah pertemuan (modal form), edit, hapus (confirm dialog)
- **Desktop**: Grid cards
- **Mobile**: Chat-like list, FAB button untuk tambah, sort toggle

### 7.4 MeetingDetailView (`/meetings/:id`)

- **Semua Role**: Lihat detail materi (judul, topik, tanggal, video YouTube embed)
- **Admin/Dosen**: Tab "Presensi" → checklist absensi per mahasiswa menggunakan `PresensiCheckList.vue`
- **Mahasiswa**: Tab "Resume" → rich text editor (TipTap) untuk menulis resume menggunakan `MeetingResumeManager.vue`
- **Admin**: Tab "Rekap Resume" → lihat semua resume yang dikumpulkan mahasiswa

### 7.5 PresensiView (`/presensi`)

- **Admin/Dosen Only**
- Matriks tabel: baris = mahasiswa, kolom = sesi pertemuan
- Cell menampilkan H (Hadir, hijau) atau A (Alpa, merah) atau - (belum diabsen)
- Kolom terakhir: Total Alpa (highlight merah jika ≥ 3)
- Klik nama mahasiswa → ContactModal (lihat detail + link WhatsApp)
- Sticky first column saat horizontal scroll

### 7.6 ResumesView (`/resumes`)

- **Admin/Dosen Only**
- Matriks serupa PresensiView tapi untuk resume
- Cell menampilkan ✓ (sudah kumpul) atau ✗ (belum)
- Klik cell → lihat isi resume mahasiswa

### 7.7 MyResumesView (`/my-resumes`)

- **Mahasiswa Only**
- Dropdown selector: pilih sesi pertemuan
- Rich text editor (TipTap) untuk menulis/edit resume
- Auto-save ke Supabase saat submit

### 7.8 SummaryView (`/summary`)

- **Admin/Dosen Only**
- Toggle tabs: Rekap Presensi | Rekap Resume
- Tabel ringkasan: Total Hadir, Total Alpa per mahasiswa
- Tabel ringkasan: Total Resume Kumpul, Total Kosong per mahasiswa
- Warning row (merah muda) jika alpa/kosong ≥ 3
- Klik nama → ContactModal

### 7.9 MahasiswaView (`/mahasiswa`)

- **Admin/Dosen Only**
- Daftar semua mahasiswa (avatar, nama, NIM, nomor anggota)
- Search bar (cari nama / NIM / nomor anggota)
- Klik item → navigasi ke detail
- Mobile: gradient header + overlap search bar

### 7.10 MahasiswaDetailView (`/mahasiswa/:id`)

- **Admin/Dosen Only**
- Profile hero: avatar, nama, NIM
- Card info: NIM, Nomor Anggota, Jurusan, Prodi, Semester, No HP (link WhatsApp)
- **Admin Only**: Tombol Edit (modal form) + Tombol Hapus (confirm dialog)

### 7.11 UsersView (`/users`)

- **Admin Only**
- Toggle registrasi (buka/tutup pendaftaran baru)
- Tombol "Tambah User" (modal: email, password, role selection)
- Tabel matriks role: kolom Mahasiswa / Dosen / Admin (checkbox toggle)
- Kolom Aksi: Edit (modal form lengkap) + Hapus (confirm)
- Search bar

### 7.12 ProfileView (`/profile`)

- **Semua Role**
- Profile hero: avatar, nama, role ribbon
- Card Informasi Akademik (Mahasiswa only): NIM, Nomor Anggota, Jurusan, Prodi, Semester
- Card Statistik Kegiatan: total pertemuan, kehadiran, resume terkumpul
- Card Tentang Akun: User ID, Role badge, Auth provider
- Tombol "Edit Profil" → modal form

### 7.13 SettingsView (`/settings`)

- **Semua Role**
- Menu navigasi: Email → form ubah email
- Menu navigasi: Password → form ubah/buat password
- Step indicator dots
- Info banner keamanan
- Terhubung ke `supabase.auth.updateUser()`

---

## 8. Component Library

### 8.1 Common Components

| Component | Fungsi |
|-----------|--------|
| `BaseButton` | Tombol dengan variant: `primary`, `outline`, `danger`. Size: `sm`, `md`, `lg` |
| `BaseCard` | Kartu kontainer dengan shadow dan border |
| `BaseModal` | Modal dialog (overlay + card). Slot: default (body), `#footer` |
| `BaseSelect` | Custom dropdown select dengan options array `[{ label, value }]` |
| `ContactModal` | Modal kontak mahasiswa (nama, NIM, HP, link WhatsApp) |
| `EmptyState` | Placeholder saat data kosong. Slot: `#icon`, `#action` |
| `StatusBadge` | Badge label berwarna. Type: `success`, `danger`, `info`, `warning` |

### 8.2 Layout Components

| Component | Fungsi |
|-----------|--------|
| `AppSidebar` | Sidebar kiri (desktop) / bottom navigation bar (mobile). Menu berdasarkan role |
| `AppHeader` | Top bar dengan avatar. Popup menu: profile link, role info, logout |

### 8.3 Feature Components

| Component | Fungsi |
|-----------|--------|
| `MeetingCard` | Card untuk 1 pertemuan: nomor sesi, judul, tanggal, tombol edit/hapus |
| `YouTubeEmbed` | Embed iframe YouTube dari URL |
| `PresensiCheckList` | Checklist absensi: list mahasiswa dengan toggle hadir/alfa/sakit/izin |
| `MeetingResumeManager` | Container resume per sesi: load resume → editor → save |
| `RichTextEditor` | TipTap editor: bold, italic, bullet list, heading. Emit content HTML |

---

## 9. UI/UX Design System

### 9.1 CSS Design Tokens (index.css)

```css
:root {
  --c-primary: #c62828;        /* Merah utama (brand HopeApp) */
  --c-secondary: #e65100;      /* Oranye sekunder */
  --c-danger: #dc2626;         /* Merah error/bahaya */
  --c-success: #16a34a;        /* Hijau sukses */
  --c-warning: #d97706;        /* Kuning peringatan */
  --c-info: #2563eb;           /* Biru informasi */
  
  --c-bg: #f8f9fa;             /* Background utama */
  --c-surface: #ffffff;        /* Background kartu/komponen */
  --c-border: #e5e7eb;         /* Border */
  --c-text-main: #1f2937;      /* Teks utama */
  --c-text-muted: #6b7280;     /* Teks sekunder */
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 60px rgba(0,0,0,0.1);
  
  --font-sans: 'Inter', sans-serif;
}
```

### 9.2 Responsive Breakpoints

| Breakpoint | Target | Behavior |
|------------|--------|----------|
| `> 768px` | Desktop | Sidebar kiri, bento grid, tabel full |
| `≤ 768px` | Mobile | Bottom nav, gradient headers, overlap cards, list view |
| `≤ 600px` | Small phone | Single column fallback, compact padding |
| `≤ 400px` | Very small | Extra compact form |

### 9.3 Mobile-First Patterns

- **Gradient header**: Merah gelap (brand) dengan border-radius bawah 20px
- **Overlap search bar**: Margin-top negatif (-2rem) agar menimpa header
- **Chat-like list**: Item berjejer vertikal dengan session circle + chevron
- **FAB (Floating Action Button)**: Tombol bulat merah di kanan bawah (admin only)
- **Horizontal scroll stat cards**: Snap scroll, card 75% width agar "peek" card berikutnya

---

## 10. Supabase Client Configuration

### 10.1 Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 10.2 Client Setup (lib/supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 11. Deployment (Vercel)

### 11.1 Build Config

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Ini diperlukan karena Vue Router menggunakan `history` mode — semua route harus di-rewrite ke `index.html` agar client-side routing bekerja.

### 11.2 Environment Variables di Vercel

Set di Vercel dashboard → Project Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 11.3 Build Command

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 11.4 Auto-Deploy

Connect GitHub repo → setiap push ke branch `main` akan auto-deploy.

---

## 12. Key Dependencies

| Package | Version | Fungsi |
|---------|---------|--------|
| `vue` | ^3.5 | Frontend framework |
| `vue-router` | ^4.5 | Client-side routing |
| `@supabase/supabase-js` | ^2.49 | Supabase client SDK |
| `lucide-vue-next` | ^1.0 | Icon library (Lucide Icons) |
| `@tiptap/vue-3` | ^2.12 | Rich text editor framework |
| `@tiptap/starter-kit` | ^2.12 | TipTap default extensions (bold, italic, list, heading) |
| `@tiptap/extension-placeholder` | ^2.12 | Placeholder text di editor |
| `xlsx` | ^0.18 | Export data ke Excel (download rekap) |
| `vite` | ^6.3 | Build tool & dev server |
| `@vitejs/plugin-vue` | ^5.2 | Vite plugin untuk Vue SFC |
| `vite-plugin-pwa` | ^0.22 | Progressive Web App support (service worker, manifest, offline cache) |

---

## 13. Keputusan Arsitektur Penting

| Keputusan | Detail |
|-----------|--------|
| **Multi-role** | User bisa punya >1 role sekaligus (admin+dosen). Disimpan sebagai `TEXT[]` di PostgreSQL |
| **Service Layer** | Views tidak akses Supabase langsung. Semua lewat service files untuk encapsulation |
| **RLS (Row Level Security)** | Keamanan di level database, bukan hanya frontend. Bahkan jika frontend di-bypass, data tetap aman |
| **Auto Profile Creation** | Trigger PostgreSQL otomatis buat profile saat user signup. Tidak perlu API call terpisah |
| **Registration Toggle** | Disimpan di tabel `system_settings`. Dibaca saat signup untuk menentukan apakah user baru diizinkan |
| **SPA on Vercel** | Single Page Application, semua routing handled di client. Vercel rewrite semua path ke `/` |
| **No SSR** | Tidak pakai server-side rendering. Semua data di-fetch client-side dari Supabase |
| **PWA (Progressive Web App)** | Mendukung instalasi di homescreen HP dengan ikon Barongsai. Service worker untuk offline cache |
| **Router Memory Caching** | Navigation guard menggunakan cache lokal dari `useAuth()` agar perpindahan menu instan tanpa fetch DB berulang |
| **Optimistic UI** | Dashboard menampilkan layout + nilai default langsung tanpa loading spinner. Data asli mengisi secara reaktif |
| **Native Mobile Polish** | Viewport lock (no zoom), tap highlight disabled, user-select disabled (kecuali input). Terasa seperti app native |
| **Vendor Chunk Splitting** | Build di-split jadi chunk terpisah: vue, supabase, tiptap. Browser cache chunk vendor secara permanen |

---

## 14. Setup Supabase (Langkah untuk User)

1. Buka [supabase.com](https://supabase.com) → buat project baru
2. Copy **Project URL** dan **Anon Key** dari Settings → API
3. Buat file `.env` di root project:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Buka Supabase Dashboard → SQL Editor → jalankan isi `supabase/schema.sql`
5. Aktifkan Google OAuth:
   - Supabase Dashboard → Authentication → Providers → Google → Enable
   - Buat OAuth credentials di [Google Cloud Console](https://console.cloud.google.com)
   - Set Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Set Site URL di Authentication → URL Configuration:
   - Site URL: `https://your-app.vercel.app` (atau `http://localhost:3000` saat dev)
   - Redirect URLs: tambahkan `http://localhost:3000`, `https://your-app.vercel.app`

---

## 15. PWA (Progressive Web App)

### 15.1 Konfigurasi (vite.config.js)

```javascript
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.png', 'logo-192x192.png', 'logo-512x512.png'],
  manifest: {
    name: 'HopeApp POLIBAN',
    short_name: 'HopeApp',
    description: 'Portal Koordinasi Kelas Bahasa Mandarin Program HOPE.',
    theme_color: '#c62828',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      { src: 'logo-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'logo-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
})
```

### 15.2 Logo & Branding

- **Desain**: Ikon Barongsai (Lion Dance) minimalis bergaya lucu, warna merah & emas
- **File**: `favicon.png`, `logo-192x192.png`, `logo-512x512.png` di folder `public/`
- **HTML Meta Tags** (index.html):
  - `<meta name="theme-color" content="#c62828">` — warna status bar HP
  - `<link rel="apple-touch-icon" href="/logo-192x192.png">` — ikon iOS
  - `<meta name="viewport" ... user-scalable=no, viewport-fit=cover>` — kunci zoom

### 15.3 Build Optimization (Chunk Splitting)

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-vue': ['vue', 'vue-router'],
        'vendor-supabase': ['@supabase/supabase-js'],
        'vendor-tiptap': ['@tiptap/vue-3', '@tiptap/starter-kit', '@tiptap/extension-placeholder']
      }
    }
  }
}
```

Browser menyimpan (cache) chunk vendor secara permanen. Jika hanya kode aplikasi yang berubah, pengguna tidak perlu mengunduh ulang library besar.

### 15.4 Native Mobile CSS (index.css)

```css
body {
  -webkit-tap-highlight-color: transparent; /* Hilangkan flash biru saat tap */
  user-select: none;                        /* Cegah select teks tidak sengaja */
}
input, textarea, [contenteditable="true"] {
  user-select: auto; /* Kembalikan select untuk form input */
}
```

---

## 16. Changelog

| Versi | Tanggal | Perubahan |
|-------|---------|----------|
| 1.0 | 2 April 2026 | Rilis awal: full Supabase migration, multi-role, semua modul CRUD |
| 1.1 | 2 April 2026 | PWA support, logo Barongsai, favicon, production cleanup |
| 1.1.1 | 3 April 2026 | Router memory caching, optimistic UI dashboard, native mobile polish, vendor chunk splitting, versi label di login |
| 1.1.2 | 3 April 2026 | Optimistic UI tanpa loading spinner, dokumentasi core.md diperbarui menyeluruh |
| 1.1.3 | 3 April 2026 | Fix session stale saat kembali ke app (visibilitychange), versi ditampilkan di Settings |
| 1.2.0 | 3 April 2026 | Skeleton loading di seluruh halaman (Dashboard, Meetings, Presensi, Mahasiswa). Komponen SkeletonLoader & PageSkeleton reusable |
| 1.3.0 | 3 April 2026 | Halaman reset password dedicated (/reset-password). Form sandi baru + konfirmasi + toggle visibility + real-time match indicator. Fix feedback message mobile di login page |
| 1.4.0 | 3 April 2026 | Integrasi Cloudflare Turnstile (invisible mode) di login dan reset password dengan server-side verification di Supabase. |

---

*Dokumen ini adalah sumber kebenaran tunggal (single source of truth) untuk memahami sistem HopeApp secara menyeluruh.*
