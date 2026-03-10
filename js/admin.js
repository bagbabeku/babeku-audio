/**
 * =============================================================
 * BABEKU AUDIO - Admin Module
 * =============================================================
 * CRUD produk dan review via Firebase Firestore + Storage.
 * File ini hanya di-load di admin.html.
 * =============================================================
 */

"use strict";

// ============================
// STATE ADMIN
// ============================
const AdminState = {
  db:              null,
  storage:         null,
  editingProductId: null,   // null = tambah baru, string = edit existing
  pendingFiles:    [],      // Array<File> yang akan diupload
  existingUrls:    [],      // Array<string> URL foto yang sudah ada (saat edit)
  uploadedUrls:    []       // Array<string> URL yang berhasil diupload
};

// ============================
// INIT ADMIN
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const sb = initSupabase();
  if (!sb) { window.location.href = "login.html"; return; }

  // Tunggu session dari Supabase selesai load dulu
  const { data: { session }, error } = await sb.auth.getSession();

  if (!session || !session.user) {
    // Benar-benar tidak ada session — baru redirect
    window.location.href = "login.html";
    return;
  }

  // Session valid — lanjut load admin
  window._authUser = session.user;
  saveSession(session.user.id, session.user.email);
  document.getElementById("admin-email").textContent = session.user.email;

  // Listen perubahan auth state (untuk handle logout)
  sb.auth.onAuthStateChange((event, newSession) => {
    if (event === "SIGNED_OUT") {
      window.location.href = "login.html";
    }
  });

  await loadAdminDashboard();
});


function onAdminLogin(user) {
  document.getElementById("admin-email").textContent = user.email;
  loadAdminDashboard();
}

// ============================
// LOAD DASHBOARD
// ============================
async function loadAdminDashboard() {
  await Promise.all([
    loadAdminProducts(),
    loadAdminReviews(),
    loadAdminStats()
  ]);
}

async function loadAdminStats() {
  try {
    const [prodSnap, revSnap] = await Promise.all([
      AdminState.db.collection("products").get(),
      AdminState.db.collection("reviews").get()
    ]);

    const reviews      = revSnap.docs.map(d => d.data());
    const totalProds   = prodSnap.size;
    const totalReviews = revSnap.size;
    const avgRating    = totalReviews > 0
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1)
      : "0.0";

    document.getElementById("stat-products").textContent  = totalProds;
    document.getElementById("stat-reviews").textContent   = totalReviews;
    document.getElementById("stat-avg-rating").textContent = avgRating;
  } catch (err) {
    console.error("Stats error:", err);
  }
}


// ============================
// ADMIN PRODUCTS LIST
// ============================
async function loadAdminProducts() {
  const container = document.getElementById("admin-products-list");
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="loading-row">Memuat produk...</td></tr>`;

  try {
    const snap = await AdminState.db
      .collection("products")
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      container.innerHTML = `<tr><td colspan="5" class="empty-row">Belum ada produk. Tambah produk pertama!</td></tr>`;
      return;
    }

    container.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      return `
        <tr>
          <td>
            <img
              src="${escapeHtml(p.fotoUrls && p.fotoUrls[0] ? p.fotoUrls[0] : "https://placehold.co/60x45/1e3a8a/f59e0b?text=No+Img")}"
              alt="${escapeHtml(p.name)}"
              class="admin-thumb"
              onerror="this.src='https://placehold.co/60x45/1e3a8a/f59e0b?text=X'"
            >
          </td>
          <td class="product-name-cell">${escapeHtml(p.name)}</td>
          <td>${formatRupiah(p.price)}</td>
          <td>
            ${renderStars(p.ratingAverage || 0)}
            <span class="text-muted">(${p.totalReviews || 0})</span>
          </td>
          <td class="action-cell">
            <button class="btn-admin-edit" onclick="openEditProduct('${doc.id}')">✏️ Edit</button>
            <button class="btn-admin-delete" onclick="confirmDeleteProduct('${doc.id}', '${escapeHtml(p.name).replace(/'/g,"\\'")}')">🗑️ Hapus</button>
          </td>
        </tr>`;
    }).join("");
  } catch (err) {
    console.error("Load admin products error:", err);
    container.innerHTML = `<tr><td colspan="5" class="error-row">Gagal memuat produk. ${escapeHtml(err.message)}</td></tr>`;
  }
}


// ============================
// ADMIN REVIEWS LIST
// ============================
async function loadAdminReviews() {
  const container = document.getElementById("admin-reviews-list");
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="loading-row">Memuat ulasan...</td></tr>`;

  try {
    const snap = await AdminState.db
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      container.innerHTML = `<tr><td colspan="5" class="empty-row">Belum ada ulasan.</td></tr>`;
      return;
    }

    container.innerHTML = snap.docs.map(doc => {
      const r = doc.data();
      return `
        <tr>
          <td>${escapeHtml(r.name || "Anonim")}</td>
          <td>${renderStars(r.rating || 0)}</td>
          <td class="review-text-cell">${escapeHtml(r.ulasan || "-")}</td>
          <td>${r.isOwner ? '<span class="badge-owner">Admin</span>' : '<span class="badge-user">User</span>'}</td>
          <td>
            <button class="btn-admin-delete"
              onclick="confirmDeleteReview('${doc.id}', '${escapeHtml(r.name || "").replace(/'/g,"\\'")}')">
              🗑️ Hapus
            </button>
          </td>
        </tr>`;
    }).join("");
  } catch (err) {
    console.error("Load admin reviews error:", err);
    container.innerHTML = `<tr><td colspan="5" class="error-row">Gagal memuat ulasan.</td></tr>`;
  }
}


// ============================
// PRODUCT FORM (Tambah / Edit)
// ============================
function openAddProduct() {
  AdminState.editingProductId = null;
  AdminState.pendingFiles     = [];
  AdminState.existingUrls     = [];
  resetProductForm();
  document.getElementById("product-form-title").textContent = "➕ Tambah Produk Baru";
  document.getElementById("product-modal-form").classList.add("open");
}

async function openEditProduct(productId) {
  try {
    const doc = await AdminState.db.collection("products").doc(productId).get();
    if (!doc.exists) {
      showToast("Produk tidak ditemukan.", "error");
      return;
    }
    const p = doc.data();

    AdminState.editingProductId = productId;
    AdminState.pendingFiles     = [];
    AdminState.existingUrls     = p.fotoUrls ? [...p.fotoUrls] : [];

    // Isi form
    document.getElementById("product-form-title").textContent  = "✏️ Edit Produk";
    document.getElementById("input-product-name").value        = p.name || "";
    document.getElementById("input-product-price").value       = p.price || "";
    document.getElementById("input-product-description").value = p.description || "";
    document.getElementById("input-product-category").value    = p.category || "lainnya";
    document.getElementById("input-product-condition").value   = p.condition || "";
    document.getElementById("input-product-warranty").value    = p.warranty || "Garansi 7 Hari";
    document.getElementById("input-product-location").value    = p.location || STORE_CONFIG.address;

    renderPhotoPreview();
    document.getElementById("product-modal-form").classList.add("open");
  } catch (err) {
    console.error("Open edit error:", err);
    showToast("Gagal membuka form edit.", "error");
  }
}

function closeProductForm() {
  document.getElementById("product-modal-form").classList.remove("open");
  resetProductForm();
}

function resetProductForm() {
  const form = document.getElementById("product-form");
  if (form) form.reset();
  AdminState.pendingFiles  = [];
  AdminState.existingUrls  = [];
  document.getElementById("photo-preview").innerHTML = "";
  document.getElementById("upload-progress").style.display = "none";
}


// ============================
// FOTO UPLOAD HANDLING
// ============================

// Inisialisasi drag & drop setelah DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const dropZone   = document.getElementById("photo-dropzone");
  const fileInput  = document.getElementById("photo-input");
  if (!dropZone || !fileInput) return;

  // Klik drop zone → trigger file input
  dropZone.addEventListener("click", () => fileInput.click());

  // Drag & drop
  dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", ()  => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop",      (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    addFiles(Array.from(e.dataTransfer.files));
  });

  // File input change
  fileInput.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files));
    fileInput.value = ""; // Reset agar bisa upload file sama lagi
  });
});

function addFiles(files) {
  const maxTotal = APP_CONFIG.maxPhotosPerProduct;
  const current  = AdminState.existingUrls.length + AdminState.pendingFiles.length;

  for (const file of files) {
    if (current >= maxTotal) {
      showToast(`Maksimal ${maxTotal} foto per produk.`, "warning");
      break;
    }
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, "error");
      continue;
    }
    if (AdminState.pendingFiles.length + AdminState.existingUrls.length >= maxTotal) {
      showToast(`Maksimal ${maxTotal} foto per produk.`, "warning");
      break;
    }
    AdminState.pendingFiles.push(file);
  }
  renderPhotoPreview();
}

function renderPhotoPreview() {
  const container = document.getElementById("photo-preview");
  if (!container) return;

  let html = "";

  // Foto existing (dari Firestore/Storage)
  AdminState.existingUrls.forEach((url, i) => {
    html += `
      <div class="preview-item" data-type="existing" data-index="${i}">
        <img src="${escapeHtml(url)}" alt="Foto ${i+1}" onerror="this.src='https://placehold.co/100x75?text=X'">
        <button type="button" class="preview-remove" onclick="removeExistingPhoto(${i})" aria-label="Hapus foto">✕</button>
        <span class="preview-badge">Ada</span>
      </div>`;
  });

  // Foto baru (pending upload)
  AdminState.pendingFiles.forEach((file, i) => {
    const objectUrl = URL.createObjectURL(file);
    html += `
      <div class="preview-item" data-type="pending" data-index="${i}">
        <img src="${objectUrl}" alt="Preview ${i+1}">
        <button type="button" class="preview-remove" onclick="removePendingPhoto(${i})" aria-label="Hapus foto">✕</button>
        <span class="preview-badge new">Baru</span>
      </div>`;
  });

  container.innerHTML = html;

  // Update counter
  const total = AdminState.existingUrls.length + AdminState.pendingFiles.length;
  const counter = document.getElementById("photo-counter");
  if (counter) counter.textContent = `${total}/${APP_CONFIG.maxPhotosPerProduct} foto`;
}

function removeExistingPhoto(idx) {
  AdminState.existingUrls.splice(idx, 1);
  renderPhotoPreview();
}

function removePendingPhoto(idx) {
  AdminState.pendingFiles.splice(idx, 1);
  renderPhotoPreview();
}


// ============================
// UPLOAD FOTO KE FIREBASE STORAGE
// ============================
async function uploadPhotos(productId) {
  const urls = [...AdminState.existingUrls]; // Mulai dari foto yang sudah ada
  const files = AdminState.pendingFiles;

  if (files.length === 0) return urls;

  const progressBar     = document.getElementById("upload-progress");
  const progressFill    = document.getElementById("progress-fill");
  const progressText    = document.getElementById("progress-text");

  progressBar.style.display = "block";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext  = file.name.split(".").pop().toLowerCase();
    // Generate nama file unik untuk menghindari collision
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path     = `products/${productId}/${filename}`;
    const ref      = AdminState.storage.ref(path);

    try {
      await ref.put(file);
      const url = await ref.getDownloadURL();
      urls.push(url);

      // Update progress
      const pct = Math.round(((i + 1) / files.length) * 100);
      if (progressFill) progressFill.style.width = pct + "%";
      if (progressText) progressText.textContent  = `Mengunggah... ${pct}%`;
    } catch (err) {
      console.error(`Upload error untuk ${file.name}:`, err);
      showToast(`Gagal upload foto: ${file.name}`, "error");
    }
  }

  progressBar.style.display = "none";
  return urls;
}


// ============================
// SIMPAN PRODUK
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("product-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveProduct();
  });
});

async function saveProduct() {
  const name        = sanitizeText(document.getElementById("input-product-name").value, 200);
  const priceStr    = document.getElementById("input-product-price").value;
  const description = sanitizeText(document.getElementById("input-product-description").value, 2000);
  const category    = document.getElementById("input-product-category").value;
  const condition   = sanitizeText(document.getElementById("input-product-condition").value, 100);
  const warranty    = sanitizeText(document.getElementById("input-product-warranty").value, 100);
  const location    = sanitizeText(document.getElementById("input-product-location").value, 200);

  // Validasi
  if (!name) { showToast("Nama produk wajib diisi.", "error"); return; }
  const price = parseRupiah(priceStr);
  if (!price || price <= 0) { showToast("Harga tidak valid.", "error"); return; }
  if (!description) { showToast("Deskripsi wajib diisi.", "error"); return; }

  const totalPhotos = AdminState.existingUrls.length + AdminState.pendingFiles.length;
  if (totalPhotos === 0) { showToast("Minimal 1 foto diperlukan.", "error"); return; }

  const saveBtn = document.getElementById("btn-save-product");
  saveBtn.disabled    = true;
  saveBtn.textContent = "Menyimpan...";

  try {
    let productId = AdminState.editingProductId;

    // Jika tambah baru, buat dokumen dulu untuk dapat ID
    if (!productId) {
      const ref = await AdminState.db.collection("products").add({ _temp: true });
      productId = ref.id;
    }

    // Upload foto
    const fotoUrls = await uploadPhotos(productId);

    const data = {
      name, price, description, category,
      condition, warranty,
      location:   location || STORE_CONFIG.address,
      fotoUrls,
      updatedAt:  firebase.firestore.Timestamp.now()
    };

    if (!AdminState.editingProductId) {
      // Tambah baru: set semua field + createdAt
      await AdminState.db.collection("products").doc(productId).set({
        ...data,
        ratingAverage: 0,
        totalReviews:  0,
        createdAt:     firebase.firestore.Timestamp.now()
      });
    } else {
      // Edit: hanya update field yang berubah
      await AdminState.db.collection("products").doc(productId).update(data);
    }

    showToast("Produk berhasil disimpan! ✅", "success");
    closeProductForm();
    await loadAdminDashboard();

  } catch (err) {
    console.error("Save product error:", err);
    showToast("Gagal menyimpan produk: " + err.message, "error");
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = "💾 Simpan Produk";
  }
}


// ============================
// HAPUS PRODUK
// ============================
function confirmDeleteProduct(productId, name) {
  const modal = document.getElementById("confirm-modal");
  const msgEl = document.getElementById("confirm-message");
  if (!modal || !msgEl) return;

  msgEl.innerHTML = `Hapus produk <strong>${escapeHtml(name)}</strong>?<br><small>Tindakan ini tidak bisa dibatalkan.</small>`;

  document.getElementById("confirm-ok").onclick = async () => {
    modal.classList.remove("open");
    await deleteProduct(productId);
  };
  document.getElementById("confirm-cancel").onclick = () => modal.classList.remove("open");
  modal.classList.add("open");
}

async function deleteProduct(productId) {
  try {
    // Hapus foto dari Storage
    const doc = await AdminState.db.collection("products").doc(productId).get();
    if (doc.exists) {
      const urls = doc.data().fotoUrls || [];
      for (const url of urls) {
        try {
          const ref = AdminState.storage.refFromURL(url);
          await ref.delete();
        } catch {
          // Foto mungkin sudah dihapus manual atau URL berubah, skip
        }
      }
    }

    // Hapus dokumen Firestore
    await AdminState.db.collection("products").doc(productId).delete();
    showToast("Produk berhasil dihapus.", "success");
    await loadAdminDashboard();
  } catch (err) {
    console.error("Delete product error:", err);
    showToast("Gagal menghapus produk.", "error");
  }
}


// ============================
// FAKE REVIEW (Admin)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("fake-review-form");
  if (!form) return;
  setupInteractiveStarsAdmin(form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitFakeReview(form);
  });
});

function setupInteractiveStarsAdmin(container) {
  const starsEl = container.querySelector(".star-rating-input");
  if (!starsEl) return;
  starsEl.querySelectorAll(".star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val    = parseInt(btn.dataset.value, 10);
      const hidden = starsEl.querySelector("input[type=hidden]");
      if (hidden) hidden.value = val;
      starsEl.querySelectorAll(".star-btn").forEach((b, i) => {
        b.classList.toggle("active", i < val);
        b.setAttribute("aria-pressed", i < val ? "true" : "false");
      });
    });
  });
}

async function submitFakeReview(form) {
  const nameInput   = form.querySelector("[name=fake-name]");
  const ratingInput = form.querySelector("[name=fake-rating]");
  const ulasanInput = form.querySelector("[name=fake-ulasan]");

  const name   = sanitizeText(nameInput ? nameInput.value : "", 100);
  const rating = parseInt(ratingInput ? ratingInput.value : "0", 10);
  const ulasan = sanitizeText(ulasanInput ? ulasanInput.value : "", 1000);

  if (!name)   { showToast("Nama wajib diisi.", "error"); return; }
  if (!rating) { showToast("Pilih rating.", "error"); return; }
  if (!ulasan || ulasan.length < 5) { showToast("Ulasan terlalu pendek.", "error"); return; }

  const btn = form.querySelector("[type=submit]");
  btn.disabled = true;

  try {
    await AdminState.db.collection("reviews").add({
      productId: null,
      name,
      rating,
      ulasan,
      isOwner:   true,
      createdAt: firebase.firestore.Timestamp.now()
    });
    showToast("Review berhasil ditambahkan. ⭐", "success");
    form.reset();
    // Reset bintang UI
    const starsEl = form.querySelector(".star-rating-input");
    if (starsEl) {
      starsEl.querySelectorAll(".star-btn").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      const hidden = starsEl.querySelector("input[type=hidden]");
      if (hidden) hidden.value = "0";
    }
    await loadAdminReviews();
    await loadAdminStats();
  } catch (err) {
    console.error("Fake review error:", err);
    showToast("Gagal menambahkan review.", "error");
  } finally {
    btn.disabled = false;
  }
}


// ============================
// HAPUS REVIEW
// ============================
function confirmDeleteReview(reviewId, name) {
  const modal = document.getElementById("confirm-modal");
  const msgEl = document.getElementById("confirm-message");
  if (!modal || !msgEl) return;

  msgEl.innerHTML = `Hapus ulasan dari <strong>${escapeHtml(name)}</strong>?`;
  document.getElementById("confirm-ok").onclick = async () => {
    modal.classList.remove("open");
    await deleteReview(reviewId);
  };
  document.getElementById("confirm-cancel").onclick = () => modal.classList.remove("open");
  modal.classList.add("open");
}

async function deleteReview(reviewId) {
  try {
    await AdminState.db.collection("reviews").doc(reviewId).delete();
    showToast("Ulasan berhasil dihapus.", "success");
    await loadAdminReviews();
    await loadAdminStats();
  } catch (err) {
    console.error("Delete review error:", err);
    showToast("Gagal menghapus ulasan.", "error");
  }
}


// ============================
// ADMIN LOGOUT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutUser();
      window.location.href = "index.html";
    });
  }
});
