import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

const STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed'];
const STATUS_COLOR = {
  placed: '#f59e0b', accepted: '#3b82f6', preparing: '#a855f7',
  ready: '#22c55e', completed: '#6b7280'
};
const STATUS_EMOJI = { placed: '☕', accepted: '✅', preparing: '👨‍🍳', ready: '🔔', completed: '✓' };
const METHOD_LABEL = { cash: '💵 Cash', cafe: '🏠 Café', online: '💳 Online' };

const NEXT_STATUS = {
  placed: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/orders${params}`);
      setOrders(data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: next });
      toast.success(`Order #${order.id} → ${next}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/orders" />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '26px' }}><span className="gradient-text">Orders</span></h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={fetchOrders} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Outfit', fontSize: '13px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '7px 14px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
                background: filter === s ? (STATUS_COLOR[s] || 'linear-gradient(135deg, #f59e0b, #d97706)') : 'var(--color-card)',
                color: filter === s ? '#fff' : 'var(--color-muted)',
                border: filter === s ? 'none' : '1px solid var(--color-border)',
                boxShadow: filter === s ? `0 4px 12px ${STATUS_COLOR[s] || '#f59e0b'}44` : 'none'
              }}
            >
              {s ? `${STATUS_EMOJI[s]} ${s}` : '🗂 All'}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '14px' }} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p>No {filter || ''} orders</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const isExpanded = expanded === order.id;
                const nextStatus = NEXT_STATUS[order.status];
                const color = STATUS_COLOR[order.status];
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="card"
                    style={{ overflow: 'hidden', border: `1px solid ${color}22` }}
                  >
                    {/* Order header */}
                    <div
                      style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        {STATUS_EMOJI[order.status]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700 }}>#{order.id} — {order.customer.name}</p>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: `${color}20`, color, fontWeight: 600 }}>
                            {order.status}
                          </span>
                        </div>
                        <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>
                          {order.customer.phone} · {METHOD_LABEL[order.paymentMethod]} · {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 800, color: 'var(--color-accent)' }}>₹{order.total.toFixed(0)}</p>
                        <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>{order.items.length} items</p>
                      </div>
                      <div style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                              {order.items.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                  <span style={{ color: 'var(--color-muted)' }}>{item.menuItem.name} × {item.quantity}</span>
                                  <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                            {order.note && (
                              <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--color-muted)' }}>
                                📝 {order.note}
                              </div>
                            )}
                            {nextStatus && (
                              <button
                                onClick={() => advanceStatus(order)}
                                disabled={updating === order.id}
                                className="btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                {updating === order.id ? <><div className="spinner" /> Updating...</> : `Mark as ${nextStatus} ${STATUS_EMOJI[nextStatus]}`}
                              </button>
                            )}
                            {!nextStatus && order.status === 'completed' && (
                              <div style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600, fontSize: '14px' }}>
                                ✅ Order Completed
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
