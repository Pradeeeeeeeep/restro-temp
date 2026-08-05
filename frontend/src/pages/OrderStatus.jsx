import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, CheckCircle, Clock, ChefHat, Bell, Home, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Coffee, description: 'Your order has been received' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle, description: 'Café accepted your order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Your order is being prepared' },
  { key: 'ready', label: 'Ready!', icon: Bell, description: 'Come pick up your order 🎉' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, description: 'Enjoy your meal!' },
];

const METHOD_LABELS = {
  cash: '💵 Cash on Pickup',
  cafe: '🏠 Order in Café',
  online: '💳 Online',
};

const STATUS_COLORS = {
  placed: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  accepted: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  preparing: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  ready: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  completed: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

function getStepIndex(status) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

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
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // Poll every 5 seconds
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-muted)' }}>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>😕</div>
          <p>Order not found</p>
          <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(order.status);
  const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '40px' }}>
      {/* Top glow for ready/completed */}
      {(isReady || isCompleted) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '200px', zIndex: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${statusStyle.color}22 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />
      )}

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <Home size={16} /> Home
          </button>
          <button onClick={fetchOrder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Status Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <motion.div
            animate={isReady ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              width: 90, height: 90, borderRadius: '28px', margin: '0 auto 20px',
              background: statusStyle.bg, border: `2px solid ${statusStyle.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isReady ? `0 0 32px ${statusStyle.color}44` : 'none'
            }}
          >
            <span style={{ fontSize: '40px' }}>
              {order.status === 'placed' && '☕'}
              {order.status === 'accepted' && '✅'}
              {order.status === 'preparing' && '👨‍🍳'}
              {order.status === 'ready' && '🔔'}
              {order.status === 'completed' && '🎉'}
            </span>
          </motion.div>

          <h1 style={{ fontWeight: 800, fontSize: '26px', marginBottom: '8px' }}>
            {order.status === 'placed' && 'Order Placed!'}
            {order.status === 'accepted' && 'Order Accepted!'}
            {order.status === 'preparing' && 'Being Prepared...'}
            {order.status === 'ready' && 'Ready for Pickup! 🎉'}
            {order.status === 'completed' && 'Order Complete!'}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '15px', maxWidth: '300px', margin: '0 auto' }}>
            {STATUS_STEPS[currentStepIdx]?.description}
          </p>

          {order.status === 'ready' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '99px', padding: '8px 16px', color: '#86efac', fontWeight: 600
              }}
            >
              🏃 Please collect your order at the counter
            </motion.div>
          )}
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass"
          style={{ borderRadius: '20px', padding: '24px', marginBottom: '20px' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Order Progress
          </h3>
          <div style={{ position: 'relative' }}>
            {/* Track line */}
            <div style={{ position: 'absolute', left: '19px', top: '8px', bottom: '8px', width: '2px', background: 'var(--color-border)' }} />
            <div style={{
              position: 'absolute', left: '19px', top: '8px', width: '2px',
              height: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%`,
              background: 'linear-gradient(to bottom, #f59e0b, #22c55e)',
              transition: 'height 0.5s ease'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <motion.div
                      animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                        background: isDone ? '#22c55e22' : isActive ? statusStyle.bg : 'var(--color-surface)',
                        border: `2px solid ${isDone ? '#22c55e' : isActive ? statusStyle.color : 'var(--color-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isActive ? `0 0 16px ${statusStyle.color}44` : 'none'
                      }}
                    >
                      <Icon size={18} color={isDone ? '#22c55e' : isActive ? statusStyle.color : 'var(--color-muted)'} />
                    </motion.div>
                    <div style={{ paddingTop: '8px' }}>
                      <p style={{ fontWeight: isDone || isActive ? 700 : 500, color: isDone ? '#86efac' : isActive ? statusStyle.color : 'var(--color-muted)', fontSize: '15px' }}>
                        {step.label}
                      </p>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}
                        >
                          {step.description}
                        </motion.p>
                      )}
                    </div>
                    {isActive && (
                      <div style={{ marginLeft: 'auto', paddingTop: '10px' }}>
                        <Clock size={14} color="var(--color-muted)" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass"
          style={{ borderRadius: '20px', padding: '20px', marginBottom: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700 }}>Order #{order.id}</h3>
            <span style={{ color: 'var(--color-muted)', fontSize: '13px' }}>
              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '99px', background: statusStyle.bg, color: statusStyle.color, fontWeight: 600 }}>
              {METHOD_LABELS[order.paymentMethod]}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted)' }}>{item.menuItem.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-accent)' }}>₹{order.total.toFixed(0)}</span>
          </div>
        </motion.div>

        {lastUpdated && (
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '12px' }}>
            Auto-updating · Last checked {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
