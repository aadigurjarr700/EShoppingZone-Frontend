import { useState } from 'react';
import { apiProfile } from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    emailId: '',
    mobileNumber: '',
    password: '',
    role: 'CUSTOMER',
    gender: 'Other',
    dateOfBirth: '2000-01-01',
    image: '',
    about: 'I am a new user',
    addresses: []
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = formData.role === 'MERCHANT' ? '/addMerchant' : '/addCustomer';
      
      // Convert mobile string to number for backend
      const payload = {
        ...formData,
        mobileNumber: parseInt(formData.mobileNumber)
      };

      await apiProfile.post(endpoint, payload);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        const errorMsg = err.response?.data?.Message || err.response?.data?.Detailed || err.response?.data?.title || err.response?.data || 'Registration failed';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h2>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid grid-cols-2">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mobile Number</label>
              <input type="number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="grid grid-cols-2">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
              <input type="email" name="emailId" value={formData.emailId} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  style={{ paddingRight: '2.5rem' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Account Type</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="CUSTOMER">Customer</option>
              <option value="MERCHANT">Merchant</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
