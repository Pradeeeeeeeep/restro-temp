import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, CheckCircle, ChefHat, Bell, Home, RefreshCw, Clock } from 'lucide-react';
import api from '../api/axios';

const STEPS = [
  { key: 'placed',    label: 'Order Placed',  icon: Coffee,       desc: 'Your order has been received' },
  { key: 'accepted',  label: 'Accepted',       icon: CheckCircle,  desc: 'Café accepted your order' },
  { key: 'preparing', label: 'Preparing',      icon: ChefHat,      desc: 'Your order is being prepared' },
  { key: 'ready',     label: 'Ready!',         icon: Bell,         desc: 'Come collect your order 🎉' },
  { key: 'completed', label: 'Completed',      icon: CheckCircle,  desc: 'Enjoy your meal!' },
];

const STATUS_STYLE = {
  placed:    { color: '#c2700f', bg: '#fef3e2', border: '#f9d89a' },
  accepted:  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  preparing: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ready:     { color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  completed: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

const METHOD_LABEL = { cash: '💵 Cash on Pickup', cafe: '🏠 Order in Café', online: '💳 Online' };
const STEP_EMOJI   = { placed: '☕', accepted: '✅', preparing: '👨‍🍳', ready: '🔔', completed: '🎉' };

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    const iv = setInterval(fetchOrder, 5000);
    return () => clearInterval(iv);
  }, [fetchOrder]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 14px', width: 28, height: 28 }} />
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading your order…</p>
      </div>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <p style={{ marginBottom: 16 }}>Order not found</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    </div>
  );

  const stepIdx = STEPS.findIndex((s) => s.key === order.status);
  const ss = STATUS_STYLE[order.status] || STATUS_STYLE.placed;
  const isReady = order.status === 'ready';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 40 }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${ss.color}, ${ss.color}88)` }} />

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px', }}>
        {/* Nav bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <Home size={16} /> Home
          </button>
          <button onClick={fetchOrder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Hero status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            animate={isReady ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.8 }}
            style={{
              width: 88, height: 88, borderRadius: 26, margin: '0 auto 18px',
              background: ss.bg, border: `2px solid ${ss.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              boxShadow: isReady ? `0 4px 24px ${ss.color}30` : '0 2px 12px rgba(100,60,20,0.1)'
            }}>
            {STEP_EMOJI[order.status]}
          </motion.div>

          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 6 }}>
            {order.status === 'placed' && 'Order Placed!'}
            {order.status === 'accepted' && 'Order Accepted!'}
            {order.status === 'preparing' && 'Being Prepared…'}
            {order.status === 'ready' && 'Ready for Pickup! 🎉'}
            {order.status === 'completed' && 'Completed!'}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{STEPS[stepIdx]?.desc}</p>

          {isReady && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 99, padding: '7px 14px', color: '#15803d', fontWeight: 600, fontSize: 13 }}>
              🏃 Please collect your order at the counter
            </motion.div>
          )}
        </motion.div>

        {/* Progress timeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 18, padding: '20px 22px', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 18 }}>Order Progress</p>

          <div style={{ position: 'relative' }}>
            {/* grey track */}
            <div style={{ position: 'absolute', left: 19, top: 8, bottom: 8, width: 2, background: 'var(--color-border)' }} />
            {/* filled track */}
            <div style={{ position: 'absolute', left: 19, top: 8, width: 2, height: `${(stepIdx / (STEPS.length - 1)) * 100}%`, background: `linear-gradient(to bottom, ${ss.color}, #15803d)`, transition: 'height 0.5s ease' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = idx < stepIdx;
                const active = idx === stepIdx;
                const sc = STATUS_STYLE[step.key];
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
                    <motion.div animate={active ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: done ? '#f0fdf4' : active ? sc.bg : '#f9fafb',
                        border: `2px solid ${done ? '#86efac' : active ? sc.color : '#e5e7eb'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: active ? `0 2px 12px ${sc.color}30` : 'none'
                      }}>
                      <Icon size={17} color={done ? '#15803d' : active ? sc.color : '#9ca3af'} />
                    </motion.div>
                    <div style={{ paddingTop: 9 }}>
                      <p style={{ fontWeight: done || active ? 700 : 500, fontSize: 14, color: done ? '#15803d' : active ? sc.color : 'var(--color-muted)' }}>
                        {step.label}
                      </p>
                      {active && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{step.desc}</p>}
                    </div>
                    {active && <div style={{ marginLeft: 'auto', paddingTop: 12 }}><Clock size={13} color="var(--color-muted)" /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Order details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Order #{order.id}</h3>
            <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>
              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: ss.bg, color: ss.color, fontWeight: 600, border: `1px solid ${ss.border}`, display: 'inline-block', marginBottom: 12 }}>
            {METHOD_LABEL[order.paymentMethod]}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--color-muted)' }}>{item.menuItem.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17 }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-accent-dark)' }}>₹{order.total.toFixed(0)}</span>
          </div>
        </motion.div>

        {lastUpdated && (
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 11 }}>
            Auto-refreshing every 5s · Last at {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
