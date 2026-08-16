async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const getProducts = (params = "") => request(`/products${params}`);
export const getProduct = (idOrSlug) => request(`/products/${idOrSlug}`);
export const getCategories = () => request(`/categories`);
export const placeOrder = (payload) =>
  request(`/orders`, { method: "POST", body: JSON.stringify(payload) });
export const getOrder = (id) => request(`/orders/${id}`);
