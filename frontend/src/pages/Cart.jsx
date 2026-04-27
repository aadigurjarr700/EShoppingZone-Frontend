import { useState, useEffect, useContext } from 'react';
import { apiCart } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      // CartService endpoint: GET /api/carts/{id}
      const response = await apiCart.get(`/${user.userId}`);
      setCart(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        if (!window.confirm("Remove this item from your cart?")) return;
      }
      await apiCart.put(`?productId=${productId}&quantity=${quantity}`);
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;
    try {
      await apiCart.delete('');
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error(err);
    }
  };

  if (!cart) return <div className="container">Loading...</div>;

  return (
    <div className="container animate-fade-in">
      <h2>Your Cart</h2>
      
      {cart.items && cart.items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          {/* Left Column: Items & Clear Cart */}
          <div>
            {cart.items.map(item => (
              <div key={item.cartItemId} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4>{item.productName}</h4>
                  <p style={{ color: 'var(--primary)' }}>₹{item.price}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="btn-primary" style={{ padding: '0.25rem 0.75rem' }}>-</button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="btn-primary" style={{ padding: '0.25rem 0.75rem' }}>+</button>
                  <button onClick={() => updateQuantity(item.productId, 0)} style={{ marginLeft: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove item">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
              <button 
                onClick={clearCart} 
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                <Trash2 size={14} /> Clear Cart
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div>
            <div className="glass-card" style={{ position: 'sticky', top: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Order Summary</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                <span>Items ({cart.items.reduce((sum, i) => sum + i.quantity, 0)}):</span>
                <span>₹{cart.totalPrice}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--primary)' }}>₹{cart.totalPrice}</span>
              </div>

              <button 
                className="btn-primary" 
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Your cart is empty.</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
