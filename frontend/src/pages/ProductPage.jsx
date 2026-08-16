import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function ProductPage() {
  const { idOrSlug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getProduct(idOrSlug)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="empty">{error}</div>;
  if (!product) return null;

  const handleAdd = () => {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-detail">
      <img src={product.imageUrl} alt={product.name} />
      <div>
        <p className="muted">{product.category}</p>
        <h1>{product.name}</h1>
        <div className="price">${product.price.toFixed(2)}</div>
        <p>{product.description}</p>
        <p className="stock-note muted">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>
        <button className="btn" onClick={handleAdd} disabled={product.stock === 0}>
          {added ? "Added to cart ✓" : "Add to cart"}
        </button>{" "}
        <Link to="/cart" className="btn btn-secondary">
          View cart
        </Link>
      </div>
    </div>
  );
}
