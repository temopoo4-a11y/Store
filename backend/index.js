const express = require("express");
const crypto = require("crypto");
const path = require("path");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/categories", (req, res) => {
  res.json(store.getCategories());
});

app.get("/api/products", (req, res) => {
  let products = store.getProducts();
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

app.get("/api/products/:idOrSlug", (req, res) => {
  const { idOrSlug } = req.params;
  const byId = store.getProductById(Number(idOrSlug));
  const product = byId || store.getProductBySlug(idOrSlug);

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

app.post("/api/products", (req, res) => {
  const { name, price } = req.body || {};
  if (!name || price === undefined || isNaN(Number(price))) {
    return res
      .status(400)
      .json({ error: "Product name and a numeric price are required" });
  }
  res.status(201).json(store.createProduct(req.body));
});

app.put("/api/products/:id", (req, res) => {
  const product = store.updateProduct(Number(req.params.id), req.body || {});
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
  const deleted = store.deleteProduct(Number(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.status(204).end();
});

function buildOrder(items, customer) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }
  if (!customer || !customer.name || !customer.email || !customer.address) {
    throw new Error("Customer name, email and address are required");
  }

  let total = 0;
  const lines = items.map((item) => {
    const product = store.getProductById(Number(item.productId));
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (qty > product.stock) {
      throw new Error(`Not enough stock for ${product.name}`);
    }
    const price = product.price;
    total += price * qty;
    return { productId: product.id, name: product.name, price, quantity: qty };
  });

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

app.post("/api/orders", (req, res) => {
  const { items, customer } = req.body || {};

  let order;
  try {
    order = buildOrder(items, customer);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  store.saveOrder(order);
  res.status(201).json(order);
});

app.get("/api/orders", (req, res) => {
  const orders = store.getOrders().map((o) => ({
    id: o.id,
    customerName: o.customer.name,
    customerEmail: o.customer.email,
    itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    total: o.total,
    status: o.status,
    createdAt: o.createdAt,
  }));
  res.json(orders);
});

app.get("/api/orders/:id", (req, res) => {
  const order = store.getOrders().find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.patch("/api/orders/:id", (req, res) => {
  const { status } = req.body || {};
  const allowed = ["placed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });
  }
  const order = store.updateOrderStatus(req.params.id, status);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
