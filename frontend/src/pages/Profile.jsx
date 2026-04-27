import { useState, useEffect, useContext } from 'react';
import { apiProfile } from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('view');
  const [loading, setLoading] = useState(false);



  // Update profile form state
  const [updateForm, setUpdateForm] = useState({
    fullName: '', emailId: '', mobileNumber: '', about: '', gender: '', dateOfBirth: '', image: ''
  });

  // Change password form state
  const [pwForm, setPwForm] = useState({
    emailId: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    if (user?.userId) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await apiProfile.get(`/${user.userId}`);
      setProfile(res.data);
      setUpdateForm({
        fullName: res.data.fullName || '',
        emailId: res.data.emailId || '',
        mobileNumber: res.data.mobileNumber || '',
        about: res.data.about || '',
        gender: res.data.gender || '',
        dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
        image: res.data.image || ''
      });
      setPwForm(f => ({ ...f, emailId: res.data.emailId || '' }));


    } catch (err) {
      console.error(err);
    }
  };



  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiProfile.put(`/${user.userId}`, {
        ...updateForm,
        mobileNumber: parseInt(updateForm.mobileNumber) || 0,
        password: '',
        role: profile?.role || 'CUSTOMER',
        addresses: profile?.addresses || []
      });
      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      const errorMsg = err.response?.data?.Message || err.response?.data?.Detailed || err.response?.data?.title || err.response?.data || 'Failed to update profile.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      await apiProfile.post('/changePassword', {
        emailId: pwForm.emailId,
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword
      });
      toast.success('Password changed successfully!');
      setPwForm(f => ({ ...f, oldPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      const errorMsg = err.response?.data?.Message || err.response?.data?.Detailed || err.response?.data?.title || err.response?.data || 'Failed to change password.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <p>Loading profile...</p>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '700px' }}>
      {/* Profile Header */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0
        }}>
          {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <h2>{profile.fullName}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{profile.emailId}</p>
          <span className={`badge ${profile.role === 'ADMIN' ? 'badge-warning' : profile.role === 'MERCHANT' ? 'badge-success' : 'badge-primary'}`}
            style={{ marginTop: '0.5rem', display: 'inline-block' }}>
            {profile.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { key: 'view', label: '👤 My Info' },
          { key: 'edit', label: '✏️ Update Profile' },
          { key: 'password', label: '🔒 Change Password' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: '600',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))'
                : 'rgba(30, 41, 59, 0.7)',
              color: 'white', transition: 'all 0.3s ease'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Info Tab */}
      {activeTab === 'view' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Personal Information</h3>
          <div className="grid grid-cols-2">
            {[
              { label: 'Full Name', value: profile.fullName },
              { label: 'Email', value: profile.emailId },
              { label: 'Mobile', value: profile.mobileNumber },
              { label: 'Gender', value: profile.gender },
              { label: 'Date of Birth', value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A' },
              { label: 'Profile ID', value: profile.profileId },
            ].map(item => (
              <div key={item.label} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{item.label}</p>
                <p style={{ fontWeight: '600' }}>{item.value || 'N/A'}</p>
              </div>
            ))}
          </div>
          {profile.about && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>About</p>
              <p>{profile.about}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Tab */}
      {activeTab === 'edit' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Update Profile</h3>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid grid-cols-2">
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full Name</label>
                <input type="text" value={updateForm.fullName}
                  onChange={e => setUpdateForm({ ...updateForm, fullName: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Mobile Number</label>
                <input type="number" value={updateForm.mobileNumber}
                  onChange={e => setUpdateForm({ ...updateForm, mobileNumber: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Gender</label>
                <select value={updateForm.gender} onChange={e => setUpdateForm({ ...updateForm, gender: e.target.value })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Date of Birth</label>
                <input type="date" value={updateForm.dateOfBirth}
                  onChange={e => setUpdateForm({ ...updateForm, dateOfBirth: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>About</label>
              <input type="text" value={updateForm.about}
                onChange={e => setUpdateForm({ ...updateForm, about: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showOldPw ? "text" : "password"} value={pwForm.oldPassword} required
                  onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })} 
                  style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowOldPw(!showOldPw)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showOldPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNewPw ? "text" : "password"} value={pwForm.newPassword} required
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} 
                  style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPw ? "text" : "password"} value={pwForm.confirmPassword} required
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} 
                  style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Lock size={18} /> {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default Profile;
