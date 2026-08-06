import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Link, ToggleLeft, ToggleRight, Save, ExternalLink,
  Palette, Check, RefreshCw, Pipette, Upload, Image, Edit3, Coffee, Sparkles, Tag, ArrowRight, ShoppingBag, X, Plus, Trash2, Gift, Percent, Sliders, Share2, UserPlus, Users, Lock, Shield, MessageSquare
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';
import { THEMES, THEME_IDS, applyTheme } from '../../theme/themes';
import { useTheme } from '../../theme/ThemeProvider';
import { getFestivalPalette, CORNER_STYLES, getCornerRadius } from '../../theme/festivalThemes';

/* ── Colour swatch for theme picker ── */
function ThemeSwatch({ theme, selected, onClick }) {
  const t = THEMES[theme];
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{
        position: 'relative', width: '100%', padding: 0, border: 'none', cursor: 'pointer',
        borderRadius: 16, overflow: 'hidden',
        outline: selected ? `2.5px solid var(--color-accent)` : '2.5px solid transparent',
        outlineOffset: 2, boxShadow: selected ? '0 4px 18px var(--btn-shadow)' : '0 1px 6px rgba(0,0,0,0.08)',
        fontFamily: 'Outfit', transition: 'all 0.2s',
      }}>
      {/* Colour bars */}
      <div style={{ display: 'flex', height: 64 }}>
        <div style={{ flex: 1, background: t.preview.bg }} />
        <div style={{ flex: 1, background: t.preview.surface }} />
        <div style={{ flex: 1, background: t.preview.accent }} />
      </div>
      {/* Label row */}
      <div style={{
        padding: '10px 12px', background: t.preview.bg,
        borderTop: `1px solid ${t.preview.surface}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: t.preview.text, lineHeight: 1.2 }}>{t.name}</p>
          <p style={{ fontSize: 11, color: t.preview.text, opacity: 0.55, marginTop: 2 }}>{t.desc}</p>
        </div>
        {selected && (
          <div style={{ width: 22, height: 22, borderRadius: 99, background: t.preview.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={13} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>
    </motion.button>
  );
}

/* ── Colour row ── */
function ColorRow({ label, desc, varName, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>{desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: value, border: '1px solid var(--color-border)', flexShrink: 0 }} />
        <input type="color" value={value} onChange={(e) => onChange(varName, e.target.value)}
          style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'var(--color-card)' }} />
      </div>
    </div>
  );
}

/* ── Festival Sale Presets ── */
const FESTIVAL_SALE_CATEGORIES = [
  {
    name: 'Holiday & Cultural Themes',
    sales: [
      'Valentine’s Cupid Deals',
      'Christmas Cheer Carnival',
      'Durga Puja Dhamaaka',
      'Diwali Light-Up Sale',
      'Eid Mubarak Specials',
      'Halloween Spooktacular Savings',
      'New Year, New Looks',
    ]
  },
  {
    name: 'Seasonal & Weather Themes',
    sales: [
      'Summer Splash Sale',
      'Monsoon Madness Markdown',
      'Winter Warm-Up Event',
      'Spring Renewal Showcase',
      'Autumn Harvest Discounts',
    ]
  },
  {
    name: 'National & Cultural Themes',
    sales: [
      'Independence Day Freedom Sale',
      'Republic Day Parade of Savings',
      'Rakhi Bond of Love Deals',
      'Holi Color Fest Offers',
    ]
  }
];

const SETTINGS_TABS = [
  { id: 'all', label: 'All Settings', icon: Sliders },
  { id: 'branding', label: 'Branding & Info', icon: Edit3 },
  { id: 'appearance', label: 'Theme & Style', icon: Palette },
  { id: 'coupons', label: 'Coupons & Offers', icon: Tag },
  { id: 'festival', label: 'Festival Banners', icon: Sparkles },
  { id: 'reviews', label: 'Reviews & Social', icon: Star },
  { id: 'admins', label: 'Admin Accounts', icon: Shield },
];

/* ════════════════════════════════════════
   ADMIN SETTINGS PAGE
════════════════════════════════════════ */
export default function AdminSettings() {
  const { themeId: activeThemeId, customColors: activeCustomColors, updateTheme, updateCustomColors } = useTheme();

  const [settings, setSettings] = useState({
    googleReviewLink: '', showReviewBanner: false,
    theme: activeThemeId, customColors: activeCustomColors,
    festivalSaleDescription: 'Special deals & seasonal offers available now',
    socialLinks: { instagram: '', facebook: '', whatsapp: '', twitter: '', youtube: '' },
  });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showPopupPreview, setShowPopupPreview] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');

  // Coupon management state
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '', discountType: 'fixed', discountValue: '', minOrderAmount: '0', maxDiscount: '', active: true,
  });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState(null);

  // Custom Reviews state
  const [reviewsList, setReviewsList] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, comment: '', avatar: '' });
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Admin Users state
  const [adminsList, setAdminsList] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ username: '', password: '', name: '' });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings({
        googleReviewLink: '', showReviewBanner: false, cafeName: 'Brew & Bites', cafeLogoUrl: '',
        showFestivalBanner: false, festivalSaleName: 'Diwali Light-Up Sale',
        festivalSaleDescription: 'Special deals & seasonal offers available now',
        cardCornerStyle: 'rounded-full', menuItemCornerStyle: 'rounded-md',
        socialLinks: { instagram: '', facebook: '', whatsapp: '', twitter: '', youtube: '' },
        ...data.settings,
        socialLinks: { instagram: '', facebook: '', whatsapp: '', twitter: '', youtube: '', ...(data.settings?.socialLinks || {}) }
      }))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));

    fetchCoupons();
    fetchReviews();
    fetchAdmins();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/admin/coupons');
      setCoupons(data.coupons || []);
    } catch {}
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/admin/reviews');
      setReviewsList(data.reviews || []);
    } catch {}
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setAdminsList(data.admins || []);
    } catch {}
  };

  const saveReview = async () => {
    if (!reviewForm.author.trim()) return toast.error('Author name is required');
    if (!reviewForm.comment.trim()) return toast.error('Review comment is required');
    setSavingReview(true);
    try {
      await api.post('/admin/reviews', {
        author: reviewForm.author.trim(),
        rating: parseInt(reviewForm.rating) || 5,
        comment: reviewForm.comment.trim(),
        avatar: reviewForm.avatar?.trim() || null,
      });
      toast.success('Review added!');
      setShowReviewModal(false);
      setReviewForm({ author: '', rating: 5, comment: '', avatar: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add review');
    } finally {
      setSavingReview(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    setDeletingReviewId(id);
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const saveAdminUser = async () => {
    if (!adminForm.username.trim()) return toast.error('Username is required');
    if (!adminForm.password.trim()) return toast.error('Password is required');
    setSavingAdmin(true);
    try {
      await api.post('/admin/users', {
        username: adminForm.username.trim(),
        password: adminForm.password.trim(),
        name: adminForm.name?.trim() || null,
      });
      toast.success('Admin user added!');
      setShowAdminModal(false);
      setAdminForm({ username: '', password: '', name: '' });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add admin user');
    } finally {
      setSavingAdmin(false);
    }
  };

  const deleteAdminUser = async (id) => {
    if (!window.confirm('Remove this admin account?')) return;
    setDeletingAdminId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Admin account removed');
      fetchAdmins();
    } catch {
      toast.error('Failed to remove admin');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const openAddCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({ code: '', discountType: 'fixed', discountValue: '', minOrderAmount: '0', maxDiscount: '', active: true });
    setShowCouponModal(true);
  };

  const openEditCoupon = (c) => {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount || 0),
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      active: c.active,
    });
    setShowCouponModal(true);
  };

  const saveCoupon = async () => {
    if (!couponForm.code.trim()) return toast.error('Coupon code is required');
    if (!couponForm.discountValue || isNaN(couponForm.discountValue)) return toast.error('Valid discount value is required');

    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderAmount: parseFloat(couponForm.minOrderAmount) || 0,
        maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
        active: couponForm.active,
      };

      if (editingCoupon) {
        await api.put(`/admin/coupons/${editingCoupon.id}`, payload);
        toast.success('Coupon updated!');
      } else {
        await api.post('/admin/coupons', payload);
        toast.success('Coupon created!');
      }

      setShowCouponModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const toggleCouponActive = async (c) => {
    try {
      await api.put(`/admin/coupons/${c.id}`, { active: !c.active });
      toast.success(`Coupon ${c.code} ${!c.active ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch {
      toast.error('Failed to toggle coupon status');
    }
  };

  const deleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    setDeletingCouponId(c.id);
    try {
      await api.delete(`/admin/coupons/${c.id}`);
      toast.success(`Coupon ${c.code} deleted`);
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    } finally {
      setDeletingCouponId(null);
    }
  };

  // Live preview when hovering a theme swatch
  const handleSwatchHover = (id) => {
    if (id === previewTheme) return;
    setPreviewTheme(id);
    applyTheme(id, settings.customColors || {});
  };
  const handleSwatchLeave = () => {
    setPreviewTheme(null);
    applyTheme(settings.theme || 'warm-cafe', settings.customColors || {});
  };

  const selectTheme = (id) => {
    setSettings((s) => ({ ...s, theme: id }));
    applyTheme(id, settings.customColors || {});
    updateTheme(id, settings.customColors || {});
  };

  const handleColorChange = (varName, color) => {
    const newColors = { ...(settings.customColors || {}), [varName]: color };
    setSettings((s) => ({ ...s, customColors: newColors }));
    applyTheme(settings.theme || 'warm-cafe', newColors);
    updateCustomColors(newColors);
  };

  const resetColors = () => {
    setSettings((s) => ({ ...s, customColors: {} }));
    applyTheme(settings.theme || 'warm-cafe', {});
    updateCustomColors({});
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/admin/settings', settings);
      setSettings(data.settings);
      updateTheme(data.settings.theme || 'warm-cafe', data.settings.customColors || {});
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSettings((s) => ({ ...s, cafeLogoUrl: data.logoUrl }));
      toast.success('Logo uploaded!');
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const isValidUrl = (url) => { try { new URL(url); return true; } catch { return false; } };

  // Current custom colors with defaults from selected theme
  const themeBase = THEMES[settings.theme || 'warm-cafe']?.vars || {};
  const cc = settings.customColors || {};
  const effectiveAccent = cc['--color-accent-light'] || themeBase['--color-accent-light'] || '#e8901f';
  const effectivePrimary = cc['--color-accent'] || themeBase['--color-accent'] || '#c2700f';
  const effectiveBg     = cc['--color-bg'] || themeBase['--color-bg'] || '#faf7f3';
  const effectiveCard   = cc['--color-card'] || themeBase['--color-card'] || '#ffffff';
  const effectiveText   = cc['--color-text'] || themeBase['--color-text'] || '#1a0f05';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/settings" />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px', paddingBottom: 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
            <span className="gradient-text">Store Settings</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Manage your café app branding, themes, coupons &amp; configurations</p>
        </div>

        {/* Category Navigation Pills */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const sel = activeCategoryTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveCategoryTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 99,
                  fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.18s',
                  background: sel ? 'linear-gradient(135deg, #e8901f, #c2700f)' : 'var(--color-card)',
                  color: sel ? '#ffffff' : 'var(--color-text-secondary)',
                  border: sel ? 'none' : '1px solid var(--color-border)',
                  boxShadow: sel ? '0 3px 12px var(--btn-shadow)' : '0 1px 4px var(--card-shadow)',
                }}
              >
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[200, 120, 160].map((h, i) => <div key={i} className="shimmer" style={{ height: h, borderRadius: 16 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ════ 1. CAFÉ BRANDING ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'branding') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Edit3 size={20} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>Café Branding &amp; Info</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Customize your café name and logo shown to customers</p>
                  </div>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Logo preview + upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 18, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 14px var(--btn-shadow)' }}>
                      {settings.cafeLogoUrl
                        ? <img src={settings.cafeLogoUrl} alt="logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Coffee size={32} color="#fff" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Café Logo</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>PNG, JPG or SVG (max 5MB)</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Outfit', color: 'var(--color-muted)' }}>
                          {logoUploading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Upload size={14} />}
                          {logoUploading ? 'Uploading…' : 'Upload Logo'}
                          <input type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => uploadLogo(e.target.files[0])} />
                        </label>
                        {settings.cafeLogoUrl && (
                          <button onClick={() => setSettings((s) => ({ ...s, cafeLogoUrl: '' }))}
                            style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 12, fontFamily: 'Outfit' }}>Remove</button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Café Name */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Café Name</label>
                    <input className="input-field"
                      value={settings.cafeName || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, cafeName: e.target.value }))}
                      placeholder="e.g. Brew &amp; Bites"
                      style={{ maxWidth: 340 }} />
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5 }}>Shown in the app header and browser tab</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ 2. THEME & APPEARANCE ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'appearance') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Theme Swatches */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Palette size={20} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 16 }}>Theme &amp; Appearance</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Choose a color theme for your customer-facing pages</p>
                    </div>
                  </div>

                  <div style={{ padding: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
                      Hover to preview · Click to select
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                      {THEME_IDS.map((id) => (
                        <div key={id}
                          onMouseEnter={() => handleSwatchHover(id)}
                          onMouseLeave={handleSwatchLeave}
                        >
                          <ThemeSwatch
                            theme={id}
                            selected={settings.theme === id}
                            onClick={() => selectTheme(id)}
                          />
                        </div>
                      ))}
                    </div>

                    <AnimatePresence>
                      {previewTheme && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', borderRadius: 99, padding: '5px 12px', fontSize: 12, color: 'var(--color-accent-dark)', fontWeight: 600 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--color-accent)', display: 'inline-block' }} />
                          Previewing {THEMES[previewTheme]?.name}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Menu Item Card Corner Style Customization */}
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
                      <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: 'var(--color-text)' }}>
                        Menu Item Card Customization
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14 }}>
                        Customize corner shape &amp; curvature specifically for your food &amp; beverage menu cards
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                        {Object.values(CORNER_STYLES).map((corner) => {
                          const isSelected = (settings.menuItemCornerStyle || 'rounded-md') === corner.id;
                          return (
                            <button
                              key={`menu-${corner.id}`}
                              type="button"
                              onClick={() => setSettings((s) => ({ ...s, menuItemCornerStyle: corner.id }))}
                              style={{
                                background: isSelected ? 'var(--color-surface)' : 'var(--color-card)',
                                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                borderRadius: 14, padding: '12px 10px', cursor: 'pointer',
                                textAlign: 'center', transition: 'all 0.15s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                              }}
                            >
                              <div style={{
                                width: 42, height: 28, background: 'var(--color-accent)',
                                borderRadius: corner.radius, opacity: isSelected ? 1 : 0.5,
                                transition: 'all 0.15s',
                                boxShadow: isSelected ? '0 2px 8px var(--btn-shadow)' : 'none'
                              }} />
                              <div>
                                <p style={{ fontWeight: 800, fontSize: 12, color: isSelected ? 'var(--color-accent)' : 'var(--color-text)' }}>
                                  {corner.name}
                                </p>
                                <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                                  {corner.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Custom Colors */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Pipette size={20} color="#fff" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16 }}>Custom Palette Colours</p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Fine-tune the selected theme colours</p>
                      </div>
                    </div>
                    {Object.keys(cc).length > 0 && (
                      <button onClick={resetColors}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}>
                        <RefreshCw size={12} /> Reset
                      </button>
                    )}
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <ColorRow label="Accent (light)" desc="Button highlights, icons" varName="--color-accent-light" value={effectiveAccent} onChange={handleColorChange} />
                    <ColorRow label="Accent (dark)"  desc="Text, deep highlights"   varName="--color-accent"       value={effectivePrimary} onChange={handleColorChange} />
                    <ColorRow label="Background"      desc="Page background colour"  varName="--color-bg"           value={effectiveBg}     onChange={handleColorChange} />
                    <ColorRow label="Card"            desc="Card / panel background" varName="--color-card"         value={effectiveCard}   onChange={handleColorChange} />
                    <ColorRow label="Text"            desc="Primary text colour"     varName="--color-text"         value={effectiveText}   onChange={handleColorChange} />
                  </div>
                </motion.div>

                {/* ════ REMOTE MASTER THEME CONTROL ════ */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  style={{ background: 'var(--color-card)', border: '2px solid var(--color-accent-border)', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ExternalLink size={20} color="#fff" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-accent-dark)' }}>Remote Master Theme Controller API</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Control store theme &amp; banners remotely from an external master site</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--color-accent)', color: '#fff', padding: '4px 10px', borderRadius: 99 }}>
                      API LIVE
                    </span>
                  </div>

                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 14, border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                        Remote Control Endpoint
                      </p>
                      <code style={{ display: 'block', background: 'var(--color-card)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--color-accent-dark)', border: '1px solid var(--color-border)' }}>
                        POST /api/remote/theme
                      </code>
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Header: <code style={{ fontWeight: 700 }}>X-Remote-Secret: super-secret-remote-key</code>
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-text)' }}>
                        Remote Controller Simulator (Test External Site Change)
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {['shopify-crave', 'neo-brutalism', 'warm-cafe', 'midnight', 'clean-pro', 'forest', 'sweet-pink'].map((tId) => (
                          <button
                            key={`remote-${tId}`}
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post('/remote/theme', { theme: tId }, {
                                  headers: { 'x-remote-secret': 'super-secret-remote-key' }
                                });
                                selectTheme(tId);
                                toast.success(`Remote command executed: Switched to ${tId}!`);
                              } catch {
                                toast.error('Remote command failed');
                              }
                            }}
                            style={{
                              padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                              fontFamily: 'Outfit', fontWeight: 700, fontSize: 12,
                              background: settings.theme === tId ? 'var(--color-accent)' : 'var(--color-surface)',
                              color: settings.theme === tId ? '#ffffff' : 'var(--color-text)',
                              border: settings.theme === tId ? 'none' : '1px solid var(--color-border)',
                              transition: 'all 0.15s'
                            }}
                          >
                            {tId === 'shopify-crave' ? '🔥 Shopify Crave' : tId}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ════ 3. COUPON CODES & DISCOUNTS ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'coupons') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Tag size={20} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 16 }}>Coupon Codes &amp; Offers</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Create promo codes with minimum purchase limits &amp; discount rules</p>
                    </div>
                  </div>
                  <button onClick={openAddCoupon} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Add Coupon
                  </button>
                </div>

                <div style={{ padding: 20 }}>
                  {coupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-muted)' }}>
                      <Gift size={36} style={{ margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ fontWeight: 600 }}>No coupon codes added yet</p>
                      <button onClick={openAddCoupon} className="btn-primary" style={{ marginTop: 12, padding: '8px 16px', fontSize: 13 }}>
                        + Create your first coupon
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {coupons.map((c) => (
                        <div key={c.id} style={{ padding: '12px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: c.active ? 1 : 0.6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, background: 'var(--color-accent-bg)', color: 'var(--color-accent-dark)', border: '1px solid var(--color-accent-border)', padding: '4px 10px', borderRadius: 8 }}>
                              {c.code}
                            </span>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 13 }}>
                                {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`}
                                {c.maxDiscount ? ` (Max ₹${c.maxDiscount})` : ''}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                                {c.minOrderAmount > 0 ? `Min purchase limit: ₹${c.minOrderAmount}` : 'No min limit'}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => toggleCouponActive(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.active ? '#15803d' : 'var(--color-muted)', padding: 0 }} title={c.active ? 'Deactivate coupon' : 'Activate coupon'}>
                              {c.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                            <button onClick={() => openEditCoupon(c)} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}>
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => deleteCoupon(c)} disabled={deletingCouponId === c.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                              {deletingCouponId === c.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ════ 4. FESTIVAL & SALE BANNERS ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'festival') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={20} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 16 }}>Festival &amp; Sale Banners</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Display a floating festival banner card on customer pages</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, showFestivalBanner: !s.showFestivalBanner }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: settings.showFestivalBanner ? 'var(--color-accent)' : 'var(--color-muted)', padding: 0, display: 'flex' }}
                  >
                    {settings.showFestivalBanner ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                  </button>
                </div>

                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      Live Banner Preview
                    </label>
                    {(() => {
                      const pal = getFestivalPalette(settings.festivalSaleName);
                      const radius = getCornerRadius(settings.cardCornerStyle);
                      return (
                        <div style={{
                          background: pal.gradient,
                          color: '#ffffff',
                          borderRadius: radius, padding: '14px 18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          boxShadow: `0 4px 16px ${pal.accent}40`,
                          border: `1.5px solid ${pal.border}`,
                          opacity: settings.showFestivalBanner ? 1 : 0.45,
                          transition: 'all 0.2s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Sparkles size={18} color="#fff" />
                            </div>
                            <div>
                              <p style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.2px' }}>
                                {settings.festivalSaleName || 'Diwali Light-Up Sale'} is going on!
                              </p>
                              <p style={{ fontSize: 11, opacity: 0.92, fontWeight: 500 }}>
                                ORDER NOW &amp; enjoy special offers
                              </p>
                            </div>
                          </div>
                          <span style={{
                            background: '#ffffff', color: pal.accent,
                            fontWeight: 800, fontSize: 11, padding: '6px 12px', borderRadius: 99,
                            letterSpacing: '0.4px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4
                          }}>
                            ORDER NOW <ArrowRight size={12} />
                          </span>
                        </div>
                      );
                    })()}
                    
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowPopupPreview(true)}
                        style={{
                          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                          borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
                          fontFamily: 'Outfit', fontWeight: 700, fontSize: 12, color: 'var(--color-accent)',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Sparkles size={14} /> Preview Full-Screen Celebration Popup
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                      Active Sale Name
                    </label>
                    <input
                      className="input-field"
                      value={settings.festivalSaleName || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, festivalSaleName: e.target.value }))}
                      placeholder="e.g. Diwali Light-Up Sale"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                      Sale Banner Description
                    </label>
                    <input
                      className="input-field"
                      value={settings.festivalSaleDescription || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, festivalSaleDescription: e.target.value }))}
                      placeholder="e.g. Special deals & seasonal offers available now"
                    />
                  </div>

                  {/* Card Corner Style */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                      Card Corner &amp; Shape Style
                    </label>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 12 }}>
                      Customize corner curvature for celebration cards &amp; banners
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                      {Object.values(CORNER_STYLES).map((corner) => {
                        const isSelected = (settings.cardCornerStyle || 'rounded-full') === corner.id;
                        return (
                          <button
                            key={corner.id}
                            type="button"
                            onClick={() => setSettings((s) => ({ ...s, cardCornerStyle: corner.id }))}
                            style={{
                              background: isSelected ? 'var(--color-surface)' : 'var(--color-card)',
                              border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                              borderRadius: 14, padding: '12px 10px', cursor: 'pointer',
                              textAlign: 'center', transition: 'all 0.15s',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            }}
                          >
                            <div style={{
                              width: 40, height: 26, background: 'var(--color-accent)',
                              borderRadius: corner.radius, opacity: isSelected ? 1 : 0.5,
                              transition: 'all 0.15s'
                            }} />
                            <div>
                              <p style={{ fontWeight: 800, fontSize: 12, color: isSelected ? 'var(--color-accent)' : 'var(--color-text)' }}>
                                {corner.name}
                              </p>
                              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                                {corner.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Festival Presets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Select a Sale Theme Preset
                    </p>

                    {FESTIVAL_SALE_CATEGORIES.map((cat) => (
                      <div key={cat.name} style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 14, border: '1px solid var(--color-border)' }}>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--color-text)' }}>
                          {cat.name}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {cat.sales.map((saleName) => {
                            const isSelected = settings.festivalSaleName === saleName;
                            const pal = getFestivalPalette(saleName);
                            return (
                              <button
                                key={saleName}
                                type="button"
                                onClick={() => setSettings((s) => ({ ...s, festivalSaleName: saleName, showFestivalBanner: true }))}
                                style={{
                                  padding: '6px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
                                  fontFamily: 'Outfit', fontWeight: 700, fontSize: 12,
                                  transition: 'all 0.15s',
                                  background: isSelected ? pal.accent : 'var(--color-card)',
                                  color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                                  border: isSelected ? 'none' : '1px solid var(--color-border)',
                                  boxShadow: isSelected ? `0 3px 10px ${pal.accent}40` : 'none',
                                }}
                              >
                                {isSelected ? '✓ ' : ''}{saleName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ 5. GOOGLE REVIEWS & SOCIAL ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'reviews') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star size={20} color="#fff" fill="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>Google Reviews &amp; Ratings</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Show a review banner on customer pages</p>
                  </div>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>Show Review Banner</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>Displays on Home &amp; Order Status pages</p>
                    </div>
                    <button onClick={() => setSettings((s) => ({ ...s, showReviewBanner: !s.showReviewBanner }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: settings.showReviewBanner ? '#15803d' : 'var(--color-muted)' }}>
                      {settings.showReviewBanner ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                    </button>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      <Link size={12} /> Google Review Link
                    </label>
                    <input className="input-field" type="url"
                      placeholder="https://g.page/r/YOUR-PLACE-ID/review"
                      value={settings.googleReviewLink}
                      onChange={(e) => setSettings((s) => ({ ...s, googleReviewLink: e.target.value }))}
                    />
                    {settings.googleReviewLink && isValidUrl(settings.googleReviewLink) && (
                      <a href={settings.googleReviewLink} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                        <ExternalLink size={12} /> Test link →
                      </a>
                    )}
                    <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                      Get from <strong>Google Business Profile</strong> → Get more reviews → Copy link
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ 6. FOLLOW US ON SOCIALS ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'reviews') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Share2 size={20} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>Follow Us on Socials</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Configure your café social media handles shown to customers</p>
                  </div>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Instagram URL
                    </label>
                    <input className="input-field" type="url" placeholder="https://instagram.com/yourcafe"
                      value={settings.socialLinks?.instagram || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), instagram: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Facebook Page URL
                    </label>
                    <input className="input-field" type="url" placeholder="https://facebook.com/yourcafe"
                      value={settings.socialLinks?.facebook || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), facebook: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      WhatsApp Link or Phone Number
                    </label>
                    <input className="input-field" type="text" placeholder="https://wa.me/919876543210 or 9876543210"
                      value={settings.socialLinks?.whatsapp || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), whatsapp: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      Twitter / X URL
                    </label>
                    <input className="input-field" type="url" placeholder="https://x.com/yourcafe"
                      value={settings.socialLinks?.twitter || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), twitter: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                      YouTube Channel URL
                    </label>
                    <input className="input-field" type="url" placeholder="https://youtube.com/@yourcafe"
                      value={settings.socialLinks?.youtube || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, socialLinks: { ...(s.socialLinks || {}), youtube: e.target.value } }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ 7. CUSTOM REVIEWS MANAGEMENT ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'reviews') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageSquare size={20} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 16 }}>Custom Customer Reviews</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Add or remove featured customer feedback shown on your site</p>
                    </div>
                  </div>
                  <button onClick={() => setShowReviewModal(true)} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Add Review
                  </button>
                </div>

                <div style={{ padding: 20 }}>
                  {reviewsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-muted)' }}>
                      <Star size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                      <p style={{ fontWeight: 600 }}>No custom reviews added yet</p>
                      <button onClick={() => setShowReviewModal(true)} className="btn-primary" style={{ marginTop: 12, padding: '8px 16px', fontSize: 13 }}>
                        + Add first review
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {reviewsList.map((r) => (
                        <div key={r.id} style={{ padding: '14px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{r.author}</span>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {Array.from({ length: r.rating || 5 }).map((_, i) => (
                                  <Star key={i} size={13} fill="#e8901f" color="#e8901f" />
                                ))}
                              </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>"{r.comment}"</p>
                          </div>

                          <button onClick={() => deleteReview(r.id)} disabled={deletingReviewId === r.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626', display: 'flex', flexShrink: 0 }}>
                            {deletingReviewId === r.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ════ 8. ADMIN USER MANAGEMENT ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'admins') && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={20} color="#fff" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 16 }}>Admin Access &amp; Accounts</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Create and manage staff/admin login accounts</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAdminModal(true)} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserPlus size={14} /> Add Other Admin
                  </button>
                </div>

                <div style={{ padding: 20 }}>
                  {adminsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-muted)' }}>
                      <Users size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                      <p style={{ fontWeight: 600 }}>No additional database admin accounts added</p>
                      <p style={{ fontSize: 12, marginTop: 4 }}>Default environment admin is active.</p>
                      <button onClick={() => setShowAdminModal(true)} className="btn-primary" style={{ marginTop: 12, padding: '8px 16px', fontSize: 13 }}>
                        + Create New Admin Account
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {adminsList.map((ad) => (
                        <div key={ad.id} style={{ padding: '12px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text)' }}>
                              {ad.name ? `${ad.name} (@${ad.username})` : `@${ad.username}`}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                              Added: {new Date(ad.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>

                          <button onClick={() => deleteAdminUser(ad.id)} disabled={deletingAdminId === ad.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626', display: 'flex', flexShrink: 0 }}>
                            {deletingAdminId === ad.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>
        )}

        {/* Save Settings Button Floating Bar */}
        <div style={{ position: 'sticky', bottom: 20, marginTop: 32, zIndex: 40, display: 'flex', justifyContent: 'center' }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={save} disabled={saving}
            className="btn-primary"
            style={{
              padding: '14px 36px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 24px var(--btn-shadow)',
            }}>
            {saving ? <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save All Settings'}
          </motion.button>
        </div>
      </div>

      {/* Full-Screen Popup Preview Modal */}
      <AnimatePresence>
        {showPopupPreview && (() => {
          const pal = getFestivalPalette(settings.festivalSaleName);
          const radius = getCornerRadius(settings.cardCornerStyle);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPopupPreview(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,10,5,0.75)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <motion.div onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                style={{ width: '100%', maxWidth: 420, background: 'var(--color-card)', border: `2.5px solid ${pal.accent}`, borderRadius: radius, boxShadow: '0 32px 80px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'relative', background: pal.gradient, padding: '38px 24px 30px', textAlign: 'center', color: '#fff', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 18, left: -34, background: '#fff', color: pal.accent, transform: 'rotate(-45deg)', padding: '4px 38px', fontSize: 10, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>{pal.ribbonText}</div>
                  <button onClick={() => setShowPopupPreview(false)} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 99, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                  <div style={{ width: 76, height: 76, borderRadius: 24, background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.4)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={40} color="#fff" /></div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.38)', padding: '5px 16px', borderRadius: 99, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>{pal.tag}</div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>{settings.festivalSaleName || 'Diwali Light-Up Sale'}</h2>
                  <p style={{ fontSize: 14, opacity: 0.95, fontWeight: 600 }}>is going on right now!</p>
                </div>
                <div style={{ padding: '24px 24px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: pal.bg, borderRadius: 18, padding: 16, border: `1.5px solid ${pal.border}` }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: pal.text, marginBottom: 4 }}>Special Festival Discounts Applied!</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>Order your favorite food &amp; drinks today and celebrate with festive deals.</p>
                  </div>
                  <button onClick={() => setShowPopupPreview(false)} style={{ width: '100%', padding: '16px 24px', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, border: 'none', cursor: 'pointer', background: pal.gradient, color: '#fff', boxShadow: `0 8px 24px ${pal.accent}50`, fontFamily: 'Outfit' }}><ShoppingBag size={20} /><span>ORDER NOW</span><ArrowRight size={18} /></button>
                  <button onClick={() => setShowPopupPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 13, fontWeight: 600, fontFamily: 'Outfit', textDecoration: 'underline' }}>Close preview</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Add / Edit Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCouponModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontWeight: 800, fontSize: 17 }}>{editingCoupon ? 'Edit Coupon Code' : 'New Coupon Code'}</h3>
                <button onClick={() => setShowCouponModal(false)} style={{ background: 'var(--color-surface)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Coupon Code */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Coupon Code *
                  </label>
                  <input className="input-field" type="text" placeholder="e.g. WELCOME50, FESTIVAL100"
                    value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    style={{ textTransform: 'uppercase', fontWeight: 700 }} />
                </div>

                {/* Discount Type */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                      Discount Type
                    </label>
                    <select className="input-field" value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                      <option value="fixed">Flat Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                      Discount Value *
                    </label>
                    <input className="input-field" type="number" placeholder={couponForm.discountType === 'fixed' ? '50' : '20'}
                      value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
                  </div>
                </div>

                {/* Minimum Purchase Limit */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Minimum Purchase Order Limit (₹)
                  </label>
                  <input className="input-field" type="number" placeholder="e.g. 150 (Leave 0 for no limit)"
                    value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} />
                  <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                    Customers must order at least this amount to apply the coupon.
                  </p>
                </div>

                {/* Max Discount (if percentage) */}
                {couponForm.discountType === 'percentage' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                      Max Discount Cap (₹) (Optional)
                    </label>
                    <input className="input-field" type="number" placeholder="e.g. 80"
                      value={couponForm.maxDiscount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })} />
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowCouponModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveCoupon} disabled={savingCoupon} className="btn-primary" style={{ flex: 1, padding: 12 }}>
                    {savingCoupon ? 'Saving…' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Custom Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowReviewModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontWeight: 800, fontSize: 17 }}>Add Customer Review</h3>
                <button onClick={() => setShowReviewModal(false)} style={{ background: 'var(--color-surface)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Customer Name *
                  </label>
                  <input className="input-field" type="text" placeholder="e.g. Rahul Sharma"
                    value={reviewForm.author} onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Rating (1 - 5 Stars) *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <Star size={24} fill={star <= reviewForm.rating ? '#e8901f' : 'none'} color={star <= reviewForm.rating ? '#e8901f' : 'var(--color-muted)'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Review Comment *
                  </label>
                  <textarea className="input-field" rows={3} placeholder="Write customer feedback..."
                    value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowReviewModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveReview} disabled={savingReview} className="btn-primary" style={{ flex: 1, padding: 12 }}>
                    {savingReview ? 'Saving…' : 'Add Review'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Admin User Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAdminModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontWeight: 800, fontSize: 17 }}>Add Other Admin Account</h3>
                <button onClick={() => setShowAdminModal(false)} style={{ background: 'var(--color-surface)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Username *
                  </label>
                  <input className="input-field" type="text" placeholder="e.g. manager, cashier2"
                    value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Password *
                  </label>
                  <input className="input-field" type="password" placeholder="Enter secure password"
                    value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Staff / Admin Name (Optional)
                  </label>
                  <input className="input-field" type="text" placeholder="e.g. Amit Kumar"
                    value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowAdminModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveAdminUser} disabled={savingAdmin} className="btn-primary" style={{ flex: 1, padding: 12 }}>
                    {savingAdmin ? 'Saving…' : 'Create Admin'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
