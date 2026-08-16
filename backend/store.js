const supabase = require("./db");

async function getProducts() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select("*");
  if (error) throw new Error(error.message);
  return data || [];
}

async function getProductById(id) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

async function getProductBySlug(slug) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

async function getCategories() {
  const products = await getProducts();
  const seen = new Map();
  for (const p of products) {
    if (!seen.has(p.category)) {
      seen.set(p.category, { name: p.category, slug: p.category });
    }
  }
  return [...seen.values()];
}

async function getOrders() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function saveOrder(order) {
  if (!supabase) throw new Error("Database not configured");
  const { error } = await supabase.from("orders").insert(order);
  if (error) throw new Error(error.message);
  return order;
}

async function nextProductId() {
  if (!supabase) return 1;
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return (data && data.length ? Number(data[0].id) : 0) + 1;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createProduct(data) {
  if (!supabase) throw new Error("Database not configured");
  const product = {
    id: await nextProductId(),
    name: data.name,
    slug: slugify(data.slug || data.name),
    description: data.description || "",
    price: Math.round(Number(data.price) * 100) / 100,
    imageUrl: data.imageUrl || "",
    category: data.category || "general",
    stock: Math.max(0, Math.floor(Number(data.stock) || 0)),
    createdAt: new Date().toISOString(),
  };
  const { data: inserted, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return inserted;
}

async function updateProduct(id, data) {
  if (!supabase) throw new Error("Database not configured");
  const existing = await getProductById(id);
  if (!existing) return null;
  const updated = {
    name: data.name !== undefined ? data.name : existing.name,
    slug:
      data.slug !== undefined
        ? slugify(data.slug)
        : data.name !== undefined
          ? slugify(data.name)
          : existing.slug,
    description:
      data.description !== undefined ? data.description : existing.description,
    price:
      data.price !== undefined
        ? Math.round(Number(data.price) * 100) / 100
        : existing.price,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
    category: data.category !== undefined ? data.category : existing.category,
    stock:
      data.stock !== undefined
        ? Math.max(0, Math.floor(Number(data.stock) || 0))
        : existing.stock,
  };
  const { data: updatedRow, error } = await supabase
    .from("products")
    .update(updated)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return updatedRow;
}

async function deleteProduct(id) {
  if (!supabase) throw new Error("Database not configured");
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  return data && data.length > 0;
}

async function updateOrderStatus(id, status) {
  if (!supabase) throw new Error("Database not configured");
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data;
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
