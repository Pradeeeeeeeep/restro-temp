import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, RefreshCw, Printer, MessageCircle, XCircle, Coffee, CheckCircle, ChefHat, Bell, Check, X, ClipboardList, FileText, Banknote, House, CreditCard } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

const STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'completed'];
const STATUS_COLOR  = { placed:'#c2700f', accepted:'#1d4ed8', preparing:'#7c3aed', ready:'#15803d', completed:'#6b7280', cancelled:'#dc2626' };
const STATUS_BG     = { placed:'#fef3e2', accepted:'#eff6ff', preparing:'#f5f3ff', ready:'#f0fdf4', completed:'#f9fafb', cancelled:'#fef2f2' };
const STATUS_BORDER = { placed:'#f9d89a', accepted:'#bfdbfe', preparing:'#ddd6fe', ready:'#86efac', completed:'#e5e7eb', cancelled:'#fecaca' };
const STATUS_ICON   = { placed: Coffee, accepted: CheckCircle, preparing: ChefHat, ready: Bell, completed: Check, cancelled: X };
const METHOD_LABEL  = { cash: 'Cash', cafe: 'Café', online: 'Online' };
const NEXT_STATUS   = { placed:'accepted', accepted:'preparing', preparing:'ready', ready:'completed' };
const CAN_CANCEL    = ['placed', 'accepted', 'preparing'];

/* ── Print invoice ── */
function printInvoice(order) {
  const date = new Date(order.createdAt).toLocaleString('en-IN');
  const rows = order.items.map((i) => `
    <tr>
      <td style="padding:7px 0;border-bottom:1px solid #f0ebe4">${i.menuItem.name}</td>
      <td style="text-align:center;padding:7px 8px;border-bottom:1px solid #f0ebe4">×${i.quantity}</td>
      <td style="text-align:right;padding:7px 0;border-bottom:1px solid #f0ebe4;font-weight:600">₹${(i.price * i.quantity).toFixed(0)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1a0f05; max-width: 400px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 28px; color: #c2700f; }
    .header p { color: #8a6040; font-size: 13px; margin-top: 4px; }
    .divider { border: none; border-top: 2px dashed #f9d89a; margin: 16px 0; }
    .section { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a6040; font-weight: 700; }
    .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .total-row td { font-weight: 800; font-size: 16px; padding-top: 12px; }
    .footer { text-align: center; margin-top: 28px; font-size: 12px; color: #8a6040; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cafe</h1>
    <p>Order Receipt</p>
  </div>
  <hr class="divider">
  <div style="display:flex;justify-content:space-between;margin-bottom:16px">
    <div class="section"><div class="label">Order</div><div class="value">#${order.id}</div></div>
    <div class="section" style="text-align:right"><div class="label">Date</div><div class="value" style="font-size:12px">${date}</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:16px">
    <div class="section"><div class="label">Customer</div><div class="value">${order.customer.name}</div></div>
    <div class="section" style="text-align:right"><div class="label">Phone</div><div class="value">${order.customer.phone}</div></div>
  </div>
  <div class="section"><div class="label">Payment</div><div class="value">${METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</div></div>
  <hr class="divider">
  <table>
    <thead><tr>
      <th style="text-align:left;font-size:11px;text-transform:uppercase;color:#8a6040;padding-bottom:8px">Item</th>
      <th style="text-align:center;font-size:11px;text-transform:uppercase;color:#8a6040;padding-bottom:8px">Qty</th>
      <th style="text-align:right;font-size:11px;text-transform:uppercase;color:#8a6040;padding-bottom:8px">Amount</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">Total</td>
        <td style="text-align:right;color:#c2700f">₹${order.total.toFixed(0)}</td>
      </tr>
    </tfoot>
  </table>
  ${order.note ? `<hr class="divider"><div class="section"><div class="label">Note</div><div class="value" style="font-size:13px">${order.note}</div></div>` : ''}
  <div class="footer"><p>Thank you for visiting!</p><p style="margin-top:4px">Please come again</p></div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=450,height=650');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

/* ── WhatsApp invoice ── */
function sendWhatsApp(order) {
  const date = new Date(order.createdAt).toLocaleString('en-IN');
  const lines = order.items.map((i) => `  • ${i.menuItem.name} × ${i.quantity} = ₹${(i.price * i.quantity).toFixed(0)}`).join('\n');
  const note = order.note ? `\nNote: ${order.note}` : '';
  const text = `*Cafe Order Invoice*\n\n` +
    `Order #${order.id}\n` +
    `Date: ${date}\n` +
    `Customer: ${order.customer.name} (${order.customer.phone})\n` +
    `Payment: ${METHOD_LABEL[order.paymentMethod] || order.paymentMethod}\n\n` +
    `*Items:*\n${lines}\n` +
    `────────────────\n` +
    `*Total: ₹${order.total.toFixed(0)}*` +
    note +
    `\n\nThank you for visiting! 🙏`;

  const phone = order.customer.phone.replace(/\D/g, '');
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, '_blank');
}

/* ════════════════════════════════════════════
   ADMIN ORDERS PAGE
════════════════════════════════════════════ */
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 10000);
    return () => clearInterval(iv);
  }, [filter]);

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

  const cancelOrder = async (order) => {
    if (!window.confirm(`Cancel Order #${order.id} for ${order.customer.name}?`)) return;
    setCancelling(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: 'cancelled' });
      toast.success(`Order #${order.id} cancelled`);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to cancel'); }
    finally { setCancelling(null); }
  };

  const filterList = ['', ...STATUSES, 'cancelled'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/orders" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24 }}><span className="gradient-text">Orders</span></h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={fetchOrders}
            style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 13px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit', fontSize: 13, fontWeight: 600 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          {filterList.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '6px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                background: filter === s ? (s ? STATUS_COLOR[s] || 'var(--color-accent)' : 'var(--color-accent)') : '#fff',
                color: filter === s ? '#fff' : 'var(--color-text-secondary)',
                border: filter === s ? 'none' : '1px solid var(--color-border)',
                boxShadow: filter === s ? `0 3px 10px ${(STATUS_COLOR[s] || 'var(--color-accent)')}44` : 'none',
              }}>
              {s ? (() => { const Icon = STATUS_ICON[s]; return <><Icon size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {s}</>; })() : 'All'}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 76, borderRadius: 14 }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
            <ClipboardList size={44} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p>No {filter || ''} orders</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <AnimatePresence>
              {orders.map((order) => {
                const open    = expanded === order.id;
                const next    = NEXT_STATUS[order.status];
                const color   = STATUS_COLOR[order.status] || '#6b7280';
                const bg      = STATUS_BG[order.status]    || '#f9fafb';
                const border  = STATUS_BORDER[order.status]|| '#e5e7eb';
                const canCancel = CAN_CANCEL.includes(order.status);

                return (
                  <motion.div key={order.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                    style={{ background: '#fff', border: `1.5px solid ${open ? color + '44' : 'var(--color-border)'}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(100,60,20,0.06)', transition: 'border 0.2s' }}>

                    {/* Header row */}
                    <div onClick={() => setExpanded(open ? null : order.id)}
                      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {(() => { const Icon = STATUS_ICON[order.status] || Coffee; return <Icon size={19} color={color} />; })()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>#{order.id} — {order.customer.name}</p>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: bg, color, fontWeight: 700, border: `1px solid ${border}` }}>{order.status}</span>
                        </div>
                        <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                          {order.customer.phone} · {METHOD_LABEL[order.paymentMethod]} · {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
                        <p style={{ fontWeight: 800, color: 'var(--color-accent-dark)', fontSize: 15 }}>₹{order.total.toFixed(0)}</p>
                        <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>{order.items.length} items</p>
                      </div>
                      <div style={{ color: 'var(--color-muted)', flexShrink: 0 }}>
                        {open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                      </div>
                    </div>

                    {/* Expanded section */}
                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: '1px solid var(--color-border)', padding: 16 }}>
                            {/* Items list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                              {order.items.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                  <span style={{ color: 'var(--color-muted)' }}>{item.menuItem.name} × {item.quantity}</span>
                                  <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--color-accent-dark)' }}>₹{order.total.toFixed(0)}</span>
                              </div>
                            </div>

                            {/* Note */}
                            {order.note && (
                              <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '9px 13px', marginBottom: 14, fontSize: 13, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                                <FileText size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {order.note}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {/* Advance / Completed */}
                              {order.status !== 'cancelled' && (
                                next ? (
                                  <button onClick={() => advance(order)} disabled={updating === order.id} className="btn-primary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    {updating === order.id
                                      ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Updating…</>
                                      : (() => { const Icon = STATUS_ICON[next]; return <><Icon size={15} /> Mark as {next}</>; })()}
                                  </button>
                                ) : (
                                  <div style={{ textAlign: 'center', color: '#15803d', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><CheckCircle size={16} color="#15803d" /> Order Completed</div>
                                )
                              )}

                              {/* Invoice actions row */}
                              <div style={{ display: 'flex', gap: 8 }}>
                                {/* Print */}
                                <button onClick={() => printInvoice(order)}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: 'var(--color-text-secondary)', transition: 'all 0.15s' }}>
                                  <Printer size={15} /> Print Invoice
                                </button>
                                {/* WhatsApp */}
                                <button onClick={() => sendWhatsApp(order)}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #25d366', background: '#f0fdf4', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: '#15803d', transition: 'all 0.15s' }}>
                                  <MessageCircle size={15} /> WhatsApp
                                </button>
                              </div>

                              {/* Cancel */}
                              {canCancel && (
                                <button onClick={() => cancelOrder(order)} disabled={cancelling === order.id}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 12, border: '1.5px solid #fecaca', background: '#fef2f2', cursor: cancelling === order.id ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: '#dc2626', transition: 'all 0.15s' }}>
                                  {cancelling === order.id
                                    ? <><div className="spinner" style={{ width: 14, height: 14, borderColor: '#fca5a5', borderTopColor: '#dc2626' }} /> Cancelling…</>
                                    : <><XCircle size={15} /> Cancel Order</>}
                                </button>
                              )}

                              {order.status === 'cancelled' && (
                                <div style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700, fontSize: 14, padding: '6px 0' }}>✗ Order Cancelled</div>
                              )}
                            </div>
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
