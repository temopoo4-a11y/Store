const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

let productsCache = null;

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function getProducts() {
  if (!productsCache) {
    productsCache = readJson(PRODUCTS_FILE);
  }
  return productsCache;
}

function getProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

function getProductBySlug(slug) {
  return getProducts().find((p) => p.slug === slug) || null;
}

function getCategories() {
  const seen = new Map();
  for (const p of getProducts()) {
    if (!seen.has(p.category)) {
      seen.set(p.category, { name: p.category, slug: p.category });
    }
  }
  return [...seen.values()];
}

function getOrders() {
  return readJson(ORDERS_FILE);
}

function saveOrder(order) {
  const orders = getOrders();
  orders.push(order);
  writeJson(ORDERS_FILE, orders);
  return order;
}

function nextProductId() {
  return getProducts().reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createProduct(data) {
  const products = getProducts();
  const product = {
    id: nextProductId(),
    name: data.name,
    slug: slugify(data.slug || data.name),
    description: data.description || "",
    price: Math.round(Number(data.price) * 100) / 100,
    imageUrl: data.imageUrl || "",
    category: data.category || "general",
    stock: Math.max(0, Math.floor(Number(data.stock) || 0)),
    createdAt: new Date().toISOString(),
  };
  products.push(product);
  writeJson(PRODUCTS_FILE, products);
  productsCache = products;
  return product;
}

function updateProduct(id, data) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const existing = products[index];
  const updated = {
    ...existing,
    name: data.name !== undefined ? data.name : existing.name,
    slug:
      data.slug !== undefined
        ? slugify(data.slug)
        : data.name !== undefined
          ? slugify(data.name)
          : existing.slug,
    description: data.description !== undefined ? data.description : existing.description,
    price:
      data.price !== undefined ? Math.round(Number(data.price) * 100) / 100 : existing.price,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
    category: data.category !== undefined ? data.category : existing.category,
    stock: data.stock !== undefined ? Math.max(0, Math.floor(Number(data.stock) || 0)) : existing.stock,
  };
  products[index] = updated;
  writeJson(PRODUCTS_FILE, products);
  productsCache = products;
  return updated;
}

function deleteProduct(id) {
  const products = getProducts();
  const next = products.filter((p) => p.id !== id);
  if (next.length === products.length) return false;
  writeJson(PRODUCTS_FILE, next);
  productsCache = next;
  return true;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index], status };
  writeJson(ORDERS_FILE, orders);
  return orders[index];
}

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  getCategories,
  getOrders,
  saveOrder,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
};
