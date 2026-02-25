import {
  collection,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase.js";
import { SITE_CONFIG } from "./firebase-config.js";

const state = {
  products: [],
  currentFilter: "all"
};

function byId(id) {
  return document.getElementById(id);
}

function initBranding() {
  byId("nav-brand").textContent = SITE_CONFIG.brandName;
  byId("hero-title").textContent = SITE_CONFIG.brandName;
  byId("footer-brand").textContent = SITE_CONFIG.brandName;
  byId("hero-tagline").textContent = SITE_CONFIG.tagline;
  byId("about-title").textContent = SITE_CONFIG.aboutTitle;
  byId("about-text").textContent = SITE_CONFIG.aboutText;
  byId("instagram-link").href = `https://instagram.com/${SITE_CONFIG.instagramHandle.replace("@", "")}`;
  byId("whatsapp-link").href = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
}

function showToast(message, type = "success") {
  const container = byId("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "bg-sage" : "bg-red-400"} text-white px-6 py-3 rounded-lg shadow-lg mb-2`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function filterProducts(category) {
  state.currentFilter = category;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === category);
  });
  renderProducts();
}

function renderProducts() {
  const grid = byId("products-grid");
  const emptyState = byId("empty-state");

  const visible =
    state.currentFilter === "all"
      ? state.products
      : state.products.filter((p) => p.category === state.currentFilter);

  if (!visible.length) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  grid.innerHTML = visible
    .map(
      (p) => `
      <article class="bg-white rounded-xl overflow-hidden shadow-lg card-hover">
        <div class="aspect-square bg-cream overflow-hidden">
          <img src="${p.image_url}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy">
        </div>
        <div class="p-5">
          <h3 class="font-serif text-xl font-semibold mb-2">${p.name}</h3>
          <p class="text-light text-sm mb-3">${p.description ?? ""}</p>
          <div class="flex items-center justify-between gap-2">
            <span class="text-xl font-bold text-sage-dark">Rs ${Number(p.price || 0).toLocaleString()}</span>
            <button class="btn-blush px-4 py-2 rounded-lg text-sm font-medium" data-open-id="${p.id}">View</button>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll("[data-open-id]").forEach((btn) => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.openId));
  });
}

function openProductModal(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  byId("modal-title").textContent = product.name;
  byId("modal-name").textContent = product.name;
  byId("modal-description").textContent = product.description ?? "";
  byId("modal-price").textContent = `Rs ${Number(product.price || 0).toLocaleString()}`;

  const img = byId("modal-main-image");
  img.src = product.image_url;
  img.alt = product.name;

  const message = encodeURIComponent(
    `Hi, I want to order ${product.name} (Rs ${product.price}) from ${SITE_CONFIG.brandName}.`
  );
  byId("modal-whatsapp-btn").href = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${message}`;

  byId("product-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  byId("product-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

function initProducts() {
  const productsRef = query(collection(db, "products"), orderBy("created_at", "desc"));
  onSnapshot(
    productsRef,
    (snapshot) => {
      state.products = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      byId("loading-state").classList.add("hidden");
      renderProducts();
    },
    () => {
      byId("loading-state").classList.add("hidden");
      showToast("Failed to load products", "error");
    }
  );
}

window.filterProducts = filterProducts;
window.closeProductModal = closeProductModal;

document.addEventListener("DOMContentLoaded", () => {
  initBranding();
  initProducts();

  byId("close-product-modal").addEventListener("click", closeProductModal);
  byId("product-modal-backdrop").addEventListener("click", closeProductModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
  });
});
