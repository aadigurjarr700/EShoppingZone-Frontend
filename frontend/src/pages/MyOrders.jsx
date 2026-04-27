import { useState, useEffect, useContext } from 'react';
import { apiOrder, apiProduct } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN' || user.role === 'MERCHANT') {
        fetchAllOrders();
      }
      fetchMyOrders();
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await apiProduct.get('');
      setProducts(response.data);
    } catch (err) {
      console.error("Failed to fetch products for images", err);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const response = await apiOrder.get('/customer');
      setMyOrders(response.data || []);
    } catch (err) {
      console.error(err);
      setMyOrders([]);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await apiOrder.get('');
      setAllOrders(response.data || []);
    } catch (err) {
      console.error(err);
      setAllOrders([]);
    }
  };

  const fetchAllAddresses = async () => {
    try {
      const response = await apiOrder.get('/allAddress');
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setAddresses([]);
    }
  };

  const changeStatus = async (orderId, status) => {
    try {
      await apiOrder.put(`/changeStatus?orderId=${orderId}&status=${status}`);
      if (user.role === 'ADMIN' || user.role === 'MERCHANT') fetchAllOrders();
      else fetchMyOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) return;
    try {
      await apiOrder.put(`/changeStatus?orderId=${orderId}&status=CANCELLED`);
      fetchMyOrders();
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel order');
    }
  };

  const deletePersonalOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order #${orderId}?`)) return;
    try {
      await apiOrder.delete(`/${orderId}`);
      fetchMyOrders();
      toast.success('Order deleted successfully');
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  const filteredAllOrders = user?.role === 'MERCHANT' && Array.isArray(products)
    ? allOrders.filter(order => {
        if (!order?.product?.productId) return false;
        const product = products.find(p => p.productId === order.product.productId);
        return String(product?.merchantId) === String(user.userId);
      })
    : allOrders;

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

  const currentOrders = Array.isArray(myOrders) ? myOrders : [];

  return (
    <div className="container animate-fade-in">
      <h2 style={{ marginBottom: '2rem' }}>
        My Orders
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[...currentOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).map(order => (
            <div key={order.orderId} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>Order #{order.orderId}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
                    <button onClick={() => cancelOrder(order.orderId)} 
                      className="btn-primary"
                      style={{ background: '#ef4444', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} 
                      title="Cancel Order">
                      Cancel Order
                    </button>
                  )}
                  <button onClick={() => deletePersonalOrder(order.orderId)} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                    title="Delete Order Permanently">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>
                <p>📅 {new Date(order.orderDate).toLocaleString()}</p>
                <p>💰 ₹{order.amountPaid}</p>
                <p>💳 {order.modeOfPayment}</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {order.product ? (
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
                      {Array.isArray(products) && products.find(p => p.productId === order.product.productId)?.image && Object.values(products.find(p => p.productId === order.product.productId).image)[0] ? (
                        <img 
                          src={Object.values(products.find(p => p.productId === order.product.productId).image)[0]} 
                          alt="Product" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='📦'; }} 
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.2rem' }}>{order.product.productName}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Qty: {order.quantity}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Item Details Unavailable</p>
                  </div>
                )}

                {order.address && (
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'white' }}>
                      <span style={{ fontSize: '1.1rem' }}>📍</span>
                      <strong>Delivery Address</strong>
                    </div>
                    <p style={{ marginLeft: '1.6rem', marginBottom: '0.2rem' }}><strong>{order.address.fullName}</strong> ({order.address.mobileNumber})</p>
                    <p style={{ marginLeft: '1.6rem', marginBottom: '0.2rem' }}>{order.address.flatNumber}, {order.address.city}</p>
                    <p style={{ marginLeft: '1.6rem' }}>{order.address.state} - {order.address.pincode}</p>
                  </div>
                )}
              </div>

              {user?.role === 'ADMIN' && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={() => changeStatus(order.orderId, 'SHIPPED')} className="btn-primary" style={{ padding: '0.5rem' }}>Ship</button>
                  <button onClick={() => changeStatus(order.orderId, 'DELIVERED')} className="btn-primary" style={{ padding: '0.5rem', background: 'var(--success)' }}>Deliver</button>
                </div>
              )}
            </div>
          ))}
          {currentOrders.length === 0 && <p>No orders found.</p>}
        </div>
    </div>
  );
};

export default MyOrders;
