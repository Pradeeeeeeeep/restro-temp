import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Coffee, CreditCard, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

const METHODS = [
  {
    id: 'cash', label: 'Cash on Pickup', description: 'Pay cash when you collect your order',
    icon: Wallet, color: '#15803d', bg: '#f0fdf4', border: '#86efac',
  },
  {
    id: 'cafe', label: 'Order in Café', description: 'Dine-in and pay at the counter',
    icon: Coffee, color: '#c2700f', bg: '#fef3e2', border: '#f9d89a',
  },
  {
    id: 'online', label: 'Pay Online', description: 'Coming soon — UPI & Card payments',
    icon: CreditCard, color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', disabled: true,
  },
];

export default function Checkout() {
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const { items, total, count, clearCart } = useCartStore();

  if (!customer) { navigate('/'); return null; }
  if (items.length === 0) { navigate('/menu'); return null; }

  const handleOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customerId: customer.id,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        paymentMethod: method,
        note: note.trim() || undefined,
      });
      clearCart();
      toast.success('Order placed! ☕');
      navigate(`/order/${data.order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 110 }}>
      {/* Header */}
      <div className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <ArrowLeft size={21} />
          </button>
          <h1 style={{ fontWeight: 800, fontSize: 19 }}><span className="gradient-text">Checkout</span></h1>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px' }}>
        {/* Customer */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card"
          style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #e8901f, #c2700f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>
            {customer.name[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>{customer.name}</p>
            <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>{customer.phone}</p>
          </div>
        </motion.div>

        {/* Order summary */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Order ({count} items)</h3>
            <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600 }}>Edit</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
            {items.map((i) => (
              <div key={i.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--color-muted)' }}>{i.name} × {i.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(i.price * i.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17 }}>
            <span>Total</span><span style={{ color: 'var(--color-accent-dark)' }}>₹{total.toFixed(0)}</span>
          </div>
        </motion.div>

        {/* Payment method */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>How would you like to pay?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {METHODS.map((m) => {
              const Icon = m.icon;
              const sel = method === m.id;
              return (
                <motion.button key={m.id} whileTap={!m.disabled ? { scale: 0.98 } : {}}
                  onClick={() => !m.disabled && setMethod(m.id)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14, textAlign: 'left', cursor: m.disabled ? 'not-allowed' : 'pointer',
                    border: sel ? `2px solid ${m.color}` : `1.5px solid ${m.disabled ? '#e5e7eb' : m.border}`,
                    background: sel ? m.bg : '#fff', opacity: m.disabled ? 0.55 : 1, transition: 'all 0.18s',
                    display: 'flex', alignItems: 'center', gap: 13, fontFamily: 'Outfit'
                  }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: sel ? m.bg : 'var(--color-surface)', border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={m.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: sel ? m.color : 'var(--color-text)' }}>{m.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{m.description}</p>
                  </div>
                  {sel && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Note */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            <FileText size={13} /> Special Instructions (optional)
          </label>
          <textarea className="input-field" rows={2} placeholder="e.g. Extra spicy, less sugar…" value={note}
            onChange={(e) => setNote(e.target.value)} style={{ resize: 'vertical' }} />
        </motion.div>
      </div>

      {/* CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 18, background: 'linear-gradient(to top, var(--color-bg) 60%, transparent)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <button className="btn-primary" style={{ width: '100%', fontSize: 16, padding: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            onClick={handleOrder} disabled={loading}>
            {loading
              ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Placing Order...</>
              : <>Place Order · ₹{total.toFixed(0)} <ChevronRight size={19} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
