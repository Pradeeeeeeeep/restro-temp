import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

const EMPTY_FORM = { name: '', description: '', price: '', categoryId: '', available: true, image: '' };

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.get('/admin/menu'),
        api.get('/admin/categories'),
      ]);
      setItems(itemsRes.data.items);
      setCategories(catsRes.data.categories);
      if (catsRes.data.categories.length && !form.categoryId) {
        setForm((f) => ({ ...f, categoryId: catsRes.data.categories[0].id }));
      }
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      available: item.available,
      image: item.image || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price || isNaN(form.price)) return toast.error('Valid price is required');
    if (!form.categoryId) return toast.error('Category is required');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        categoryId: parseInt(form.categoryId),
        available: form.available,
        image: form.image.trim() || undefined,
      };

      if (editItem) {
        await api.put(`/admin/menu/${editItem.id}`, payload);
        toast.success('Item updated!');
      } else {
        await api.post('/admin/menu', payload);
        toast.success('Item added!');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setDeleting(item.id);
    try {
      await api.delete(`/admin/menu/${item.id}`);
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await api.put(`/admin/menu/${item.id}`, { available: !item.available });
      fetchData();
    } catch {
      toast.error('Failed to update');
    }
  };

  const filteredItems = filterCat ? items.filter((i) => i.categoryId === parseInt(filterCat)) : items;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/menu" />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '26px' }}><span className="gradient-text">Menu Items</span></h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>{items.length} items</p>
          </div>
          <button onClick={openAddForm} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Item
          </button>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterCat('')}
            style={{
              padding: '7px 14px', borderRadius: '99px', border: filterCat === '' ? 'none' : '1px solid var(--color-border)',
              cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600, fontSize: '13px',
              background: filterCat === '' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--color-card)',
              color: filterCat === '' ? '#1a0800' : 'var(--color-muted)',
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCat(String(cat.id))}
              style={{
                padding: '7px 14px', borderRadius: '99px',
                border: filterCat === String(cat.id) ? 'none' : '1px solid var(--color-border)',
                cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600, fontSize: '13px',
                background: filterCat === String(cat.id) ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--color-card)',
                color: filterCat === String(cat.id) ? '#1a0800' : 'var(--color-muted)',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer" style={{ height: '70px', borderRadius: '12px' }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', opacity: item.available ? 1 : 0.6 }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: '12px', background: 'var(--color-surface)',
                  flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px'
                }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍴'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '15px' }}>{item.name}</p>
                  <p style={{ color: 'var(--color-muted)', fontSize: '12px' }}>{item.category?.name}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: '70px' }}>
                  <p style={{ fontWeight: 800, color: 'var(--color-accent)', fontSize: '16px' }}>₹{item.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => toggleAvailable(item)}
                    title={item.available ? 'Mark unavailable' : 'Mark available'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.available ? '#22c55e' : 'var(--color-muted)' }}
                  >
                    {item.available ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                  </button>
                  <button onClick={() => openEditForm(item)} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex', alignItems: 'center' }}>
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(item)} disabled={deleting === item.id} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                    {deleting === item.id ? <div className="spinner" style={{ width: 15, height: 15 }} /> : <Trash2 size={15} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: '24px', padding: '28px', zIndex: 101
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontWeight: 800, fontSize: '20px' }}>{editItem ? 'Edit Item' : 'Add New Item'}</h2>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
                  <X size={22} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Name *</label>
                  <input className="input-field" placeholder="e.g. Cappuccino" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</label>
                  <textarea className="input-field" rows={2} placeholder="Short description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Price (₹) *</label>
                    <input className="input-field" type="number" min="0" step="0.5" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Category *</label>
                    <select className="input-field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={{ cursor: 'pointer' }}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Image URL</label>
                  <input className="input-field" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, available: !form.available })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.available ? '#22c55e' : 'var(--color-muted)' }}
                  >
                    {form.available ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: form.available ? '#22c55e' : 'var(--color-muted)' }}>
                    {form.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? <><div className="spinner" /> Saving...</> : <><Check size={16} /> {editItem ? 'Update' : 'Add Item'}</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
