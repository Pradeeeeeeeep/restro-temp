import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Clock, Plus, Check } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import toast from 'react-hot-toast';

export const DEFAULT_FAST_FOOD_COMBOS = [
  {
    id: 'combo-1',
    name: 'Crispy Burger Saver Combo',
    desc: 'Double Cheeseburger + Large Golden Fries + Chilled Coke Float',
    originalPrice: 309,
    comboPrice: 249,
    savings: 60,
    badge: 'BESTSELLER ⚡',
    available: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'combo-2',
    name: 'Cheesy Pizza Party Combo',
    desc: 'Medium Loaded Farmhouse Pizza + Stuffed Garlic Bread + Choco Lava Cake',
    originalPrice: 509,
    comboPrice: 399,
    savings: 110,
    badge: 'POPULAR COMBO 🔥',
    available: true,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'combo-3',
    name: 'Family Crispy Bucket Combo',
    desc: '8pc Spicy Crispy Chicken/Paneer Wings + 2 Dips + 2 Chilled Iced Teas',
    originalPrice: 619,
    comboPrice: 499,
    savings: 120,
    badge: 'MEGA SAVER 🎉',
    available: true,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80',
  }
];

export function getStoredCombos() {
  try {
    const raw = localStorage.getItem('admin_combos');
    if (!raw) return DEFAULT_FAST_FOOD_COMBOS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FAST_FOOD_COMBOS;
  }
}

export function isCombosSectionEnabled() {
  return localStorage.getItem('admin_combos_enabled') !== 'false';
}

/* ─── 1. Express Pickup Countdown Timer ─── */
export function PickupTimerWidget({ initialMinutes = 15 }) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedSecs = secs < 10 ? `0${secs}` : secs;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        color: '#ffffff',
        borderRadius: 16,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: 12,
        boxShadow: '0 8px 24px rgba(220,38,38,0.35)',
        border: '2px solid #ffc72c',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#ffc72c', color: '#1a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Clock size={22} className="pulse" />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ffc72c' }}>
            ⚡ EXPRESS PICKUP GUARANTEE
          </p>
          <p style={{ fontSize: 11, opacity: 0.95, fontWeight: 600 }}>
            Fresh &amp; Hot in {mins}m {formattedSecs}s or free upgrade!
          </p>
        </div>
      </div>
      <div style={{ background: '#ffffff', color: '#dc2626', padding: '6px 14px', borderRadius: 99, fontWeight: 900, fontSize: 16, fontFamily: 'Outfit', letterSpacing: '1px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        {mins}:{formattedSecs}
      </div>
    </motion.div>
  );
}

/* ─── 2. Big Fast Food CTA Banner ─── */
export function FastFoodBigCTA({ onOrderClick }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        borderRadius: 20,
        padding: '24px 20px',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(220,38,38,0.30)',
        border: '3px solid #ffc72c',
        marginBottom: 24,
      }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#ffc72c', color: '#1a0000',
        padding: '5px 16px', borderRadius: 99,
        fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px',
        marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <Zap size={15} fill="#1a0000" /> FAST FOOD EXPRESS PICKUP
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, marginBottom: 8, color: '#ffffff' }}>
        HUNGRY? GET HOT &amp; CRISPY MEALS IN 15 MINS! 🍔🍟
      </h2>
      <p style={{ fontSize: 13, color: '#ffe6a5', fontWeight: 600, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.4 }}>
        Skip the line! Order fast food burgers, pizzas &amp; buckets now and pick up hot &amp; fresh.
      </p>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onOrderClick}
        style={{
          width: '100%', maxWidth: 360, margin: '0 auto',
          padding: '16px 28px', borderRadius: 16,
          background: 'linear-gradient(135deg, #ffc72c, #f59e0b)',
          color: '#1a0000', border: 'none', cursor: 'pointer',
          fontWeight: 900, fontSize: 17, fontFamily: 'Outfit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(255,199,44,0.5)',
          letterSpacing: '0.3px',
        }}
      >
        <Flame size={22} fill="#1a0000" />
        <span>START EXPRESS ORDER NOW</span>
      </motion.button>
    </motion.div>
  );
}

import api from '../api/axios';

/* ─── 3. Combo Cards Section (Fetches active DB combos) ─── */
export function FastFoodComboCards() {
  const addItem = useCartStore((s) => s.addItem);
  const [animatingId, setAnimatingId] = useState(null);
  const [combos, setCombos] = useState([]);
  const [enabled, setEnabled] = useState(isCombosSectionEnabled());

  const fetchCombos = async () => {
    try {
      const { data } = await api.get('/combos');
      if (data.combos) {
        setCombos(data.combos);
      }
    } catch {
      setCombos(DEFAULT_FAST_FOOD_COMBOS);
    }
  };

  useEffect(() => {
    fetchCombos();
    const handleUpdate = () => {
      fetchCombos();
      setEnabled(isCombosSectionEnabled());
    };
    window.addEventListener('combos-updated', handleUpdate);
    return () => window.removeEventListener('combos-updated', handleUpdate);
  }, []);

  // Filter only available/active combos
  const activeCombos = combos.filter((c) => c.available !== false);

  if (!enabled || activeCombos.length === 0) return null;

  const handleAddCombo = (combo) => {
    addItem({
      menuItemId: `combo-${combo.id}`,
      name: combo.name,
      price: combo.comboPrice,
      image: combo.image,
    });
    setAnimatingId(combo.id);
    toast.success(`Added ${combo.name} to cart! 🍔`, {
      style: { background: '#dc2626', color: '#fff', fontWeight: 700 }
    });
    setTimeout(() => setAnimatingId(null), 700);
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontWeight: 900, fontSize: 19, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
            <Flame size={20} color="#dc2626" fill="#dc2626" /> Fast Food Combo Meals
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Super saver burger, pizza &amp; bucket combos</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: 99 }}>
          SPECIAL OFFER ⚡
        </span>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
        {activeCombos.map((combo) => {
          const isAnimating = animatingId === combo.id;

          return (
            <motion.div
              key={combo.id}
              whileHover={{ y: -4 }}
              style={{
                width: 260, flexShrink: 0,
                background: 'var(--color-card)',
                border: '2px solid var(--color-border)',
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: '0 4px 16px var(--card-shadow)',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Image + Badge */}
              <div style={{ height: 130, position: 'relative', overflow: 'hidden' }}>
                <img src={combo.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'} alt={combo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {combo.badge && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: '#dc2626', color: '#ffffff',
                    fontWeight: 900, fontSize: 10, padding: '4px 9px', borderRadius: 99,
                    letterSpacing: '0.4px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    {combo.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, lineHeight: 1.3, color: 'var(--color-text)' }}>
                    {combo.name}
                  </h4>
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.35 }}>
                    {combo.desc || combo.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontWeight: 900, fontSize: 17, color: '#dc2626' }}>₹{combo.comboPrice}</span>
                      {combo.originalPrice && (
                        <span style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'line-through' }}>₹{combo.originalPrice}</span>
                      )}
                    </div>
                    {combo.savings && (
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', marginTop: 1 }}>Save ₹{combo.savings}!</p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    animate={isAnimating ? { scale: [1, 1.25, 0.95, 1], rotate: [0, 8, -8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={() => handleAddCombo(combo)}
                    style={{
                      background: isAnimating ? '#16a34a' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: '#ffffff', border: 'none', cursor: 'pointer',
                      borderRadius: 12, padding: '8px 14px',
                      fontWeight: 800, fontSize: 12, fontFamily: 'Outfit',
                      display: 'flex', alignItems: 'center', gap: 5,
                      boxShadow: isAnimating ? '0 4px 14px rgba(22,163,74,0.4)' : '0 4px 12px rgba(220,38,38,0.3)',
                      transition: 'background 0.2s',
                    }}
                  >
                    {isAnimating ? <><Check size={14} /> Added!</> : <><Plus size={14} /> Add Combo</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
