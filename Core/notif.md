# Rencana Implementasi: Web Push Notification (OneSignal)

Dokumen ini adalah rancangan teknis (Implementation Plan) untuk menambahkan fitur *Push Notification* pada HopeApp menggunakan layanan **OneSignal** dikombinasikan dengan arsitektur **Supabase Webhooks & Edge Functions**.

---

## 1. Persiapan Awal & Kebutuhan Kunci
Tindakan ini sepenuhnya dilakukan secara mandiri oleh _Administrator_ (di luar kode):

- Mendaftar dan masuk ke akun [OneSignal Dashboard](https://onesignal.com/).
- Membuat project aplikasi web baru dengan platform **Web Push**.
- Menyiapkan parameter (biarkan URL ke `localhost:3000` untuk mode pengembangan, dan ubah nanti jika live ke `*.vercel.app`).
- Mencatat dua buah kredensial krusial:
  - `ONESIGNAL_APP_ID`: Dibutuhkan oleh *Frontend* dan *Backend*.
  - `ONESIGNAL_REST_API_KEY`: Dibutuhkan HANYA oleh *Backend (Edge Function)*.

---

## 2. Struktur Database (Supabase)

Menambahkan kapabilitas penyimpanan "Token Unik/OneSignal External ID" pada tabel profil pengguna:

### `public.profiles`
- **[NEW_COLUMN]** `onesignal_id` (tipe `TEXT`, nullable)
  - Kolom ini menampung *Subscription ID* dari OneSignal setelah mahasiswa mengizinkan notifikasi di broswer mereka.
  - Memastikan *backend* tahu alat/mesin HP siapa yang harus dikirimi ping.

*Script SQL untuk disiapkan:*
```sql
ALTER TABLE public.profiles ADD COLUMN onesignal_id TEXT;
```

---

## 3. Modifikasi Tampilan & Frontend (Vue 3 + Vite)

### Dependensi / NPM
- Menjalankan `npm install @onesignal/onesignal-vue3` sebagai SDK *client-side*.

### Kestabilan Profil (Sinkronisasi Token)
File: `src/views/DashboardView.vue` atau `App.vue` (Global Lifecycle)
1. **Inisiasi OneSignal:** Melakukan inisiasi library saat komponen global di-_mount_.
2. **Prompts:** Kalau status `Notification.permission` adalah bebas (bukan *denied*), kita picu kemunculan Push Prompts milik OneSignal.
3. **Capture Subscription:** Segera setelah mahasiswa memencet *Allow*, OneSignal Client akan menghasilkan ID (kadang disebut `Subscription Id` atau dikaitkan via `external_id`).
4. **Sync-up Database:** Menjalankan `supabase.from('profiles').update({ onesignal_id: tokenBaru }).eq('id', currentUser.id)`.

---

## 4. Sistem Penembak Notifikasi (Edge Function)

### Pembuatan Direktori Baru
File: `supabase/functions/notify-chat/index.ts`
- **Tujuan:** Berkomunikasi secara privat/aman (via server-to-server) dengan API resmi OneSignal.
- **Workflow:** 
  1. Fungsi membaca *payload JSON* yang diteruskan secara otomatis oleh *Supabase Trigger*.
  2. Mengekstrak data *Author* (Pengirim) dan *Pesan*.
  3. Membangun konfigurasi *HTTP Post* ke *API Endpoint OneSignal*: `https://onesignal.com/api/v1/notifications`
  4. Pengaturan penerima dikonfigurasi menggunakan: *"Tembakkan ke semua `external_id` (users) KECUALI external_id milik si Pengirim"* (Untuk menghindari si pengirim mendapat notifikasi dari dirinya sendiri).

---

## 5. Menyiapkan Tali Pemicu (Database Webhook)

Supabase memiliki fitur "Database Webhooks", yakni mengamati gerak-gerik tabel secara _live_ dan melaporkannya ke suatu URL:
- **Target Table:** `messages`
- **Events:** `INSERT` (Hanya trigger jika ada chat masuk baru).
- **Type:** HTTP Request
- **Method:** `POST`
- **URL Target:** Url *Edge Function* `notify-chat` yang telah dideploy pada poin (4) sebelumnya.

### Keuntungan Arsitektur Ini:
Alur ini sepenuhnya otomatis setelah *frontend* mendelegasikannya. Jika chat grup tiba-tiba aktif dan berisi ratusan pesan per menit, proses penembakan notifikasi hanya ditanggung oleh infrastruktur *Edge Network* Supabase yang bebas kendala dan terlepas (asynchronous), sehingga HP para _client_ (Mahasiswa) dan antarmuka chat tidak terbebani sama sekali!

---
*Rencana ini dapat dieksekusi langkah demi langkah ketika parameter OneSignal telah dikumpulkan.*
