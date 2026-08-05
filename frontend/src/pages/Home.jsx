import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, User, Phone, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCustomerStore from '../store/useCustomerStore';

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setCustomer = useCustomerStore((s) => s.setCustomer);
  const existingCustomer = useCustomerStore((s) => s.customer);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    if (!/^[6-9]\d{9}$/.test(phone.trim())) return toast.error('Enter a valid 10-digit mobile number');

    setLoading(true);
    try {
      const { data } = await api.post('/customer', { name: name.trim(), phone: phone.trim() });
      setCustomer(data.customer);
      toast.success(`Welcome, ${data.customer.name}! ☕`);
      navigate('/menu');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => navigate('/menu');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px', position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '24px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 48px rgba(245,158,11,0.3)'
          }}>
            <Coffee size={40} color="#1a0800" />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            <span className="gradient-text">Brew & Bites</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '16px' }}>
            Your neighbourhood café ☕
          </p>
        </motion.div>

        {/* Returning user shortcut */}
        {existingCustomer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              width: '100%', maxWidth: '400px', marginBottom: '24px',
              padding: '20px', borderRadius: '16px',
              background: 'rgba(245,158,11,0.08)',
              border: '1.5px solid rgba(245,158,11,0.25)',
              cursor: 'pointer'
            }}
            onClick={handleContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Welcome back!
                </p>
                <p style={{ fontWeight: 700, fontSize: '18px' }}>{existingCustomer.name}</p>
                <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>{existingCustomer.phone}</p>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'var(--color-accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <ArrowRight size={20} color="#1a0800" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass"
          style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px' }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>
            {existingCustomer ? 'Or continue as someone else' : 'Let\'s get started!'}
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '28px' }}>
            No account needed — just your name and number
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '8px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Your Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  type="text"
                  placeholder="e.g. Rahul"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '8px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  type="tel"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                />
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? <div className="spinner" /> : <><Coffee size={18} /> Browse Menu</>}
            </button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '24px', color: 'var(--color-muted)', fontSize: '13px', textAlign: 'center' }}
        >
          🔒 We only use your number to track your order
        </motion.p>
      </div>
    </div>
  );
}
