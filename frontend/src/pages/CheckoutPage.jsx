import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const order = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer: form,
      });
      clear();
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Jane Doe"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="jane@example.com"
            />
          </label>
          <label className="full">
            Shipping address
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              placeholder="123 Main St, Springfield"
            />
          </label>
        </div>

        <div className="summary">
          <div className="summary-row total">
            <span>Total ({items.length} {items.length === 1 ? "item" : "items"})</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button type="submit" className="btn btn-block" disabled={submitting}>
            {submitting ? "Placing order…" : "Place order"}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </form>
    </div>
  );
}
