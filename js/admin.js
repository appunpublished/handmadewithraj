import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth, db } from "./firebase.js";
import { ADMIN_EMAILS, SITE_CONFIG } from "./firebase-config.js";

const state = {
  products: [],
  editingId: null,
  deletingId: null,
  unsubscribeProducts: null
};

function byId(id) {
  return document.getElementById(id);
}

function showToast(message, type = "success") {
  const container = byId("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "bg-sage" : "bg-red-400"} text-white px-6 py-3 rounded-lg shadow-lg mb-2`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function isAllowedAdmin(email) {
  const normalized = (email || "").toLowerCase();
  return ADMIN_EMAILS.map((v) => v.toLowerCase()).includes(normalized);
}

async function hasAdminAccess(user) {
  const tokenResult = await getIdTokenResult(user, true);
  const hasClaim = tokenResult?.claims?.admin === true;
  return hasClaim || isAllowedAdmin(user.email);
}

function renderTable() {
  const tbody = byId("products-table-body");
  const empty = byId("table-empty");

  if (!state.products.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  tbody.innerHTML = state.products
    .map(
      (p) => `
      <tr class="border-b border-blush/20 hover:bg-cream/50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-cream overflow-hidden flex-shrink-0">
              <img src="${p.image_url}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <div class="min-w-0">
              <p class="font-medium truncate">${p.name}</p>
              <p class="text-light text-sm truncate max-w-xs">${p.description ?? ""}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">${p.category || "-"}</td>
        <td class="px-6 py-4 font-semibold">Rs ${Number(p.price || 0).toLocaleString()}</td>
        <td class="px-6 py-4 text-right">
          <button class="btn-blush px-3 py-1 rounded-lg text-sm" data-edit-id="${p.id}">Edit</button>
          <button class="ml-2 px-3 py-1 rounded-lg text-sm bg-red-500 text-white" data-delete-id="${p.id}">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => openEditForm(btn.dataset.editId));
  });
  tbody.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", () => openDeleteModal(btn.dataset.deleteId));
  });

  byId("stat-total").textContent = state.products.length;
  byId("stat-toys").textContent = state.products.filter((p) => p.category === "toys").length;
  byId("stat-keychains").textContent = state.products.filter((p) => p.category === "keychains").length;
}

function resetForm() {
  byId("product-form").reset();
  byId("edit-product-id").value = "";
  state.editingId = null;
  byId("form-title").textContent = "Add New Product";
  byId("submit-btn-text").textContent = "Save Product";
}

function showForm() {
  byId("product-form-container").classList.remove("hidden");
}

function hideForm() {
  byId("product-form-container").classList.add("hidden");
  resetForm();
}

function openEditForm(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product) return;

  state.editingId = id;
  byId("form-title").textContent = "Edit Product";
  byId("submit-btn-text").textContent = "Update Product";
  byId("edit-product-id").value = id;
  byId("product-name").value = product.name || "";
  byId("product-category").value = product.category || "";
  byId("product-description").value = product.description || "";
  byId("product-price").value = product.price || "";
  byId("product-image").value = product.image_url || "";
  byId("product-image-2").value = product.image_url_2 || "";
  byId("product-image-3").value = product.image_url_3 || "";
  byId("product-video").value = product.video_url || "";

  showForm();
}

function openDeleteModal(id) {
  state.deletingId = id;
  byId("delete-modal").classList.remove("hidden");
}

function closeDeleteModal() {
  state.deletingId = null;
  byId("delete-modal").classList.add("hidden");
}

async function onSubmitProduct(event) {
  event.preventDefault();

  const submitBtn = byId("submit-btn");
  submitBtn.disabled = true;
  byId("submit-btn-text").textContent = "Saving...";

  const payload = {
    name: byId("product-name").value.trim(),
    category: byId("product-category").value,
    description: byId("product-description").value.trim(),
    price: Number(byId("product-price").value),
    image_url: byId("product-image").value.trim(),
    image_url_2: byId("product-image-2").value.trim(),
    image_url_3: byId("product-image-3").value.trim(),
    video_url: byId("product-video").value.trim(),
    updated_at: serverTimestamp()
  };

  try {
    if (state.editingId) {
      await updateDoc(doc(db, "products", state.editingId), payload);
      showToast("Product updated successfully");
    } else {
      await addDoc(collection(db, "products"), {
        ...payload,
        created_at: serverTimestamp()
      });
      showToast("Product added successfully");
    }
    hideForm();
  } catch (error) {
    showToast("Failed to save product", "error");
  } finally {
    submitBtn.disabled = false;
    byId("submit-btn-text").textContent = state.editingId ? "Update Product" : "Save Product";
  }
}

async function onConfirmDelete() {
  if (!state.deletingId) return;
  try {
    await deleteDoc(doc(db, "products", state.deletingId));
    showToast("Product deleted successfully");
  } catch (error) {
    showToast("Failed to delete product", "error");
  } finally {
    closeDeleteModal();
  }
}

function initRealtimeProducts() {
  if (state.unsubscribeProducts) {
    state.unsubscribeProducts();
  }

  const q = query(collection(db, "products"), orderBy("created_at", "desc"));
  state.unsubscribeProducts = onSnapshot(
    q,
    (snapshot) => {
      state.products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderTable();
    },
    () => {
      showToast("Failed to load products", "error");
    }
  );
}

function showLogin() {
  if (state.unsubscribeProducts) {
    state.unsubscribeProducts();
    state.unsubscribeProducts = null;
  }
  state.products = [];
  renderTable();
  byId("admin-login").classList.remove("hidden");
  byId("admin-dashboard").classList.add("hidden");
}

function showDashboard() {
  byId("admin-login").classList.add("hidden");
  byId("admin-dashboard").classList.remove("hidden");
}

function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showLogin();
      return;
    }

    const allowed = await hasAdminAccess(user);
    if (!allowed) {
      await signOut(auth);
      showToast("You do not have admin access", "error");
      showLogin();
      return;
    }

    showDashboard();
    initRealtimeProducts();
  });
}

async function onLogin(event) {
  event.preventDefault();
  const email = byId("login-email").value;
  const password = byId("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("Welcome back");
    byId("login-form").reset();
  } catch (error) {
    showToast("Invalid login", "error");
  }
}

async function onLogout() {
  await signOut(auth);
  showToast("Logged out");
}

document.addEventListener("DOMContentLoaded", () => {
  byId("brand-name").textContent = SITE_CONFIG.brandName;
  byId("login-form").addEventListener("submit", onLogin);
  byId("product-form").addEventListener("submit", onSubmitProduct);
  byId("logout-btn").addEventListener("click", onLogout);
  byId("show-add-form-btn").addEventListener("click", () => {
    resetForm();
    showForm();
  });
  byId("cancel-form-btn").addEventListener("click", hideForm);
  byId("close-form-btn").addEventListener("click", hideForm);
  byId("close-delete-btn").addEventListener("click", closeDeleteModal);
  byId("confirm-delete-btn").addEventListener("click", onConfirmDelete);
  byId("delete-backdrop").addEventListener("click", closeDeleteModal);

  initAuth();
});
