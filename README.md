# 🔊 Babeku Audio — Website Katalog (Supabase Version)

**Barang Bekas Berkualitas** — Static site dengan backend Supabase (PostgreSQL + Storage + Auth).

> Tuban, Jawa Timur | WhatsApp: +62 851-8985-8954

---

## 📋 Daftar Isi

1. [Setup Supabase (Langkah per Langkah)](#setup-supabase)
2. [SQL Schema (Copy-Paste ke Supabase)](#sql-schema)
3. [Storage Setup](#storage-setup)
4. [RLS Security Policies](#rls-policies)
5. [Deploy ke GitHub Pages](#deploy)
6. [Catatan Keamanan](#security)
7. [Troubleshooting](#troubleshooting)

---

## 🔥 Setup Supabase

### Langkah 1: Buat Project

1. Buka [https://supabase.com](https://supabase.com) → **Start your project**
2. Login dengan GitHub / Google
3. Klik **"New project"**
4. Isi:
   - **Name**: `babeku-audio`
   - **Database Password**: buat password yang kuat — **simpan ini!**
   - **Region**: `Southeast Asia (Singapore)`
5. Klik **"Create new project"** — tunggu ~2 menit

### Langkah 2: Ambil API Keys

1. Di sidebar kiri → klik ikon **Settings (gear)** paling bawah
2. Pilih **"API"**
3. Copy 2 nilai ini:
   - **Project URL** → `https://xxxxxyyyyyyy.supabase.co`
   - **anon public** key → string panjang `eyJhbGci...`

4. Buka file `js/config.js`, paste keduanya:

```javascript
const SUPABASE_URL      = "https://xxxxxyyyyyyy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### Langkah 3: Buat Tabel (SQL Editor)

1. Di sidebar kiri → **"Table Editor"** atau **"SQL Editor"**
2. Klik **"SQL Editor"** → **"New query"**
3. Copy-paste SQL di bawah ini → klik **"Run"**

---

## 🗄️ SQL Schema

Copy semua SQL ini ke Supabase SQL Editor dan jalankan:

```sql
-- =============================================
-- TABEL PRODUCTS
-- =============================================
CREATE TABLE products (
  id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT          NOT NULL,
  price            BIGINT        NOT NULL CHECK (price > 0),
  description      TEXT,
  category         TEXT          DEFAULT 'lainnya',
  condition        TEXT,
  warranty         TEXT          DEFAULT 'Garansi 7 Hari',
  location         TEXT,
  foto_urls        TEXT[]        DEFAULT '{}',
  rating_average   DECIMAL(3,1)  DEFAULT 0.0,
  total_reviews    INTEGER       DEFAULT 0,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- =============================================
-- TABEL REVIEWS
-- =============================================
CREATE TABLE reviews (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID        REFERENCES products(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  ulasan      TEXT        NOT NULL CHECK (char_length(ulasan) >= 10),
  is_owner    BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AKTIFKAN ROW LEVEL SECURITY
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews  ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: PRODUCTS
-- =============================================

-- Siapa saja bisa baca produk
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

-- Hanya user login yang bisa tambah produk
CREATE POLICY "products_auth_insert"
  ON products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Hanya user login yang bisa edit produk
CREATE POLICY "products_auth_update"
  ON products FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Hanya user login yang bisa hapus produk
CREATE POLICY "products_auth_delete"
  ON products FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- RLS POLICIES: REVIEWS
-- =============================================

-- Siapa saja bisa baca review
CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT
  USING (true);

-- Siapa saja bisa tambah review (dengan batasan)
CREATE POLICY "reviews_public_insert"
  ON reviews FOR INSERT
  WITH CHECK (
    -- is_owner hanya bisa true jika user login
    (is_owner = false) OR (auth.role() = 'authenticated')
  );

-- Hanya admin yang bisa hapus review
CREATE POLICY "reviews_auth_delete"
  ON reviews FOR DELETE
  USING (auth.role() = 'authenticated');
```

### Langkah 4: Buat Admin User

1. Di sidebar kiri → **Authentication** → **Users**
2. Klik **"Add user"** → **"Create new user"**
3. Isi email dan password admin
4. Klik **"Create user"**
5. Nonaktifkan "Auto confirm user" jika perlu (biarkan ON untuk kemudahan)

> **Catat email & password ini** — dipakai untuk login di `login.html`

---

## 🗂️ Storage Setup

### Buat Bucket

1. Di sidebar kiri → **Storage**
2. Klik **"New bucket"**
3. Name: `product-photos`
4. **Centang "Public bucket"** → ✅
5. Klik **"Save"**

### Storage Policies

Setelah bucket dibuat, buka tab **"Policies"** pada bucket tersebut:

**Policy 1 — Public Read:**
```sql
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');
```

**Policy 2 — Authenticated Upload:**
```sql
CREATE POLICY "storage_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-photos'
    AND auth.role() = 'authenticated'
  );
```

**Policy 3 — Authenticated Delete:**
```sql
CREATE POLICY "storage_auth_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-photos'
    AND auth.role() = 'authenticated'
  );
```

Atau cara lebih mudah — paste semua 3 policy sekaligus di SQL Editor:

```sql
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-photos');

CREATE POLICY "storage_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-photos' AND auth.role() = 'authenticated');

CREATE POLICY "storage_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-photos' AND auth.role() = 'authenticated');
```

---

## 🚀 Deploy ke GitHub Pages

1. Buat repository baru di GitHub (`babeku-audio`)
2. Upload semua file project ini ke repository
3. Settings → Pages → Source: **branch `main`**, folder **`/ (root)`** → Save
4. Website live di: `https://username.github.io/babeku-audio/`

---

## 🔐 Security Notes

**Supabase anon key aman untuk di-expose di frontend** karena:
- Anon key hanya punya permission sesuai RLS policies yang kamu set
- Tanpa RLS yang benar, anon key bisa berbahaya — pastikan policies di atas sudah dijalankan
- Service role key (`secret`) JANGAN pernah dipakai di frontend

---

## ❓ Troubleshooting

| Problem | Solusi |
|---------|--------|
| "Supabase belum dikonfigurasi" | Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `js/config.js` |
| Produk tidak muncul | Jalankan SQL schema, aktifkan RLS policies |
| Upload foto gagal | Buat bucket `product-photos`, set ke Public, tambahkan storage policies |
| Login gagal | Buat user di Authentication → Users, pastikan email sudah confirmed |
| "new row violates row-level security" | Jalankan ulang SQL RLS policies |
| Data kosong setelah deploy | Normal — seeding otomatis saat halaman pertama kali dibuka |

---

*Babeku Audio © 2026 — Barang Bekas Berkualitas*
