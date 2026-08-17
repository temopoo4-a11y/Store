import type {
  Category,
  Order,
  OrderStatus,
  OrderSummary,
  Product,
  ProductInput,
} from "../types";

interface ApiError {
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export interface PlaceOrderPayload {
  items: { productId: number; quantity: number }[];
  customer: { name: string; email: string; address: string };
}

export const getProducts = (params = "") =>
  request<Product[]>(`/products${params}`);
export const getProduct = (idOrSlug: string | number) =>
  request<Product>(`/products/${idOrSlug}`);
export const getCategories = () => request<Category[]>(`/categories`);
export const getOrders = () => request<OrderSummary[]>(`/orders`);
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const createProduct = (data: ProductInput) =>
  request<Product>("/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: number, data: Partial<ProductInput>) =>
  request<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteProduct = (id: number) =>
  request<void>(`/products/${id}`, { method: "DELETE" });
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request<Order>(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
export const placeOrder = (payload: PlaceOrderPayload) =>
  request<Order>("/orders", { method: "POST", body: JSON.stringify(payload) });
