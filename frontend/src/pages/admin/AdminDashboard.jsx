import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, ShoppingBag, UtensilsCrossed, TrendingUp, Clock, LogOut, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLOR = { placed: '#c2700f', accepted: '#1d4ed8', preparing: '#7c3aed', ready: '#15803d', completed: '#6b7280' };
const STATUS_BG    = { placed: '#fef3e2', accepted: '#eff6ff', preparing: '#f5f3ff', ready: '#f0fdf4', completed: '#f9fafb' };
const STATUS_EMOJI = { placed: '☕', accepted: '✅', preparing: '👨‍🍳', ready: '🔔', completed: '✓' };
const METHOD_LABEL = { cash: '💵 Cash', cafe: '🏠 Café', online: '💳 Online' };

/* ─── Shared Admin Nav ─── */
export function AdminNav({ active }) {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('admin_token'); navigate('/admin/login'); toast.success('Logged out'); };
  const links = [
    { path: '/admin',        label: 'Dashboard', icon: TrendingUp },
    { path: '/admin/orders', label: 'Orders',    icon: ShoppingBag },
    { path: '/admin/menu',   label: 'Menu',      icon: UtensilsCrossed },
  ];
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid var(--color-border)', padding: '10px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #e8901f, #c2700f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>Brew & Bites</span>
          <span style={{ fontSize: 10, color: 'var(--color-accent)', background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>ADMIN</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {links.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
              color: active === path ? '#fff' : 'var(--color-text-secondary)',
              background: active === path ? 'linear-gradient(135deg, #e8901f, #c2700f)' : 'transparent',
            }}>
              <Icon size={15} />{label}
            </Link>
          ))}
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626', fontFamily: 'Outfit', fontSize: 14, fontWeight: 600, marginLeft: 4 }}>
            <LogOut size={15} /> Logout
          </button>
        </nav>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(100,60,20,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>{label}</p>
          <p style={{ fontWeight: 800, fontSize: 28, color: color || 'var(--color-text)', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 5 }}>{sub}</p>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color || 'var(--color-accent)'} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Dashboard ─── */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 15000);
    return () => clearInterval(iv);
  }, []);

  const fetchData = async () => {
    try {
      const [s, o] = await Promise.all([api.get('/admin/dashboard/stats'), api.get('/admin/orders')]);
      setStats(s.data.stats);
      setRecentOrders(o.data.orders.slice(0, 5));
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 3 }}><span className="gradient-text">Dashboard</span></h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Welcome back! Here's what's happening.</p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 14 }} />)}
          </div>
        ) : stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
              <StatCard icon={ShoppingBag} label="Today's Orders" value={stats.todayOrders}   color="#c2700f" />
              <StatCard icon={Clock}       label="Active Orders"  value={stats.pendingOrders}  color="#7c3aed" sub="placed + accepted + preparing" />
              <StatCard icon={TrendingUp}  label="Today Revenue"  value={`₹${stats.todayRevenue?.toFixed(0)||0}`} color="#15803d" />
              <StatCard icon={ShoppingBag} label="Total Orders"   value={stats.totalOrders}    color="#1d4ed8" />
              <StatCard icon={TrendingUp}  label="Total Revenue"  value={`₹${stats.totalRevenue?.toFixed(0)||0}`} color="#c2700f" sub="completed only" />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontWeight: 700, fontSize: 17 }}>Recent Orders</h2>
                <Link to="/admin/orders" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                  View all <ChevronRight size={13} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentOrders.map((order) => (
                  <motion.div key={order.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: STATUS_BG[order.status], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {STATUS_EMOJI[order.status]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{order.customer.name} — Order #{order.id}</p>
                      <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>{order.items.length} item{order.items.length!==1?'s':''} · {METHOD_LABEL[order.paymentMethod]}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, color: 'var(--color-accent-dark)', fontSize: 15 }}>₹{order.total.toFixed(0)}</p>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: STATUS_BG[order.status], color: STATUS_COLOR[order.status], fontWeight: 700 }}>
                        {order.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {recentOrders.length === 0 && <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--color-muted)', fontSize: 14 }}>No orders yet</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
