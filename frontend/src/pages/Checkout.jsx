import { useState, useContext } from 'react';
import { apiOrder, apiCart } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState({
    fullName: '', mobileNumber: '', flatNumber: '', city: '', pincode: '', state: ''
  });
  const [modeOfPayment, setModeOfPayment] = useState('WALLET');
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      apiCart.get(`/${user.userId}`).then(res => setCart(res.data)).catch(console.error);
    }
  }, [user]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!cart) {
      toast.info("Loading cart...");
      return;
    }
    
    try {
      const payload = {
        cart: cart,
        address: { ...address, customerId: user.userId }
      };
      
      const endpoint = modeOfPayment === 'WALLET' ? '/onlinePayment' : '/placeOrder';
      
      await apiOrder.post(endpoint, payload);
      
      // Clear cart after successful checkout
      await apiCart.delete('');
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success(modeOfPayment === 'WALLET' ? "Order placed via E-Wallet!" : "Order placed via Cash on Delivery!");
      navigate('/orders');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.Message || err.response?.data || "Checkout failed!";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Checkout failed!");
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '600px' }}>
      <div className="glass-card">
        <h2>Checkout</h2>
        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="grid grid-cols-2">
            <div>
              <label>Full Name</label>
              <input type="text" required onChange={e => setAddress({...address, fullName: e.target.value})} />
            </div>
            <div>
              <label>Mobile Number</label>
              <input type="text" required onChange={e => setAddress({...address, mobileNumber: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label>Flat Number / Address Line 1</label>
            <input type="text" required onChange={e => setAddress({...address, flatNumber: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-3">
            <div>
              <label>City</label>
              <input type="text" required onChange={e => setAddress({...address, city: e.target.value})} />
            </div>
            <div>
              <label>State</label>
              <input type="text" required onChange={e => setAddress({...address, state: e.target.value})} />
            </div>
            <div>
              <label>Pincode</label>
              <input type="text" required onChange={e => setAddress({...address, pincode: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Payment Method</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setModeOfPayment('WALLET')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '8px',
                  border: modeOfPayment === 'WALLET' ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.1)',
                  background: modeOfPayment === 'WALLET' ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: modeOfPayment === 'WALLET' ? 'var(--primary)' : 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                E-Wallet
              </button>
              <button
                type="button"
                onClick={() => setModeOfPayment('COD')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '8px',
                  border: modeOfPayment === 'COD' ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.1)',
                  background: modeOfPayment === 'COD' ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: modeOfPayment === 'COD' ? 'var(--primary)' : 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                Cash on Delivery
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>Place Order</button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
