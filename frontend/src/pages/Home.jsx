import { useEffect, useState } from "react";
import { getCategories, getProducts } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : "";
    getProducts(query)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <>
      <section className="hero">
        <h1>Everyday goods, thoughtfully made</h1>
        <p>Kitchen, home and accessories for a better daily routine.</p>
        <div className="category-filters">
          <button
            className={activeCategory === "" ? "active" : ""}
            onClick={() => setActiveCategory("")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              className={activeCategory === c.slug ? "active" : ""}
              onClick={() => setActiveCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="loading">Loading products…</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : products.length === 0 ? (
        <div className="empty">No products found.</div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
