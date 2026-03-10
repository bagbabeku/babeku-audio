/**
 * =============================================================
 * BABEKU AUDIO - Utility Functions
 * =============================================================
 * Kumpulan fungsi helper yang digunakan di seluruh aplikasi.
 * Semua fungsi bersifat pure / minimal side-effect.
 * =============================================================
 */

"use strict";

// ============================
// FORMAT CURRENCY
// ============================

/**
 * Format angka menjadi format Rupiah.
 * @param {number} amount - Nilai dalam angka
 * @returns {string} - "Rp 2.500.000"
 */
function formatRupiah(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "Rp 0";
  return "Rp " + Math.floor(amount).toLocaleString("id-ID");
}

/**
 * Parse string Rupiah kembali ke number.
 * @param {string} str - "Rp 2.500.000" atau "2500000"
 * @returns {number}
 */
function parseRupiah(str) {
  if (typeof str === "number") return str;
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
}


// ============================
// FORMAT TANGGAL
// ============================

/**
 * Format timestamp Firebase atau Date ke string Indonesia.
 * @param {object|Date|number} ts - Firestore Timestamp, Date, atau ms
 * @returns {string} - "15 Januari 2026"
 */
function formatDate(ts) {
  let date;
  if (!ts) return "-";
  if (ts && typeof ts.toDate === "function") {
    date = ts.toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    date = new Date(ts);
  }
  return date.toLocaleDateString("id-ID", {
    day:   "numeric",
    month: "long",
    year:  "numeric"
  });
}


// ============================
// RENDER BINTANG
// ============================

/**
 * Render bintang HTML berdasarkan nilai rating.
 * @param {number} rating - 1 sampai 5
 * @param {boolean} [interactive=false] - Apakah bintang bisa diklik
 * @param {string} [inputName="rating"] - Name untuk input hidden
 * @returns {string} - HTML string
 */
function renderStars(rating, interactive = false, inputName = "rating") {
  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));
  if (interactive) {
    return `
      <div class="star-rating-input" role="group" aria-label="Pilih rating">
        ${[1,2,3,4,5].map(i => `
          <button type="button"
            class="star-btn ${i <= safeRating ? "active" : ""}"
            data-value="${i}"
            aria-label="${i} bintang"
            aria-pressed="${i <= safeRating}">
            ★
          </button>
        `).join("")}
        <input type="hidden" name="${inputName}" value="${safeRating}">
      </div>`;
  }
  // Static display
  let html = '<span class="stars-display" aria-label="Rating ' + safeRating + ' dari 5">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= safeRating ? "filled" : "empty"}">★</span>`;
  }
  html += "</span>";
  return html;
}


// ============================
// TOAST NOTIFICATION
// ============================

let _toastTimer = null;

/**
 * Tampilkan toast notification.
 * @param {string} message
 * @param {"success"|"error"|"info"|"warning"} [type="info"]
 * @param {number} [duration=3000] - ms
 */
function showToast(message, type = "info", duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "alert");

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Tutup notifikasi">&times;</button>
  `;

  toast.querySelector(".toast-close").addEventListener("click", () => removeToast(toast));
  container.appendChild(toast);

  // Trigger reflow for animation
  requestAnimationFrame(() => toast.classList.add("visible"));

  const timer = setTimeout(() => removeToast(toast), duration);
  toast._timer = timer;
}

function removeToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.remove("visible");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
}


// ============================
// LOADING SKELETON
// ============================

/**
 * Generate HTML skeleton card untuk loading state.
 * @param {number} [count=6] - Jumlah skeleton card
 * @returns {string} HTML
 */
function renderSkeletons(count = 6) {
  return Array(count).fill(0).map(() => `
    <div class="product-card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-img"></div>
      <div class="product-card-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-price"></div>
        <div class="skeleton skeleton-stars"></div>
        <div class="skeleton skeleton-btns"></div>
      </div>
    </div>
  `).join("");
}


// ============================
// WHATSAPP URL BUILDER
// ============================

/**
 * Buat URL WhatsApp dengan pesan template.
 * @param {"buy"|"ask"|"contact"} intent
 * @param {string} [productName=""]
 * @returns {string} URL
 */
function buildWhatsAppUrl(intent, productName = "") {
  const base   = "https://wa.me/" + STORE_CONFIG.whatsapp + "?text=";
  const name   = encodeURIComponent(productName);
  const templates = {
    buy:     `Halo%20Babeku%20Audio,%20Saya%20ingin%20Membeli%20Barang%20${name}`,
    ask:     `Halo%20Babeku%20Audio,%20Saya%20ingin%20menanyakan%20lebih%20detail%20barang%20${name}`,
    contact: `Halo%20Babeku%20Audio,%20saya%20ingin%20bertanya...`
  };
  return base + (templates[intent] || templates.contact);
}


// ============================
// INPUT SANITIZATION
// ============================

/**
 * Escape HTML entities untuk mencegah XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitasi input teks: trim + limit panjang.
 * @param {string} str
 * @param {number} [maxLen=500]
 * @returns {string}
 */
function sanitizeText(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}


// ============================
// ANTI-SPAM (Review)
// ============================

const SPAM_KEY = "babeku_last_review_ts";

/**
 * Cek apakah user masih dalam cooldown period.
 * @returns {boolean} true = masih cooldown, false = boleh submit
 */
function isReviewCooldown() {
  const lastTs = parseInt(localStorage.getItem(SPAM_KEY) || "0", 10);
  return (Date.now() - lastTs) < APP_CONFIG.reviewCooldownMs;
}

/**
 * Hitung sisa cooldown dalam detik.
 * @returns {number}
 */
function reviewCooldownRemaining() {
  const lastTs  = parseInt(localStorage.getItem(SPAM_KEY) || "0", 10);
  const elapsed = Date.now() - lastTs;
  const remain  = APP_CONFIG.reviewCooldownMs - elapsed;
  return Math.max(0, Math.ceil(remain / 1000));
}

/**
 * Catat timestamp review terakhir.
 */
function recordReviewSubmit() {
  localStorage.setItem(SPAM_KEY, String(Date.now()));
}


// ============================
// SMOOTH SCROLL
// ============================

/**
 * Scroll halus ke elemen dengan ID tertentu.
 * @param {string} sectionId - ID elemen target (tanpa #)
 * @param {number} [offset=70] - Offset dari atas (navbar height)
 */
function scrollToSection(sectionId, offset = 70) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: "smooth" });
}


// ============================
// CLIPBOARD
// ============================

/**
 * Salin teks ke clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback untuk http (non-secure context)
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}


// ============================
// SESSION MANAGEMENT
// ============================

const SESSION_KEY = "babeku_session";

/**
 * Simpan session admin.
 * @param {string} uid
 * @param {string} email
 */
function saveSession(uid, email) {
  const session = { uid, email, ts: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Ambil session admin yang masih valid.
 * @returns {{uid:string, email:string}|null}
 */
function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const age = Date.now() - (session.ts || 0);
    if (age > APP_CONFIG.sessionMaxMs) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Hapus session admin.
 */
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}


// ============================
// IMAGE VALIDATION
// ============================

/**
 * Validasi file gambar sebelum upload.
 * @param {File} file
 * @returns {{valid:boolean, error?:string}}
 */
function validateImageFile(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxBytes     = APP_CONFIG.maxPhotoSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." };
  }
  if (file.size > maxBytes) {
    return { valid: false, error: `Ukuran file melebihi ${APP_CONFIG.maxPhotoSizeMB}MB.` };
  }
  return { valid: true };
}


// ============================
// DEBOUNCE
// ============================

/**
 * Debounce sebuah fungsi.
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


// ============================
// INTERSECTION OBSERVER (Scroll Reveal)
// ============================

/**
 * Inisialisasi scroll-reveal untuk elemen dengan class .reveal.
 */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target); // Hanya trigger sekali
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}
