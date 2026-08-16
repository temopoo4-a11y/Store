import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <img src={product.imageUrl} alt={product.name} loading="lazy" />
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <span className="price">${product.price.toFixed(2)}</span>
      </div>
    </Link>
  );
}
