import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Coffee, Search, Plus, Check, ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

function MenuCard({ item, onAdd, inCart }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Image */}
      <div style={{
        height: '140px', background: 'var(--color-surface)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
      }}>
        {item.image ? (
          <img src={item.image.startsWith('/') ? item.image : item.image} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ fontSize: '40px' }}>
            {getCategoryEmoji(item.category?.name)}
          </div>
        )}
        {inCart > 0 && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'var(--color-accent)', color: '#1a0800',
            borderRadius: '99px', padding: '2px 8px', fontSize: '12px', fontWeight: 700
          }}>
            {inCart} in cart
          </div>
        )}
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.3 }}>{item.name}</h3>
        {item.description && (
          <p style={{ color: 'var(--color-muted)', fontSize: '13px', lineHeight: 1.5, flex: 1 }}>
            {item.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-accent)' }}>
            ₹{item.price}
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAdd}
            style={{
              width: 36, height: 36, borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: added ? '#22c55e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            {added ? <Check size={18} color="#fff" /> : <Plus size={18} color="#1a0800" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function getCategoryEmoji(name) {
  const map = {
    'Coffee': '☕', 'Cold Drinks': '🧋', 'Snacks': '🥪',
    'Desserts': '🍰', 'Meals': '🍽️'
  };
  return map[name] || '🍴';
}

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const { items: cartItems, addItem, removeItem, updateQuantity, total, count } = useCartStore();

  useEffect(() => {
    if (!customer) { navigate('/'); return; }
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data } = await api.get('/menu');
      setCategories(data.categories);
      if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (item) => {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image: item.image });
    toast.success(`${item.name} added!`, { duration: 1200 });
  };

  const getCartQty = (itemId) => {
    const ci = cartItems.find((i) => i.menuItemId === itemId);
    return ci ? ci.quantity : 0;
  };

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase())
    )
  })).filter((cat) => cat.items.length > 0);

  const displayCategories = search ? filteredCategories : categories.filter((c) =>
    activeCategory ? c.id === activeCategory : true
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '100px' }}>
      {/* Header */}
      <div className="glass" style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 style={{ fontWeight: 800, fontSize: '20px' }}>
                  <span className="gradient-text">Our Menu</span>
                </h1>
                <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>Hey {customer?.name}! 👋</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              style={{
                position: 'relative', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', borderRadius: '14px', padding: '10px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', color: '#1a0800', fontWeight: 700
              }}
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#ef4444', color: '#fff', borderRadius: '99px',
                    width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '11px', fontWeight: 700
                  }}
                >
                  {count}
                </motion.span>
              )}
              {count > 0 ? `₹${total.toFixed(0)}` : 'Cart'}
            </motion.button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '14px' }}
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div style={{ padding: '16px 20px 0', maxWidth: '768px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '99px', border: 'none',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px',
                  transition: 'all 0.2s',
                  background: activeCategory === cat.id ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--color-card)',
                  color: activeCategory === cat.id ? '#1a0800' : 'var(--color-muted)',
                  boxShadow: activeCategory === cat.id ? '0 4px 12px rgba(245,158,11,0.25)' : 'none',
                  border: activeCategory === cat.id ? 'none' : '1px solid var(--color-border)'
                }}
              >
                {getCategoryEmoji(cat.name)} {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '20px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: '220px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : (
          <>
            {displayCategories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <p>No items found</p>
              </div>
            )}
            {displayCategories.map((cat) => (
              <div key={cat.id} style={{ marginBottom: '32px' }}>
                {search && (
                  <h2 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '16px', color: 'var(--color-accent)' }}>
                    {getCategoryEmoji(cat.name)} {cat.name}
                  </h2>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {cat.items.map((item) => (
                    <MenuCard key={item.id} item={item} onAdd={handleAdd} inCart={getCartQty(item.id)} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100 }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '400px',
                background: 'var(--color-card)', borderLeft: '1px solid var(--color-border)',
                zIndex: 101, display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontWeight: 700, fontSize: '20px' }}>Your Cart</h2>
                <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                  <X size={22} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cartItems.map((item) => (
                      <div key={item.menuItemId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--color-surface)', borderRadius: '12px', padding: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</p>
                          <p style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '14px' }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            −
                          </button>
                          <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--color-accent)', border: 'none', color: '#1a0800', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-accent)' }}>₹{total.toFixed(0)}</span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => { setCartOpen(false); navigate('/checkout'); }}
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {count > 0 && !cartOpen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 90 }}
        >
          <button
            onClick={() => navigate('/checkout')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '99px', boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}
          >
            <ShoppingCart size={20} />
            {count} item{count > 1 ? 's' : ''} · ₹{total.toFixed(0)}
            <ArrowRight size={18} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
