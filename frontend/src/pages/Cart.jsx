import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

export default function Cart() {
  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const { items, updateQuantity, removeItem, clearCart, total, count } = useCartStore();
  if (!customer) { navigate('/'); return null; }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 110 }}>
      {/* Header */}
      <div className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <ArrowLeft size={21} />
          </button>
          <h1 style={{ fontWeight: 800, fontSize: 19, flex: 1 }}><span className="gradient-text">Your Cart</span></h1>
          <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>({count} item{count !== 1 ? 's' : ''})</span>
          {items.length > 0 && (
            <button onClick={clearCart} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '18px 16px' }}>
        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 70, color: 'var(--color-muted)' }}>
            <ShoppingBag size={56} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.35 }} />
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: 'var(--color-text)' }}>Cart is empty</h2>
            <p style={{ marginBottom: 22, fontSize: 14 }}>Add some delicious items!</p>
            <button className="btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {items.map((item) => (
                <motion.div key={item.menuItemId} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
                  className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍴'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</p>
                    <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>₹{item.price} each</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Minus size={13} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--color-accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <div style={{ minWidth: 56, textAlign: 'right' }}>
                    <p style={{ fontWeight: 800, color: 'var(--color-accent-dark)', fontSize: 15 }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                  <button onClick={() => removeItem(item.menuItemId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Summary card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 14, color: 'var(--color-muted)' }}>
                <span>Subtotal ({count} items)</span><span>₹{total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 14, color: 'var(--color-muted)' }}>
                <span>Taxes & charges</span><span style={{ color: 'var(--color-green)' }}>FREE</span>
              </div>
              <div style={{ height: 1, background: 'var(--color-border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18 }}>
                <span>Total</span><span style={{ color: 'var(--color-accent-dark)' }}>₹{total.toFixed(2)}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 18, background: 'linear-gradient(to top, var(--color-bg) 50%, transparent)' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button className="btn-primary" style={{ width: '100%', fontSize: 16, padding: 16 }} onClick={() => navigate('/checkout')}>
              Proceed to Checkout → ₹{total.toFixed(0)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
