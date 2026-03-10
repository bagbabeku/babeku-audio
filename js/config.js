/**
 * =============================================================
 * BABEKU AUDIO - Firebase Configuration
 * =============================================================
 * CARA SETUP:
 * 1. Buka https://console.firebase.google.com/
 * 2. Buat project baru bernama "Babeku Audio"
 * 3. Tambahkan Web App → dapatkan firebaseConfig
 * 4. Paste nilai-nilai tersebut di bawah ini
 * 5. Aktifkan: Authentication (Email/Password), Firestore, Storage
 *
 * JANGAN commit file ini ke GitHub jika mengutamakan keamanan.
 * Untuk proyek ini, aman selama Firestore Rules dikonfigurasi benar.
 * =============================================================
 */

const FIREBASE_CONFIG = {
  apiKey:            "PASTE_API_KEY_DISINI",
  authDomain:        "PASTE_AUTH_DOMAIN_DISINI",
  projectId:         "PASTE_PROJECT_ID_DISINI",
  storageBucket:     "PASTE_STORAGE_BUCKET_DISINI",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID_DISINI",
  appId:             "PASTE_APP_ID_DISINI"
};

// ============================
// KONFIGURASI TOKO
// ============================
const STORE_CONFIG = {
  name:        "Babeku Audio",
  fullName:    "Barang Bekas Berkualitas",
  tagline:     "Solusi Elektronik Bekas Berkualitas, Harga Terjangkau!",
  whatsapp:    "6285189858954",
  address:     "Tuban, Jawa Timur, Indonesia",
  hours:       "Senin - Sabtu: 08.00 - 20.00 WIB",
  social: {
    facebook1:  "https://www.facebook.com/share/14bEE7hyGyM/",
    facebook2:  "https://www.facebook.com/babeeku",
    instagram:  "https://www.instagram.com/babekuaudio?igsh=MTlxbWZ1dWFoZGg1Yw==",
    youtube:    "https://youtube.com/@babekubag?si=9qJXEuRS7_E6Dky0"
  }
};

// ============================
// KONSTANTA APP
// ============================
const APP_CONFIG = {
  productsPerPage:   9,       // Jumlah produk per halaman
  reviewCooldownMs:  5 * 60 * 1000,  // 5 menit anti-spam
  sessionMaxMs:      24 * 60 * 60 * 1000, // 24 jam session
  maxPhotosPerProduct: 5,
  maxPhotoSizeMB:    2,
  minReviewLength:   10
};
