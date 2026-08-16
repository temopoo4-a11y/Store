import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api.js";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="empty">{error}</div>;

  return (
    <div className="confirmation">
      <div className="check">✓</div>
      <h1>Thanks, {order.customer.name.split(" ")[0]}!</h1>
      <p className="muted">
        Your order is confirmed. We&apos;ll send a receipt to{" "}
        <strong>{order.customer.email}</strong>.
      </p>
      <p className="muted">Order ID: {order.id}</p>

      <table className="cart-table" style={{ textAlign: "left", marginTop: 24 }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.productId}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="summary" style={{ margin: "24px auto 0" }}>
        <div className="summary-row total">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/" className="btn" style={{ marginTop: 24 }}>
        Continue shopping
      </Link>
    </div>
  );
}
