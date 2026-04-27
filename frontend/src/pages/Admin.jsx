import { useState, useEffect, useContext } from 'react';
import { apiProfile, apiProduct, apiOrder, apiWallet } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingBag, CreditCard, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profiles, setProfiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [merchantProducts, setMerchantProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [statements, setStatements] = useState([]);
  const [directoryFilter, setDirectoryFilter] = useState('');
  const [statementFilter, setStatementFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [orderSearchText, setOrderSearchText] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [newProduct, setNewProduct] = useState({
    productType: '', productName: '', category: '', price: '', description: '', imageUrl: ''
  });
  const [newSpecs, setNewSpecs] = useState([{ key: '', value: '' }]);
  const [newRatings, setNewRatings] = useState([{ userId: '', value: '' }]);
  const [newReviews, setNewReviews] = useState([{ userId: '', text: '' }]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editSpecs, setEditSpecs] = useState([{ key: '', value: '' }]);
  const [editRatings, setEditRatings] = useState([{ userId: '', value: '' }]);
  const [editReviews, setEditReviews] = useState([{ userId: '', text: '' }]);
  const [registerForm, setRegisterForm] = useState({
    fullName: '', emailId: '', password: '', mobileNumber: '',
    gender: 'Male', dateOfBirth: '', role: 'CUSTOMER'
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MERCHANT')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const prodRes = await apiProduct.get('');
      const sortedAll = [...prodRes.data].sort((a, b) => b.productId - a.productId);
      setProducts(sortedAll);

      const ordRes = await apiOrder.get('');

      if (user?.role === 'MERCHANT') {
        // For merchant: fetch only their published products
        const myProdRes = await apiProduct.get(`/merchant/${user.userId}`);
        const sortedMerchant = [...myProdRes.data].sort((a, b) => b.productId - a.productId);
        setMerchantProducts(sortedMerchant);
        const myProductIds = new Set(myProdRes.data.map(p => p.productId));
        // Filter orders where the order's productId is in merchant's product list
        const filteredOrders = ordRes.data.filter(o =>
          o.product && myProductIds.has(o.product.productId)
        );
        setOrders(filteredOrders);
      } else {
        setOrders(ordRes.data);
      }
    } catch (err) {
      console.error(err);
    }

    if (user?.role === 'ADMIN') {
      try {
        const [profRes, walRes, statRes] = await Promise.all([
          apiProfile.get(''),
          apiWallet.get('/all'),
          apiWallet.get('/statements')
        ]);
        setProfiles(profRes.data);
        setWallets(walRes.data);
        setStatements(Array.isArray(statRes.data) ? statRes.data : []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      // Build specification object from rows
      const specification = {};
      newSpecs.forEach(s => { if (s.key.trim()) specification[s.key.trim()] = s.value.trim(); });
      // Build rating object from rows
      const rating = {};
      newRatings.forEach(r => { if (r.userId) rating[parseInt(r.userId)] = parseFloat(r.value) || 0; });
      // Build review object from rows
      const review = {};
      newReviews.forEach(r => { if (r.userId) review[parseInt(r.userId)] = r.text; });

      await apiProduct.post('', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        image: newProduct.imageUrl ? [newProduct.imageUrl] : [],
        specification,
        rating,
        review
      });
      toast.success('Product added!');
      setNewProduct({ productType: '', productName: '', category: '', price: '', description: '', imageUrl: '' });
      setNewSpecs([{ key: '', value: '' }]);
      setNewRatings([{ userId: '', value: '' }]);
      setNewReviews([{ userId: '', text: '' }]);
      fetchData();
    } catch (err) {
      toast.error('Failed to add product');
      console.error(err);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiProduct.delete(`/${id}`);
      fetchData();
      toast.success('Product deleted');
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      const specification = {};
      editSpecs.forEach(s => { if (s.key.trim()) specification[s.key.trim()] = s.value.trim(); });
      const rating = {};
      editRatings.forEach(r => { if (r.userId) rating[parseInt(r.userId)] = parseFloat(r.value) || 0; });
      const review = {};
      editReviews.forEach(r => { if (r.userId) review[parseInt(r.userId)] = r.text; });

      await apiProduct.put(`/${editingProduct.productId}`, {
        productName: editingProduct.productName,
        category: editingProduct.category,
        productType: editingProduct.productType,
        price: parseFloat(editingProduct.price),
        description: editingProduct.description,
        image: editingProduct.imageUrl
          ? [editingProduct.imageUrl]
          : (editingProduct.image || []),
        specification: Object.keys(specification).length > 0 ? specification : (editingProduct.specification || {}),
        rating: Object.keys(rating).length > 0 ? rating : undefined,
        review: Object.keys(review).length > 0 ? review : undefined,
        merchantId: editingProduct.merchantId
      });
      toast.success('Product updated!');
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update product');
      console.error(err);
    }
  };

  const changeOrderStatus = async (orderId, status) => {
    try {
      await apiOrder.put(`/changeStatus?orderId=${orderId}&status=${status}`);
      fetchData();
      toast.success('Order status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const deleteOrderAdmin = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete Order #${orderId}?`)) return;
    try {
      await apiOrder.delete(`/${orderId}`);
      fetchData();
      toast.success('Order deleted successfully');
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  const deleteProfile = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await apiProfile.delete(`/${id}`);
      fetchData();
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const registerUser = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      const endpoint = registerForm.role === 'ADMIN' ? '/addAdmin'
        : registerForm.role === 'MERCHANT' ? '/addMerchant'
          : '/addCustomer';
      const payload = {
        fullName: registerForm.fullName,
        emailId: registerForm.emailId,
        password: registerForm.password,
        mobileNumber: parseInt(registerForm.mobileNumber),
        gender: registerForm.gender,
        dateOfBirth: registerForm.dateOfBirth,
        role: registerForm.role,
        image: '',
        about: '',
        addresses: []
      };
      await apiProfile.post(endpoint, payload);
      toast.success(`${registerForm.role} registered successfully!`);
      setRegisterForm({ fullName: '', emailId: '', password: '', mobileNumber: '', gender: 'Male', dateOfBirth: '', role: 'CUSTOMER' });
      fetchData();
    } catch (err) {
      if (err.response?.data?.errors) {
        // Extract first validation error
        const firstError = Object.values(err.response.data.errors)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(msg);
      } else {
        const errorMsg = err.response?.data?.Message || err.response?.data?.Detailed || err.response?.data?.title || err.response?.data || 'Registration failed.';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Registration failed.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: 'Add Products' },
    { key: 'orders', label: 'All Orders' },
    { key: 'addresses', label: 'All Addresses' },
    ...(user?.role === 'ADMIN' ? [
      { key: 'users', label: 'User Directory' },
      { key: 'wallets', label: 'Wallets' },
      { key: 'statements', label: 'Statements' },
      { key: 'register', label: '➕ Register User' }
    ] : [])
  ];

  const filteredProfiles = profiles.filter(p => {
    // Apply role filter first
    if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;

    // Then apply text search
    if (!directoryFilter) return true;
    const term = directoryFilter.toLowerCase();
    switch (searchCategory) {
      case 'name': return p.fullName?.toLowerCase().includes(term);
      case 'email': return p.emailId?.toLowerCase().includes(term);
      case 'role': return p.role?.toLowerCase().includes(term);
      case 'id': return p.profileId?.toString().includes(term);
      case 'mobile': return p.mobileNumber?.toString().includes(term);
      default:
        return (
          p.fullName?.toLowerCase().includes(term) ||
          p.emailId?.toLowerCase().includes(term) ||
          p.role?.toLowerCase().includes(term) ||
          p.profileId?.toString().includes(term) ||
          p.mobileNumber?.toString().includes(term)
        );
    }
  });

  const getStatusBadgeClass = (status) => {
    switch(status?.toUpperCase()) {
      case 'DELIVERED': return 'badge-success';
      case 'SHIPPED': return 'badge-warning';
      case 'CONFIRMED': return 'badge-secondary';
      case 'CANCELLED': return 'badge-danger';
      case 'PLACED':
      default: return 'badge-primary';
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: activeTab === 'users' ? '1200px' : undefined }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>{user?.role === 'ADMIN' ? '🛡️ Admin Dashboard' : '🏪 Merchant Dashboard'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage your EShoppingZone platform</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                : 'rgba(30, 41, 59, 0.7)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Package size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
            <h1>{products.length}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Products</p>
          </div>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <ShoppingBag size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <h1>{orders.length}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Orders</p>
          </div>
          {user?.role === 'ADMIN' && <>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <Users size={32} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
              <h1>{profiles.length}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Users</p>
            </div>
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <CreditCard size={32} style={{ color: '#ec4899', marginBottom: '0.5rem' }} />
              <h1>{wallets.length}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Wallets</p>
            </div>
          </>}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          {/* Add Product Form */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Product</h3>
            <form onSubmit={addProduct}>
              <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Product Name</label>
                  <input type="text" required value={newProduct.productName}
                    onChange={e => setNewProduct({ ...newProduct, productName: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Category</label>
                  <input type="text" required value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Product Type</label>
                  <input type="text" required value={newProduct.productType}
                    onChange={e => setNewProduct({ ...newProduct, productType: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem' }}>Price (₹)</label>
                  <input type="number" required value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Description</label>
                <input type="text" required value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Image URL (optional)</label>
                <input type="url" placeholder="https://example.com/image.jpg" value={newProduct.imageUrl}
                  onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })} />
                {newProduct.imageUrl && (
                  <img src={newProduct.imageUrl} alt="preview"
                    style={{ marginTop: '0.5rem', height: '80px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(0,0,0,0.1)' }}
                    onError={e => e.target.style.display = 'none'} />
                )}
              </div>

              {/* Specifications */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Specifications (optional)</label>
                  <button type="button" onClick={() => setNewSpecs([...newSpecs, { key: '', value: '' }])}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', cursor: 'pointer' }}>+ Add Row</button>
                </div>
                {newSpecs.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <input type="text" placeholder="Key (e.g. Color)" value={s.key}
                      onChange={e => { const u=[...newSpecs]; u[i].key=e.target.value; setNewSpecs(u); }} style={{ flex: 1 }} />
                    <input type="text" placeholder="Value (e.g. Red)" value={s.value}
                      onChange={e => { const u=[...newSpecs]; u[i].value=e.target.value; setNewSpecs(u); }} style={{ flex: 1 }} />
                    {newSpecs.length > 1 && <button type="button" onClick={() => setNewSpecs(newSpecs.filter((_,j)=>j!==i))}
                      style={{ padding: '0 0.5rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>✕</button>}
                  </div>
                ))}
              </div>

              {/* Ratings */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Ratings (optional)</label>
                  <button type="button" onClick={() => setNewRatings([...newRatings, { userId: '', value: '' }])}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(245,158,11,0.2)', color: '#fcd34d', cursor: 'pointer' }}>+ Add Row</button>
                </div>
                {newRatings.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <input type="number" placeholder="User ID" value={r.userId}
                      onChange={e => { const u=[...newRatings]; u[i].userId=e.target.value; setNewRatings(u); }} style={{ flex: 1 }} />
                    <input type="number" placeholder="Rating (0-5)" min="0" max="5" step="0.1" value={r.value}
                      onChange={e => { const u=[...newRatings]; u[i].value=e.target.value; setNewRatings(u); }} style={{ flex: 1 }} />
                    {newRatings.length > 1 && <button type="button" onClick={() => setNewRatings(newRatings.filter((_,j)=>j!==i))}
                      style={{ padding: '0 0.5rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>✕</button>}
                  </div>
                ))}
              </div>

              {/* Reviews */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label>Reviews (optional)</label>
                  <button type="button" onClick={() => setNewReviews([...newReviews, { userId: '', text: '' }])}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: 'none', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', cursor: 'pointer' }}>+ Add Row</button>
                </div>
                {newReviews.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <input type="number" placeholder="User ID" value={r.userId}
                      onChange={e => { const u=[...newReviews]; u[i].userId=e.target.value; setNewReviews(u); }} style={{ flex: 1 }} />
                    <input type="text" placeholder="Review text" value={r.text}
                      onChange={e => { const u=[...newReviews]; u[i].text=e.target.value; setNewReviews(u); }} style={{ flex: 2 }} />
                    {newReviews.length > 1 && <button type="button" onClick={() => setNewReviews(newReviews.filter((_,j)=>j!==i))}
                      style={{ padding: '0 0.5rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>✕</button>}
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary">Add Product</button>
            </form>
          </div>

          {/* Products List */}
          <div className="grid grid-cols-3">
            {(user?.role === 'MERCHANT' ? merchantProducts : products).map(p => (
              <div key={p.productId} className="glass-card">
                {editingProduct?.productId === p.productId ? (
                  // Inline Edit Form
                  <form onSubmit={updateProduct}>
                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--primary)' }}>Edit Product</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input type="text" placeholder="Product Name" required value={editingProduct.productName}
                        onChange={e => setEditingProduct({ ...editingProduct, productName: e.target.value })} />
                      <input type="text" placeholder="Category" required value={editingProduct.category}
                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} />
                      <input type="text" placeholder="Product Type" required value={editingProduct.productType}
                        onChange={e => setEditingProduct({ ...editingProduct, productType: e.target.value })} />
                      <input type="number" placeholder="Price (₹)" required value={editingProduct.price}
                        onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} />
                      <input type="text" placeholder="Description" value={editingProduct.description}
                        onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                      <input type="url" placeholder="Image URL (optional)" value={editingProduct.imageUrl || (editingProduct.image?.[0] || '')}
                        onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })} />
                      {(editingProduct.imageUrl || editingProduct.image?.[0]) && (
                        <img src={editingProduct.imageUrl || editingProduct.image[0]} alt="preview"
                          style={{ height: '80px', borderRadius: '8px', objectFit: 'contain', background: 'rgba(0,0,0,0.1)', width: '100%' }}
                          onError={e => e.target.style.display = 'none'} />
                      )}

                      {/* Edit Specifications */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <label style={{ fontSize: '0.78rem', color: '#a5b4fc' }}>Specifications</label>
                          <button type="button" onClick={() => setEditSpecs([...editSpecs, { key: '', value: '' }])}
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '5px', border: 'none', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', cursor: 'pointer' }}>+ Add</button>
                        </div>
                        {editSpecs.map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem' }}>
                            <input type="text" placeholder="Key" value={s.key} style={{ flex: 1 }}
                              onChange={e => { const u=[...editSpecs]; u[i].key=e.target.value; setEditSpecs(u); }} />
                            <input type="text" placeholder="Value" value={s.value} style={{ flex: 1 }}
                              onChange={e => { const u=[...editSpecs]; u[i].value=e.target.value; setEditSpecs(u); }} />
                            {editSpecs.length > 1 && <button type="button" onClick={() => setEditSpecs(editSpecs.filter((_,j)=>j!==i))}
                              style={{ padding: '0 0.4rem', border: 'none', borderRadius: '5px', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>✕</button>}
                          </div>
                        ))}
                      </div>

                      {/* Edit Ratings */}
                      <div style={{ marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <label style={{ fontSize: '0.78rem', color: '#fcd34d' }}>Ratings</label>
                          <button type="button" onClick={() => setEditRatings([...editRatings, { userId: '', value: '' }])}
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '5px', border: 'none', background: 'rgba(245,158,11,0.2)', color: '#fcd34d', cursor: 'pointer' }}>+ Add</button>
                        </div>
                        {editRatings.map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem' }}>
                            <input type="number" placeholder="User ID" value={r.userId} style={{ flex: 1 }}
                              onChange={e => { const u=[...editRatings]; u[i].userId=e.target.value; setEditRatings(u); }} />
                            <input type="number" placeholder="Rating (0-5)" min="0" max="5" step="0.1" value={r.value} style={{ flex: 1 }}
                              onChange={e => { const u=[...editRatings]; u[i].value=e.target.value; setEditRatings(u); }} />
                            {editRatings.length > 1 && <button type="button" onClick={() => setEditRatings(editRatings.filter((_,j)=>j!==i))}
                              style={{ padding: '0 0.4rem', border: 'none', borderRadius: '5px', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>✕</button>}
                          </div>
                        ))}
                      </div>

                      {/* Edit Reviews */}
                      <div style={{ marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <label style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>Reviews</label>
                          <button type="button" onClick={() => setEditReviews([...editReviews, { userId: '', text: '' }])}
                            style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '5px', border: 'none', background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', cursor: 'pointer' }}>+ Add</button>
                        </div>
                        {editReviews.map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem' }}>
                            <input type="number" placeholder="User ID" value={r.userId} style={{ flex: 1 }}
                              onChange={e => { const u=[...editReviews]; u[i].userId=e.target.value; setEditReviews(u); }} />
                            <input type="text" placeholder="Review text" value={r.text} style={{ flex: 2 }}
                              onChange={e => { const u=[...editReviews]; u[i].text=e.target.value; setEditReviews(u); }} />
                            {editReviews.length > 1 && <button type="button" onClick={() => setEditReviews(editReviews.filter((_,j)=>j!==i))}
                              style={{ padding: '0 0.4rem', border: 'none', borderRadius: '5px', background: 'rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>✕</button>}
                          </div>
                        ))}
                      </div> {/* end reviews section */}
                    </div> {/* end outer fields wrapper */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
                      <button type="button" onClick={() => setEditingProduct(null)}
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: 'white' }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  // Normal View
                  <>
                    {/* Thumbnail image at top */}
                    {p.image && p.image.length > 0 ? (
                      <img src={p.image[0]} alt={p.productName}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }}
                        onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100px', borderRadius: '8px', marginBottom: '0.75rem',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                      }}>🛍️</div>
                    )}

                    {/* Name + Price row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{p.productName}</h4>
                      <span style={{
                        color: '#f97316', fontWeight: '800', fontSize: '1.1rem',
                        textShadow: '0 0 10px rgba(249,115,22,0.3)', whiteSpace: 'nowrap', marginLeft: '0.5rem'
                      }}>₹{p.price}</span>
                    </div>

                    {/* ID + Category */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>ID #{p.productId}</span>
                      {p.category && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '999px', color: '#a5b4fc' }}>{p.category}</span>}
                      {p.productType && <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '999px', color: '#6ee7b7' }}>{p.productType}</span>}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.75rem', lineHeight: 1.4 }}>
                      {p.description || 'No description.'}
                    </p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button onClick={() => {
                        setEditingProduct({ ...p });
                        // Initialize edit fields from existing product data
                        const specs = p.specification ? Object.entries(p.specification).map(([key, value]) => ({ key, value })) : [];
                        setEditSpecs(specs.length > 0 ? specs : [{ key: '', value: '' }]);
                        setEditRatings([{ userId: '', value: '' }]);
                        setEditReviews([{ userId: '', text: '' }]);
                      }} className="btn-primary" style={{ flex: 1 }}>Edit</button>
                      <button onClick={() => deleteProduct(p.productId)} className="btn-danger" style={{ flex: 1 }}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by Customer ID or Name..."
              value={orderSearchText}
              onChange={e => setOrderSearchText(e.target.value)}
              style={{ minWidth: '300px' }}
            />
          </div>
          <div className="grid grid-cols-2">
            {[...orders]
              .filter(o => {
                if (!orderSearchText) return true;
                const term = orderSearchText.toLowerCase();
                return o.customerId?.toLowerCase().includes(term) || 
                       o.address?.fullName?.toLowerCase().includes(term) ||
                       o.orderId?.toString().includes(term);
              })
              .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
              .map(order => (
              <div key={order.orderId} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4>Order #{order.orderId}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    {user?.role === 'ADMIN' && (
                      <button onClick={() => deleteOrderAdmin(order.orderId)} 
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                        title="Delete Order">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Customer ID: <strong style={{ color: 'var(--primary)' }}>{order.customerId}</strong>
                </p>
                {order.address && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Name: <strong style={{ color: 'white' }}>{order.address.fullName}</strong>
                  </p>
                )}
                {order.product && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Item: <strong style={{ color: 'white' }}>{order.product.productName}</strong>
                  </p>
                )}
                <p>Amount: ₹{order.amountPaid} | {order.modeOfPayment}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(order.orderDate).toLocaleString()}
                </p>
                {order.address && (
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <p>📍 {order.address.flatNumber}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
                    <p>📱 <strong style={{ color: 'white' }}>{order.address.mobileNumber}</strong></p>
                  </div>
                )}
                {user?.role === 'ADMIN' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Update Status:</label>
                    <select 
                      value={order.orderStatus ? order.orderStatus.toUpperCase() : 'PLACED'} 
                      onChange={(e) => changeOrderStatus(order.orderId, e.target.value)}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'white', fontSize: '0.875rem' }}
                    >
                      <option value="PLACED">Placed</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
            {orders.length === 0 && <p>No orders yet.</p>}
          </div>
        </div>
      )}

      {/* All Addresses Tab */}
      {activeTab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by name, city, state, mobile..."
              value={orderSearchText}
              onChange={e => setOrderSearchText(e.target.value)}
              style={{ minWidth: '320px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Order #</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Mobile</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Flat / Street</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>City</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>State</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Pincode</th>
                </tr>
              </thead>
              <tbody>
                {[...orders]
                  .filter(o => {
                    if (!o.address) return false;
                    if (!orderSearchText) return true;
                    const t = orderSearchText.toLowerCase();
                    return (
                      o.address.fullName?.toLowerCase().includes(t) ||
                      o.address.city?.toLowerCase().includes(t) ||
                      o.address.state?.toLowerCase().includes(t) ||
                      o.address.mobileNumber?.toString().includes(t) ||
                      o.address.pincode?.toString().includes(t)
                    );
                  })
                  .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                  .map(order => (
                    <tr key={order.orderId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>#{order.orderId}</td>
                      <td style={{ padding: '0.75rem' }}>{order.address.fullName}</td>
                      <td style={{ padding: '0.75rem' }}>📱 {order.address.mobileNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{order.address.flatNumber}</td>
                      <td style={{ padding: '0.75rem' }}>{order.address.city}</td>
                      <td style={{ padding: '0.75rem' }}>{order.address.state}</td>
                      <td style={{ padding: '0.75rem' }}>{order.address.pincode}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
            {orders.filter(o => o.address).length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No addresses found.</p>
            )}
          </div>
        </div>
      )}

      {/* Users Tab (Admin only) */}
      {activeTab === 'users' && user?.role === 'ADMIN' && (
        <div className="glass-card">
          {/* Role filter chips */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['ALL', 'ADMIN', 'MERCHANT', 'CUSTOMER'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                style={{
                  padding: '0.3rem 0.9rem',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  background: roleFilter === role
                    ? role === 'ADMIN' ? '#f59e0b'
                      : role === 'MERCHANT' ? '#10b981'
                        : role === 'CUSTOMER' ? 'var(--primary)'
                          : 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                    : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                {role} ({role === 'ALL' ? profiles.length : profiles.filter(p => p.role === role).length})
              </button>
            ))}
          </div>

          {/* Search row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              >
                <option value="all">Search All Fields</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="id">ID</option>
                <option value="mobile">Mobile Number</option>
              </select>
              <input
                type="text"
                placeholder={searchCategory === 'all' ? "Search..." : `Search by ${searchCategory}...`}
                value={directoryFilter}
                onChange={e => setDirectoryFilter(e.target.value)}
                style={{ minWidth: '250px' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>ID</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Mobile</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map(p => (
                  <tr key={p.profileId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.profileId}</td>
                    <td style={{ padding: '0.75rem' }}>{p.fullName}</td>
                    <td style={{ padding: '0.75rem' }}>{p.emailId}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${p.role === 'ADMIN' ? 'badge-warning' : p.role === 'MERCHANT' ? 'badge-success' : 'badge-primary'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{p.mobileNumber || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        className="btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => deleteProfile(p.profileId)}
                        disabled={p.profileId === user.userId}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProfiles.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No users found matching your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Wallets Tab (Admin only) */}
      {activeTab === 'wallets' && user?.role === 'ADMIN' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by Wallet ID..."
              value={walletFilter}
              onChange={e => setWalletFilter(e.target.value)}
              style={{ minWidth: '300px' }}
            />
          </div>
          <div className="grid grid-cols-3">
            {wallets
              .filter(w => !walletFilter || w.walletId?.toString() === walletFilter)
              .map(w => (
              <div key={w.walletId} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h4>Wallet #{w.walletId}</h4>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.25rem' }}>₹{w.currentBalance}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  {w.statements?.length || 0} transactions
                </p>
              </div>
            ))}
            {wallets.filter(w => !walletFilter || w.walletId?.toString() === walletFilter).length === 0 && (
              <p>No wallets found.</p>
            )}
          </div>
        </div>
      )}

      {/* Statements Tab (Admin only) */}
      {activeTab === 'statements' && user?.role === 'ADMIN' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Filter by Wallet ID..."
              value={statementFilter}
              onChange={e => setStatementFilter(e.target.value)}
              style={{ minWidth: '300px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>ID</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Wallet ID</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Amount</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {statements
                  .filter(s => !statementFilter || s.walletId?.toString() === statementFilter)
                  .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
                  .map(s => (
                  <tr key={s.statementId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{s.statementId}</td>
                    <td style={{ padding: '0.75rem' }}>{s.walletId}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${['deposit', 'credit'].includes(s.transactionType?.toLowerCase()) ? 'badge-success' : 'badge-warning'}`}>
                        {s.transactionType}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: ['deposit', 'credit'].includes(s.transactionType?.toLowerCase()) ? 'var(--success)' : '#ef4444' }}>
                      {['deposit', 'credit'].includes(s.transactionType?.toLowerCase()) ? '+' : '-'}₹{Math.abs(s.amount)}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{new Date(s.dateTime).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.transactionRemarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {statements.filter(s => !statementFilter || s.walletId?.toString() === statementFilter).length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No statements found.</p>
            )}
          </div>
        </div>
      )}

      {/* Register User Tab (Admin only) */}
      {activeTab === 'register' && user?.role === 'ADMIN' && (
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '0.5rem' }}>Register New User</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Create accounts for Customers, Merchants, or Admins.</p>
            <form onSubmit={registerUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Role selector dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Register As</label>
                <select
                  value={registerForm.role}
                  onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}
                  style={{
                    width: '100%', padding: '0.6rem 1rem', borderRadius: '8px',
                    border: `2px solid ${registerForm.role === 'ADMIN' ? '#f59e0b' : registerForm.role === 'MERCHANT' ? '#10b981' : 'var(--primary)'}`,
                    background: 'rgba(0,0,0,0.3)', color: 'white', fontWeight: '600', fontSize: '0.95rem'
                  }}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MERCHANT">Merchant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</label>
                  <input type="text" required value={registerForm.fullName}
                    onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Mobile Number</label>
                  <input type="number" required value={registerForm.mobileNumber}
                    onChange={e => setRegisterForm({ ...registerForm, mobileNumber: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</label>
                  <input type="email" required value={registerForm.emailId}
                    onChange={e => setRegisterForm({ ...registerForm, emailId: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showRegPw ? 'text' : 'password'} required value={registerForm.password}
                      onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      style={{ paddingRight: '2.5rem' }} />
                    <button type="button" onClick={() => setShowRegPw(!showRegPw)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      {showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gender</label>
                  <select value={registerForm.gender} onChange={e => setRegisterForm({ ...registerForm, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Date of Birth</label>
                  <input type="date" required value={registerForm.dateOfBirth}
                    onChange={e => setRegisterForm({ ...registerForm, dateOfBirth: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={registerLoading}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {registerLoading ? 'Registering...' : `Register as ${registerForm.role}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
