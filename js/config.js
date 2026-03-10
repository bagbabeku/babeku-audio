/**
 * =============================================================
 * BABEKU AUDIO - Supabase Configuration
 * =============================================================
 * Cara ambil nilai ini:
 * 1. Buka https://supabase.com → Login → masuk ke project kamu
 * 2. Klik ikon Settings (gear) di sidebar kiri → "API"
 * 3. Copy "Project URL" → paste ke SUPABASE_URL
 * 4. Copy "anon public" key → paste ke SUPABASE_ANON_KEY
 * =============================================================
 */

const SUPABASE_URL      = "https://mcwvtijzxzoncmecokgj.supabase.co";       // contoh: https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jd3Z0aWp6eHpvbmNtZWNva2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzUxNDgsImV4cCI6MjA4ODExMTE0OH0.VN7slbmVb_slkXrDW4ZDqEwRFOrptjOOydooYEJonIQ";   // eyJhbGciOiJIUzI1NiIsInR5...

// ============================
// KONFIGURASI TOKO
// ============================
const STORE_CONFIG = {
  name:     "Babeku Audio",
  fullName: "Barang Bekas Berkualitas",
  tagline:  "Solusi Elektronik Bekas Berkualitas, Harga Terjangkau!",
  whatsapp: "6285189858954",
  address:  "Tuban, Jawa Timur, Indonesia",
  hours:    "Senin - Sabtu: 08.00 - 20.00 WIB",
  social: {
    facebook1: "https://www.facebook.com/share/14bEE7hyGyM/",
    facebook2: "https://www.facebook.com/babeeku",
    instagram: "https://www.instagram.com/babekuaudio?igsh=MTlxbWZ1dWFoZGg1Yw==",
    youtube:   "https://youtube.com/@babekubag?si=9qJXEuRS7_E6Dky0"
  }
};

// ============================
// KONSTANTA APP
// ============================
const APP_CONFIG = {
  productsPerPage:    9,
  reviewCooldownMs:   5 * 60 * 1000,
  sessionMaxMs:       24 * 60 * 60 * 1000,
  maxPhotosPerProduct: 5,
  maxPhotoSizeMB:     2,
  minReviewLength:    10,
  storageBucket:      "product-photos"   // nama bucket di Supabase Storage
};
