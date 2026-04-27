import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiCart } from '../api/axiosConfig';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard, Wallet } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCartCount();
      const handleCartUpdate = () => fetchCartCount();
      window.addEventListener('cartUpdated', handleCartUpdate);
      return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    } else {
      setCartCount(0);
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const res = await apiCart.get(`/${user.userId}`);
      if (res.data && res.data.items) {
        const total = res.data.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      setCartCount(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="nav-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🛍️</span>
          <h2 className="brand-font" style={{ color: 'var(--primary)' }}>EShoppingZone</h2>
        </Link>

        {/* Admin / Merchant Dashboard shifted to left and colored red */}
        {user && (user.role === 'ADMIN' || user.role === 'MERCHANT') && (
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 'bold' }}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        )}
      </div>

      <div className="nav-links" style={{ alignItems: 'center' }}>
        <Link to="/" className={`nav-link ${isActive('/')}`}>Products</Link>

        {user ? (
          <>

            {/* Cart - for all users */}
            {user && (
              <Link to="/cart" className={`nav-link ${isActive('/cart')}`}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                <ShoppingCart size={16} /> 
                Cart
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-20px',
                    background: 'var(--danger)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Orders - visible to all logged-in users */}
            <Link to="/orders" className={`nav-link ${isActive('/orders')}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Package size={16} /> My Orders
            </Link>

            {/* Wallet - visible to all logged-in users */}
            <Link to="/wallet" className={`nav-link ${isActive('/wallet')}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wallet size={16} /> Wallet
            </Link>

            {/* Profile link */}
            <Link to="/profile" className={`nav-link ${isActive('/profile')}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={16} /> Profile
            </Link>

            {/* Role badge */}
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-warning' : user.role === 'MERCHANT' ? 'badge-success' : 'badge-primary'}`}>
              {user.role}
            </span>

            <button onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '8px',
                cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Login</Link>
            <Link to="/register" style={{
              padding: '0.5rem 1.25rem', borderRadius: '8px',
              border: '1px solid var(--primary)', color: 'var(--primary)',
              textDecoration: 'none', fontWeight: '600', transition: 'all 0.3s ease'
            }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
