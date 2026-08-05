import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Link, ToggleLeft, ToggleRight, Save, ExternalLink,
  Palette, Check, RefreshCw, Pipette, Upload, Image, Edit3, Coffee,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';
import { THEMES, THEME_IDS, applyTheme } from '../../theme/themes';
import { useTheme } from '../../theme/ThemeProvider';

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

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings({
        googleReviewLink: '', showReviewBanner: false, cafeName: 'Brew & Bites', cafeLogoUrl: '',
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

            {/* ── Save button ── */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={save} disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                padding: '15px 24px', borderRadius: 14, border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                background: 'var(--color-accent)',
                color: '#fff', fontFamily: 'Outfit', fontWeight: 800, fontSize: 16,
                boxShadow: '0 4px 16px var(--btn-shadow)',
              }}>
              {saving
                ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
                : <><Save size={18} /> Save All Settings</>}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
