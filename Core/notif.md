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
File: `src/composables/useNotifications.js` (Baru)
1. **Inisiasi OneSignal:** Melakukan inisasi library saat aplikasi di-_mount_.
2. **Prompts:** Kalau status `Notification.permission` adalah bebas (bukan *denied*), kita picu kemunculan Push Prompts milik OneSignal.
3. **Capture Subscription:** Segera setelah mahasiswa memencet *Allow*, OneSignal Client akan menghasilkan ID.
4. **Sync-up Database:** Menjalankan `supabase.from('profiles').update({ onesignal_id: tokenBaru }).eq('id', currentUser.id)`.

---

## 4. Sistem Penembak Notifikasi (Edge Function)

### Pembuatan Direktori Baru
File: `supabase/functions/notify-chat/index.ts`
- **Tujuan:** Berkomunikasi secara privat/aman (via server-to-server) dengan API resmi OneSignal.
- **Workflow:** 
  1. Fungsi membaca *payload JSON* yang diteruskan secara otomatis oleh *Supabase Trigger*.
  2. **Logika Group Chat**: Jika tabel asal adalah `messages`, ambil semua `onesignal_id` kecuali pengirim.
  3. **Logika Private Chat**: Jika tabel asal adalah `private_messages`, ambil hanya `onesignal_id` milik si penerima.
  4. Membangun konfigurasi *HTTP Post* ke *OneSignal API*.
  5. Pengaturan penerima dikonfigurasi menggunakan `include_external_user_ids`.

---

## 5. Menyiapkan Tali Pemicu (Database Webhook)

Supabase memiliki fitur "Database Webhooks", yakni mengamati gerak-gerik tabel secara _live_ dan melaporkannya ke suatu URL:
- **Webhook 1 (Grup):** Tabel `messages` (INSERT).
- **Webhook 2 (Pribadi):** Tabel `private_messages` (INSERT).
- **URL Target:** Url *Edge Function* `notify-chat`.

---

## 6. Fitur Pendukung & Privasi

1. **Toggle Settings:** Menambahkan kontrol di `SettingsView.vue` untuk mematikan/menyalakan notifikasi secara mandiri.
2. **Privasi Pesan:** Untuk pesan pribadi, notifikasi akan menggunakan format *"Anda menerima pesan baru dari [Nama]"* tanpa menampilkan isi pesan demi keamanan data.
3. **Optimasi @mention:** Menambahkan logika agar notifikasi grup diutamakan bagi mereka yang disebut (@nama).

---
*Rencana ini telah diperbarui berdasarkan kebutuhan Pesan Pribadi dan preferensi pengguna.*
