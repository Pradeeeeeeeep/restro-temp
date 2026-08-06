import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('Brew & Bites');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/customer/settings')
      .then(({ data }) => {
        if (data.settings?.cafeName) setStoreName(data.settings.cafeName);
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Enter username and password');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { username, password });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_role', data.role || 'super_admin');
      localStorage.setItem('admin_permissions', data.permissions || 'all');
      localStorage.setItem('admin_username', data.username || '');
      toast.success(`Welcome back, ${data.name || data.username || 'Admin'}! 👋`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: -80, left: '50%', transform: 'translateX(-50%)', width: 500, height: 250, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(232,144,31,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Card */}
        <div style={{ background: 'var(--color-card)', borderRadius: 24, padding: '36px 32px', border: '1px solid var(--color-border)', boxShadow: '0 8px 32px var(--card-shadow)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 62, height: 62, borderRadius: 18, margin: '0 auto 14px', background: 'linear-gradient(135deg, #e8901f, #c2700f)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(194,112,15,0.25)' }}>
              <Coffee size={30} color="#fff" />
            </div>
            <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Admin Panel</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{storeName} Management</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} />
                <input className="input-field" style={{ paddingLeft: 38 }} type="text" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} />
                <input className="input-field" style={{ paddingLeft: 38 }} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Logging in…</>
                : 'Login to Dashboard'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--color-muted)', fontSize: 12 }}>
            Default credentials: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
