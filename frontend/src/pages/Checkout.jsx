import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wallet, Coffee, CreditCard, ChevronRight, FileText, Tag, Check, Sparkles, AlertCircle, X } from 'lucide-react';
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

  // Coupon state
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const setLastOrderId = useCustomerStore((s) => s.setLastOrderId);
  const { items, total, count, clearCart } = useCartStore();

  useEffect(() => {
    api.get('/coupons')
      .then(({ data }) => setAvailableCoupons(data.coupons || []))
      .catch(() => {});
  }, []);

  if (!customer) { navigate('/'); return null; }
  if (items.length === 0) { navigate('/menu'); return null; }

  const handleApplyCoupon = async (codeToUse) => {
    const targetCode = (codeToUse || couponCodeInput).trim();
    if (!targetCode) return toast.error('Enter a coupon code');

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const { data } = await api.post('/coupons/validate', {
        code: targetCode,
        subtotal: total,
      });
      setAppliedCoupon(data);
      setCouponCodeInput(data.coupon.code);
      toast.success(data.message);
    } catch (err) {
      setAppliedCoupon(null);
      const errMsg = err.response?.data?.error || 'Invalid or expired coupon code';
      setCouponError(errMsg);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
    toast.success('Coupon removed');
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  const handleOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customerId: customer.id,
        items: items.map((i) => {
          let custStr = i.customizations || null;
          if (!custStr && i.name && i.name.includes('(')) {
            custStr = i.name.substring(i.name.indexOf('(') + 1, i.name.lastIndexOf(')'));
          }
          return {
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.price,
            customizations: custStr,
          };
        }),
        paymentMethod: method,
        couponCode: appliedCoupon?.coupon?.code || undefined,
        discount: discountAmount > 0 ? discountAmount : undefined,
        note: note.trim() || undefined,
      });
      clearCart();
      setLastOrderId(data.order.id);
      toast.success('Order placed! Your order is on the way.');
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
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-muted)' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{total.toFixed(0)}</span>
            </div>

            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#15803d', fontWeight: 700 }}>
                <span>Coupon Discount ({appliedCoupon.coupon.code})</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginTop: 4, paddingTop: 8, borderTop: '1.5px dashed var(--color-border)' }}>
              <span>Payable Total</span>
              <span style={{ color: 'var(--color-accent-dark)' }}>₹{finalTotal.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>

        {/* ── COUPON CODE CARD ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Tag size={18} color="var(--color-accent)" />
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Apply Coupon Code</h3>
          </div>

          {/* Input & Apply Button */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Enter coupon code (e.g. WELCOME50)"
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              disabled={validatingCoupon || !!appliedCoupon}
              className="input-field"
              style={{ flex: 1, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <X size={15} /> Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                disabled={validatingCoupon || !couponCodeInput.trim()}
                className="btn-primary"
                style={{ padding: '0 20px', borderRadius: 10, fontSize: 14 }}
              >
                {validatingCoupon ? 'Applying…' : 'Apply'}
              </button>
            )}
          </div>

          {/* Validation Feedback Banner */}
          <AnimatePresence mode="wait">
            {appliedCoupon && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#15803d', fontWeight: 700, marginBottom: 10 }}>
                <Check size={16} />
                <span>Coupon {appliedCoupon.coupon.code} applied! Saved ₹{appliedCoupon.discountAmount}</span>
              </motion.div>
            )}

            {couponError && !appliedCoupon && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 10 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{couponError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick-apply Coupons List */}
          {availableCoupons.length > 0 && !appliedCoupon && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                Available Coupons
              </p>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {availableCoupons.map((c) => {
                  const meetsMin = total >= c.minOrderAmount;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      style={{
                        padding: '8px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                        background: meetsMin ? 'var(--color-accent-bg)' : 'var(--color-surface)',
                        border: meetsMin ? '1.5px solid var(--color-accent-border)' : '1px solid var(--color-border)',
                        flexShrink: 0, transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Sparkles size={12} color="var(--color-accent)" />
                        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--color-accent-dark)' }}>{c.code}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--color-text)', fontWeight: 600 }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`}
                      </p>
                      <p style={{ fontSize: 10, color: meetsMin ? '#15803d' : 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>
                        {c.minOrderAmount > 0 ? `Min order ₹${c.minOrderAmount}` : 'No minimum'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
              : <>Place Order · ₹{finalTotal.toFixed(0)} <ChevronRight size={19} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
