import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Coffee, CreditCard, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'Cash on Pickup',
    description: 'Pay cash when you collect your order',
    icon: Wallet,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  {
    id: 'cafe',
    label: 'Order in Café',
    description: 'Dine in and pay at the counter',
    icon: Coffee,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'online',
    label: 'Pay Online',
    description: 'Coming soon — UPI & Card payments',
    icon: CreditCard,
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.06)',
    border: 'rgba(107, 114, 128, 0.15)',
    disabled: true,
  },
];

export default function Checkout() {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const customer = useCustomerStore((s) => s.customer);
  const { items, total, count, clearCart } = useCartStore();

  if (!customer) { navigate('/'); return null; }
  if (items.length === 0) { navigate('/menu'); return null; }

  const handlePlaceOrder = async () => {
    if (!selectedMethod) return toast.error('Please select a payment method');

    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customerId: customer.id,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        paymentMethod: selectedMethod,
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '120px' }}>
      {/* Header */}
      <div className="glass" style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontWeight: 800, fontSize: '20px' }}>
            <span className="gradient-text">Checkout</span>
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Customer info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1a0800', fontWeight: 800, fontSize: '18px'
          }}>
            {customer.name[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700 }}>{customer.name}</p>
            <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>{customer.phone}</p>
          </div>
        </motion.div>

        {/* Order Items Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass"
          style={{ borderRadius: '16px', padding: '16px', marginBottom: '20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontWeight: 700 }}>Order Summary ({count} items)</h3>
            <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: '13px' }}>Edit</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {items.map((item) => (
              <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--color-muted)' }}>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-accent)' }}>₹{total.toFixed(0)}</span>
          </div>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '20px' }}
        >
          <h2 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '12px' }}>How would you like to pay?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <motion.button
                  key={method.id}
                  whileTap={!method.disabled ? { scale: 0.98 } : {}}
                  onClick={() => !method.disabled && setSelectedMethod(method.id)}
                  style={{
                    width: '100%', padding: '16px', borderRadius: '14px', textAlign: 'left',
                    cursor: method.disabled ? 'not-allowed' : 'pointer',
                    border: isSelected ? `2px solid ${method.color}` : `1.5px solid ${method.disabled ? 'var(--color-border)' : method.border}`,
                    background: isSelected ? method.bg : 'var(--color-card)',
                    opacity: method.disabled ? 0.5 : 1,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'Outfit, sans-serif'
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                    background: isSelected ? method.bg : 'var(--color-surface)',
                    border: `1px solid ${method.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={22} color={method.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', color: isSelected ? method.color : 'var(--color-text)' }}>
                      {method.label}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
                      {method.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: method.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1" stroke="#1a0800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Special note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: '20px' }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            <FileText size={14} /> Special Instructions (optional)
          </label>
          <textarea
            className="input-field"
            rows={2}
            placeholder="e.g. Extra spicy, less sugar, no ice..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </motion.div>
      </div>

      {/* Place Order CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 100%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', fontSize: '17px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" /> Placing Order...</>
            ) : (
              <>Place Order · ₹{total.toFixed(0)} <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
