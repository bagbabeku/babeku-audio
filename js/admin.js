/**
 * =============================================================
 * BABEKU AUDIO - Admin Module (Supabase)
 * =============================================================
 */

"use strict";

const AdminState = {
  editingProductId: null,
  pendingFiles:     [],
  existingUrls:     [],
};

// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const sb = initSupabase();
  if (!sb) { window.location.href = "login.html"; return; }

  // Tunggu session Supabase selesai load — jangan pakai callback
  const { data, error } = await sb.auth.getSession();
  const session = data?.session;

  console.log("Session check:", session ? "VALID" : "NULL", error || "");

  if (!session || !session.user) {
    console.log("No session — redirecting to login");
    window.location.href = "login.html";
    return;
  }

  // Session valid
  window._authUser = session.user;
  saveSession(session.user.id, session.user.email);

  const emailEl = document.getElementById("admin-email");
  if (emailEl) emailEl.textContent = session.user.email;

  // Hanya redirect saat benar-benar logout
  sb.auth.onAuthStateChange((event, newSession) => {
    console.log("Auth event:", event);
    if (event === "SIGNED_OUT") {
      window.location.href = "login.html";
    }
  });

  await loadAdminDashboard();
});

async function loadAdminDashboard() {
  await Promise.all([loadAdminProducts(), loadAdminReviews(), loadAdminStats()]);
}

// ============================
// STATS
// ============================
async function loadAdminStats() {
  const [
    { count: totalProds },
    { data: reviews }
  ] = await Promise.all([
    window._supabase.from("products").select("*", { count: "exact", head: true }),
    window._supabase.from("reviews").select("rating")
  ]);

  const totalReviews = reviews?.length || 0;
  const avgRating    = totalReviews > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : "0.0";

  document.getElementById("stat-products").textContent   = totalProds   || 0;
  document.getElementById("stat-reviews").textContent    = totalReviews;
  document.getElementById("stat-avg-rating").textContent = avgRating;
}

// ============================
// PRODUCTS TABLE
// ============================
async function loadAdminProducts() {
  const tbody = document.getElementById("admin-products-list");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="loading-row">Memuat produk...</td></tr>`;

  const { data, error } = await window._supabase
    .from("products").select("*").order("created_at", { ascending: false });

  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Belum ada produk.</td></tr>`; return;
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${escapeHtml(p.foto_urls?.[0] || "https://placehold.co/60x45/1e3a8a/f59e0b?text=No+Img")}"
        alt="${escapeHtml(p.name)}" class="admin-thumb"
        onerror="this.src='https://placehold.co/60x45/1e3a8a/f59e0b?text=X'"></td>
      <td class="product-name-cell">${escapeHtml(p.name)}</td>
      <td>${formatRupiah(p.price)}</td>
      <td>${renderStars(p.rating_average || 0)} <span class="text-muted">(${p.total_reviews || 0})</span></td>
      <td class="action-cell">
        <button class="btn-admin-edit"   onclick="openEditProduct('${p.id}')">✏️ Edit</button>
        <button class="btn-admin-delete" onclick="confirmDeleteProduct('${p.id}', '${escapeHtml(p.name).replace(/'/g,"\\'")}')">🗑️ Hapus</button>
      </td>
    </tr>`).join("");
}

// ============================
// REVIEWS TABLE
// ============================
async function loadAdminReviews() {
  const tbody = document.getElementById("admin-reviews-list");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="loading-row">Memuat ulasan...</td></tr>`;

  const { data, error } = await window._supabase
    .from("reviews").select("*").order("created_at", { ascending: false });

  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Belum ada ulasan.</td></tr>`; return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${escapeHtml(r.name || "Anonim")}</td>
      <td>${renderStars(r.rating || 0)}</td>
      <td class="review-text-cell">${escapeHtml(r.ulasan || "-")}</td>
      <td>${r.is_owner ? '<span class="badge-owner">Admin</span>' : '<span class="badge-user">User</span>'}</td>
      <td>
        <button class="btn-admin-delete"
          onclick="confirmDeleteReview('${r.id}', '${escapeHtml(r.name || "").replace(/'/g,"\\'")}')">
          🗑️ Hapus
        </button>
      </td>
    </tr>`).join("");
}

// ============================
// PRODUCT FORM
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
  const { data: p, error } = await window._supabase
    .from("products").select("*").eq("id", productId).single();

  if (error || !p) { showToast("Produk tidak ditemukan.", "error"); return; }

  AdminState.editingProductId = productId;
  AdminState.pendingFiles     = [];
  AdminState.existingUrls     = p.foto_urls ? [...p.foto_urls] : [];

  document.getElementById("product-form-title").textContent         = "✏️ Edit Produk";
  document.getElementById("input-product-name").value               = p.name || "";
  document.getElementById("input-product-price").value              = p.price || "";
  document.getElementById("input-product-description").value        = p.description || "";
  document.getElementById("input-product-category").value           = p.category || "lainnya";
  document.getElementById("input-product-condition").value          = p.condition || "";
  document.getElementById("input-product-warranty").value           = p.warranty || "Garansi 7 Hari";
  document.getElementById("input-product-location").value           = p.location || STORE_CONFIG.address;

  renderPhotoPreview();
  document.getElementById("product-modal-form").classList.add("open");
}

function closeProductForm() {
  document.getElementById("product-modal-form").classList.remove("open");
  resetProductForm();
}

function resetProductForm() {
  document.getElementById("product-form")?.reset();
  AdminState.pendingFiles = [];
  AdminState.existingUrls = [];
  document.getElementById("photo-preview").innerHTML   = "";
  document.getElementById("upload-progress").style.display = "none";
  const counter = document.getElementById("photo-counter");
  if (counter) counter.textContent = "0/5 foto";
}

// ============================
// FOTO UPLOAD
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const dropZone  = document.getElementById("photo-dropzone");
  const fileInput = document.getElementById("photo-input");
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click",     () => fileInput.click());
  dropZone.addEventListener("dragover",  e  => { e.preventDefault(); dropZone.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop",      e  => { e.preventDefault(); dropZone.classList.remove("dragover"); addFiles(Array.from(e.dataTransfer.files)); });
  fileInput.addEventListener("change",   () => { addFiles(Array.from(fileInput.files)); fileInput.value = ""; });
});

function addFiles(files) {
  const max = APP_CONFIG.maxPhotosPerProduct;
  for (const file of files) {
    if (AdminState.existingUrls.length + AdminState.pendingFiles.length >= max) {
      showToast(`Maksimal ${max} foto per produk.`, "warning"); break;
    }
    const v = validateImageFile(file);
    if (!v.valid) { showToast(v.error, "error"); continue; }
    AdminState.pendingFiles.push(file);
  }
  renderPhotoPreview();
}

function renderPhotoPreview() {
  const container = document.getElementById("photo-preview");
  if (!container) return;
  let html = "";

  AdminState.existingUrls.forEach((url, i) => {
    html += `
      <div class="preview-item">
        <img src="${escapeHtml(url)}" alt="Foto ${i+1}" onerror="this.src='https://placehold.co/100x75?text=X'">
        <button type="button" class="preview-remove" onclick="removeExistingPhoto(${i})">✕</button>
        <span class="preview-badge">Ada</span>
      </div>`;
  });
  AdminState.pendingFiles.forEach((file, i) => {
    html += `
      <div class="preview-item">
        <img src="${URL.createObjectURL(file)}" alt="Preview ${i+1}">
        <button type="button" class="preview-remove" onclick="removePendingPhoto(${i})">✕</button>
        <span class="preview-badge new">Baru</span>
      </div>`;
  });

  container.innerHTML = html;
  const total = AdminState.existingUrls.length + AdminState.pendingFiles.length;
  const counter = document.getElementById("photo-counter");
  if (counter) counter.textContent = `${total}/${APP_CONFIG.maxPhotosPerProduct} foto`;
}

function removeExistingPhoto(i) { AdminState.existingUrls.splice(i, 1); renderPhotoPreview(); }
function removePendingPhoto(i)  { AdminState.pendingFiles.splice(i, 1); renderPhotoPreview(); }

/**
 * Upload foto ke Supabase Storage.
 * @param {string} productId
 * @returns {Promise<string[]>} Array URL publik
 */
async function uploadPhotos(productId) {
  const urls  = [...AdminState.existingUrls];
  const files = AdminState.pendingFiles;
  if (!files.length) return urls;

  const progressBar  = document.getElementById("upload-progress");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  progressBar.style.display = "block";

  for (let i = 0; i < files.length; i++) {
    const file     = files[i];
    const ext      = file.name.split(".").pop().toLowerCase();
    const filename = `${productId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await window._supabase.storage
      .from(APP_CONFIG.storageBucket)
      .upload(filename, file, { cacheControl: "3600", upsert: false });

    if (upErr) {
      console.error("Upload error:", upErr);
      showToast(`Gagal upload ${file.name}: ${upErr.message}`, "error");
      continue;
    }

    // Ambil URL publik
    const { data: { publicUrl } } = window._supabase.storage
      .from(APP_CONFIG.storageBucket)
      .getPublicUrl(filename);

    urls.push(publicUrl);

    const pct = Math.round(((i + 1) / files.length) * 100);
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressText) progressText.textContent  = `Mengunggah... ${pct}%`;
  }

  progressBar.style.display = "none";
  return urls;
}

// ============================
// SIMPAN PRODUK
// ============================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("product-form")?.addEventListener("submit", async e => { e.preventDefault(); await saveProduct(); });
});

async function saveProduct() {
  const name        = sanitizeText(document.getElementById("input-product-name").value, 200);
  const priceStr    = document.getElementById("input-product-price").value;
  const description = sanitizeText(document.getElementById("input-product-description").value, 2000);
  const category    = document.getElementById("input-product-category").value;
  const condition   = sanitizeText(document.getElementById("input-product-condition").value, 100);
  const warranty    = sanitizeText(document.getElementById("input-product-warranty").value, 100);
  const location    = sanitizeText(document.getElementById("input-product-location").value, 200);

  if (!name)   { showToast("Nama produk wajib diisi.", "error"); return; }
  const price = parseRupiah(priceStr);
  if (!price || price <= 0) { showToast("Harga tidak valid.", "error"); return; }
  if (!description) { showToast("Deskripsi wajib diisi.", "error"); return; }
  if ((AdminState.existingUrls.length + AdminState.pendingFiles.length) === 0) {
    showToast("Minimal 1 foto diperlukan.", "error"); return;
  }

  const saveBtn = document.getElementById("btn-save-product");
  saveBtn.disabled = true;
  saveBtn.textContent = "Menyimpan...";

  try {
    let productId = AdminState.editingProductId;

    // Jika tambah baru, insert dulu untuk dapat UUID
    if (!productId) {
      const { data: newProd, error: insertErr } = await window._supabase
        .from("products")
        .insert({ name: "__temp__", price: 1, description: "__temp__" })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      productId = newProd.id;
    }

    const foto_urls = await uploadPhotos(productId);

    const payload = {
      name, price, description, category,
      condition, warranty,
      location:   location || STORE_CONFIG.address,
      foto_urls,
      updated_at: new Date().toISOString()
    };

    let dbError;
    if (!AdminState.editingProductId) {
      // Update row yang baru dibuat tadi
      ({ error: dbError } = await window._supabase
        .from("products").update({ ...payload, rating_average: 0, total_reviews: 0 }).eq("id", productId));
    } else {
      ({ error: dbError } = await window._supabase
        .from("products").update(payload).eq("id", productId));
    }

    if (dbError) throw dbError;

    showToast("Produk berhasil disimpan! ✅", "success");
    closeProductForm();
    await loadAdminDashboard();
  } catch (err) {
    console.error("Save product error:", err);
    showToast("Gagal menyimpan: " + err.message, "error");
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
  document.getElementById("confirm-message").innerHTML =
    `Hapus produk <strong>${escapeHtml(name)}</strong>?<br><small>Foto di Storage juga akan dihapus.</small>`;
  document.getElementById("confirm-ok").onclick     = () => { modal.classList.remove("open"); deleteProduct(productId); };
  document.getElementById("confirm-cancel").onclick = () => modal.classList.remove("open");
  modal.classList.add("open");
}

async function deleteProduct(productId) {
  try {
    // Hapus foto dari Storage
    const { data: p } = await window._supabase.from("products").select("foto_urls").eq("id", productId).single();
    if (p?.foto_urls?.length) {
      // Extract path dari URL publik
      const paths = p.foto_urls.map(url => {
        const parts = url.split(`/${APP_CONFIG.storageBucket}/`);
        return parts[1] || null;
      }).filter(Boolean);

      if (paths.length) {
        await window._supabase.storage.from(APP_CONFIG.storageBucket).remove(paths);
      }
    }

    const { error } = await window._supabase.from("products").delete().eq("id", productId);
    if (error) throw error;

    showToast("Produk berhasil dihapus.", "success");
    await loadAdminDashboard();
  } catch (err) {
    console.error("Delete product error:", err);
    showToast("Gagal menghapus produk.", "error");
  }
}

// ============================
// FAKE REVIEW
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("fake-review-form");
  if (!form) return;
  setupInteractiveStarsAdmin(form);
  form.addEventListener("submit", async e => { e.preventDefault(); await submitFakeReview(form); });
});

function setupInteractiveStarsAdmin(container) {
  const starsEl = container.querySelector(".star-rating-input");
  if (!starsEl) return;
  starsEl.querySelectorAll(".star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.value, 10);
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
  const name   = sanitizeText(form.querySelector("[name=fake-name]")?.value || "", 100);
  const rating = parseInt(form.querySelector("[name=fake-rating]")?.value || "0", 10);
  const ulasan = sanitizeText(form.querySelector("[name=fake-ulasan]")?.value || "", 1000);

  if (!name)   { showToast("Nama wajib diisi.", "error"); return; }
  if (!rating) { showToast("Pilih rating.", "error"); return; }
  if (!ulasan || ulasan.length < 5) { showToast("Ulasan terlalu pendek.", "error"); return; }

  const btn = form.querySelector("[type=submit]");
  btn.disabled = true;

  try {
    const { error } = await window._supabase.from("reviews").insert({
      product_id: null, name, rating, ulasan, is_owner: true
    });
    if (error) throw error;
    showToast("Review berhasil ditambahkan. ⭐", "success");
    form.reset();
    const starsEl = form.querySelector(".star-rating-input");
    if (starsEl) {
      starsEl.querySelectorAll(".star-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed","false"); });
      const hidden = starsEl.querySelector("input[type=hidden]");
      if (hidden) hidden.value = "0";
    }
    await loadAdminReviews();
    await loadAdminStats();
  } catch (err) {
    console.error("Fake review error:", err);
    showToast("Gagal: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

// ============================
// HAPUS REVIEW
// ============================
function confirmDeleteReview(reviewId, name) {
  const modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-message").innerHTML = `Hapus ulasan dari <strong>${escapeHtml(name)}</strong>?`;
  document.getElementById("confirm-ok").onclick     = () => { modal.classList.remove("open"); deleteReview(reviewId); };
  document.getElementById("confirm-cancel").onclick = () => modal.classList.remove("open");
  modal.classList.add("open");
}

async function deleteReview(reviewId) {
  const { error } = await window._supabase.from("reviews").delete().eq("id", reviewId);
  if (error) { showToast("Gagal menghapus ulasan.", "error"); return; }
  showToast("Ulasan berhasil dihapus.", "success");
  await loadAdminReviews();
  await loadAdminStats();
}

// ============================
// LOGOUT
// ============================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    await logoutUser();
    window.location.href = "index.html";
  });
});
