import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, ShoppingBag, Menu, TrendingUp, Clock, LogOut, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>{label}</p>
          <p style={{ fontWeight: 800, fontSize: '28px', color: color || 'var(--color-text)', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ color: 'var(--color-muted)', fontSize: '12px', marginTop: '6px' }}>{sub}</p>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color || 'var(--color-accent)'} />
        </div>
      </div>
    </motion.div>
  );
}

function AdminNav({ active }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
    toast.success('Logged out');
  };

  const links = [
    { path: '/admin', label: 'Dashboard', icon: TrendingUp },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/menu', label: 'Menu', icon: Menu },
  ];

  return (
    <div className="glass" style={{ borderBottom: '1px solid var(--color-border)', padding: '12px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={20} color="#1a0800" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px' }}>Brew & Bites</span>
          <span style={{ fontSize: '11px', color: 'var(--color-accent)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '99px', padding: '2px 8px', fontWeight: 600 }}>ADMIN</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {links.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
              color: active === path ? '#1a0800' : 'var(--color-muted)',
              background: active === path ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              transition: 'all 0.2s'
            }}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontFamily: 'Outfit', fontSize: '14px', fontWeight: 600 }}>
            <LogOut size={15} /> Logout
          </button>
        </nav>
      </div>
    </div>
  );
}

export { AdminNav };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/orders?'),
      ]);
      setStats(statsRes.data.stats);
      setRecentOrders(ordersRes.data.orders.slice(0, 5));
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLOR = { placed: '#f59e0b', accepted: '#3b82f6', preparing: '#a855f7', ready: '#22c55e', completed: '#6b7280' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin" />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontWeight: 800, fontSize: '26px', marginBottom: '4px' }}>
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>Welcome back! Here's what's happening.</p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer" style={{ height: '110px', borderRadius: '16px' }} />)}
          </div>
        ) : stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <StatCard icon={ShoppingBag} label="Today's Orders" value={stats.todayOrders} color="#f59e0b" />
              <StatCard icon={Clock} label="Active Orders" value={stats.pendingOrders} color="#a855f7" sub="placed + accepted + preparing" />
              <StatCard icon={TrendingUp} label="Today's Revenue" value={`₹${stats.todayRevenue?.toFixed(0) || 0}`} color="#22c55e" />
              <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders} color="#3b82f6" />
              <StatCard icon={TrendingUp} label="Total Revenue" value={`₹${stats.totalRevenue?.toFixed(0) || 0}`} color="#f59e0b" sub="completed orders" />
            </div>

            {/* Recent Orders */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '18px' }}>Recent Orders</h2>
                <Link to="/admin/orders" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View all <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card"
                    style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${STATUS_COLOR[order.status]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {order.status === 'placed' && '☕'}
                      {order.status === 'accepted' && '✅'}
                      {order.status === 'preparing' && '👨‍🍳'}
                      {order.status === 'ready' && '🔔'}
                      {order.status === 'completed' && '✓'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700 }}>{order.customer.name} — Order #{order.id}</p>
                      <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.paymentMethod === 'cash' ? '💵 Cash' : order.paymentMethod === 'cafe' ? '🏠 Café' : '💳 Online'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, color: 'var(--color-accent)' }}>₹{order.total.toFixed(0)}</p>
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '99px', background: `${STATUS_COLOR[order.status]}20`, color: STATUS_COLOR[order.status], fontWeight: 600 }}>
                        {order.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {recentOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                    No orders yet
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
