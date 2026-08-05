import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, User, Phone, ArrowRight, ChevronRight,
  Clock, CheckCircle, ChefHat, Bell, ShoppingBag, RefreshCw, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCustomerStore from '../store/useCustomerStore';
import useCartStore from '../store/useCartStore';

/* ─── Status config ─── */
const STATUS_CONFIG = {
  placed:    { label: 'Order Placed',  emoji: '☕', color: '#c2700f', bg: '#fef3e2', border: '#f9d89a' },
  accepted:  { label: 'Accepted',      emoji: '✅', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  preparing: { label: 'Preparing',     emoji: '👨‍🍳', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ready:     { label: 'Ready! 🎉',    emoji: '🔔', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  completed: { label: 'Completed',     emoji: '✓',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`
    }}>
      <span style={{ fontSize: '10px' }}>{cfg.emoji}</span>
      {cfg.label}
    </span>
  );
}

function OrderCard({ order, onClick }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
  const isActive = !['completed'].includes(order.status);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: '#fff', border: `1.5px solid ${isActive ? cfg.border : 'var(--color-border)'}`,
        borderRadius: '14px', padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: isActive ? `0 2px 12px ${cfg.color}15` : '0 1px 4px rgba(100,60,20,0.06)',
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
      }}>
        {cfg.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Order #{order.id}</span>
          <StatusBadge status={order.status} />
          {isActive && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block' }}
              className="pulse" />
          )}
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·&nbsp;
          {order.paymentMethod === 'cash' ? '💵 Cash' : order.paymentMethod === 'cafe' ? '🏠 Café' : '💳 Online'} ·&nbsp;
          ₹{order.total.toFixed(0)}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, color: 'var(--color-muted)' }}>
        <span style={{ fontSize: '12px' }}>
          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <ChevronRight size={16} />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();
  const { customer, setCustomer, clearCustomer } = useCustomerStore();
  const clearCart = useCartStore((s) => s.clearCart);

  /* fetch orders whenever we have a customer */
  useEffect(() => {
    if (customer?.phone) fetchOrders(customer.phone);
  }, [customer?.phone]);

  const fetchOrders = async (phone) => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get(`/orders/customer/${phone}`);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    if (!/^[6-9]\d{9}$/.test(phone.trim())) return toast.error('Enter a valid 10-digit mobile number');

    setLoading(true);
    try {
      const { data } = await api.post('/customer', { name: name.trim(), phone: phone.trim() });
      setCustomer(data.customer);
      toast.success(`Welcome, ${data.customer.name}! ☕`);
      setShowForm(false);
      setName('');
      setPhone('');
      // If no orders yet, go straight to menu
      const ordersRes = await api.get(`/orders/customer/${data.customer.phone}`);
      const fetchedOrders = ordersRes.data.orders || [];
      setOrders(fetchedOrders);
      if (fetchedOrders.length === 0) navigate('/menu');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearCustomer();
    clearCart();
    setOrders([]);
    setShowForm(false);
    toast('Switched account', { icon: '👋' });
  };

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top ambient blob */}
      <div style={{
        position: 'fixed', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232,144,31,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{
        maxWidth: 440, margin: '0 auto', padding: '40px 20px 60px',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 0
      }}>

        {/* ── LOGO ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{
            width: 76, height: 76, borderRadius: '22px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #e8901f, #c2700f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(194,112,15,0.25)',
          }}>
            <Coffee size={38} color="#fff" />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            <span className="gradient-text">Brew & Bites</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Your neighbourhood café ☕</p>
        </motion.div>

        {/* ── RETURNING CUSTOMER VIEW ── */}
        <AnimatePresence mode="wait">
          {customer && !showForm ? (
            <motion.div
              key="returning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Welcome card */}
              <div style={{
                background: 'var(--color-card)', borderRadius: 18,
                border: '1.5px solid var(--color-accent-border)',
                padding: '18px 20px', boxShadow: '0 2px 16px rgba(194,112,15,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14,
                      background: 'linear-gradient(135deg, #e8901f, #c2700f)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 20
                    }}>
                      {customer.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{customer.name}</p>
                      <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{customer.phone}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} title="Switch account"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}>
                    <LogOut size={17} />
                  </button>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={() => navigate('/menu')}
                >
                  <ShoppingBag size={18} /> Order Now
                </button>
              </div>

              {/* My Orders section */}
              <div style={{ background: 'var(--color-card)', borderRadius: 18, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{
                  padding: '16px 18px 12px', borderBottom: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="var(--color-accent)" />
                    <h2 style={{ fontWeight: 700, fontSize: 15 }}>My Orders</h2>
                  </div>
                  <button
                    onClick={() => fetchOrders(customer.phone)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
                    title="Refresh"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>

                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ordersLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />
                    ))
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--color-muted)' }}>
                      <ShoppingBag size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                      <p style={{ fontSize: 14 }}>No orders yet</p>
                      <p style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Start your first order!</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => navigate(`/order/${order.id}`)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Switch account */}
              <button
                onClick={() => setShowForm(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 13, textAlign: 'center', padding: '4px 0' }}
              >
                Not {customer.name}? <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Switch account</span>
              </button>
            </motion.div>

          ) : (
            /* ── NEW / SWITCH CUSTOMER FORM ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {customer && showForm && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ marginBottom: 12, textAlign: 'center' }}>
                  <button onClick={() => setShowForm(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 14, fontWeight: 600 }}>
                    ← Back to {customer.name}'s orders
                  </button>
                </motion.div>
              )}

              <div className="glass shadow-md" style={{ borderRadius: 22, padding: 28 }}>
                <div style={{ marginBottom: 22 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 5 }}>
                    {customer ? 'Switch Account' : "Let's get started!"}
                  </h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
                    No account needed — just your name & number
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Your Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} />
                      <input
                        className="input-field"
                        style={{ paddingLeft: 38 }}
                        type="text"
                        placeholder="e.g. Rahul"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Mobile Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} />
                      <input
                        className="input-field"
                        style={{ paddingLeft: 38 }}
                        type="tel"
                        placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={loading}
                    style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {loading
                      ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Checking...</>
                      : <><Coffee size={17} /> Continue to Menu <ArrowRight size={16} /></>}
                  </button>
                </form>
              </div>

              <p style={{ marginTop: 16, color: 'var(--color-muted)', fontSize: 12, textAlign: 'center' }}>
                🔒 We only use your number to track your order
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
