import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Link, ToggleLeft, ToggleRight, Save, ExternalLink,
  Palette, Check, RefreshCw, Pipette, Upload, Image, Edit3, Coffee, Sparkles, Tag, ArrowRight, ShoppingBag, X, Plus, Trash2, Gift, Percent, Sliders, Share2, UserPlus, Users, Lock, Shield, MessageSquare, Key
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav, getAdminAuthInfo } from './AdminDashboard';
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
  const { isSuper, hasPermission, username } = getAdminAuthInfo();

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
  const [menuItemsList, setMenuItemsList] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, comment: '', avatar: '', itemTitle: '' });
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

const AVAILABLE_PERMISSIONS = [
  { id: 'branding', label: '🎨 Branding & Theme', desc: 'Theme colors, logo, cafe name, tagline & social links' },
  { id: 'sales', label: '🎉 Sales & Offers', desc: 'Festival sale banners, discount %, price overrides & item eligibility' },
  { id: 'menu', label: '🍕 Menu & Combos', desc: 'Add/edit categories, menu items, prices & combos' },
  { id: 'orders', label: '📋 Order Management', desc: 'View live customer orders & update order statuses' },
  { id: 'reviews', label: '⭐ Customer Reviews', desc: 'Add & delete custom customer feedback' },
  { id: 'coupons', label: '🏷️ Coupons & Offers', desc: 'Create & manage promo codes & discount rules' },
  { id: 'admins', label: '👥 Admin Management', desc: 'Manage & create other admin user accounts' },
];

  // Admin Users state
  const [adminsList, setAdminsList] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: '', password: '', name: '', role: 'custom',
    permissions: ['orders']
  });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetAdmin, setPasswordTargetAdmin] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Dedicated inline password change per admin card
  const [inlinePasswords, setInlinePasswords] = useState({});
  const [updatingPasswordId, setUpdatingPasswordId] = useState(null);

  // Edit Admin state
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editAdminForm, setEditAdminForm] = useState({
    name: '', role: 'custom', permissions: [], password: ''
  });
  const [savingEditAdmin, setSavingEditAdmin] = useState(false);

  // Self password change state for Super Admin
  const [myPasswordValue, setMyPasswordValue] = useState('');
  const [updatingMyPassword, setUpdatingMyPassword] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings({
        googleReviewLink: '', showReviewBanner: false, cafeName: 'Brew & Bites', cafeLogoUrl: '',
        showFestivalBanner: false, festivalSaleName: 'Diwali Light-Up Sale',
        festivalSaleDescription: 'Special deals & seasonal offers available now',
        festivalDiscountType: 'percentage', festivalDiscountValue: 15, festivalDiscountPercent: 15, excludedFestivalItemIds: [], customFestivalPrices: {},
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
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const [menuRes, comboRes] = await Promise.all([
        api.get('/admin/menu').catch(() => ({ data: { items: [] } })),
        api.get('/admin/combos').catch(() => ({ data: { combos: [] } }))
      ]);

      let items = [];
      if (menuRes.data?.items) {
        items = menuRes.data.items.map((i) => ({ rawId: i.id, id: `item-${i.id}`, name: i.name, price: i.price, isCombo: false }));
      } else if (menuRes.data?.categories) {
        items = menuRes.data.categories.flatMap((cat) => cat.items || []).map((i) => ({ rawId: i.id, id: `item-${i.id}`, name: i.name, price: i.price, isCombo: false }));
      }

      const combos = (comboRes.data?.combos || []).map((c) => ({ rawId: c.id, id: `combo-${c.id}`, name: c.name, price: c.comboPrice, isCombo: true }));
      setMenuItemsList([...items, ...combos]);
    } catch {}
  };

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
        itemTitle: reviewForm.itemTitle?.trim() || null,
      });
      toast.success('Review added!');
      setShowReviewModal(false);
      setReviewForm({ author: '', rating: 5, comment: '', avatar: '', itemTitle: '' });
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
    if (adminForm.role === 'custom' && adminForm.permissions.length === 0) {
      return toast.error('Please select at least one permission for custom role');
    }
    setSavingAdmin(true);
    try {
      await api.post('/admin/users', {
        username: adminForm.username.trim(),
        password: adminForm.password.trim(),
        name: adminForm.name?.trim() || null,
        role: adminForm.role,
        permissions: adminForm.role === 'super_admin' ? ['all'] : adminForm.permissions,
      });
      toast.success('Admin user account created!');
      setShowAdminModal(false);
      setAdminForm({
        username: '', password: '', name: '', role: 'custom',
        permissions: ['orders']
      });
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

  const handleUpdatePassword = async () => {
    if (!newPasswordValue || !newPasswordValue.trim()) {
      return toast.error('Please enter a new password');
    }
    setUpdatingPassword(true);
    try {
      await api.put(`/admin/users/${passwordTargetAdmin.id}/password`, { password: newPasswordValue.trim() });
      toast.success(`Password updated for @${passwordTargetAdmin.username}!`);
      setShowPasswordModal(false);
      setPasswordTargetAdmin(null);
      setNewPasswordValue('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleInlinePasswordUpdate = async (adminId, username) => {
    const newPwd = (inlinePasswords[adminId] || '').trim();
    if (!newPwd) {
      return toast.error('Type a new password first');
    }
    setUpdatingPasswordId(adminId);
    try {
      await api.put(`/admin/users/${adminId}/password`, { password: newPwd });
      toast.success(`Password updated for @${username}!`);
      setInlinePasswords((prev) => ({ ...prev, [adminId]: '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setUpdatingPasswordId(null);
    }
  };

  const openEditAdmin = (ad) => {
    if (editingAdminId === ad.id) {
      setEditingAdminId(null);
      return;
    }
    const isSuper = ad.role === 'super_admin' || ad.permissions === 'all' || !ad.permissions;
    const perms = isSuper
      ? ['branding', 'sales', 'menu', 'orders', 'reviews', 'coupons', 'admins']
      : typeof ad.permissions === 'string'
      ? ad.permissions.split(',')
      : ad.permissions || [];

    setEditingAdminId(ad.id);
    setEditAdminForm({
      name: ad.name || '',
      role: isSuper ? 'super_admin' : ad.role || 'custom',
      permissions: perms,
      password: ''
    });
  };

  const saveUpdateAdmin = async (id) => {
    if (editAdminForm.role === 'custom' && editAdminForm.permissions.length === 0) {
      return toast.error('Please select at least one permission for custom role');
    }
    setSavingEditAdmin(true);
    try {
      await api.put(`/admin/users/${id}`, {
        name: editAdminForm.name?.trim() || null,
        role: editAdminForm.role,
        permissions: editAdminForm.role === 'super_admin' ? ['all'] : editAdminForm.permissions,
        password: editAdminForm.password?.trim() || undefined,
      });
      toast.success('Admin permissions and details updated!');
      setEditingAdminId(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update admin account');
    } finally {
      setSavingEditAdmin(false);
    }
  };

  const handleUpdateMyPassword = async () => {
    const newPwd = myPasswordValue.trim();
    if (!newPwd) return toast.error('Please enter a new password');
    setUpdatingMyPassword(true);
    try {
      await api.put('/admin/users/self/password', { password: newPwd });
      toast.success('Your Super Admin password has been updated!');
      setMyPasswordValue('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setUpdatingMyPassword(false);
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
          {SETTINGS_TABS.filter(({ id }) => {
            if (id === 'all') return true;
            if (id === 'branding' || id === 'appearance') return hasPermission('branding');
            if (id === 'coupons') return hasPermission('coupons');
            if (id === 'festival') return hasPermission('sales');
            if (id === 'reviews') return hasPermission('reviews') || hasPermission('branding');
            if (id === 'admins') return hasPermission('admins');
            return true;
          }).map(({ id, label, icon: Icon }) => {
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
            {(activeCategoryTab === 'all' || activeCategoryTab === 'branding') && hasPermission('branding') && (
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
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Café Name</label>
                    <input className="input-field"
                      value={settings.cafeName || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, cafeName: e.target.value }))}
                      placeholder="e.g. Brew &amp; Bites"
                      style={{ maxWidth: 340 }} />
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5 }}>Shown in the app header and browser tab</p>
                  </div>
                  {/* Café Tagline */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Café Tagline / Subtitle</label>
                    <input className="input-field"
                      value={settings.cafeTagline || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, cafeTagline: e.target.value }))}
                      placeholder="e.g. Your neighbourhood café"
                      style={{ maxWidth: 340 }} />
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5 }}>Shown directly below the café name on the home page</p>
                  </div>
                  <div style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      className="btn-primary"
                      style={{ padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Save size={14} />
                      {saving ? 'Saving...' : 'Save Store Name & Branding'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════ 2. THEME & PALETTE ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'appearance') && hasPermission('branding') && (
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

              </div>
            )}

            {/* ════ 5. COUPONS & DISCOUNTS MANAGEMENT ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'coupons') && hasPermission('coupons') && (
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

            {/* ════ 3. FESTIVAL SALE BANNER ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'festival') && hasPermission('sales') && (
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

                  {/* Festival Discount Type & Value */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                      Festival Sale Discount Type &amp; Value
                    </label>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, festivalDiscountType: 'percentage' }))}
                        style={{
                          padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 800, fontSize: 13,
                          background: (settings.festivalDiscountType || 'percentage') === 'percentage' ? 'var(--color-accent)' : 'var(--color-surface)',
                          color: (settings.festivalDiscountType || 'percentage') === 'percentage' ? '#ffffff' : 'var(--color-text)',
                          border: (settings.festivalDiscountType || 'percentage') === 'percentage' ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        Percentage OFF (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, festivalDiscountType: 'fixed' }))}
                        style={{
                          padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 800, fontSize: 13,
                          background: settings.festivalDiscountType === 'fixed' ? 'var(--color-accent)' : 'var(--color-surface)',
                          color: settings.festivalDiscountType === 'fixed' ? '#ffffff' : 'var(--color-text)',
                          border: settings.festivalDiscountType === 'fixed' ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        Flat Amount OFF (₹)
                      </button>
                    </div>

                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={settings.festivalDiscountValue ?? settings.festivalDiscountPercent ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                        setSettings((s) => ({
                          ...s,
                          festivalDiscountValue: val,
                          festivalDiscountPercent: val
                        }));
                      }}
                      placeholder={settings.festivalDiscountType === 'fixed' ? 'e.g. 20 for Flat ₹20 off' : 'e.g. 15 for 15% off'}
                      style={{ maxWidth: 260 }}
                    />
                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5 }}>
                      {settings.festivalDiscountType === 'fixed'
                        ? 'Flat rupee amount subtracted from eligible items during festival sale'
                        : 'Percentage discount applied to eligible items during festival sale'}
                    </p>
                  </div>

                  {/* Item Eligibility Manager (Include / Exclude Items) */}
                  <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 18, border: '1px solid var(--color-border)', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text)' }}>
                          Item Eligibility (Include / Exclude Items)
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                          Click items below to toggle whether they are included in the {settings.festivalDiscountType === 'fixed' ? `Flat ₹${settings.festivalDiscountValue || 0} OFF` : `${settings.festivalDiscountValue || settings.festivalDiscountPercent || 0}% OFF`} sale.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, excludedFestivalItemIds: [] }))}
                          style={{ padding: '6px 12px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          ✓ Include All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, excludedFestivalItemIds: menuItemsList.map((i) => i.rawId !== undefined ? i.rawId : i.id) }))}
                          style={{ padding: '6px 12px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          ✕ Exclude All
                        </button>
                      </div>
                    </div>

                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                      {menuItemsList.map((item) => {
                        const itemKey = item.rawId !== undefined ? item.rawId : item.id;
                        const excludedList = (settings.excludedFestivalItemIds || []).map(id => String(id));
                        const isExcluded = excludedList.includes(String(itemKey));
                        const discountType = settings.festivalDiscountType || 'percentage';
                        const discountVal = Number(settings.festivalDiscountValue ?? settings.festivalDiscountPercent) || 0;
                        const originalPrice = Number(item.price) || 0;

                        let salePrice = originalPrice;
                        let badgeText = '';
                        if (discountVal > 0) {
                          if (discountType === 'fixed') {
                            salePrice = Math.max(0, Math.round(originalPrice - discountVal));
                            badgeText = `₹${discountVal} OFF`;
                          } else {
                            salePrice = Math.max(0, Math.round(originalPrice * (1 - discountVal / 100)));
                            badgeText = `${discountVal}% OFF`;
                          }
                        }

                        const isOnSale = !isExcluded && salePrice < originalPrice;

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSettings((s) => {
                                const currentExcluded = (s.excludedFestivalItemIds || []).map(id => String(id));
                                const keyStr = String(itemKey);
                                const newExcluded = currentExcluded.includes(keyStr)
                                  ? currentExcluded.filter((id) => id !== keyStr)
                                  : [...currentExcluded, itemKey];
                                return { ...s, excludedFestivalItemIds: newExcluded };
                              });
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 12,
                              cursor: 'pointer',
                              border: !isExcluded ? '1.5px solid #16a34a' : '1px solid var(--color-border)',
                              background: !isExcluded ? 'var(--color-card)' : 'var(--color-surface)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 700, fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {item.isCombo ? '⚡ ' : ''}{item.name}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                {isOnSale ? (
                                  <>
                                    <span style={{ fontSize: 11, color: 'var(--color-muted)', textDecoration: 'line-through' }}>₹{originalPrice}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>₹{salePrice}</span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>₹{originalPrice}</span>
                                )}
                              </div>
                            </div>

                            <span style={{
                              padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800, flexShrink: 0,
                              background: !isExcluded ? '#f0fdf4' : '#f3f4f6',
                              color: !isExcluded ? '#16a34a' : '#6b7280',
                              border: !isExcluded ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
                            }}>
                              {!isExcluded ? (isOnSale ? `✓ ${badgeText}` : '✓ Included') : '✕ Excluded'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Festival Item Prices (Special Price Overrides) */}
                  <div style={{ background: 'var(--color-surface)', borderRadius: 16, padding: 18, border: '1px solid var(--color-border)', marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text)' }}>
                          Custom Festival Item Prices (Special Price Overrides)
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                          Set custom sale prices for specific items to override percentage or flat discounts during the festival sale.
                        </p>
                      </div>
                      {Object.keys(settings.customFestivalPrices || {}).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSettings((s) => ({ ...s, customFestivalPrices: {} }))}
                          style={{ padding: '6px 12px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          Clear All Custom Prices
                        </button>
                      )}
                    </div>

                    <div className="no-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                      {menuItemsList.map((item) => {
                        const itemKey = item.rawId !== undefined ? String(item.rawId) : String(item.id);
                        const excludedList = (settings.excludedFestivalItemIds || []).map(id => String(id));
                        const isExcluded = excludedList.includes(itemKey);
                        if (isExcluded) return null; // Only show included items for custom pricing

                        const customPrices = settings.customFestivalPrices || {};
                        const currentCustomVal = customPrices[itemKey] !== undefined ? customPrices[itemKey] : '';
                        const originalPrice = Number(item.price) || 0;
                        const discountType = settings.festivalDiscountType || 'percentage';
                        const discountVal = Number(settings.festivalDiscountValue ?? settings.festivalDiscountPercent) || 0;
                        
                        let defaultAutoPrice = originalPrice;
                        if (discountVal > 0) {
                          if (discountType === 'fixed') {
                            defaultAutoPrice = Math.max(0, Math.round(originalPrice - discountVal));
                          } else {
                            defaultAutoPrice = Math.max(0, Math.round(originalPrice * (1 - discountVal / 100)));
                          }
                        }

                        return (
                          <div
                            key={`custom-price-${item.id}`}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 12,
                              background: 'var(--color-card)',
                              border: currentCustomVal !== '' ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <p style={{ fontWeight: 700, fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {item.isCombo ? '⚡ ' : ''}{item.name}
                              </p>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                                Reg: ₹{originalPrice}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-accent-dark)' }}>₹</span>
                              <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={currentCustomVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSettings((s) => {
                                    const nextCustom = { ...(s.customFestivalPrices || {}) };
                                    if (val === '' || val === null) {
                                      delete nextCustom[itemKey];
                                    } else {
                                      nextCustom[itemKey] = Math.max(0, Number(val));
                                    }
                                    return { ...s, customFestivalPrices: nextCustom };
                                  });
                                }}
                                placeholder={`Auto: ₹${defaultAutoPrice}`}
                                style={{ padding: '6px 10px', fontSize: 13, height: 36, flex: 1 }}
                              />
                              {currentCustomVal !== '' && (
                                <button
                                  type="button"
                                  title="Reset to default discount"
                                  onClick={() => {
                                    setSettings((s) => {
                                      const nextCustom = { ...(s.customFestivalPrices || {}) };
                                      delete nextCustom[itemKey];
                                      return { ...s, customFestivalPrices: nextCustom };
                                    });
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, padding: '4px 6px' }}
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
            {(activeCategoryTab === 'all' || activeCategoryTab === 'reviews') && (hasPermission('reviews') || hasPermission('branding')) && (
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

            {/* ════ 6. SOCIAL LINKS ════ */}
            {(activeCategoryTab === 'all' || activeCategoryTab === 'reviews') && (hasPermission('reviews') || hasPermission('branding')) && (
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
            {(activeCategoryTab === 'all' || activeCategoryTab === 'reviews') && (hasPermission('reviews') || hasPermission('branding')) && (
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{r.author}</span>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {Array.from({ length: r.rating || 5 }).map((_, i) => (
                                  <Star key={i} size={13} fill="#e8901f" color="#e8901f" />
                                ))}
                              </div>
                              {r.itemTitle && (
                                <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--color-accent-bg)', color: 'var(--color-accent-dark)', border: '1px solid var(--color-accent-border)', padding: '2px 8px', borderRadius: 99 }}>
                                  For: {r.itemTitle}
                                </span>
                              )}
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
            {(activeCategoryTab === 'all' || activeCategoryTab === 'admins') && hasPermission('admins') && (
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
                  {/* 🔑 Dedicated Super Admin Self Password Change Box */}
                  {isSuper && (
                    <div style={{
                      background: 'var(--color-surface)',
                      border: '1.5px solid var(--color-accent-border)',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Key size={18} color="var(--color-accent-dark)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text)' }}>
                            🔑 Change Super Admin Password
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                            Update password for active super admin account (@{username || 'admin'})
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                        <input
                          type="password"
                          className="input-field"
                          placeholder="Type new secure password..."
                          value={myPasswordValue}
                          onChange={(e) => setMyPasswordValue(e.target.value)}
                          style={{ fontSize: 13, height: 38, flex: 1, minWidth: 200 }}
                        />
                        <button
                          type="button"
                          onClick={handleUpdateMyPassword}
                          disabled={updatingMyPassword || !myPasswordValue.trim()}
                          className="btn-primary"
                          style={{ padding: '8px 18px', fontSize: 13, height: 38, whiteSpace: 'nowrap' }}
                        >
                          {updatingMyPassword ? 'Updating…' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  )}
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
                      {adminsList.map((ad) => {
                        const isSuper = ad.role === 'super_admin' || ad.permissions === 'all' || !ad.permissions;
                        const permsList = isSuper ? [] : (typeof ad.permissions === 'string' ? ad.permissions.split(',') : ad.permissions || []);
                        return (
                          <div key={ad.id} style={{
                            padding: '16px 18px', background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)', borderRadius: 16,
                            display: 'flex', flexDirection: 'column', gap: 12
                          }}>
                            {/* Card Top Row: Info & Delete */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                  <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text)' }}>
                                    {ad.name ? `${ad.name} (@${ad.username})` : `@${ad.username}`}
                                  </span>
                                  {isSuper ? (
                                    <span style={{ fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 99 }}>
                                      👑 Super Admin (Full Access)
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--color-accent-bg)', color: 'var(--color-accent-dark)', border: '1px solid var(--color-accent-border)', padding: '2px 8px', borderRadius: 99 }}>
                                      ⚙️ Custom Staff Role
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
                                  Added: {new Date(ad.createdAt).toLocaleDateString('en-IN')}
                                </p>
                                {!isSuper && permsList.length > 0 && (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                    {permsList.map((pId) => {
                                      const pObj = AVAILABLE_PERMISSIONS.find(p => p.id === pId);
                                      return (
                                        <span key={pId} style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', padding: '2px 7px', borderRadius: 6, color: 'var(--color-text-secondary)' }}>
                                          {pObj ? pObj.label : pId}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => openEditAdmin(ad)}
                                  title="Edit Account & Permissions"
                                  style={{
                                    padding: '6px 12px', borderRadius: 8,
                                    background: editingAdminId === ad.id ? 'var(--color-accent)' : 'var(--color-card)',
                                    color: editingAdminId === ad.id ? '#ffffff' : 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s'
                                  }}
                                >
                                  <Edit3 size={13} /> {editingAdminId === ad.id ? 'Close Edit' : 'Edit Role & Permissions'}
                                </button>

                                <button onClick={() => deleteAdminUser(ad.id)} disabled={deletingAdminId === ad.id} title="Remove Account" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#dc2626', display: 'flex', flexShrink: 0 }}>
                                  {deletingAdminId === ad.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={15} />}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Edit Account Panel */}
                            <AnimatePresence>
                              {editingAdminId === ad.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{
                                    background: 'var(--color-card)',
                                    borderRadius: 14,
                                    padding: 16,
                                    border: '1.5px solid var(--color-accent-border)',
                                    marginTop: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 14
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-accent-dark)' }}>
                                      ✏️ Edit Account: @{ad.username}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setEditingAdminId(null)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: 12, fontWeight: 700 }}
                                    >
                                      ✕ Cancel
                                    </button>
                                  </div>

                                  {/* Staff Name Edit */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                                      Staff / Admin Name
                                    </label>
                                    <input
                                      type="text"
                                      className="input-field"
                                      placeholder="e.g. Amit Kumar"
                                      value={editAdminForm.name}
                                      onChange={(e) => setEditAdminForm({ ...editAdminForm, name: e.target.value })}
                                      style={{ fontSize: 13, height: 36 }}
                                    />
                                  </div>

                                  {/* Role Selection */}
                                  <div>
                                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                                      Admin Role Type
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                      <button
                                        type="button"
                                        onClick={() => setEditAdminForm(f => ({ ...f, role: 'custom' }))}
                                        style={{
                                          padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 800, fontSize: 12,
                                          background: editAdminForm.role === 'custom' ? 'var(--color-accent)' : 'var(--color-surface)',
                                          color: editAdminForm.role === 'custom' ? '#ffffff' : 'var(--color-text)',
                                          border: editAdminForm.role === 'custom' ? 'none' : '1px solid var(--color-border)',
                                          textAlign: 'center'
                                        }}
                                      >
                                        ⚙️ Custom Staff Role
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditAdminForm(f => ({ ...f, role: 'super_admin' }))}
                                        style={{
                                          padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 800, fontSize: 12,
                                          background: editAdminForm.role === 'super_admin' ? 'var(--color-accent)' : 'var(--color-surface)',
                                          color: editAdminForm.role === 'super_admin' ? '#ffffff' : 'var(--color-text)',
                                          border: editAdminForm.role === 'super_admin' ? 'none' : '1px solid var(--color-border)',
                                          textAlign: 'center'
                                        }}
                                      >
                                        👑 Super Admin
                                      </button>
                                    </div>
                                  </div>

                                  {/* Quick Role Presets (for Custom Role) */}
                                  {editAdminForm.role === 'custom' && (
                                    <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: 12, border: '1px solid var(--color-border)' }}>
                                      <div style={{ marginBottom: 8 }}>
                                        <p style={{ fontWeight: 800, fontSize: 12, color: 'var(--color-text)', marginBottom: 6 }}>
                                          Quick Role Presets:
                                        </p>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                          <button
                                            type="button"
                                            onClick={() => setEditAdminForm(f => ({ ...f, permissions: ['orders'] }))}
                                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                          >
                                            📋 Cashier / Orders
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditAdminForm(f => ({ ...f, permissions: ['menu'] }))}
                                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                          >
                                            🍕 Menu Manager
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditAdminForm(f => ({ ...f, permissions: ['sales', 'coupons'] }))}
                                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                          >
                                            🎉 Deals &amp; Promo
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditAdminForm(f => ({ ...f, permissions: ['branding', 'sales', 'menu', 'orders', 'reviews', 'coupons'] }))}
                                            style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                          >
                                            🏬 Store Manager
                                          </button>
                                        </div>
                                      </div>

                                      <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 6, color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                                        Assigned Permissions:
                                      </p>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {AVAILABLE_PERMISSIONS.map((perm) => {
                                          const isChecked = (editAdminForm.permissions || []).includes(perm.id);
                                          return (
                                            <div
                                              key={`edit-${ad.id}-${perm.id}`}
                                              onClick={() => {
                                                setEditAdminForm(f => {
                                                  const cur = f.permissions || [];
                                                  const next = cur.includes(perm.id)
                                                    ? cur.filter(p => p !== perm.id)
                                                    : [...cur, perm.id];
                                                  return { ...f, permissions: next };
                                                });
                                              }}
                                              style={{
                                                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                                                background: isChecked ? 'var(--color-card)' : 'transparent',
                                                border: isChecked ? '1.5px solid #16a34a' : '1px solid var(--color-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                                              }}
                                            >
                                              <div>
                                                <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text)' }}>{perm.label}</p>
                                                <p style={{ fontSize: 10, color: 'var(--color-muted)' }}>{perm.desc}</p>
                                              </div>
                                              <span style={{
                                                padding: '2px 6px', borderRadius: 99, fontSize: 10, fontWeight: 800,
                                                background: isChecked ? '#f0fdf4' : '#f3f4f6',
                                                color: isChecked ? '#16a34a' : '#9ca3af',
                                                border: isChecked ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
                                              }}>
                                                {isChecked ? '✓ Granted' : 'Disabled'}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Embedded Password Reset inside Edit Card (Super Admin only) */}
                                  {isSuper && (
                                    <div>
                                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
                                        Reset Password (Optional)
                                      </label>
                                      <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Leave blank to keep existing password"
                                        value={editAdminForm.password}
                                        onChange={(e) => setEditAdminForm({ ...editAdminForm, password: e.target.value })}
                                        style={{ fontSize: 13, height: 36 }}
                                      />
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingAdminId(null)}
                                      className="btn-secondary"
                                      style={{ flex: 1, padding: 9, fontSize: 12 }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveUpdateAdmin(ad.id)}
                                      disabled={savingEditAdmin}
                                      className="btn-primary"
                                      style={{ flex: 1, padding: 9, fontSize: 12 }}
                                    >
                                      {savingEditAdmin ? 'Saving…' : 'Save Changes'}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Dedicated Change Password Box inside this Admin Card (Super Admin only) */}
                            {isSuper && editingAdminId !== ad.id && (
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'var(--color-card)', padding: '8px 12px',
                                borderRadius: 12, border: '1px solid var(--color-border)', flexWrap: 'wrap'
                              }}>
                                <Key size={14} color="var(--color-accent-dark)" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', flexShrink: 0 }}>
                                  Change Password:
                                </span>
                                <input
                                  type="password"
                                  className="input-field"
                                  placeholder="Type new password..."
                                  value={inlinePasswords[ad.id] || ''}
                                  onChange={(e) => setInlinePasswords({ ...inlinePasswords, [ad.id]: e.target.value })}
                                  style={{ fontSize: 12, height: 34, padding: '4px 10px', flex: 1, minWidth: 140 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleInlinePasswordUpdate(ad.id, ad.username)}
                                  disabled={updatingPasswordId === ad.id || !(inlinePasswords[ad.id] || '').trim()}
                                  style={{
                                    padding: '6px 14px', borderRadius: 8,
                                    background: (inlinePasswords[ad.id] || '').trim() ? 'var(--color-accent)' : 'var(--color-surface)',
                                    color: (inlinePasswords[ad.id] || '').trim() ? '#ffffff' : 'var(--color-muted)',
                                    border: (inlinePasswords[ad.id] || '').trim() ? 'none' : '1px solid var(--color-border)',
                                    fontWeight: 800, fontSize: 12, cursor: (inlinePasswords[ad.id] || '').trim() ? 'pointer' : 'default',
                                    flexShrink: 0, transition: 'all 0.15s'
                                  }}
                                >
                                  {updatingPasswordId === ad.id ? 'Updating…' : 'Update'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                    Select Reviewed Item (Optional)
                  </label>
                  <select
                    className="input-field"
                    value={reviewForm.itemTitle || ''}
                    onChange={(e) => setReviewForm({ ...reviewForm, itemTitle: e.target.value })}
                  >
                    <option value="">General Café Review (No Specific Item)</option>
                    {menuItemsList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.isCombo ? '⚡ Combo: ' : '🍽️ '} {item.name}
                      </option>
                    ))}
                  </select>
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
              className="no-scrollbar"
              style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

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

                {/* Role Type Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                    Select Admin Account Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setAdminForm((f) => ({ ...f, role: 'custom' }))}
                      style={{
                        padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 800, fontSize: 13,
                        background: adminForm.role === 'custom' ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: adminForm.role === 'custom' ? '#ffffff' : 'var(--color-text)',
                        border: adminForm.role === 'custom' ? 'none' : '1px solid var(--color-border)',
                        textAlign: 'center'
                      }}
                    >
                      ⚙️ Custom Staff Role
                      <span style={{ display: 'block', fontSize: 10, opacity: 0.8, fontWeight: 500, marginTop: 2 }}>Selective Permissions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminForm((f) => ({ ...f, role: 'super_admin' }))}
                      style={{
                        padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 800, fontSize: 13,
                        background: adminForm.role === 'super_admin' ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: adminForm.role === 'super_admin' ? '#ffffff' : 'var(--color-text)',
                        border: adminForm.role === 'super_admin' ? 'none' : '1px solid var(--color-border)',
                        textAlign: 'center'
                      }}
                    >
                      👑 Super Admin
                      <span style={{ display: 'block', fontSize: 10, opacity: 0.8, fontWeight: 500, marginTop: 2 }}>Full Unrestricted Access</span>
                    </button>
                  </div>
                </div>

                {/* Granular Permissions Checklist (Only for Custom Role) */}
                {adminForm.role === 'custom' && (
                  <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 14, border: '1px solid var(--color-border)' }}>
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--color-text)', marginBottom: 6 }}>
                        Quick Role Presets:
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setAdminForm(f => ({ ...f, permissions: ['orders'] }))}
                          style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                        >
                          📋 Cashier / Orders
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminForm(f => ({ ...f, permissions: ['menu'] }))}
                          style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                        >
                          🍕 Menu Manager
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminForm(f => ({ ...f, permissions: ['sales', 'coupons'] }))}
                          style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                        >
                          🎉 Deals &amp; Promo
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminForm(f => ({ ...f, permissions: ['branding', 'sales', 'menu', 'orders', 'reviews', 'coupons'] }))}
                          style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--color-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                        >
                          🏬 Store Manager
                        </button>
                      </div>
                    </div>

                    <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                      Assigned Permissions:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const isChecked = (adminForm.permissions || []).includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => {
                              setAdminForm((f) => {
                                const currentPerms = f.permissions || [];
                                const newPerms = currentPerms.includes(perm.id)
                                  ? currentPerms.filter((p) => p !== perm.id)
                                  : [...currentPerms, perm.id];
                                return { ...f, permissions: newPerms };
                              });
                            }}
                            style={{
                              padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                              background: isChecked ? 'var(--color-card)' : 'transparent',
                              border: isChecked ? '1.5px solid #16a34a' : '1px solid var(--color-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>{perm.label}</p>
                              <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>{perm.desc}</p>
                            </div>
                            <span style={{
                              padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                              background: isChecked ? '#f0fdf4' : '#f3f4f6',
                              color: isChecked ? '#16a34a' : '#9ca3af',
                              border: isChecked ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
                            }}>
                              {isChecked ? '✓ Granted' : 'Disabled'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
      {/* Change Admin Password Modal */}
      <AnimatePresence>
        {showPasswordModal && passwordTargetAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPasswordModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 400, background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={16} color="var(--color-accent-dark)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 16 }}>Change Admin Password</h3>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Account: @{passwordTargetAdmin.username}</p>
                  </div>
                </div>
                <button onClick={() => setShowPasswordModal(false)} style={{ background: 'var(--color-surface)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    New Password *
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Enter new password"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleUpdatePassword} disabled={updatingPassword} className="btn-primary" style={{ flex: 1, padding: 12 }}>
                    {updatingPassword ? 'Updating…' : 'Update Password'}
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
