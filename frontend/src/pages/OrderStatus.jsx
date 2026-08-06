import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, CheckCircle, ChefHat, Bell, Home, RefreshCw, Clock, Star, X, Check, Banknote, House, CreditCard, Frown, ArrowRight, MessageSquare, ThumbsUp } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'placed',    label: 'Order Placed',  icon: Coffee,       desc: 'Your order has been received' },
  { key: 'accepted',  label: 'Accepted',       icon: CheckCircle,  desc: 'Café accepted your order' },
  { key: 'preparing', label: 'Preparing',      icon: ChefHat,      desc: 'Your order is being prepared' },
  { key: 'ready',     label: 'Ready!',    icon: Bell,         desc: 'Come collect your order!' },
  { key: 'completed', label: 'Completed',      icon: CheckCircle,  desc: 'Enjoy your meal!' },
];

const STATUS_STYLE = {
  placed:    { color: '#c2700f', bg: '#fef3e2', border: '#f9d89a' },
  accepted:  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  preparing: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  ready:     { color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  completed: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

const METHOD_LABEL = {
  cash:   { icon: Banknote,    label: 'Cash on Pickup' },
  cafe:   { icon: House,       label: 'Order in Café' },
  online: { icon: CreditCard,  label: 'Online Payment' },
};
const STEP_ICON = { placed: Coffee, accepted: CheckCircle, preparing: ChefHat, ready: Bell, completed: Check };

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [reviewSettings, setReviewSettings] = useState(null);
  // Customer food review state
  const [showFoodReviewModal, setShowFoodReviewModal] = useState(false);
  const [selectedItemTitle, setSelectedItemTitle] = useState('');
  const [foodRating, setFoodRating] = useState(5);
  const [foodComment, setFoodComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [orderReviewed, setOrderReviewed] = useState(() =>
    localStorage.getItem(`order_reviewed_${id}`) === 'true'
  );

  // Fetch settings for review banner
  useEffect(() => {
    api.get('/settings').then(({ data }) => setReviewSettings(data.settings)).catch(() => {});
  }, []);

  const handleFoodReviewSubmit = async (e) => {
    e.preventDefault();
    if (!foodComment.trim()) return toast.error('Please write a short review comment');
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        author: order?.customer?.name || 'Happy Customer',
        rating: foodRating,
        comment: foodComment.trim(),
        itemTitle: selectedItemTitle || (order?.items?.[0]?.menuItem?.name || 'Menu Order'),
      });
      toast.success('Thank you for reviewing your food! ⭐');
      localStorage.setItem(`order_reviewed_${id}`, 'true');
      setOrderReviewed(true);
      setShowFoodReviewModal(false);
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      setLastUpdated(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    const iv = setInterval(fetchOrder, 5000);
    return () => clearInterval(iv);
  }, [fetchOrder]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 14px', width: 28, height: 28 }} />
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading your order…</p>
      </div>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
        <Frown size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ marginBottom: 16 }}>Order not found</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    </div>
  );

  const stepIdx = STEPS.findIndex((s) => s.key === order.status);
  const ss = STATUS_STYLE[order.status] || STATUS_STYLE.placed;
  const isReady = order.status === 'ready';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 40 }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: ss.color }} />

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px', }}>
        {/* Nav bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
            <Home size={16} /> Home
          </button>
          <button onClick={fetchOrder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Hero status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            animate={isReady ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.8 }}
            style={{
              width: 88, height: 88, borderRadius: 26, margin: '0 auto 18px',
              background: ss.bg, border: `2px solid ${ss.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
              boxShadow: isReady ? `0 4px 24px ${ss.color}30` : '0 2px 12px rgba(100,60,20,0.1)'
            }}>
            {(() => { const Icon = STEP_ICON[order.status] || Coffee; return <Icon size={38} color={ss.color} />; })()}
          </motion.div>

          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 6 }}>
            {order.status === 'placed'    && 'Order Placed!'}
            {order.status === 'accepted'  && 'Order Accepted!'}
            {order.status === 'preparing' && 'Being Prepared…'}
            {order.status === 'ready'     && 'Ready for Pickup!'}
            {order.status === 'completed' && 'Completed!'}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{STEPS[stepIdx]?.desc}</p>

          {isReady && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 99, padding: '7px 14px', color: '#15803d', fontWeight: 600, fontSize: 13 }}>
              <ArrowRight size={14} /> Please collect your order at the counter
            </motion.div>
          )}
        </motion.div>

        {/* Progress timeline */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, padding: '20px 22px', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 18 }}>Order Progress</p>

          <div style={{ position: 'relative' }}>
            {/* grey track */}
            <div style={{ position: 'absolute', left: 19, top: 8, bottom: 8, width: 2, background: 'var(--color-border)' }} />
            {/* filled track */}
            <div style={{ position: 'absolute', left: 19, top: 8, width: 2, height: `${(stepIdx / (STEPS.length - 1)) * 100}%`, background: ss.color, transition: 'height 0.5s ease' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = idx < stepIdx;
                const active = idx === stepIdx;
                const StepIcon = STEP_ICON[step.key] || Coffee;
                const sc = STATUS_STYLE[step.key];
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
                    <motion.div animate={active ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{
                        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                        background: done ? '#f0fdf4' : active ? sc.bg : '#f9fafb',
                        border: `2px solid ${done ? '#86efac' : active ? sc.color : '#e5e7eb'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: active ? `0 2px 12px ${sc.color}30` : 'none'
                      }}>
                      <Icon size={17} color={done ? '#15803d' : active ? sc.color : '#9ca3af'} />
                    </motion.div>
                    <div style={{ paddingTop: 9 }}>
                      <p style={{ fontWeight: done || active ? 700 : 500, fontSize: 14, color: done ? '#15803d' : active ? sc.color : 'var(--color-muted)' }}>
                        {step.label}
                      </p>
                      {active && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{step.desc}</p>}
                    </div>
                    {active && <div style={{ marginLeft: 'auto', paddingTop: 12 }}><Clock size={13} color="var(--color-muted)" /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Order details */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Order #{order.id}</h3>
            <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>
              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: ss.bg, color: ss.color, fontWeight: 600, border: `1px solid ${ss.border}`, display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
            {(() => { const M = METHOD_LABEL[order.paymentMethod]; return M ? <><M.icon size={11} />{M.label}</> : order.paymentMethod; })()}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--color-muted)' }}>{item.menuItem?.name || item.name || 'Combo / Special Item'} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, marginBottom: 16 }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-accent-dark)' }}>₹{order.total.toFixed(0)}</span>
          </div>

          {/* ── Customer Food Review Section ── */}
          {orderReviewed ? (
            <div style={{ padding: '12px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 99, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={16} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, color: '#16a34a' }}>Thank you for your review! ⭐</p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Your food feedback helps us maintain top quality!</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setSelectedItemTitle(order?.items?.[0]?.menuItem?.name || '');
                setShowFoodReviewModal(true);
              }}
              className="btn-primary"
              style={{
                width: '100%', padding: '12px 18px', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 14, fontWeight: 800,
              }}
            >
              <Star size={16} fill="#fff" /> Rate &amp; Review Your Food
            </button>
          )}
        </motion.div>

        {lastUpdated && (
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 11 }}>
            Auto-refreshing every 5s · Last at {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}

        {/* ── Google Review Banner ── */}
        <AnimatePresence>
          {reviewSettings?.showReviewBanner && reviewSettings?.googleReviewLink &&
           !reviewDismissed && (order?.status === 'completed' || order?.status === 'ready') && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ delay: 0.5, duration: 0.4 }}
              style={{ marginTop: 18 }}
            >
              <a href={reviewSettings.googleReviewLink} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: 'var(--color-accent-bg)',
                  border: '1.5px solid var(--color-accent-border)', borderRadius: 16,
                  padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 2px 12px var(--card-shadow)', position: 'relative',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star size={22} color="#fff" fill="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-accent-dark)', marginBottom: 3 }}>
                      Enjoyed your order?
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Leave us a Google review — it means the world!
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReviewDismissed(true); localStorage.setItem('review_dismissed', 'true'); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', opacity: 0.8, display: 'flex' }}>
                    <X size={15} />
                  </button>
                </div>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Customer Food Review Modal ── */}
      <AnimatePresence>
        {showFoodReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFoodReviewModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 17 }}>Rate Your Food &amp; Order</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Order #{order?.id} · {order?.customer?.name}</p>
                </div>
                <button onClick={() => setShowFoodReviewModal(false)} style={{ background: 'var(--color-surface)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFoodReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Select Item from Order */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Select Item to Review
                  </label>
                  <select
                    className="input-field"
                    value={selectedItemTitle}
                    onChange={(e) => setSelectedItemTitle(e.target.value)}
                  >
                    {order?.items?.map((item) => {
                      const title = item.menuItem?.name || item.name || 'Combo / Special Item';
                      return (
                        <option key={item.id} value={title}>
                          🍽️ {title}
                        </option>
                      );
                    })}
                    <option value="Entire Order">🍔 Entire Order / Overall Experience</option>
                  </select>
                </div>

                {/* Rating Stars */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Your Rating *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setFoodRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <Star size={28} fill={star <= foodRating ? '#e8901f' : 'none'} color={star <= foodRating ? '#e8901f' : 'var(--color-muted)'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review comment */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Your Feedback *
                  </label>
                  <textarea className="input-field" rows={3} placeholder="How was the taste, freshness & temperature of your food?"
                    value={foodComment} onChange={(e) => setFoodComment(e.target.value)} autoFocus />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowFoodReviewModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingReview} className="btn-primary" style={{ flex: 1, padding: 12 }}>
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
