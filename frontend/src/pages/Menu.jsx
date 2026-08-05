import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, Plus, ArrowLeft, X, Minus, ArrowRight, Coffee, Utensils, ClipboardList, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';
import useCustomerStore from '../store/useCustomerStore';

/* ─── Cart bottom snackbar ─── */
function CartSnackbar({ count, total, lastAdded, onCheckout }) {
  if (count === 0) return null;
  return (
    // Static outer container handles position — Framer Motion doesn't fight transform
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 0,
      right: 0,
      zIndex: 90,
      display: 'flex',
      justifyContent: 'center',
      padding: '0 16px',
      pointerEvents: 'none', // let clicks pass through transparent area
    }}>
      <AnimatePresence mode="wait">
        {lastAdded ? (
          <motion.div key="added"
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              width: '100%', maxWidth: 440,
              pointerEvents: 'auto',
              background: '#1a0f05', color: '#fff', borderRadius: 16,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}>
            <Coffee size={18} color="var(--color-accent)" />
            <p style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
              <span style={{ color: 'var(--color-accent-light)' }}>{lastAdded}</span> added to cart
            </p>
            <span style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 99,
              padding: '3px 10px', fontSize: 12, fontWeight: 700,
            }}>{count} item{count !== 1 ? 's' : ''}</span>
          </motion.div>
        ) : (
          <motion.button key="checkout"
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCheckout}
            style={{
              width: '100%', maxWidth: 440,
              pointerEvents: 'auto',
              background: 'var(--color-accent)', color: '#fff',
              borderRadius: 16, padding: '14px 20px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              boxShadow: '0 8px 24px var(--btn-shadow)', fontFamily: 'Outfit',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ShoppingCart size={18} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {count} item{count !== 1 ? 's' : ''}
              </span>
            </div>
            <span style={{ flex: 1 }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>₹{total.toFixed(0)}</span>
            <span style={{ margin: '0 10px', opacity: 0.5 }}>·</span>
            <span style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
              Checkout <ArrowRight size={16} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Menu card ─── */
function MenuCard({ item, onAdd, onUpdate, cartQty, onClickCard }) {
  const imgSrc = item.image || null;
  const rating = (4.5 + (item.id % 5) * 0.1).toFixed(1);

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card"
      onClick={() => onClickCard && onClickCard(item)}
      style={{ overflow: 'visible', position: 'relative', cursor: 'pointer' }}>
      {/* Image */}
      <div style={{ height: 130, background: 'var(--color-surface)', overflow: 'hidden', borderRadius: '14px 14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {imgSrc
          ? <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Utensils size={34} color="var(--color-muted-light)" />}

        {/* Rating star badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '3px 8px', borderRadius: 99,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
          fontSize: 11, fontWeight: 800, color: '#1a0f05',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
        }}>
          <Star size={11} fill="#e8901f" color="#e8901f" />
          <span>{rating}</span>
        </div>
      </div>

      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{item.name}</h3>
        {item.description && (
          <p style={{ color: 'var(--color-muted)', fontSize: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-accent-dark)' }}>₹{item.price}</span>

          <AnimatePresence mode="wait" initial={false}>
            {cartQty === 0 ? (
              <motion.button key="add"
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => { e.stopPropagation(); onAdd(item); }}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-accent)',
                  boxShadow: '0 3px 10px var(--btn-shadow)',
                }}>
                <Plus size={18} color="#fff" strokeWidth={2.5} />
              </motion.button>
            ) : (
              <motion.div key="stepper"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex', alignItems: 'center',
                  background: 'var(--color-accent)',
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: '0 3px 10px var(--btn-shadow)',
                }}>
                <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onUpdate(item.id, cartQty - 1); }}
                  style={{ width: 32, height: 36, border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Minus size={15} strokeWidth={2.8} />
                </motion.button>
                <AnimatePresence mode="popLayout">
                  <motion.span key={cartQty}
                    initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#fff', userSelect: 'none' }}>
                    {cartQty}
                  </motion.span>
                </AnimatePresence>
                <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onAdd(item); }}
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

/* ─── Item Detail Floating Modal ─── */
function ItemDetailModal({ itemData, onClose, onAdd, onUpdate, cartQty }) {
  if (!itemData) return null;
  const { item, catName } = itemData;
  const imgSrc = item.image || null;
  const rating = (4.5 + (item.id % 5) * 0.1).toFixed(1);
  const reviewsCount = 18 + (item.id * 7) % 45;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(26,15,5,0.45)',
          backdropFilter: 'blur(6px)', zIndex: 110,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 24 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 24,
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden'
          }}>
          {/* Header Image */}
          <div style={{ position: 'relative', height: 210, background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imgSrc ? (
              <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Utensils size={48} color="var(--color-muted-light)" />
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 99,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              <X size={18} />
            </button>

            {/* Rating badge */}
            <div style={{
              position: 'absolute', bottom: 12, left: 12,
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              fontSize: 13, fontWeight: 800, color: '#1a0f05'
            }}>
              <Star size={14} fill="#e8901f" color="#e8901f" />
              <span>{rating}</span>
              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>({reviewsCount} reviews)</span>
            </div>
          </div>

          {/* Details Body */}
          <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catName && (
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-accent)', background: 'var(--color-accent-bg)', padding: '3px 10px', borderRadius: 99, width: 'fit-content' }}>
                {catName}
              </span>
            )}

            <div>
              <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{item.name}</h2>
              <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-accent-dark)' }}>₹{item.price}</span>
            </div>

            {/* Description */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 14, border: '1px solid var(--color-border)' }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>About this item</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                {item.description || 'Freshly prepared using premium quality ingredients. Served hot & fresh for the best café experience.'}
              </p>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Total</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>₹{((cartQty || 1) * item.price).toFixed(0)}</p>
              </div>

              {cartQty === 0 ? (
                <button
                  className="btn-primary"
                  onClick={() => onAdd(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', fontSize: 15 }}>
                  <Plus size={18} /> Add to Cart
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-accent)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 14px var(--btn-shadow)' }}>
                  <button onClick={() => onUpdate(item.id, cartQty - 1)} style={{ width: 40, height: 42, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={16} strokeWidth={2.8} />
                  </button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 800, fontSize: 16, color: '#fff' }}>{cartQty}</span>
                  <button onClick={() => onAdd(item)} style={{ width: 40, height: 42, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} strokeWidth={2.8} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Cart drawer ─── */
function CartDrawer({ open, onClose, cartItems, updateQuantity, addItem, total, navigate }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(30,15,5,0.4)', zIndex: 100 }} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 380, background: '#fff', borderLeft: '1px solid var(--color-border)', zIndex: 101, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Your Cart</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              {cartItems.length === 0
                ? <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--color-muted)' }}><ShoppingCart size={38} style={{ margin: '0 auto 10px', display: 'block' }} /><p>Cart is empty</p></div>
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
                          <button onClick={() => addItem(item)}
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
                  <span>Total</span><span style={{ color: 'var(--color-accent-dark)' }}>₹{total.toFixed(0)}</span>
                </div>
                <button className="btn-primary" style={{ width: '100%' }}
                  onClick={() => { onClose(); navigate('/checkout'); }}>
                  Checkout →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════ MENU PAGE ═══════════════════ */
export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [snackTimer, setSnackTimer] = useState(null);
  const [selectedItemData, setSelectedItemData] = useState(null);

  const navigate = useNavigate();
  const customer = useCustomerStore((s) => s.customer);
  const lastOrderId = useCustomerStore((s) => s.lastOrderId);
  const { items: cartItems, addItem, updateQuantity, total, count } = useCartStore();

  const [siteSettings, setSiteSettings] = useState(null);
  const [reviewDismissed, setReviewDismissed] = useState(
    () => localStorage.getItem('review_dismissed') === 'true'
  );

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSiteSettings(data.settings)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!customer) { navigate('/'); return; }
    api.get('/menu').then(({ data }) => {
      setCategories(data.categories.filter((c) => c.items?.length > 0)); // only categories with items
    }).catch(() => toast.error('Failed to load menu')).finally(() => setLoading(false));
  }, []);

  const getQty = useCallback((id) =>
    cartItems.find((i) => i.menuItemId === id)?.quantity || 0,
    [cartItems]
  );

  const handleAdd = (item) => {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, image: item.image });
    // Snackbar flash
    setLastAdded(item.name);
    if (snackTimer) clearTimeout(snackTimer);
    const t = setTimeout(() => setLastAdded(null), 2500);
    setSnackTimer(t);
  };

  const handleUpdate = (menuItemId, qty) => updateQuantity(menuItemId, qty);

  const displayCategories = search
    ? categories
        .map((c) => ({
          ...c,
          items: c.items.filter((i) =>
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            (i.description || '').toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((c) => c.items.length > 0)
    : categories; // Show ALL categories as sections

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 100 }}>
      {/* ── Sticky header ── */}
      <div className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--color-border)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 768, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontWeight: 800, fontSize: 18 }}>Menu</h1>
              <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Hey {customer?.name}!</p>
            </div>
            {/* Orders button — visible after at least one order placed */}
            {lastOrderId && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
                onClick={() => navigate(`/order/${lastOrderId}`)}
                style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '8px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: 'var(--color-muted)' }}>
                <ClipboardList size={15} />
                <span>Orders</span>
              </motion.button>
            )}
            {/* Cart icon — only shown when items in cart, opens drawer */}
            {count > 0 && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                style={{ position: 'relative', background: 'var(--color-surface)', border: '1.5px solid var(--color-accent-border)', borderRadius: 12, padding: '8px 13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, color: 'var(--color-accent-dark)' }}>
                <ShoppingCart size={16} />
                <span>{count}</span>
                <span style={{
                  position: 'absolute', top: -6, right: -6, background: 'var(--color-accent)',
                  color: '#fff', borderRadius: 99, width: 18, height: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800
                }}>{count}</span>
              </motion.button>
            )}
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-light)' }} />
            <input className="input-field" style={{ paddingLeft: 34, padding: '9px 12px 9px 34px', fontSize: 14 }}
              placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category quick-jump pills ── */}
      {!search && categories.length > 1 && (
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '10px 16px 0' }}>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
            {categories.map((cat) => (
              <button key={cat.id}
                onClick={() => document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  whiteSpace: 'nowrap', padding: '6px 14px', borderRadius: 99, border: '1px solid var(--color-border)',
                  cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600, fontSize: 13,
                  background: '#fff', color: 'var(--color-text-secondary)', transition: 'all 0.15s',
                }}>{cat.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Items — ALL categories shown as sections ── */}
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '14px 16px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 210, borderRadius: 14 }} />)}
          </div>
        ) : displayCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
            <Search size={36} style={{ margin: '0 auto 10px', display: 'block' }} />
            <p>No items found for "{search}"</p>
          </div>
        ) : (
          displayCategories.map((cat) => (
            <div key={cat.id} id={`cat-${cat.id}`} style={{ marginBottom: 28, scrollMarginTop: 130 }}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <h2 style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-text)' }}>{cat.name}</h2>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600 }}>
                  {cat.items.length} item{cat.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              {/* Items grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: 14 }}>
                {cat.items.map((item) => (
                  <MenuCard key={item.id} item={item}
                    cartQty={getQty(item.id)} onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onClickCard={(it) => setSelectedItemData({ item: it, catName: cat.name })} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* ── Google Review Banner ── */}
        <AnimatePresence>
          {siteSettings?.showReviewBanner && siteSettings?.googleReviewLink && !reviewDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
              style={{ padding: '0 4px', marginTop: 8, marginBottom: 8 }}
            >
              <a href={siteSettings.googleReviewLink} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: 'var(--color-accent-bg)',
                  border: '1.5px solid var(--color-accent-border)', borderRadius: 16,
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  position: 'relative', boxShadow: '0 2px 12px var(--card-shadow)',
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star size={20} color="#fff" fill="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-accent-dark)', marginBottom: 2 }}>Enjoying your visit?</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 500 }}>Leave us a Google review — it means a lot!</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReviewDismissed(true); localStorage.setItem('review_dismissed', 'true'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', flexShrink: 0 }}>
                    <X size={15} />
                  </button>
                </div>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Cart drawer ── */}
      <CartDrawer
        open={cartOpen} onClose={() => setCartOpen(false)}
        cartItems={cartItems} updateQuantity={updateQuantity}
        addItem={addItem} total={total} navigate={navigate}
      />

      {/* ── Item Detail Floating Card Modal ── */}
      <ItemDetailModal
        itemData={selectedItemData}
        onClose={() => setSelectedItemData(null)}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        cartQty={selectedItemData ? getQty(selectedItemData.item.id) : 0}
      />

      {/* ── Bottom snackbar ── */}
      <CartSnackbar
        count={count} total={total}
        lastAdded={lastAdded}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
}
