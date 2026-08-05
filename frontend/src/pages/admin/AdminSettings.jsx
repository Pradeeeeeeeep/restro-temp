import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Link, ToggleLeft, ToggleRight, Save, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ googleReviewLink: '', showReviewBanner: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings(data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/admin/settings', settings);
      setSettings(data.settings);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isValidUrl = (url) => {
    try { new URL(url); return true; } catch { return false; }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/settings" />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 4 }}>
            <span className="gradient-text">Settings</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Manage your café app configuration</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[140, 100].map((h, i) => <div key={i} className="shimmer" style={{ height: h, borderRadius: 16 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Google Review Section ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 18, overflow: 'hidden' }}>
              {/* Section header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
                background: 'linear-gradient(135deg, #fef3e2, #fff8f0)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #e8901f, #c2700f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={20} color="#fff" fill="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: '#92400e' }}>Google Reviews</p>
                  <p style={{ fontSize: 12, color: '#b45309' }}>Show a review banner to customers after their order</p>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                {/* Toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 12,
                  border: '1px solid var(--color-border)', marginBottom: 16,
                }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>Show Review Banner</p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                      Displays a banner on the customer home page
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings((s) => ({ ...s, showReviewBanner: !s.showReviewBanner }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: settings.showReviewBanner ? '#15803d' : 'var(--color-muted)' }}
                  >
                    {settings.showReviewBanner
                      ? <ToggleRight size={34} />
                      : <ToggleLeft size={34} />}
                  </button>
                </div>

                {/* Google Review Link */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    <Link size={12} /> Google Review Link
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type="url"
                      placeholder="https://g.page/r/YOUR-PLACE-ID/review"
                      value={settings.googleReviewLink}
                      onChange={(e) => setSettings((s) => ({ ...s, googleReviewLink: e.target.value }))}
                    />
                  </div>
                  {settings.googleReviewLink && isValidUrl(settings.googleReviewLink) && (
                    <a href={settings.googleReviewLink} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                      <ExternalLink size={12} /> Test link →
                    </a>
                  )}
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
                    Get this from <strong>Google Business Profile</strong> → Get more reviews → Copy link
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Preview */}
            {settings.showReviewBanner && settings.googleReviewLink && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Preview (what customers see)
                </p>
                <div style={{
                  background: 'linear-gradient(135deg, #fef3e2, #fff8f0)',
                  border: '1.5px solid #f9d89a', borderRadius: 16, padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #e8901f, #c2700f)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star size={22} color="#fff" fill="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: '#92400e', marginBottom: 3 }}>
                      Enjoyed your visit? ☕
                    </p>
                    <p style={{ fontSize: 12, color: '#b45309' }}>
                      Leave us a Google review — it means the world!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Save button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={save} disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                padding: '15px 24px', borderRadius: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #e8901f, #c2700f)', color: '#fff',
                fontFamily: 'Outfit', fontWeight: 800, fontSize: 16,
                boxShadow: '0 4px 16px rgba(194,112,15,0.3)', transition: 'all 0.2s',
              }}
            >
              {saving
                ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
                : <><Save size={18} /> Save Settings</>}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
