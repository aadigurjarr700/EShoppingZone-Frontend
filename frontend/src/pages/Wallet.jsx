import { useState, useEffect, useContext } from 'react';
import { apiWallet } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [rechargedAmount, setRechargedAmount] = useState(0);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) fetchWallet();
  }, [user]);

  const fetchWallet = async () => {
    try {
      const response = await apiWallet.get(`/${user.userId}`);
      if (response.data && response.status !== 204) {
        setWallet(response.data);
      } else {
        // If response is 204 No Content or data is empty, wallet doesn't exist
        await createNewWallet();
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Create new wallet if it doesn't exist (older backend behavior)
        await createNewWallet();
      } else {
        console.error(err);
      }
    }
  };

  const createNewWallet = async () => {
    try {
      const createResp = await apiWallet.post('/addNew');
      setWallet(createResp.data);
    } catch (createErr) {
      console.error(createErr);
      toast.error("Failed to initialize wallet.");
    }
  };

  const addMoney = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) return;
    try {
      // 1. Create Razorpay order on backend
      const orderRes = await apiWallet.post('/createRechargeOrder', { amount: parseFloat(amount) });
      const { razorpayOrderId } = orderRes.data;

      // 2. Initialize Razorpay options
      const options = {
        key: "rzp_test_SgWmRI0CNwT0Qw", // Real test key matching backend
        amount: parseFloat(amount) * 100, // paise
        currency: "INR",
        name: "EShoppingZone Wallet",
        description: "Wallet Recharge",
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            await apiWallet.post(`/verifyRecharge?amount=${amount}`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            
            setAmount('');
            setRechargedAmount(amount);
            setRechargeSuccess(true);
            fetchWallet();
            toast.success(`₹${amount} added to your wallet successfully!`);
            setTimeout(() => setRechargeSuccess(false), 5000);
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "customer@example.com"
        },
        theme: { color: "#6366f1" }
      };

      // 4. Open Razorpay Checkout window
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error("Payment Failed: " + response.error.description);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate recharge.");
    }
  };

  if (!wallet) return <div className="container">Loading Wallet...</div>;

  let runningBalance = wallet.currentBalance || 0;
  const enrichedStatements = wallet.statements ? 
    [...wallet.statements]
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .map(stmt => {
        const balanceAfter = runningBalance;
        const balanceBefore = stmt.transactionType === 'CREDIT' 
          ? runningBalance - stmt.amount 
          : runningBalance + stmt.amount;
        runningBalance = balanceBefore;
        return { ...stmt, balanceBefore, balanceAfter };
      }) : [];

  return (
    <div className="container animate-fade-in">
      {rechargeSuccess && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '12px',
          padding: '1.25rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
          animation: 'slideDown 0.4s ease'
        }}>
          <span style={{ fontSize: '2rem' }}>✅</span>
          <div>
            <h3 style={{ margin: 0, color: 'white' }}>Payment Successful!</h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>₹{rechargedAmount} has been added to your wallet.</p>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Balance & Add Money */}
        <div>
          <div className="glass-card" style={{ textAlign: 'center', position: 'sticky', top: '2rem' }}>
            <h2>E-Wallet Balance</h2>
            <h1 style={{ color: 'var(--success)', fontSize: '3rem', margin: '1rem 0' }}>₹{wallet.currentBalance}</h1>
            
            <form onSubmit={addMoney} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
              <input 
                type="number" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="Amount to add"
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.8rem', fontSize: '1.1rem' }}>Add Money</button>
            </form>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Transaction History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrichedStatements.length > 0 ? (
              enrichedStatements.map((stmt, idx) => (
                <div key={idx} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
                  <div>
                    <h4 style={{ color: stmt.transactionType === 'CREDIT' ? 'var(--success)' : 'var(--danger)', marginBottom: '0.25rem' }}>
                      {stmt.transactionType === 'CREDIT' ? 'Credited to Wallet' : 'Debited from Wallet'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      {new Date(stmt.dateTime).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    {stmt.transactionRemarks && (
                      <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#e2e8f0' }}>{stmt.transactionRemarks}</p>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stmt.transactionType === 'CREDIT' ? 'var(--success)' : 'white' }}>
                      {stmt.transactionType === 'CREDIT' ? '+' : '-'}₹{Math.abs(stmt.amount)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                      Bal Before: ₹{stmt.balanceBefore} <br />
                      Bal After: ₹{stmt.balanceAfter}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>No transactions yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Wallet;
