import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Link, ToggleLeft, ToggleRight, Save, ExternalLink,
  Palette, Check, RefreshCw, Pipette, Upload, Image, Edit3, Coffee, Sparkles, Tag, ArrowRight, ShoppingBag, X
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
  },
  {
    name: 'Milestone & Event Themes',
    sales: [
      'Black Friday Bonanza',
      'Cyber Monday Tech Blowout',
      'Anniversary Appreciation Sale',
      'Mid-Year Mega Clearance',
    ]
  }
];

/* ════════════════════════════════════════
   ADMIN SETTINGS PAGE
════════════════════════════════════════ */
export default function AdminSettings() {
  const { themeId: activeThemeId, customColors: activeCustomColors, updateTheme, updateCustomColors } = useTheme();

  const [settings, setSettings] = useState({
    googleReviewLink: '', showReviewBanner: false,
    theme: activeThemeId, customColors: activeCustomColors,
  });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showPopupPreview, setShowPopupPreview] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings({
        googleReviewLink: '', showReviewBanner: false, cafeName: 'Brew & Bites', cafeLogoUrl: '',
        showFestivalBanner: false, festivalSaleName: 'Diwali Light-Up Sale', cardCornerStyle: 'rounded-full',
        menuItemCornerStyle: 'rounded-md',
        ...data.settings,
      }))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

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
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
            <span className="gradient-text">Settings</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Manage your café app appearance & configuration</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[200, 120, 160].map((h, i) => <div key={i} className="shimmer" style={{ height: h, borderRadius: 16 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ════ CAFÉ BRANDING ════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Edit3 size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16 }}>Café Branding</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Customize your café name and logo shown to customers</p>
                </div>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Logo preview + upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Logo preview */}
                  <div style={{ width: 80, height: 80, borderRadius: 18, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 14px var(--btn-shadow)' }}>
                    {settings.cafeLogoUrl
                      ? <img src={settings.cafeLogoUrl} alt="logo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Coffee size={32} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Café Logo</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>PNG/JPG — shows on the home screen &amp; order pages</p>
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

            {/* ════ FESTIVAL & SALE THEMES ════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={20} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>Festival &amp; Sale Themes</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Display a floating festival banner card on customer pages</p>
                  </div>
                </div>
                {/* Toggle button */}
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, showFestivalBanner: !s.showFestivalBanner }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: settings.showFestivalBanner ? 'var(--color-accent)' : 'var(--color-muted)', padding: 0, display: 'flex' }}
                >
                  {settings.showFestivalBanner ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Banner Live Card Preview */}
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

                {/* Custom Sale Name Input */}
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

                {/* Card Corner & Shape Style Picker */}
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
                          {/* Visual box preview of corner radius */}
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

                {/* Category Presets Selector */}
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

            {/* ════ THEME PICKER ════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
              {/* Section header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Palette size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16 }}>Appearance</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Choose a theme for your customer-facing pages</p>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
                  Hover to preview · Click to select
                </p>
                {/* 5-column grid of swatches */}
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

                {/* Live preview badge */}
                <AnimatePresence>
                  {previewTheme && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', borderRadius: 99, padding: '5px 12px', fontSize: 12, color: 'var(--color-accent-dark)', fontWeight: 600 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--color-accent)', display: 'inline-block' }} />
                      Previewing {THEMES[previewTheme]?.name}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Menu Item Card Corner Style Customization ── */}
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
                          {/* Visual box preview */}
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

            {/* ════ CUSTOM COLOURS ════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Pipette size={20} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>Custom Colours</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Fine-tune the selected theme</p>
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

            {/* ════ GOOGLE REVIEWS ════ */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={20} color="#fff" fill="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16 }}>Google Reviews</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Show a review banner on customer pages</p>
                </div>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>Show Review Banner</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>Displays on Home & Order Status pages</p>
                  </div>
                  <button onClick={() => setSettings((s) => ({ ...s, showReviewBanner: !s.showReviewBanner }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: settings.showReviewBanner ? '#15803d' : 'var(--color-muted)' }}>
                    {settings.showReviewBanner ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
                  </button>
                </div>
                {/* Link input */}
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
          </div>
        )}
        {/* ── Save Settings Button Floating Bar ── */}
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
    </div>
  );
}
