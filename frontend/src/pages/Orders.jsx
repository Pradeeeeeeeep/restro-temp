import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Coffee, CheckCircle, ChefHat, Bell, Check,
  ShoppingBag, RefreshCw, ChevronRight, Home,
  Banknote, House, CreditCard
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useCustomerStore from '../store/useCustomerStore';

/* ─── Status config ─── */
const STATUS_CONFIG = {
  placed:    { label: 'Order Placed', icon: Coffee,      color: '#c2700f', bg: '#fef3e2', border: '#f9d89a' },
  accepted:  { label: 'Accepted',     icon: CheckCircle, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  preparing: { label: 'Preparing',    icon: ChefHat,     color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ready:     { label: 'Ready!',       icon: Bell,        color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  completed: { label: 'Completed',    icon: Check,       color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  cancelled: { label: 'Cancelled',    icon: Coffee,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order, onClick }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
  const isActive = !['completed', 'cancelled'].includes(order.status);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: 'var(--color-card)', border: `1.5px solid ${isActive ? cfg.border : 'var(--color-border)'}`,
        borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: isActive ? `0 2px 12px ${cfg.color}15` : '0 1px 4px var(--card-shadow)',
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {(() => { const Icon = cfg.icon; return <Icon size={20} color={cfg.color} />; })()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Order #{order.id}</span>
          <StatusBadge status={order.status} />
          {isActive && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block' }}
              className="pulse" />
          )}
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·&nbsp;
          {order.paymentMethod === 'cash'
            ? <><Banknote size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Cash</>
            : order.paymentMethod === 'cafe'
            ? <><House size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Café</>
            : <><CreditCard size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Online</>} ·&nbsp;
          ₹{order.total.toFixed(0)}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: 'var(--color-muted)' }}>
        <span style={{ fontSize: 12 }}>
          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <ChevronRight size={16} />
      </div>
    </motion.div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { customer } = useCustomerStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!customer?.phone) { setLoading(false); return; }
    try {
      const { data } = await api.get(`/orders/customer/${customer.phone}`);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 8000);
    return () => clearInterval(iv);
  }, [customer?.phone]);

  // If no customer logged in, redirect to home
  if (!customer) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Please log in first</p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>Enter your details on the home page to view orders.</p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ padding: '10px 24px' }}>
            <Home size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: 'var(--color-accent)' }} />

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 60px' }}>
        {/* Nav bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <Home size={16} /> Home
          </button>
          <button onClick={fetchOrders} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>My Orders</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{customer.name} · {customer.phone}</p>
        </div>

        {/* Orders list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 76, borderRadius: 14 }} />
            ))
          ) : orders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 0', color: 'var(--color-muted)',
              background: 'var(--color-card)', borderRadius: 18, border: '1px solid var(--color-border)'
            }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No orders yet</p>
              <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>Place your first order from our menu!</p>
              <button className="btn-primary" onClick={() => navigate('/menu')} style={{ padding: '10px 22px', fontSize: 14 }}>
                Browse Menu
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => navigate(`/order/${order.id}`)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
