# 🔊 Babeku Audio — Website Katalog Produk

**Barang Bekas Berkualitas** — Website katalog e-commerce untuk toko elektronik bekas Babeku Audio.

> Tuban, Jawa Timur | WhatsApp: +62 851-8985-8954

---

## 📋 Daftar Isi

1. [Struktur File](#struktur-file)
2. [Tech Stack](#tech-stack)
3. [Setup Firebase (Langkah per Langkah)](#setup-firebase)
4. [Deploy ke GitHub Pages](#deploy-github-pages)
5. [Setup Admin Pertama Kali](#setup-admin)
6. [Firebase Security Rules](#security-rules)
7. [Maintenance & Penggunaan](#maintenance)
8. [Catatan Keamanan](#security-notes)
9. [Troubleshooting](#troubleshooting)

---

## 📁 Struktur File

```
babeku-audio/
│
├── index.html          → Halaman utama (SPA: Hero, Katalog, Ulasan, Tentang, Kontak)
├── login.html          → Halaman login admin
├── admin.html          → Dashboard admin (CRUD produk & review)
│
├── css/
│   ├── style.css       → Stylesheet utama (semua section + animasi)
│   └── admin.css       → Stylesheet admin & login
│
├── js/
│   ├── config.js       → ⚠️ Firebase config (WAJIB diisi sebelum deploy)
│   ├── utils.js        → Helper functions (format, toast, validasi, dll)
│   ├── auth.js         → Firebase Authentication
│   ├── app.js          → Logic utama: produk, review, animasi
│   └── admin.js        → Logic admin: CRUD produk & review
│
├── README.md
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer      | Teknologi                         |
|------------|-----------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript   |
| Hosting    | GitHub Pages (gratis, tanpa CC)   |
| Database   | Firebase Firestore (NoSQL)        |
| Storage    | Firebase Storage (foto produk)    |
| Auth       | Firebase Authentication           |
| CDN Fonts  | Google Fonts (Syne + Plus Jakarta Sans) |

---

## 🔥 Setup Firebase

### Langkah 1: Buat Project Firebase

1. Buka [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Login dengan akun Google
3. Klik **"Add Project"** (atau **"Create a project"**)
4. Nama project: `babeku-audio` (atau bebas)
5. **Nonaktifkan** Google Analytics (tidak diperlukan)
6. Klik **"Create Project"** → tunggu hingga selesai

### Langkah 2: Daftarkan Web App

1. Di halaman project, klik ikon **`</>`** (Web)
2. App nickname: `Babeku Audio Web`
3. **Jangan** centang "Firebase Hosting" (kita pakai GitHub Pages)
4. Klik **"Register app"**
5. Akan muncul kode seperti ini — **COPY bagian `firebaseConfig`**:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "babeku-audio.firebaseapp.com",
  projectId: "babeku-audio",
  storageBucket: "babeku-audio.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

6. Klik **"Continue to console"**

### Langkah 3: Isi Config di Project

Buka file `js/config.js` dan ganti placeholder dengan nilai yang Anda copy:

```javascript
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXXX",   // Ganti ini
  authDomain:        "babeku-audio.firebaseapp.com",     // Ganti ini
  projectId:         "babeku-audio",                     // Ganti ini
  storageBucket:     "babeku-audio.appspot.com",         // Ganti ini
  messagingSenderId: "123456789012",                     // Ganti ini
  appId:             "1:123456789012:web:abcdef123456"   // Ganti ini
};
```

### Langkah 4: Aktifkan Authentication

1. Di Firebase Console → menu kiri: **Build → Authentication**
2. Klik **"Get started"**
3. Pilih tab **"Sign-in method"**
4. Klik **"Email/Password"** → Enable toggle **ON** → **Save**

### Langkah 5: Aktifkan Firestore Database

1. Menu kiri: **Build → Firestore Database**
2. Klik **"Create database"**
3. Pilih mode: **"Start in test mode"** (kita update rules nanti)
4. Location: **`asia-southeast1`** (Singapore — paling dekat Indonesia)
5. Klik **"Enable"**

### Langkah 6: Aktifkan Firebase Storage

1. Menu kiri: **Build → Storage**
2. Klik **"Get started"**
3. Pilih **"Start in test mode"**
4. Location: sama dengan Firestore → **"Done"**

### Langkah 7: Buat User Admin

1. Menu kiri: **Build → Authentication → Users**
2. Klik **"Add user"**
3. Masukkan email admin (contoh: `admin@babekuaudio.com`)
4. Masukkan password yang kuat (minimal 8 karakter)
5. Klik **"Add user"**

> ⚠️ **Catat email & password ini** — akan digunakan untuk login di `login.html`

---

## 🚀 Deploy ke GitHub Pages

### Langkah 1: Buat Repository GitHub

1. Buka [https://github.com/new](https://github.com/new)
2. Repository name: `babeku-audio`
3. Pilih **Public** (GitHub Pages gratis hanya untuk public repo)
4. Klik **"Create repository"**

### Langkah 2: Upload File ke GitHub

**Cara A: Via Web Upload (Termudah)**

1. Di repository yang baru dibuat, klik **"uploading an existing file"**
2. Drag & drop semua file/folder proyek ini
3. Pastikan struktur folder tetap sama (`css/`, `js/`, dll.)
4. Commit message: `Initial deploy - Babeku Audio`
5. Klik **"Commit changes"**

**Cara B: Via Git CLI**

```bash
cd babeku-audio
git init
git add .
git commit -m "Initial deploy - Babeku Audio"
git branch -M main
git remote add origin https://github.com/USERNAME/babeku-audio.git
git push -u origin main
```

### Langkah 3: Aktifkan GitHub Pages

1. Di repository → tab **"Settings"**
2. Scroll ke section **"Pages"** (menu kiri)
3. Source: **"Deploy from a branch"**
4. Branch: **`main`** | Folder: **`/ (root)`**
5. Klik **"Save"**
6. Tunggu 1-3 menit
7. URL website akan muncul: `https://username.github.io/babeku-audio/`

---

## ⚙️ Setup Admin Pertama Kali

1. Buka `https://username.github.io/babeku-audio/login.html`
2. Login dengan email & password admin yang dibuat di Firebase
3. Anda akan diarahkan ke `admin.html` (dashboard)
4. **Tambah produk** via tombol "➕ Tambah Produk"
5. **Review palsu default** (Budi Santoso & Siti Nurhaliza) akan otomatis muncul saat pertama kali halaman utama dibuka (seeding otomatis jika database kosong)

---

## 🔒 Firebase Security Rules

Setelah testing selesai, update rules ini untuk keamanan produksi.

### Firestore Rules

Di Firebase Console → Firestore Database → **Rules** → paste ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Products: baca publik, tulis/hapus hanya user login
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

    // Reviews: baca publik, buat publik (siapa saja bisa review)
    // Update/hapus hanya user login (admin)
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if
        // Validasi field wajib ada
        request.resource.data.keys().hasAll(['name', 'rating', 'ulasan', 'createdAt']) &&
        // Rating harus 1-5
        request.resource.data.rating >= 1 &&
        request.resource.data.rating <= 5 &&
        // Nama tidak boleh kosong
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 100 &&
        // Ulasan minimal 10 karakter
        request.resource.data.ulasan.size() >= 10 &&
        request.resource.data.ulasan.size() <= 1000 &&
        // isOwner hanya bisa di-set true oleh user yang login
        (request.resource.data.isOwner == false || request.auth != null);
      allow update, delete: if request.auth != null;
    }

    // Users: hanya user itu sendiri yang bisa baca/tulis
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules

Di Firebase Console → Storage → **Rules** → paste ini:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Foto produk: baca publik, upload hanya user login
    match /products/{productId}/{fileName} {
      allow read: if true;
      allow write: if
        request.auth != null &&
        // Hanya gambar yang diizinkan
        request.resource.contentType.matches('image/.*') &&
        // Maksimal 2MB
        request.resource.size <= 2 * 1024 * 1024;
      allow delete: if request.auth != null;
    }
  }
}
```

---

## 🛠️ Maintenance & Penggunaan

### Tambah Produk Baru
1. Login ke `admin.html`
2. Klik "➕ Tambah Produk"
3. Isi semua field, upload 1-5 foto
4. Klik "💾 Simpan Produk"

### Edit Produk
1. Di tabel produk, klik "✏️ Edit"
2. Ubah data yang perlu
3. Simpan

### Hapus Produk
1. Klik "🗑️ Hapus" → konfirmasi
2. Foto di Storage juga otomatis terhapus

### Tambah Review Palsu
1. Di dashboard admin → section "✍️ Tambah Review"
2. Isi nama, rating, ulasan
3. Submit — review langsung muncul di toko

### Hapus Review
1. Di tabel ulasan, klik "🗑️ Hapus"

---

## 🔐 Security Notes

**Tentang API Key Firebase**

Firebase API key bersifat **publik by design**. API key ini bukan secret — fungsinya hanya untuk mengidentifikasi project Firebase Anda, bukan sebagai credentials.

Keamanan sebenarnya berasal dari **Firebase Security Rules** (Firestore & Storage), bukan dari menyembunyikan API key.

**Yang perlu Anda pastikan:**
- ✅ Deploy Security Rules yang benar (lihat section di atas)
- ✅ Update dari "Test Mode" ke Production Rules setelah testing
- ✅ Hanya buat 1 admin user di Firebase Authentication
- ✅ Jangan share password admin ke siapapun

**Opsional (untuk keamanan ekstra):**
- Tambahkan domain restriction di Firebase Console → Settings → Authorized domains
- Aktifkan Firebase App Check untuk mencegah abuse

---

## ❓ Troubleshooting

### Produk tidak muncul
- Pastikan Firebase config di `js/config.js` sudah diisi dengan benar
- Cek browser console (F12) untuk error message
- Pastikan Firestore sudah diaktifkan di Firebase Console
- Cek apakah Firestore Rules mengizinkan read public

### Login gagal
- Pastikan Authentication (Email/Password) sudah diaktifkan
- Pastikan user admin sudah dibuat di Firebase Authentication → Users
- Cek apakah email/password yang dimasukkan benar

### Upload foto gagal
- Pastikan Firebase Storage sudah diaktifkan
- Cek ukuran file (maks 2MB per foto)
- Cek format file (hanya JPG, PNG, WebP)
- Pastikan Storage Rules sudah benar

### Website error "Firebase: No Firebase App"
- Pastikan `js/config.js` diload sebelum script lainnya di HTML
- Cek apakah `FIREBASE_CONFIG` terisi semua field (bukan placeholder)

### Review tidak tersimpan
- Cek Firestore Rules — pastikan `allow create` untuk collection `reviews` sudah benar
- Cek browser console untuk error detail

### GitHub Pages tidak update
- Cek tab "Actions" di repository — mungkin masih building
- Lakukan hard refresh: Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)
- Tunggu 2-5 menit setelah push

---

## 📞 Kontak Developer

Website ini dibuat untuk **Babeku Audio**.

Untuk pertanyaan teknis, silakan buka issue di repository GitHub.

---

*Babeku Audio © 2026 — Barang Bekas Berkualitas*
