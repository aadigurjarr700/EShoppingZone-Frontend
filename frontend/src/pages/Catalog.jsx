import { useState, useEffect, useContext } from 'react';
import { apiProduct, apiCart } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { ShoppingCart, Star, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [products, searchQuery, searchCategory]);

  const fetchProducts = async () => {
    try {
      const response = await apiProduct.get('');
      // Sort newest first (highest ID first)
      const sorted = [...response.data].sort((a, b) => b.productId - a.productId);
      setProducts(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilter = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }
    const term = searchQuery.toLowerCase();
    const result = products.filter(p => {
      switch (searchCategory) {
        case 'id': return p.productId?.toString().includes(term);
        case 'name': return p.productName?.toLowerCase().includes(term);
        case 'type': return p.productType?.toLowerCase().includes(term);
        case 'category': return p.category?.toLowerCase().includes(term);
        default: return (
          p.productName?.toLowerCase().includes(term) ||
          p.productType?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          p.productId?.toString().includes(term)
        );
      }
    });
    setFilteredProducts(result);
  };

  const addToCart = async (productId) => {
    if (!user) {
      toast.info("Please login first");
      return;
    }
    try {
      await apiCart.post(`?productId=${productId}&quantity=1`);
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success("Added to cart!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  const displayProducts = searchQuery.trim() ? filteredProducts : products;

  return (
    <div className="container animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Products</h2>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={searchCategory}
            onChange={e => setSearchCategory(e.target.value)}
            style={{
              padding: '0.6rem 1rem', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)', color: 'white',
              fontWeight: '600', fontSize: '0.9rem', minWidth: '160px'
            }}
          >
            <option value="all">Search All</option>
            <option value="name">Product Name</option>
            <option value="category">Category</option>
            <option value="type">Product Type</option>
            <option value="id">Product ID</option>
          </select>

          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                searchCategory === 'all' ? 'Search products...' :
                  searchCategory === 'id' ? 'Enter product ID...' :
                    `Search by ${searchCategory}...`
              }
              style={{ paddingLeft: '2.25rem', width: '100%' }}
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                padding: '0.6rem 1rem', borderRadius: '8px', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}

          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {displayProducts.map(product => {
          const ratingObj = product.rating || {};
          const ratingValues = Object.values(ratingObj);
          const avgRating = ratingValues.length > 0
            ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
            : 0;

          return (
            <div key={product.productId} style={{
              background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.25)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
              }}
            >
              {/* Image */}
              {product.image && product.image.length > 0 ? (
                <img
                  src={product.image[0]}
                  alt={product.productName}
                  style={{ width: '100%', height: '190px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  height: '190px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'
                }}>🛍️</div>
              )}

              {/* Body */}
              <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>

                {/* ID + Rating row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>ID #{product.productId}</span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: '20px', padding: '0.18rem 0.5rem'
                  }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#f59e0b' }}>
                      {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>({ratingValues.length})</span>
                  </div>
                </div>

                {/* Product name */}
                <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: '700', lineHeight: 1.3 }}>
                  {product.productName}
                </h3>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {product.category && (
                    <span style={{
                      fontSize: '0.7rem', padding: '0.15rem 0.55rem',
                      background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                      borderRadius: '999px', color: '#a5b4fc'
                    }}>{product.category}</span>
                  )}
                  {product.productType && (
                    <span style={{
                      fontSize: '0.7rem', padding: '0.15rem 0.55rem',
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '999px', color: '#6ee7b7'
                    }}>{product.productType}</span>
                  )}
                </div>

                {/* Description */}
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', lineHeight: 1.5, margin: '0 0 0.6rem' }}>
                  {product.description || 'No description available.'}
                </p>

                {/* Toggle Details Button */}
                <button
                  type="button"
                  onClick={() => setExpandedCard(expandedCard === product.productId ? null : product.productId)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '0.3rem 0.75rem',
                    fontSize: '0.78rem', cursor: 'pointer', marginBottom: '0.6rem', width: '100%',
                    transition: 'all 0.2s'
                  }}
                >
                  {expandedCard === product.productId ? '▲ Hide Details' : '▼ Show Specs, Ratings & Reviews'}
                </button>

                {/* Expandable Details */}
                {expandedCard === product.productId && (
                  <div style={{ marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                    {/* Specifications */}
                    {product.specification && Object.keys(product.specification).length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#a5b4fc', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Specifications</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {Object.entries(product.specification).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{k}</span>
                              <span style={{ color: 'white', fontWeight: '600' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ratings breakdown */}
                    {ratingValues.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#fcd34d', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ Ratings</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {Object.entries(product.rating).map(([userId, val]) => (
                            <div key={userId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <span style={{ color: 'rgba(255,255,255,0.45)' }}>User #{userId}</span>
                              <span style={{ color: '#f59e0b', fontWeight: '700' }}>{'★'.repeat(Math.round(val))} {Number(val).toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {product.review && Object.keys(product.review).length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6ee7b7', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💬 Reviews</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {Object.entries(product.review).map(([userId, text]) => (
                            <div key={userId} style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', borderLeft: '2px solid rgba(16,185,129,0.4)' }}>
                              <div style={{ color: '#6ee7b7', fontSize: '0.68rem', marginBottom: '0.1rem' }}>User #{userId}</div>
                              <div style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No extra details */}
                    {(!product.specification || Object.keys(product.specification).length === 0) &&
                      ratingValues.length === 0 &&
                      (!product.review || Object.keys(product.review).length === 0) && (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center' }}>No additional details available.</p>
                    )}
                  </div>
                )}

                {/* Price + Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.1rem' }}>Price</div>
                    <span style={{
                      fontSize: '1.5rem', fontWeight: '900',
                      color: '#f97316',
                      textShadow: '0 0 18px rgba(249,115,22,0.4)'
                    }}>₹{product.price}</span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', whiteSpace: 'nowrap' }}
                    onClick={() => addToCart(product.productId)}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {displayProducts.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
            No products found matching your search.
          </p>
        )}
      </div>
    </div>
  );
};

export default Catalog;
