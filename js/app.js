/**
 * =============================================================
 * BABEKU AUDIO - Main Application Logic
 * =============================================================
 * Mengelola:
 * - Inisialisasi Firebase
 * - Render produk (dengan pagination)
 * - Search & filter
 * - Modal detail produk + gallery
 * - Review section (tambah review user)
 * - Seeding dummy data jika database kosong
 * - Animasi & interaksi UI
 * =============================================================
 */

"use strict";

// ============================
// STATE GLOBAL
// ============================
const AppState = {
  db:           null,
  storage:      null,
  products:     [],        // Cache produk dari Firestore
  reviews:      [],        // Cache review dari Firestore
  filteredProds: [],       // Produk setelah filter/search
  currentPage:  1,
  activeModal:  null,      // productId yang sedang dibuka di modal
  searchQuery:  "",
  filterCategory: "all",
  sortOrder:    "newest",  // newest | rating
  reviewSortOrder: "newest"
};

// ============================
// KATEGORI PRODUK
// ============================
const CATEGORIES = [
  { value: "all",        label: "Semua Kategori" },
  { value: "speaker",    label: "Speaker" },
  { value: "amplifier",  label: "Amplifier" },
  { value: "mixer",      label: "Mixer" },
  { value: "microphone", label: "Microphone" },
  { value: "sound-system","label": "Sound System" },
  { value: "salon",      label: "Peralatan Salon" },
  { value: "lainnya",    label: "Lainnya" }
];

// ============================
// DUMMY DATA (Seed saat DB kosong)
// ============================
const DUMMY_PRODUCTS = [
  {
    name:        "Speaker Active Yamaha 15 Inch",
    price:       2500000,
    description: "Speaker active kondisi 90%, suara jernih, bass powerful. Cocok untuk event kecil atau sound system rumahan. Sudah diuji fungsi semua fitur normal.",
    category:    "speaker",
    condition:   "Bekas - Kondisi 90%",
    warranty:    "Garansi 7 Hari",
    location:    "Tuban, Jawa Timur",
    fotoUrls:    [
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Speaker+Yamaha+15%22",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Tampak+Samping",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Detail+Panel"
    ],
    ratingAverage: 5,
    totalReviews:  2,
    createdAt:     new Date("2026-01-10")
  },
  {
    name:        "Mixer Soundcraft EPM8",
    price:       3200000,
    description: "Mixer 8 channel kondisi mulus, semua channel normal dan teruji. Lengkap dengan power cable original. Cocok untuk studio rekaman kecil atau live performance.",
    category:    "mixer",
    condition:   "Bekas - Kondisi 95%",
    warranty:    "Garansi 7 Hari",
    location:    "Tuban, Jawa Timur",
    fotoUrls:    [
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Mixer+Soundcraft+EPM8",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Semua+Channel+Normal"
    ],
    ratingAverage: 5,
    totalReviews:  2,
    createdAt:     new Date("2026-01-15")
  },
  {
    name:        "Mic Wireless Shure BLX24",
    price:       1800000,
    description: "Microphone wireless original Shure seri BLX24, jarak jangkau hingga 30 meter, baterai tahan lama. Kondisi seperti baru, jarang digunakan.",
    category:    "microphone",
    condition:   "Bekas - Kondisi 98%",
    warranty:    "Garansi 7 Hari",
    location:    "Tuban, Jawa Timur",
    fotoUrls:    [
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Shure+BLX24",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Receiver+Unit",
      "https://placehold.co/600x450/1e3a8a/f59e0b?text=Kelengkapan"
    ],
    ratingAverage: 5,
    totalReviews:  2,
    createdAt:     new Date("2026-01-20")
  }
];

const DUMMY_REVIEWS = [
  {
    productId:  null, // General review — tidak terikat produk spesifik
    name:       "Budi Santoso",
    rating:     5,
    ulasan:     "Barangnya bagus dan kondisi sesuai deskripsi. Pengiriman cepat!",
    isOwner:    true,
    createdAt:  new Date("2026-01-12")
  },
  {
    productId:  null,
    name:       "Siti Nurhaliza",
    rating:     5,
    ulasan:     "Sudah beberapa kali beli di Babeku Audio, selalu puas. Recommended seller!",
    isOwner:    true,
    createdAt:  new Date("2026-01-18")
  }
];


// ============================
// INISIALISASI APP
// ============================

document.addEventListener("DOMContentLoaded", async () => {
  // Init Firebase
  firebase.initializeApp(FIREBASE_CONFIG);
  AppState.db      = firebase.firestore();
  AppState.storage = firebase.storage();

  // Init Auth listener (update nav jika user login)
  initAuth(
    (user) => updateNavForAdmin(true),
    ()     => updateNavForAdmin(false)
  );

  // Build UI statis
  buildNavLinks();
  buildCategoryFilter();
  populateStoreMeta();

  // Load data
  await seedDatabaseIfEmpty();
  await loadProducts();
  await loadAllReviews();

  // Setup semua event listener
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


// ============================
// POPULATE STORE META (Isi data toko dari config)
// ============================
function populateStoreMeta() {
  // Nama toko di berbagai tempat
  document.querySelectorAll("[data-store-name]").forEach(el => {
    el.textContent = STORE_CONFIG.name;
  });
  document.querySelectorAll("[data-store-tagline]").forEach(el => {
    el.textContent = STORE_CONFIG.tagline;
  });
  document.querySelectorAll("[data-store-address]").forEach(el => {
    el.textContent = STORE_CONFIG.address;
  });
  document.querySelectorAll("[data-store-hours]").forEach(el => {
    el.textContent = STORE_CONFIG.hours;
  });
  document.querySelectorAll("[data-wa-link]").forEach(el => {
    el.href = buildWhatsAppUrl("contact");
  });
  document.querySelectorAll("[data-social-fb1]").forEach(el => {
    el.href = STORE_CONFIG.social.facebook1;
  });
  document.querySelectorAll("[data-social-fb2]").forEach(el => {
    el.href = STORE_CONFIG.social.facebook2;
  });
  document.querySelectorAll("[data-social-ig]").forEach(el => {
    el.href = STORE_CONFIG.social.instagram;
  });
  document.querySelectorAll("[data-social-yt]").forEach(el => {
    el.href = STORE_CONFIG.social.youtube;
  });
}


// ============================
// SEEDING DATABASE
// ============================

/**
 * Seed database jika koleksi products kosong.
 * Hanya berjalan sekali saat first deploy.
 */
async function seedDatabaseIfEmpty() {
  try {
    const snap = await AppState.db.collection("products").limit(1).get();
    if (!snap.empty) return; // Sudah ada data, skip

    console.log("Database kosong, menambahkan dummy data...");
    const batch = AppState.db.batch();

    // Seed produk
    const productRefs = [];
    for (const prod of DUMMY_PRODUCTS) {
      const ref = AppState.db.collection("products").doc();
      batch.set(ref, {
        ...prod,
        createdAt: firebase.firestore.Timestamp.fromDate(prod.createdAt),
        updatedAt: firebase.firestore.Timestamp.now()
      });
      productRefs.push(ref);
    }

    // Seed review palsu (general — tanpa productId)
    for (const rev of DUMMY_REVIEWS) {
      const ref = AppState.db.collection("reviews").doc();
      batch.set(ref, {
        ...rev,
        productId: null,
        createdAt: firebase.firestore.Timestamp.fromDate(rev.createdAt)
      });
    }

    await batch.commit();
    console.log("Dummy data berhasil ditambahkan.");
  } catch (err) {
    console.error("Seed error:", err);
    // Jangan throw — app tetap jalan meskipun seed gagal
  }
}


// ============================
// LOAD PRODUK
// ============================

async function loadProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = renderSkeletons(APP_CONFIG.productsPerPage);

  try {
    const snap = await AppState.db
      .collection("products")
      .orderBy("createdAt", "desc")
      .get();

    AppState.products = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    applyFilterAndRender();
  } catch (err) {
    console.error("Load products error:", err);
    grid.innerHTML = `
      <div class="load-error">
        <p>Gagal memuat produk. Periksa koneksi atau Firebase config.</p>
        <button onclick="loadProducts()" class="btn btn-primary">Coba Lagi</button>
      </div>`;
  }
}


// ============================
// FILTER & SEARCH LOGIC
// ============================

function applyFilterAndRender() {
  const q    = AppState.searchQuery.toLowerCase();
  const cat  = AppState.filterCategory;

  let filtered = AppState.products.filter(p => {
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q);
    const matchCat  = cat === "all" || p.category === cat;
    return matchSearch && matchCat;
  });

  AppState.filteredProds = filtered;
  AppState.currentPage   = 1;
  renderProductGrid();
  renderPagination();
  updateProductCount(filtered.length);
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

  grid.innerHTML = paginated.map((product, idx) =>
    renderProductCard(product, idx)
  ).join("");

  // Trigger staggered animation
  grid.querySelectorAll(".product-card").forEach((card, i) => {
    card.style.animationDelay = `${i * 80}ms`;
    card.classList.add("card-appear");
  });

  // Attach click handlers
  grid.querySelectorAll(".product-card").forEach(card => {
    card.querySelector(".card-overlay").addEventListener("click", () => {
      openProductModal(card.dataset.productId);
    });
  });
  grid.querySelectorAll(".btn-buy").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const name = btn.dataset.name;
      window.open(buildWhatsAppUrl("buy", name), "_blank", "noopener");
    });
  });
  grid.querySelectorAll(".btn-ask").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const name = btn.dataset.name;
      window.open(buildWhatsAppUrl("ask", name), "_blank", "noopener");
    });
  });
}

function renderProductCard(product, idx) {
  const photoUrl = (product.fotoUrls && product.fotoUrls[0])
    ? product.fotoUrls[0]
    : "https://placehold.co/400x300/1e3a8a/f59e0b?text=Tidak+Ada+Foto";

  const photoCount = product.fotoUrls ? product.fotoUrls.length : 0;

  return `
    <div class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="card-img-wrap">
        <img
          src="${escapeHtml(photoUrl)}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          onerror="this.src='https://placehold.co/400x300/1e3a8a/f59e0b?text=Gambar+Tidak+Tersedia'"
        >
        ${photoCount > 1 ? `<span class="photo-badge">📷 ${photoCount}</span>` : ""}
        <div class="card-overlay" role="button" tabindex="0" aria-label="Lihat detail ${escapeHtml(product.name)}"></div>
      </div>
      <div class="product-card-body">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <p class="product-price">${formatRupiah(product.price)}</p>
        <div class="product-rating">
          ${renderStars(product.ratingAverage || 0)}
          <span class="review-count">(${product.totalReviews || 0})</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-buy"
            data-name="${escapeHtml(product.name)}"
            aria-label="Beli ${escapeHtml(product.name)}">
            🛒 Beli
          </button>
          <button class="btn btn-whatsapp btn-ask"
            data-name="${escapeHtml(product.name)}"
            aria-label="Tanya detail ${escapeHtml(product.name)}">
            💬 Tanya Detail
          </button>
        </div>
      </div>
    </div>`;
}

function renderPagination() {
  const container  = document.getElementById("pagination");
  if (!container) return;

  const total   = AppState.filteredProds.length;
  const perPage = APP_CONFIG.productsPerPage;
  const pages   = Math.ceil(total / perPage);

  if (pages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= pages; i++) {
    const active = i === AppState.currentPage ? "active" : "";
    html += `<button class="page-btn ${active}" data-page="${i}" aria-label="Halaman ${i}" ${active ? 'aria-current="page"' : ""}>${i}</button>`;
  }
  container.innerHTML = html;

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
  AppState.searchQuery     = "";
  AppState.filterCategory  = "all";
  const searchInput = document.getElementById("search-input");
  const catSelect   = document.getElementById("filter-category");
  if (searchInput) searchInput.value = "";
  if (catSelect)   catSelect.value   = "all";
  applyFilterAndRender();
}


// ============================
// BUILD CATEGORY FILTER DROPDOWN
// ============================
function buildCategoryFilter() {
  const select = document.getElementById("filter-category");
  if (!select) return;
  select.innerHTML = CATEGORIES.map(c =>
    `<option value="${c.value}">${escapeHtml(c.label)}</option>`
  ).join("");
}


// ============================
// SETUP SEARCH & FILTER EVENTS
// ============================
function setupSearchFilter() {
  const searchInput = document.getElementById("search-input");
  const catSelect   = document.getElementById("filter-category");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      AppState.searchQuery = sanitizeText(searchInput.value, 100);
      applyFilterAndRender();
    }, 300));
  }

  if (catSelect) {
    catSelect.addEventListener("change", () => {
      AppState.filterCategory = catSelect.value;
      applyFilterAndRender();
    });
  }
}


// ============================
// MODAL DETAIL PRODUK
// ============================

async function openProductModal(productId) {
  const product = AppState.products.find(p => p.id === productId);
  if (!product) return;

  AppState.activeModal = productId;
  renderModal(product);

  // Load review untuk produk ini
  const reviews = await loadReviewsByProduct(productId);
  renderProductReviews(reviews, productId);

  const modal = document.getElementById("product-modal");
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Setup gallery navigation
  setupGallery(product.fotoUrls || []);
}

function closeModal() {
  const modal = document.getElementById("product-modal");
  if (!modal) return;
  modal.classList.remove("open");
  document.body.style.overflow = "";
  AppState.activeModal = null;
}

function renderModal(product) {
  const photos  = product.fotoUrls || [];
  const mainUrl = photos[0] || "https://placehold.co/700x500/1e3a8a/f59e0b?text=Tidak+Ada+Foto";

  document.getElementById("modal-main-img").src = escapeHtml(mainUrl);
  document.getElementById("modal-main-img").alt = escapeHtml(product.name);
  document.getElementById("modal-title").textContent  = product.name;
  document.getElementById("modal-price").textContent  = formatRupiah(product.price);
  document.getElementById("modal-rating").innerHTML   = `
    ${renderStars(product.ratingAverage || 0)}
    <span class="review-count">(${product.totalReviews || 0} ulasan)</span>
  `;
  document.getElementById("modal-description").textContent = product.description || "-";
  document.getElementById("modal-condition").textContent   = product.condition  || "-";
  document.getElementById("modal-warranty").textContent    = product.warranty   || "Garansi 7 Hari";
  document.getElementById("modal-location").textContent    = product.location   || STORE_CONFIG.address;

  document.getElementById("modal-btn-buy").onclick = () => {
    window.open(buildWhatsAppUrl("buy", product.name), "_blank", "noopener");
  };
  document.getElementById("modal-btn-ask").onclick = () => {
    window.open(buildWhatsAppUrl("ask", product.name), "_blank", "noopener");
  };

  // Thumbnails
  const thumbsEl = document.getElementById("modal-thumbnails");
  if (photos.length > 1) {
    thumbsEl.innerHTML = photos.map((url, i) => `
      <img
        src="${escapeHtml(url)}"
        alt="Foto ${i+1}"
        class="thumb ${i === 0 ? "active" : ""}"
        data-index="${i}"
        loading="lazy"
        onerror="this.src='https://placehold.co/80x60/1e3a8a/f59e0b?text=X'"
      >
    `).join("");
    thumbsEl.style.display = "flex";
  } else {
    thumbsEl.innerHTML = "";
    thumbsEl.style.display = "none";
  }
}

function setupGallery(photos) {
  if (!photos.length) return;
  let currentIdx = 0;

  const mainImg  = document.getElementById("modal-main-img");
  const thumbsEl = document.getElementById("modal-thumbnails");
  const prevBtn  = document.getElementById("gallery-prev");
  const nextBtn  = document.getElementById("gallery-next");

  function goTo(idx) {
    currentIdx = (idx + photos.length) % photos.length;
    mainImg.src = photos[currentIdx];
    thumbsEl.querySelectorAll(".thumb").forEach((t, i) => {
      t.classList.toggle("active", i === currentIdx);
    });
    // Tampilkan/sembunyikan nav arrows
    if (prevBtn) prevBtn.style.display = photos.length > 1 ? "" : "none";
    if (nextBtn) nextBtn.style.display = photos.length > 1 ? "" : "none";
  }

  if (prevBtn) prevBtn.onclick = () => goTo(currentIdx - 1);
  if (nextBtn) nextBtn.onclick = () => goTo(currentIdx + 1);

  thumbsEl.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      goTo(parseInt(thumb.dataset.index, 10));
    });
  });

  // Init arrow visibility
  if (prevBtn) prevBtn.style.display = photos.length > 1 ? "" : "none";
  if (nextBtn) nextBtn.style.display = photos.length > 1 ? "" : "none";
}

// Tutup modal dengan klik backdrop atau tombol close
document.addEventListener("DOMContentLoaded", () => {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && AppState.activeModal) closeModal();
  });
});


// ============================
// LOAD REVIEWS
// ============================

async function loadAllReviews() {
  try {
    const snap = await AppState.db
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .get();

    AppState.reviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTestimoniSection();
  } catch (err) {
    console.error("Load reviews error:", err);
  }
}

async function loadReviewsByProduct(productId) {
  try {
    const snap = await AppState.db
      .collection("reviews")
      .where("productId", "==", productId)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Load product reviews error:", err);
    return [];
  }
}


// ============================
// RENDER TESTIMONI SECTION
// ============================
function renderTestimoniSection() {
  const container = document.getElementById("reviews-container");
  if (!container) return;

  // Tampilkan review umum (productId == null) + semua review
  let reviews = AppState.reviews.slice(); // copy

  if (AppState.reviewSortOrder === "rating") {
    reviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (reviews.length === 0) {
    container.innerHTML = `<p class="no-reviews">Belum ada ulasan. Jadilah yang pertama!</p>`;
    updateOverallRating(0, 0);
    return;
  }

  container.innerHTML = reviews.map(rev => renderReviewCard(rev)).join("");
  updateOverallRating(reviews);

  // Carousel / slider navigation
  setupReviewSlider();
}

function renderReviewCard(review) {
  return `
    <div class="review-card">
      <div class="review-header">
        <div class="reviewer-avatar">${escapeHtml(review.name || "?").charAt(0).toUpperCase()}</div>
        <div class="reviewer-info">
          <strong class="reviewer-name">${escapeHtml(review.name || "Anonim")}</strong>
          <time class="review-date">${formatDate(review.createdAt)}</time>
        </div>
        <div class="review-stars">${renderStars(review.rating || 0)}</div>
      </div>
      <p class="review-text">${escapeHtml(review.ulasan || "")}</p>
    </div>`;
}

function updateOverallRating(reviews) {
  const el = document.getElementById("overall-rating");
  const countEl = document.getElementById("overall-count");
  if (!el || !Array.isArray(reviews)) return;

  if (reviews.length === 0) {
    el.textContent = "0.0";
    if (countEl) countEl.textContent = "(0 ulasan)";
    return;
  }

  const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  el.textContent = avg.toFixed(1);
  if (countEl) countEl.textContent = `(${reviews.length} ulasan)`;
}

function setupReviewSlider() {
  const slider   = document.getElementById("reviews-container");
  const prevBtn  = document.getElementById("review-prev");
  const nextBtn  = document.getElementById("review-next");
  if (!slider || !prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => {
    slider.scrollBy({ left: -320, behavior: "smooth" });
  });
  nextBtn.addEventListener("click", () => {
    slider.scrollBy({ left: 320, behavior: "smooth" });
  });
}


// ============================
// REVIEW FORM (User)
// ============================
function setupReviewForm() {
  const form = document.getElementById("review-form");
  if (!form) return;

  // Setup bintang interaktif
  setupInteractiveStars(form);

  // Sort handler
  const sortSelect = document.getElementById("review-sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      AppState.reviewSortOrder = sortSelect.value;
      renderTestimoniSection();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleReviewSubmit(form, null); // null = review umum
  });
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

    // Keyboard support
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") btn.click();
    });
  });
}

async function handleReviewSubmit(form, productId) {
  const nameInput   = form.querySelector("[name=reviewer-name]");
  const ratingInput = form.querySelector("[name=rating]");
  const ulasanInput = form.querySelector("[name=ulasan]");

  const name   = sanitizeText(nameInput ? nameInput.value : "", 100);
  const rating = parseInt(ratingInput ? ratingInput.value : "0", 10);
  const ulasan = sanitizeText(ulasanInput ? ulasanInput.value : "", 1000);

  // Validasi
  if (!name) {
    showToast("Nama tidak boleh kosong.", "error"); return;
  }
  if (!rating || rating < 1 || rating > 5) {
    showToast("Pilih rating bintang (1-5).", "error"); return;
  }
  if (!ulasan || ulasan.length < APP_CONFIG.minReviewLength) {
    showToast(`Ulasan minimal ${APP_CONFIG.minReviewLength} karakter.`, "error"); return;
  }

  // Anti-spam
  if (isReviewCooldown()) {
    const sisa = reviewCooldownRemaining();
    showToast(`Tunggu ${sisa} detik sebelum submit ulasan lagi.`, "warning");
    return;
  }

  const submitBtn = form.querySelector("[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  try {
    await AppState.db.collection("reviews").add({
      productId: productId || null,
      name,
      rating,
      ulasan,
      isOwner:  false,
      createdAt: firebase.firestore.Timestamp.now()
    });

    // Jika ada productId, update rating produk
    if (productId) {
      await updateProductRating(productId);
    }

    recordReviewSubmit();
    showToast("Ulasan berhasil dikirim! Terima kasih. 🎉", "success");
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

    // Reload reviews
    await loadAllReviews();
    if (productId) {
      const productReviews = await loadReviewsByProduct(productId);
      renderProductReviews(productReviews, productId);
    }

  } catch (err) {
    console.error("Submit review error:", err);
    showToast("Gagal mengirim ulasan. Coba lagi.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Ulasan";
  }
}

async function updateProductRating(productId) {
  try {
    const snap = await AppState.db
      .collection("reviews")
      .where("productId", "==", productId)
      .get();

    const reviews = snap.docs.map(d => d.data());
    const total   = reviews.length;
    const avg     = total > 0
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total
      : 0;

    await AppState.db.collection("products").doc(productId).update({
      ratingAverage: parseFloat(avg.toFixed(1)),
      totalReviews:  total
    });
  } catch (err) {
    console.error("Update rating error:", err);
  }
}

function renderProductReviews(reviews, productId) {
  const container = document.getElementById("modal-reviews-list");
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `<p class="no-reviews">Belum ada ulasan untuk produk ini.</p>`;
  } else {
    container.innerHTML = reviews.map(r => renderReviewCard(r)).join("");
  }

  // Setup form di dalam modal
  const modalForm = document.getElementById("modal-review-form");
  if (modalForm) {
    setupInteractiveStars(modalForm);
    modalForm.onsubmit = async (e) => {
      e.preventDefault();
      await handleReviewSubmit(modalForm, productId);
    };
  }
}


// ============================
// NAVIGATION
// ============================
function buildNavLinks() {
  const links = document.querySelectorAll("[data-nav-target]");
  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.navTarget;
      scrollToSection(target);
      // Tutup mobile menu jika terbuka
      const menu = document.getElementById("mobile-menu");
      if (menu) menu.classList.remove("open");
    });
  });
}

function setupNavScroll() {
  const navbar = document.getElementById("main-nav");
  if (!navbar) return;
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  }, { passive: true });
}

function setupNavActiveOnScroll() {
  const sections = ["hero","katalog","testimoni","tentang","kontak"];
  const navLinks = document.querySelectorAll("[data-nav-target]");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle("active", link.dataset.navTarget === id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

function setupMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu   = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function updateNavForAdmin(isLoggedIn) {
  const adminLink = document.getElementById("nav-admin-link");
  if (adminLink) {
    adminLink.style.display = isLoggedIn ? "inline-flex" : "none";
  }
}


// ============================
// HERO ANIMATION
// ============================
function initHeroAnimation() {
  const heroEl = document.getElementById("hero");
  if (!heroEl) return;

  // Sudah pakai CSS animation, tapi pastikan class applied
  heroEl.querySelectorAll(".hero-animate").forEach((el, i) => {
    el.style.animationDelay = `${i * 150}ms`;
  });
}


// ============================
// COPY LINK
// ============================
function setupCopyLink() {
  const btn = document.getElementById("btn-copy-link");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    try {
      await copyToClipboard(window.location.href);
      showToast("Link toko berhasil disalin! 📋", "success");
    } catch {
      showToast("Gagal menyalin link.", "error");
    }
  });
}
