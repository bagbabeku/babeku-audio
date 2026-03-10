/**
 * =============================================================
 * BABEKU AUDIO - Authentication Module
 * =============================================================
 * Mengelola login, logout, dan session check via Firebase Auth.
 * Diasumsikan Firebase SDK sudah diload sebelum file ini.
 * =============================================================
 */

"use strict";

// State global auth (diakses oleh admin.js)
window._authUser = null;

/**
 * Inisialisasi Firebase Auth listener.
 * Dipanggil sekali saat halaman load.
 * @param {Function} [onLogin] - Callback saat user login
 * @param {Function} [onLogout] - Callback saat user logout
 */
function initAuth(onLogin, onLogout) {
  const auth = firebase.auth();

  auth.onAuthStateChanged(user => {
    if (user) {
      window._authUser = user;
      saveSession(user.uid, user.email);
      if (typeof onLogin === "function") onLogin(user);
    } else {
      window._authUser = null;
      clearSession();
      if (typeof onLogout === "function") onLogout();
    }
  });
}


/**
 * Login dengan email & password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.auth.UserCredential>}
 * @throws {Error} dengan pesan yang sudah di-localize
 */
async function loginWithEmail(email, password) {
  // Validasi input dasar sebelum kirim ke Firebase
  if (!email || !password) {
    throw new Error("Email dan password tidak boleh kosong.");
  }

  try {
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    return cred;
  } catch (err) {
    // Map error code Firebase ke pesan Indonesia
    throw new Error(mapAuthError(err.code));
  }
}


/**
 * Logout user saat ini.
 * @returns {Promise<void>}
 */
async function logoutUser() {
  try {
    await firebase.auth().signOut();
    clearSession();
  } catch (err) {
    console.error("Logout error:", err);
    throw new Error("Gagal logout. Coba lagi.");
  }
}


/**
 * Cek apakah user saat ini sudah login (dari state Firebase).
 * @returns {boolean}
 */
function isAuthenticated() {
  return window._authUser !== null;
}


/**
 * Map error code Firebase Auth ke pesan Indonesia.
 * @param {string} code
 * @returns {string}
 */
function mapAuthError(code) {
  const map = {
    "auth/invalid-email":         "Format email tidak valid.",
    "auth/user-not-found":        "Email tidak terdaftar.",
    "auth/wrong-password":        "Password salah.",
    "auth/invalid-credential":    "Email atau password salah.",
    "auth/too-many-requests":     "Terlalu banyak percobaan. Tunggu beberapa menit.",
    "auth/network-request-failed":"Tidak ada koneksi internet.",
    "auth/user-disabled":         "Akun ini dinonaktifkan."
  };
  return map[code] || "Terjadi kesalahan. Coba lagi.";
}
