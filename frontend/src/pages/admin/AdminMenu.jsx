import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, Check, ToggleLeft, ToggleRight, Upload, ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

const EMPTY = { name: '', description: '', price: '', categoryId: '', available: true };

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);

  // Image state
  const [imageFile, setImageFile] = useState(null);        // new file selected by user
  const [imagePreview, setImagePreview] = useState(null);  // local preview URL
  const [existingImage, setExistingImage] = useState(null);// existing item image (when editing)
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ir, cr] = await Promise.all([api.get('/admin/menu'), api.get('/admin/categories')]);
      setItems(ir.data.items);
      setCategories(cr.data.categories);
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY, categoryId: categories[0]?.id || '' });
    resetImageState();
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      available: item.available,
    });
    resetImageState();
    setExistingImage(item.image || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetImageState();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price || isNaN(form.price)) return toast.error('Valid price is required');
    if (!form.categoryId) return toast.error('Category is required');

    setSaving(true);
    try {
      // Always use FormData so multer can handle the file
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim() || '');
      fd.append('price', parseFloat(form.price));
      fd.append('categoryId', parseInt(form.categoryId));
      fd.append('available', form.available);
      if (imageFile) {
        fd.append('image', imageFile);
      } else if (existingImage) {
        fd.append('image', existingImage); // keep existing URL
      }
      // If both null → image will be cleared

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editItem) {
        await api.put(`/admin/menu/${editItem.id}`, fd, config);
        toast.success('Item updated!');
      } else {
        await api.post('/admin/menu', fd, config);
        toast.success('Item added to menu!');
      }
      closeForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const del = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setDeleting(item.id);
    try { await api.delete(`/admin/menu/${item.id}`); toast.success('Item deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to delete'); }
    finally { setDeleting(null); }
  };

  const toggle = async (item) => {
    try {
      const fd = new FormData();
      fd.append('available', !item.available);
      await api.put(`/admin/menu/${item.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filterCat ? items.filter((i) => i.categoryId === parseInt(filterCat)) : items;
  const currentImage = imagePreview || existingImage;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/menu" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24 }}><span className="gradient-text">Menu Items</span></h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{items.length} items total</p>
          </div>
          {/* ── ADD ITEM BUTTON — prominent ── */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #e8901f, #c2700f)',
              color: '#fff', fontFamily: 'Outfit', fontWeight: 700, fontSize: 15,
              boxShadow: '0 4px 16px rgba(194,112,15,0.35)',
            }}
          >
            <Plus size={20} /> Add to Menu
          </motion.button>
        </div>

        {/* ── Category filter ── */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          {['', ...categories.map((c) => String(c.id))].map((cid) => {
            const cat = categories.find((c) => String(c.id) === cid);
            const sel = filterCat === cid;
            return (
              <button key={cid} onClick={() => setFilterCat(cid)}
                style={{
                  padding: '6px 14px', borderRadius: 99, fontFamily: 'Outfit', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  background: sel ? 'linear-gradient(135deg, #e8901f, #c2700f)' : '#fff',
                  color: sel ? '#fff' : 'var(--color-text-secondary)',
                  border: sel ? 'none' : '1px solid var(--color-border)',
                  boxShadow: sel ? '0 3px 10px rgba(194,112,15,0.25)' : 'none',
                }}>
                {cat ? cat.name : 'All'}
              </button>
            );
          })}
        </div>

        {/* ── Items list ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 68, borderRadius: 12 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>No items yet</p>
            <button className="btn-primary" onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Plus size={16} /> Add your first item
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#fff', border: '1px solid var(--color-border)', borderRadius: 14,
                  padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12,
                  opacity: item.available ? 1 : 0.58, transition: 'opacity 0.2s',
                }}>
                {/* Thumbnail */}
                <div style={{
                  width: 50, height: 50, borderRadius: 11, background: 'var(--color-surface)',
                  flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {item.image
                    ? <img src={item.image.startsWith('/') ? `http://localhost:5001${item.image}` : item.image}
                        alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🍴'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</p>
                  <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>{item.category?.name}</p>
                </div>
                <div style={{ minWidth: 60, textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, color: 'var(--color-accent-dark)', fontSize: 15 }}>₹{item.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <button onClick={() => toggle(item)} title={item.available ? 'Mark unavailable' : 'Mark available'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.available ? '#15803d' : 'var(--color-muted)', padding: 2 }}>
                    {item.available ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                  </button>
                  <button onClick={() => openEdit(item)}
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}>
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => del(item)} disabled={deleting === item.id}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                    {deleting === item.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════ ADD / EDIT MODAL ════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeForm}
              style={{ position: 'fixed', inset: 0, background: 'rgba(26,15,5,0.4)', zIndex: 100 }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
                background: '#fff', border: '1px solid var(--color-border)', borderRadius: 24,
                padding: 28, zIndex: 101, boxShadow: '0 24px 64px rgba(100,60,20,0.18)',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 20 }}>
                    {editItem ? 'Edit Menu Item' : 'Add to Menu'}
                  </h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 3 }}>
                    {editItem ? 'Update item details' : 'Fill in the details below'}
                  </p>
                </div>
                <button onClick={closeForm}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── IMAGE UPLOAD ── */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Item Photo
                  </label>

                  {currentImage ? (
                    /* Preview */
                    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 160, background: 'var(--color-surface)', border: '2px solid var(--color-accent-border)' }}>
                      <img
                        src={currentImage.startsWith('/') ? `http://localhost:5001${currentImage}` : currentImage}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0, transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                        <button onClick={() => fileInputRef.current?.click()}
                          style={{ background: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={14} /> Change
                        </button>
                        <button onClick={removeImage}
                          style={{ background: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                      {/* Always visible remove badge */}
                      <button onClick={removeImage}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 99, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* Upload zone */
                    <motion.div
                      whileHover={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-bg)' }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        height: 140, borderRadius: 14, border: '2px dashed var(--color-border)',
                        background: 'var(--color-surface)', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={22} color="var(--color-accent)" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-accent)' }}>Click to upload photo</p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 3 }}>JPG, PNG, WEBP · Max 5MB</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* ── Name ── */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                    Item Name *
                  </label>
                  <input className="input-field" type="text" placeholder="e.g. Cappuccino" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>

                {/* ── Description ── */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                    Description
                  </label>
                  <textarea className="input-field" rows={2} placeholder="Short description..."
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'vertical' }} />
                </div>

                {/* ── Price + Category ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                      Price (₹) *
                    </label>
                    <input className="input-field" type="number" min="0" step="0.5" placeholder="0"
                      value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                      Category *
                    </label>
                    <select className="input-field" value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={{ cursor: 'pointer' }}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* ── Availability toggle ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => setForm({ ...form, available: !form.available })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.available ? '#15803d' : 'var(--color-muted)', padding: 0, display: 'flex' }}>
                    {form.available ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                  </button>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: form.available ? '#15803d' : 'var(--color-muted)' }}>
                      {form.available ? 'Available on menu' : 'Hidden from menu'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                      {form.available ? 'Customers can order this item' : 'Item is not shown to customers'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Action buttons ── */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={closeForm} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={save}
                  disabled={saving}
                  style={{
                    flex: 2, padding: '14px 20px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    background: saving ? 'var(--color-border)' : 'linear-gradient(135deg, #e8901f, #c2700f)',
                    color: '#fff', fontFamily: 'Outfit', fontWeight: 800, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: saving ? 'none' : '0 4px 16px rgba(194,112,15,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving
                    ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
                    : editItem
                      ? <><Check size={18} /> Update Item</>
                      : <><Plus size={18} /> Add to Menu</>}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
