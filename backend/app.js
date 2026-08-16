const express = require("express");
const crypto = require("crypto");
const path = require("path");
const store = require("./store");

const app = express();

app.use(express.json());

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "public", "admin.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/categories", async (req, res) => {
  res.json(await store.getCategories());
});

app.get("/api/products", async (req, res) => {
  let products = await store.getProducts();
  const { category, q } = req.query;

  if (category) {
    products = products.filter((p) => p.category === category);
  }
  if (q) {
    const term = String(q).toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }

  res.json(products);
});

app.get("/api/products/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const numericId = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : null;
  const product =
    (numericId && (await store.getProductById(numericId))) ||
    (await store.getProductBySlug(idOrSlug));

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

app.post("/api/products", async (req, res) => {
  const { name, price } = req.body || {};
  if (!name || price === undefined || isNaN(Number(price))) {
    return res
      .status(400)
      .json({ error: "Product name and a numeric price are required" });
  }
  res.status(201).json(await store.createProduct(req.body));
});

app.put("/api/products/:id", async (req, res) => {
  const product = await store.updateProduct(Number(req.params.id), req.body || {});
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

app.delete("/api/products/:id", async (req, res) => {
  const deleted = await store.deleteProduct(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.status(204).end();
});

async function buildOrder(items, customer) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }
  if (!customer || !customer.name || !customer.email || !customer.address) {
    throw new Error("Customer name, email and address are required");
  }

  let total = 0;
  const lines = [];
  for (const item of items) {
    const product = await store.getProductById(Number(item.productId));
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (qty > product.stock) {
      throw new Error(`Not enough stock for ${product.name}`);
    }
    const price = Number(product.price);
    total += price * qty;
    lines.push({ productId: product.id, name: product.name, price, quantity: qty });
  }

  return {
    id: crypto.randomUUID(),
    items: lines,
    customer: {
      name: customer.name,
      email: customer.email,
      address: customer.address,
    },
    total: Math.round(total * 100) / 100,
    status: "placed",
    createdAt: new Date().toISOString(),
  };
}

app.post("/api/orders", async (req, res) => {
  const { items, customer } = req.body || {};

  let order;
  try {
    order = await buildOrder(items, customer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const saved = await store.saveOrder(order);
  res.status(201).json(saved);
});

app.get("/api/orders", async (req, res) => {
  const orders = await store.getOrders();
  res.json(
    orders.map((o) => ({
      id: o.id,
      customerName: o.customer.name,
      customerEmail: o.customer.email,
      itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    }))
  );
});

app.get("/api/orders/:id", async (req, res) => {
  const orders = await store.getOrders();
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.patch("/api/orders/:id", async (req, res) => {
  const { status } = req.body || {};
  const allowed = ["placed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
  }
  const order = await store.updateOrderStatus(req.params.id, status);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
