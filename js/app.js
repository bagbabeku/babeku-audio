/**
 * =============================================================
 * BABEKU AUDIO - Main Application Logic (Supabase)
 * =============================================================
 */

"use strict";

// ============================
// STATE GLOBAL
// ============================
const AppState = {
  products:      [],
  reviews:       [],
  filteredProds: [],
  currentPage:   1,
  activeModal:   null,
  searchQuery:   "",
  filterCategory: "all",
  reviewSortOrder: "newest"
};

// ============================
// KATEGORI
// ============================
const CATEGORIES = [
  { value: "all",         label: "Semua Kategori" },
  { value: "speaker",     label: "Speaker" },
  { value: "amplifier",   label: "Amplifier" },
  { value: "mixer",       label: "Mixer" },
  { value: "microphone",  label: "Microphone" },
  { value: "sound-system",label: "Sound System" },
  { value: "salon",       label: "Peralatan Salon" },
  { value: "lainnya",     label: "Lainnya" }
];

// ============================
// DUMMY DATA
// ============================
const DUMMY_PRODUCTS = [
  {
    name:           "Speaker Active Yamaha 15 Inch",
    price:          2500000,
    description:    "Speaker active kondisi 90%, suara jernih, bass powerful. Cocok untuk event kecil atau sound system rumahan. Semua fitur normal.",
    category:       "speaker",
    condition:      "Bekas - Kondisi 90%",
    warranty:       "Garansi 7 Hari",
    location:       "Tuban, Jawa Timur",
    foto_urls:      [
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Speaker+Yamaha+15%22",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Tampak+Samping",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Detail+Panel"
    ],
    rating_average: 5.0,
    total_reviews:  2
  },
  {
    name:           "Mixer Soundcraft EPM8",
    price:          3200000,
    description:    "Mixer 8 channel kondisi mulus, semua channel normal dan teruji. Lengkap dengan power cable original.",
    category:       "mixer",
    condition:      "Bekas - Kondisi 95%",
    warranty:       "Garansi 7 Hari",
    location:       "Tuban, Jawa Timur",
    foto_urls:      [
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Mixer+Soundcraft+EPM8",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Semua+Channel+Normal"
    ],
    rating_average: 5.0,
    total_reviews:  2
  },
  {
    name:           "Mic Wireless Shure BLX24",
    price:          1800000,
    description:    "Microphone wireless original Shure seri BLX24, jarak jangkau 30m, baterai awet. Kondisi seperti baru.",
    category:       "microphone",
    condition:      "Bekas - Kondisi 98%",
    warranty:       "Garansi 7 Hari",
    location:       "Tuban, Jawa Timur",
    foto_urls:      [
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Shure+BLX24",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Receiver+Unit",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Kelengkapan"
    ],
    rating_average: 5.0,
    total_reviews:  2
  }
];

const DUMMY_REVIEWS = [
  { product_id: null, name: "Budi Santoso",   rating: 5, ulasan: "Barangnya bagus dan kondisi sesuai deskripsi. Pengiriman cepat!",                              is_owner: true },
  { product_id: null, name: "Siti Nurhaliza", rating: 5, ulasan: "Sudah beberapa kali beli di Babeku Audio, selalu puas. Recommended seller!", is_owner: true }
];


// ============================
// INISIALISASI
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  // Init Supabase
  const sb = initSupabase();
  if (!sb) {
    showConfigError();
    return;
  }

  // Auth listener
  initAuth(
    (user) => updateNavForAdmin(true),
    ()     => updateNavForAdmin(false)
  );

  // Build UI
  buildNavLinks();
  buildCategoryFilter();
  populateStoreMeta();

  // Load data
  await seedIfEmpty();
  await loadProducts();
  await loadAllReviews();

  // Events
  setupSearchFilter();
  setupReviewForm();
  setupNavScroll();
  setupMobileMenu();
  setupCopyLink();
  setupNavActiveOnScroll();

  // Animasi
  initScrollReveal();
  initHeroAnimation();
});

function showConfigError() {
  document.body.innerHTML = `
    <div style="font-family:sans-serif;padding:48px;text-align:center;color:#dc2626">
      <h2>⚠️ Firebase Config Belum Diisi</h2>
      <p style="margin-top:12px;color:#6b7280">
        Buka file <code>js/config.js</code> dan isi <code>SUPABASE_URL</code> serta <code>SUPABASE_ANON_KEY</code>.
      </p>
    </div>`;
}

// ============================
// STORE META
// ============================
function populateStoreMeta() {
  document.querySelectorAll("[data-store-name]").forEach(el    => el.textContent = STORE_CONFIG.name);
  document.querySelectorAll("[data-store-tagline]").forEach(el => el.textContent = STORE_CONFIG.tagline);
  document.querySelectorAll("[data-store-address]").forEach(el => el.textContent = STORE_CONFIG.address);
  document.querySelectorAll("[data-store-hours]").forEach(el   => el.textContent = STORE_CONFIG.hours);
  document.querySelectorAll("[data-wa-link]").forEach(el       => el.href = buildWhatsAppUrl("contact"));
  document.querySelectorAll("[data-social-fb1]").forEach(el    => el.href = STORE_CONFIG.social.facebook1);
  document.querySelectorAll("[data-social-fb2]").forEach(el    => el.href = STORE_CONFIG.social.facebook2);
  document.querySelectorAll("[data-social-ig]").forEach(el     => el.href = STORE_CONFIG.social.instagram);
  document.querySelectorAll("[data-social-yt]").forEach(el     => el.href = STORE_CONFIG.social.youtube);
}

// ============================
// SEED DATABASE
// ============================
async function seedIfEmpty() {
  try {
    const { count, error } = await window._supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (error || count > 0) return;

    console.log("Database kosong, seeding dummy data...");

    // Insert produk
    const { data: insertedProducts, error: prodErr } = await window._supabase
      .from("products")
      .insert(DUMMY_PRODUCTS)
      .select("id");

    if (prodErr) { console.error("Seed products error:", prodErr); return; }

    // Insert review dummy (tidak terikat produk spesifik)
    const { error: revErr } = await window._supabase
      .from("reviews")
      .insert(DUMMY_REVIEWS);

    if (revErr) console.error("Seed reviews error:", revErr);
    else console.log("Dummy data berhasil di-seed.");

  } catch (err) {
    console.error("Seed error:", err);
  }
}

// ============================
// LOAD PRODUK
// ============================
async function loadProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = renderSkeletons(APP_CONFIG.productsPerPage);

  const { data, error } = await window._supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load products error:", error);
    grid.innerHTML = `
      <div class="load-error">
        <p>Gagal memuat produk. Cek koneksi atau Supabase config.</p>
        <button onclick="loadProducts()" class="btn btn-primary">Coba Lagi</button>
      </div>`;
    return;
  }

  AppState.products = data || [];
  applyFilterAndRender();
}

// ============================
// FILTER & RENDER
// ============================
function applyFilterAndRender() {
  const q   = AppState.searchQuery.toLowerCase();
  const cat = AppState.filterCategory;

  AppState.filteredProds = AppState.products.filter(p => {
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    const matchCat    = cat === "all" || p.category === cat;
    return matchSearch && matchCat;
  });

  AppState.currentPage = 1;
  renderProductGrid();
  renderPagination();
  updateProductCount(AppState.filteredProds.length);
}

function renderProductGrid() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const start    = (AppState.currentPage - 1) * APP_CONFIG.productsPerPage;
  const paginated = AppState.filteredProds.slice(start, start + APP_CONFIG.productsPerPage);

  if (paginated.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <div class="no-products-icon">🔍</div>
        <p>Tidak ada produk yang ditemukan.</p>
        <button onclick="resetFilter()" class="btn btn-secondary">Reset Filter</button>
      </div>`;
    return;
  }

  grid.innerHTML = paginated.map((p, i) => renderProductCard(p, i)).join("");

  // Staggered animation
  grid.querySelectorAll(".product-card").forEach((card, i) => {
    card.style.animationDelay = `${i * 80}ms`;
    card.classList.add("card-appear");
  });

  // Event handlers
  grid.querySelectorAll(".card-overlay").forEach(overlay => {
    overlay.addEventListener("click", () => openProductModal(overlay.closest(".product-card").dataset.productId));
  });
  grid.querySelectorAll(".btn-buy").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); window.open(buildWhatsAppUrl("buy", btn.dataset.name), "_blank", "noopener"); });
  });
  grid.querySelectorAll(".btn-ask").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); window.open(buildWhatsAppUrl("ask", btn.dataset.name), "_blank", "noopener"); });
  });
}

function renderProductCard(p, idx) {
  const photoUrl   = (p.foto_urls && p.foto_urls[0]) ? p.foto_urls[0] : "https://placehold.co/400x300/1e3a8a/f59e0b?text=No+Photo";
  const photoCount = p.foto_urls ? p.foto_urls.length : 0;

  return `
    <div class="product-card" data-product-id="${escapeHtml(p.id)}">
      <div class="card-img-wrap">
        <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(p.name)}" loading="lazy"
          onerror="this.src='https://placehold.co/400x300/1e3a8a/f59e0b?text=No+Photo'">
        ${photoCount > 1 ? `<span class="photo-badge">📷 ${photoCount}</span>` : ""}
        <div class="card-overlay" role="button" tabindex="0" aria-label="Lihat detail ${escapeHtml(p.name)}"></div>
      </div>
      <div class="product-card-body">
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <p class="product-price">${formatRupiah(p.price)}</p>
        <div class="product-rating">
          ${renderStars(p.rating_average || 0)}
          <span class="review-count">(${p.total_reviews || 0})</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-buy" data-name="${escapeHtml(p.name)}">🛒 Beli</button>
          <button class="btn btn-whatsapp btn-ask" data-name="${escapeHtml(p.name)}">💬 Tanya</button>
        </div>
      </div>
    </div>`;
}

function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;
  const pages = Math.ceil(AppState.filteredProds.length / APP_CONFIG.productsPerPage);
  if (pages <= 1) { container.innerHTML = ""; return; }

  container.innerHTML = Array.from({ length: pages }, (_, i) => i + 1).map(i => `
    <button class="page-btn ${i === AppState.currentPage ? "active" : ""}" data-page="${i}">${i}</button>
  `).join("");

  container.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      AppState.currentPage = parseInt(btn.dataset.page, 10);
      renderProductGrid();
      renderPagination();
      scrollToSection("katalog", 80);
    });
  });
}

function updateProductCount(count) {
  const el = document.getElementById("product-count");
  if (el) el.textContent = `${count} produk ditemukan`;
}

function resetFilter() {
  AppState.searchQuery    = "";
  AppState.filterCategory = "all";
  const si = document.getElementById("search-input");
  const cs = document.getElementById("filter-category");
  if (si) si.value = "";
  if (cs) cs.value = "all";
  applyFilterAndRender();
}

function buildCategoryFilter() {
  const select = document.getElementById("filter-category");
  if (!select) return;
  select.innerHTML = CATEGORIES.map(c => `<option value="${c.value}">${escapeHtml(c.label)}</option>`).join("");
}

function setupSearchFilter() {
  const si = document.getElementById("search-input");
  const cs = document.getElementById("filter-category");
  if (si) si.addEventListener("input", debounce(() => { AppState.searchQuery = sanitizeText(si.value, 100); applyFilterAndRender(); }, 300));
  if (cs) cs.addEventListener("change", () => { AppState.filterCategory = cs.value; applyFilterAndRender(); });
}

// ============================
// MODAL
// ============================
async function openProductModal(productId) {
  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  AppState.activeModal = productId;
  renderModal(product);

  const reviews = await loadReviewsByProduct(productId);
  renderProductReviews(reviews, productId);

  document.getElementById("modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
  setupGallery(product.foto_urls || []);
}

function closeModal() {
  document.getElementById("modal-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
  AppState.activeModal = null;
}

function renderModal(p) {
  const photos  = p.foto_urls || [];
  const mainUrl = photos[0] || "https://placehold.co/700x500/1e3a8a/f59e0b?text=No+Photo";

  document.getElementById("modal-main-img").src         = escapeHtml(mainUrl);
  document.getElementById("modal-main-img").alt         = escapeHtml(p.name);
  document.getElementById("modal-title").textContent    = p.name;
  document.getElementById("modal-price").textContent    = formatRupiah(p.price);
  document.getElementById("modal-rating").innerHTML     = `${renderStars(p.rating_average || 0)}<span class="review-count">(${p.total_reviews || 0} ulasan)</span>`;
  document.getElementById("modal-description").textContent = p.description || "-";
  document.getElementById("modal-condition").textContent   = p.condition || "-";
  document.getElementById("modal-warranty").textContent    = p.warranty || "Garansi 7 Hari";
  document.getElementById("modal-location").textContent    = p.location || STORE_CONFIG.address;

  document.getElementById("modal-btn-buy").onclick = () => window.open(buildWhatsAppUrl("buy", p.name), "_blank", "noopener");
  document.getElementById("modal-btn-ask").onclick = () => window.open(buildWhatsAppUrl("ask", p.name), "_blank", "noopener");

  const thumbsEl = document.getElementById("modal-thumbnails");
  if (photos.length > 1) {
    thumbsEl.innerHTML = photos.map((url, i) => `
      <img src="${escapeHtml(url)}" alt="Foto ${i+1}" class="thumb ${i === 0 ? "active" : ""}"
        data-index="${i}" loading="lazy">`).join("");
    thumbsEl.style.display = "flex";
  } else {
    thumbsEl.innerHTML = "";
    thumbsEl.style.display = "none";
  }
}

function setupGallery(photos) {
  if (!photos.length) return;
  let idx = 0;
  const mainImg = document.getElementById("modal-main-img");
  const thumbs  = document.getElementById("modal-thumbnails");
  const prev    = document.getElementById("gallery-prev");
  const next    = document.getElementById("gallery-next");

  const goTo = (i) => {
    idx = (i + photos.length) % photos.length;
    mainImg.src = photos[idx];
    thumbs.querySelectorAll(".thumb").forEach((t, j) => t.classList.toggle("active", j === idx));
  };

  if (prev) prev.onclick = () => goTo(idx - 1);
  if (next) next.onclick = () => goTo(idx + 1);
  thumbs.querySelectorAll(".thumb").forEach(t => {
    t.addEventListener("click", () => goTo(parseInt(t.dataset.index, 10)));
  });

  const show = photos.length > 1;
  if (prev) prev.style.display = show ? "" : "none";
  if (next) next.style.display = show ? "" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal-overlay")?.addEventListener("click", e => {
    if (e.target.id === "modal-overlay") closeModal();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && AppState.activeModal) closeModal(); });
});

// ============================
// REVIEWS
// ============================
async function loadAllReviews() {
  const { data, error } = await window._supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("Load reviews error:", error); return; }
  AppState.reviews = data || [];
  renderTestimoniSection();
}

async function loadReviewsByProduct(productId) {
  const { data, error } = await window._supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) { console.error("Load product reviews error:", error); return []; }
  return data || [];
}

function renderTestimoniSection() {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  let reviews = [...AppState.reviews];
  if (AppState.reviewSortOrder === "rating") reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  if (!reviews.length) {
    container.innerHTML = `<p class="no-reviews">Belum ada ulasan. Jadilah yang pertama!</p>`;
    updateOverallRating([]);
    return;
  }

  container.innerHTML = reviews.map(r => renderReviewCard(r)).join("");
  updateOverallRating(reviews);
  setupReviewSlider();
}

function renderReviewCard(r) {
  return `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-avatar">${escapeHtml(r.name || "?").charAt(0).toUpperCase()}</div>
        <div class="reviewer-info">
          <strong class="reviewer-name">${escapeHtml(r.name || "Anonim")}</strong>
          <time class="review-date">${formatDate(r.created_at)}</time>
        </div>
        <div class="review-stars">${renderStars(r.rating || 0)}</div>
      </div>
      <p class="review-text">${escapeHtml(r.ulasan || "")}</p>
    </div>`;
}

function updateOverallRating(reviews) {
  const el = document.getElementById("overall-rating");
  const countEl = document.getElementById("overall-count");
  if (!el) return;
  if (!reviews.length) { el.textContent = "0.0"; if (countEl) countEl.textContent = "(0 ulasan)"; return; }
  const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
  el.textContent = avg.toFixed(1);
  if (countEl) countEl.textContent = `(${reviews.length} ulasan)`;
}

function setupReviewSlider() {
  const slider = document.getElementById("reviews-container");
  const prev   = document.getElementById("review-prev");
  const next   = document.getElementById("review-next");
  if (!slider || !prev || !next) return;
  prev.addEventListener("click", () => slider.scrollBy({ left: -320, behavior: "smooth" }));
  next.addEventListener("click", () => slider.scrollBy({ left: 320, behavior: "smooth" }));
}

// ============================
// REVIEW FORM
// ============================
function setupReviewForm() {
  const form = document.getElementById("review-form");
  if (!form) return;
  setupInteractiveStars(form);

  const sortSelect = document.getElementById("review-sort");
  if (sortSelect) sortSelect.addEventListener("change", () => { AppState.reviewSortOrder = sortSelect.value; renderTestimoniSection(); });

  form.addEventListener("submit", async (e) => { e.preventDefault(); await handleReviewSubmit(form, null); });
}

function setupInteractiveStars(container) {
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

async function handleReviewSubmit(form, productId) {
  const name   = sanitizeText(form.querySelector("[name=reviewer-name]")?.value || "", 100);
  const rating = parseInt(form.querySelector("[name=rating]")?.value || "0", 10);
  const ulasan = sanitizeText(form.querySelector("[name=ulasan]")?.value || "", 1000);

  if (!name)   { showToast("Nama tidak boleh kosong.", "error"); return; }
  if (!rating || rating < 1 || rating > 5) { showToast("Pilih rating bintang (1-5).", "error"); return; }
  if (!ulasan || ulasan.length < APP_CONFIG.minReviewLength) {
    showToast(`Ulasan minimal ${APP_CONFIG.minReviewLength} karakter.`, "error"); return;
  }

  if (isReviewCooldown()) {
    showToast(`Tunggu ${reviewCooldownRemaining()} detik sebelum submit ulasan lagi.`, "warning"); return;
  }

  const submitBtn = form.querySelector("[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  try {
    const { error } = await window._supabase.from("reviews").insert({
      product_id: productId || null,
      name, rating, ulasan,
      is_owner: false
    });

    if (error) throw error;

    if (productId) await updateProductRating(productId);

    recordReviewSubmit();
    showToast("Ulasan berhasil dikirim! 🎉", "success");
    form.reset();

    // Reset bintang
    const starsEl = form.querySelector(".star-rating-input");
    if (starsEl) {
      starsEl.querySelectorAll(".star-btn").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      const hidden = starsEl.querySelector("input[type=hidden]");
      if (hidden) hidden.value = "0";
    }

    await loadAllReviews();
    if (productId) {
      const productReviews = await loadReviewsByProduct(productId);
      renderProductReviews(productReviews, productId);
    }
  } catch (err) {
    console.error("Submit review error:", err);
    showToast("Gagal mengirim ulasan: " + (err.message || "coba lagi."), "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Ulasan";
  }
}

async function updateProductRating(productId) {
  const { data, error } = await window._supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (error || !data) return;

  const total = data.length;
  const avg   = total > 0 ? data.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;

  await window._supabase.from("products").update({
    rating_average: parseFloat(avg.toFixed(1)),
    total_reviews:  total
  }).eq("id", productId);
}

function renderProductReviews(reviews, productId) {
  const container = document.getElementById("modal-reviews-list");
  if (!container) return;
  container.innerHTML = reviews.length
    ? reviews.map(r => renderReviewCard(r)).join("")
    : `<p class="no-reviews">Belum ada ulasan untuk produk ini.</p>`;

  const modalForm = document.getElementById("modal-review-form");
  if (modalForm) {
    setupInteractiveStars(modalForm);
    modalForm.onsubmit = async (e) => { e.preventDefault(); await handleReviewSubmit(modalForm, productId); };
  }
}

// ============================
// NAVIGATION
// ============================
function buildNavLinks() {
  document.querySelectorAll("[data-nav-target]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      scrollToSection(link.dataset.navTarget);
      document.getElementById("mobile-menu")?.classList.remove("open");
    });
  });
}

function setupNavScroll() {
  const navbar = document.getElementById("main-nav");
  if (!navbar) return;
  window.addEventListener("scroll", () => navbar.classList.toggle("scrolled", window.scrollY > 50), { passive: true });
}

function setupNavActiveOnScroll() {
  const sections = ["hero","katalog","testimoni","tentang","kontak"];
  const navLinks = document.querySelectorAll("[data-nav-target]");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.toggle("active", l.dataset.navTarget === e.target.id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
}

function setupMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu   = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function updateNavForAdmin(loggedIn) {
  const link = document.getElementById("nav-admin-link");
  if (link) link.style.display = loggedIn ? "inline-flex" : "none";
}

function initHeroAnimation() {
  document.querySelectorAll(".hero-animate").forEach((el, i) => { el.style.animationDelay = `${i * 150}ms`; });
}

function setupCopyLink() {
  document.getElementById("btn-copy-link")?.addEventListener("click", async () => {
    try { await copyToClipboard(window.location.href); showToast("Link toko berhasil disalin! 📋", "success"); }
    catch { showToast("Gagal menyalin link.", "error"); }
  });
}
