import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

const STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed'];
const STATUS_COLOR = { placed:'#c2700f', accepted:'#1d4ed8', preparing:'#7c3aed', ready:'#15803d', completed:'#6b7280' };
const STATUS_BG    = { placed:'#fef3e2', accepted:'#eff6ff', preparing:'#f5f3ff', ready:'#f0fdf4', completed:'#f9fafb' };
const STATUS_BORDER= { placed:'#f9d89a', accepted:'#bfdbfe', preparing:'#ddd6fe', ready:'#86efac', completed:'#e5e7eb' };
const STATUS_EMOJI = { placed:'☕', accepted:'✅', preparing:'👨‍🍳', ready:'🔔', completed:'✓' };
const METHOD_LABEL = { cash:'💵 Cash', cafe:'🏠 Café', online:'💳 Online' };
const NEXT_STATUS  = { placed:'accepted', accepted:'preparing', preparing:'ready', ready:'completed' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchOrders(); const iv = setInterval(fetchOrders, 10000); return () => clearInterval(iv); }, [filter]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/admin/orders${filter ? `?status=${filter}` : ''}`);
      setOrders(data.orders);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: next });
      toast.success(`Order #${order.id} → ${next}`);
      fetchOrders();
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/orders" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24 }}><span className="gradient-text">Orders</span></h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{orders.length} order{orders.length!==1?'s':''}</p>
          </div>
          <button onClick={fetchOrders} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 13px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit', fontSize: 13, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          {['', ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '6px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                background: filter === s ? (s ? STATUS_COLOR[s] : 'linear-gradient(135deg,#e8901f,#c2700f)') : '#fff',
                color: filter === s ? '#fff' : 'var(--color-text-secondary)',
                border: filter === s ? 'none' : '1px solid var(--color-border)',
                boxShadow: filter === s ? `0 3px 10px ${STATUS_COLOR[s]||'#c2700f'}44` : 'none'
              }}>
              {s ? `${STATUS_EMOJI[s]} ${s}` : '🗂 All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Array.from({length:4}).map((_,i)=><div key={i} className="shimmer" style={{height:76,borderRadius:14}}/>)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--color-muted)' }}>
            <div style={{fontSize:44,marginBottom:12}}>📋</div><p>No {filter||''} orders</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            <AnimatePresence>
              {orders.map((order) => {
                const open = expanded === order.id;
                const next = NEXT_STATUS[order.status];
                const color  = STATUS_COLOR[order.status];
                const bg     = STATUS_BG[order.status];
                const border = STATUS_BORDER[order.status];
                return (
                  <motion.div key={order.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.97}}
                    style={{ background:'#fff', border:`1.5px solid ${open ? color+'44' : 'var(--color-border)'}`, borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(100,60,20,0.06)', transition:'border 0.2s' }}>
                    {/* Header row */}
                    <div onClick={() => setExpanded(open ? null : order.id)}
                      style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:bg, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>
                        {STATUS_EMOJI[order.status]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                          <p style={{ fontWeight:700, fontSize:14 }}>#{order.id} — {order.customer.name}</p>
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, background:bg, color, fontWeight:700, border:`1px solid ${border}` }}>{order.status}</span>
                        </div>
                        <p style={{ color:'var(--color-muted)', fontSize:12 }}>
                          {order.customer.phone} · {METHOD_LABEL[order.paymentMethod]} · {new Date(order.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0, marginRight:4 }}>
                        <p style={{ fontWeight:800, color:'var(--color-accent-dark)', fontSize:15 }}>₹{order.total.toFixed(0)}</p>
                        <p style={{ color:'var(--color-muted)', fontSize:12 }}>{order.items.length} items</p>
                      </div>
                      <div style={{ color:'var(--color-muted)', flexShrink:0 }}>
                        {open ? <ChevronDown size={17}/> : <ChevronRight size={17}/>}
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} style={{overflow:'hidden'}}>
                          <div style={{ borderTop:'1px solid var(--color-border)', padding:16 }}>
                            <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
                              {order.items.map((item) => (
                                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                                  <span style={{color:'var(--color-muted)'}}>{item.menuItem.name} × {item.quantity}</span>
                                  <span style={{fontWeight:600}}>₹{(item.price*item.quantity).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                            {order.note && (
                              <div style={{ background:'var(--color-surface)', borderRadius:10, padding:'9px 13px', marginBottom:14, fontSize:13, color:'var(--color-text-secondary)', border:'1px solid var(--color-border)' }}>
                                📝 {order.note}
                              </div>
                            )}
                            {next ? (
                              <button onClick={() => advance(order)} disabled={updating===order.id} className="btn-primary"
                                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                                {updating===order.id ? <><div className="spinner" style={{borderColor:'rgba(255,255,255,0.3)',borderTopColor:'#fff'}}/> Updating…</> : `Mark as ${next} ${STATUS_EMOJI[next]}`}
                              </button>
                            ) : (
                              <div style={{ textAlign:'center', color:'#15803d', fontWeight:700, fontSize:14 }}>✅ Order Completed</div>
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
