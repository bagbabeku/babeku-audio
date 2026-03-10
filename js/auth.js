/**
 * =============================================================
 * BABEKU AUDIO - Authentication (Supabase)
 * =============================================================
 */

"use strict";

// State global
window._authUser   = null;
window._supabase   = null; // instance Supabase client

/**
 * Inisialisasi Supabase client.
 * Dipanggil sekali di DOMContentLoaded sebelum fungsi lain.
 */
function initSupabase() {
  if (!SUPABASE_URL || SUPABASE_URL.includes("PASTE_")) {
    console.error("Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/config.js");
    return null;
  }
  window._supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return window._supabase;
}

/**
 * Inisialisasi auth listener.
 * @param {Function} onLogin
 * @param {Function} onLogout
 */
function initAuth(onLogin, onLogout) {
  if (!window._supabase) return;

  // Cek session saat pertama load
  window._supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      window._authUser = session.user;
      saveSession(session.user.id, session.user.email);
      if (typeof onLogin === "function") onLogin(session.user);
    } else {
      window._authUser = null;
      if (typeof onLogout === "function") onLogout();
    }
  });

  // Listen perubahan auth state
  window._supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      window._authUser = session.user;
      saveSession(session.user.id, session.user.email);
      if (typeof onLogin === "function") onLogin(session.user);
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
 * @returns {Promise<object>} user object
 */
async function loginWithEmail(email, password) {
  if (!email || !password) throw new Error("Email dan password tidak boleh kosong.");

  const { data, error } = await window._supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthError(error));
  return data.user;
}

/**
 * Logout user.
 */
async function logoutUser() {
  const { error } = await window._supabase.auth.signOut();
  if (error) throw new Error("Gagal logout. Coba lagi.");
  clearSession();
}

/**
 * Cek apakah user sedang login.
 */
function isAuthenticated() {
  return window._authUser !== null;
}

/**
 * Map error Supabase Auth ke pesan Indonesia.
 */
function mapAuthError(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return "Email atau password salah.";
  }
  if (msg.includes("email not confirmed")) return "Email belum dikonfirmasi.";
  if (msg.includes("too many requests"))   return "Terlalu banyak percobaan. Tunggu beberapa menit.";
  if (msg.includes("network"))             return "Tidak ada koneksi internet.";
  return error?.message || "Terjadi kesalahan. Coba lagi.";
}
