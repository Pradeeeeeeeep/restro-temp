import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

export default function Cart() {
  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const { items, updateQuantity, removeItem, clearCart, total, count } = useCartStore();

  if (!customer) { navigate('/'); return null; }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '120px' }}>
      {/* Header */}
      <div className="glass" style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ fontWeight: 800, fontSize: '20px' }}>
            <span className="gradient-text">Your Cart</span>
          </h1>
          <span style={{ color: 'var(--color-muted)', fontSize: '14px' }}>({count} item{count !== 1 ? 's' : ''})</span>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--color-muted)' }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ fontWeight: 700, fontSize: '22px', marginBottom: '8px', color: 'var(--color-text)' }}>Cart is empty</h2>
            <p style={{ marginBottom: '24px' }}>Add some delicious items from the menu!</p>
            <button className="btn-primary" onClick={() => navigate('/menu')}>
              Browse Menu
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {items.map((item) => (
                <motion.div
                  key={item.menuItemId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="card"
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: '12px', background: 'var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0
                  }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                    ) : '🍴'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '15px' }}>{item.name}</p>
                    <p style={{ color: 'var(--color-muted)', fontSize: '13px' }}>₹{item.price} each</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      style={{ width: 32, height: 32, borderRadius: '10px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      style={{ width: 32, height: 32, borderRadius: '10px', background: 'var(--color-accent)', border: 'none', color: '#1a0800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={{ minWidth: '60px', textAlign: 'right' }}>
                    <p style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '16px' }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{ borderRadius: '20px', padding: '20px' }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-muted)' }}>
                <span>Subtotal ({count} items)</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--color-muted)' }}>
                <span>Taxes & charges</span>
                <span style={{ color: '#22c55e' }}>FREE</span>
              </div>
              <div style={{ height: '1px', background: 'var(--color-border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '20px' }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-accent)' }}>₹{total.toFixed(2)}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Checkout button */}
      {items.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 100%)' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button
              className="btn-primary"
              style={{ width: '100%', fontSize: '16px', padding: '16px' }}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout → ₹{total.toFixed(0)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
