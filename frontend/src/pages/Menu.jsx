import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, ArrowLeft, X, Minus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

const CATEGORY_EMOJI = {
  'Coffee': '☕', 'Cold Drinks': '🧋', 'Snacks': '🥪', 'Desserts': '🍰', 'Meals': '🍽️'
};

function MenuCard({ item, onAdd, onUpdate, cartQty }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card"
      style={{ overflow: 'visible', position: 'relative' }}>

      {/* Image */}
      <div style={{ height: 130, background: 'var(--color-surface)', overflow: 'hidden', borderRadius: '14px 14px 0 0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.image
          ? <img src={item.image.startsWith('/') ? `http://localhost:5001${item.image}` : item.image}
              alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 42 }}>{CATEGORY_EMOJI[item.category?.name] || '🍴'}</span>
        }
      </div>

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{item.name}</h3>
        {item.description && <p style={{ color: 'var(--color-muted)', fontSize: 12, lineHeight: 1.5 }}>{item.description}</p>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-accent-dark)' }}>₹{item.price}</span>

          <AnimatePresence mode="wait" initial={false}>
            {cartQty === 0 ? (
              /* ── Plain ADD button ── */
              <motion.button
                key="add"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => onAdd(item)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #e8901f, #c2700f)',
                  boxShadow: '0 3px 10px rgba(194,112,15,0.3)',
                }}
              >
                <Plus size={18} color="#fff" strokeWidth={2.5} />
              </motion.button>
            ) : (
              /* ── Stepper: − qty + ── */
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.8, width: 36 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.8, width: 36 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  background: 'linear-gradient(135deg, #e8901f, #c2700f)',
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: '0 3px 10px rgba(194,112,15,0.3)',
                }}
              >
                {/* − */}
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => onUpdate(item.id, cartQty - 1)}
                  style={{ width: 32, height: 36, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Minus size={15} strokeWidth={2.8} />
                </motion.button>

                {/* qty */}
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={cartQty}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#fff', userSelect: 'none' }}>
                    {cartQty}
                  </motion.span>
                </AnimatePresence>

                {/* + */}
                <motion.button whileTap={{ scale: 0.85 }}
                  onClick={() => onAdd(item)}
                  style={{ width: 32, height: 36, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Plus size={15} strokeWidth={2.8} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const { items: cartItems, addItem, updateQuantity, total, count } = useCartStore();

  const getQty = (id) => cartItems.find((i) => i.menuItemId === id)?.quantity || 0;

  const handleAdd = (item) => {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image: item.image });
    toast.success(`${item.name} added!`, { duration: 900, icon: '☕' });
  };

  const handleUpdate = (menuItemId, qty) => {
    updateQuantity(menuItemId, qty); // qty 0 = remove
  };

  useEffect(() => {
    if (!customer) { navigate('/'); return; }
    api.get('/menu').then(({ data }) => {
      setCategories(data.categories);
      if (data.categories[0]) setActiveCategory(data.categories[0].id);
    }).catch(() => toast.error('Failed to load menu')).finally(() => setLoading(false));
  }, []);


  const displayCategories = search
    ? categories.map((c) => ({ ...c, items: c.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase())) })).filter((c) => c.items.length)
    : categories.filter((c) => c.id === activeCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 96 }}>
      {/* Sticky header */}
      <div className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--color-border)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontWeight: 800, fontSize: 18 }}><span className="gradient-text">Menu</span></h1>
              <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Hey {customer?.name}! 👋</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              style={{
                position: 'relative', background: 'linear-gradient(135deg, #e8901f, #c2700f)', border: 'none',
                borderRadius: 12, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: '#fff', fontWeight: 700, fontSize: 14
              }}
            >
              <ShoppingCart size={17} />
              {count > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff', borderRadius: 99, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                  {count}
                </motion.span>
              )}
              {count > 0 ? `₹${total.toFixed(0)}` : 'Cart'}
            </motion.button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} />
            <input className="input-field" style={{ paddingLeft: 34, padding: '9px 12px 9px 34px', fontSize: 14 }}
              placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {categories.map((cat) => (
              <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat.id)}
                style={{
                  whiteSpace: 'nowrap', padding: '7px 15px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                  background: activeCategory === cat.id ? 'linear-gradient(135deg, #e8901f, #c2700f)' : '#fff',
                  color: activeCategory === cat.id ? '#fff' : 'var(--color-text-secondary)',
                  border: activeCategory === cat.id ? 'none' : '1px solid var(--color-border)',
                  boxShadow: activeCategory === cat.id ? '0 3px 10px rgba(194,112,15,0.25)' : 'none',
                }}>{CATEGORY_EMOJI[cat.name]} {cat.name}</motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 210, borderRadius: 14 }} />)}
          </div>
        ) : (
          displayCategories.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}><div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div><p>No items found</p></div>
            : displayCategories.map((cat) => (
              <div key={cat.id} style={{ marginBottom: 24 }}>
                {search && <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--color-accent-dark)' }}>{CATEGORY_EMOJI[cat.name]} {cat.name}</h2>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
                  {cat.items.map((item) => <MenuCard key={item.id} item={item} onAdd={handleAdd} onUpdate={handleUpdate} cartQty={getQty(item.id)} />)}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(30,15,5,0.4)', zIndex: 100 }} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 380, background: '#fff', borderLeft: '1px solid var(--color-border)', zIndex: 101, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontWeight: 800, fontSize: 18 }}>Your Cart</h2>
                <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                {cartItems.length === 0
                  ? <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--color-muted)' }}><span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🛒</span><p>Cart is empty</p></div>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {cartItems.map((item) => (
                        <div key={item.menuItemId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-surface)', borderRadius: 12, padding: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</p>
                            <p style={{ color: 'var(--color-accent-dark)', fontWeight: 700, fontSize: 13 }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                              style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Minus size={13} />
                            </button>
                            <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', fontSize: 14 }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                              style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              {cartItems.length > 0 && (
                <div style={{ padding: '16px 18px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontWeight: 800, fontSize: 17 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-accent-dark)' }}>₹{total.toFixed(0)}</span>
                  </div>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setCartOpen(false); navigate('/checkout'); }}>
                    Checkout →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating checkout */}
      {count > 0 && !cartOpen && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 90 }}>
          <button onClick={() => navigate('/checkout')} className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 26px', borderRadius: 99, boxShadow: '0 6px 24px rgba(194,112,15,0.35)', fontSize: 15 }}>
            <ShoppingCart size={18} /> {count} item{count > 1 ? 's' : ''} · ₹{total.toFixed(0)} <ArrowRight size={16} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
