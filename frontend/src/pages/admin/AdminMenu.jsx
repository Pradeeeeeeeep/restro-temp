import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, X, Check, ToggleLeft, ToggleRight,
  Upload, UtensilsCrossed, Tag, GripVertical, Utensils, Flame
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';
import { getStoredCombos, isCombosSectionEnabled } from '../../components/FastFoodFeatures';

/* ─────────────────────────── constants ─────────────────────────── */
const EMPTY_ITEM = { name: '', description: '', price: '', categoryId: '', available: true, customizations: [] };

const PRESET_ADDONS = [
  { name: 'Extra Cheese', price: 20 },
  { name: 'Extra Mayo', price: 15 },
  { name: 'Double Grilled', price: 10 },
  { name: 'Make it Spicy', price: 0 },
  { name: 'Brown Bread', price: 10 },
  { name: 'Extra Dip', price: 20 },
];
// No more emoji array — categories use UtensilsCrossed icon as default
const CATEGORY_ICON = UtensilsCrossed;

/* ═══════════════════════════════════════════════════════════════════
   ADMIN MENU PAGE
══════════════════════════════════════════════════════════════════ */
export default function AdminMenu() {
  const [tab, setTab] = useState('items'); // 'items' | 'categories'
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── item form ── */
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [hasCustomizations, setHasCustomizations] = useState(false);
  const fileInputRef = useRef(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [filterCat, setFilterCat] = useState('');

  /* ── category form ── */
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🍽️');
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCat, setDeletingCat] = useState(null);
  const [editCat, setEditCat] = useState(null);       // category being renamed
  const [editCatName, setEditCatName] = useState(''); // new name (without emoji)

  /* ── combos state ── */
  const [combosEnabled, setCombosEnabled] = useState(isCombosSectionEnabled());
  const [combosList, setCombosList] = useState(getStoredCombos());
  const [showComboModal, setShowComboModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboForm, setComboForm] = useState({
    name: '', desc: '', originalPrice: '', comboPrice: '', badge: '', image: '', available: true
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ir, cr, combRes, settRes] = await Promise.all([
        api.get('/admin/menu'),
        api.get('/admin/categories'),
        api.get('/admin/combos').catch(() => ({ data: { combos: [] } })),
        api.get('/settings').catch(() => ({ data: { settings: {} } }))
      ]);
      setItems(ir.data.items);
      setCategories(cr.data.categories);
      if (combRes.data?.combos) {
        setCombosList(combRes.data.combos.map(c => ({ ...c, desc: c.description || c.desc })));
      }
      if (settRes.data?.settings?.combosEnabled !== undefined) {
        setCombosEnabled(settRes.data.settings.combosEnabled !== false);
        localStorage.setItem('admin_combos_enabled', settRes.data.settings.combosEnabled !== false ? 'true' : 'false');
      }
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  /* ── image helpers ── */
  const resetImg = () => {
    setImageFile(null); setImagePreview(null); setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── item form actions ── */
const parseCustomizations = (cust) => {
  if (!cust) return [];
  if (Array.isArray(cust)) return cust;
  if (typeof cust === 'string') {
    try {
      const parsed = JSON.parse(cust);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};

  const openAddItem = () => {
    setEditItem(null);
    setHasCustomizations(false);
    setItemForm({ ...EMPTY_ITEM, categoryId: categories[0]?.id || '', customizations: [] });
    resetImg(); setShowItemForm(true);
  };
  const openEditItem = (item) => {
    setEditItem(item);
    const custArray = parseCustomizations(item.customizations);
    const hasCust = custArray.length > 0;
    setHasCustomizations(hasCust);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      available: item.available,
      customizations: hasCust ? custArray : [{ name: 'Extra Cheese', price: 20 }],
    });
    resetImg(); setExistingImage(item.image || null); setShowItemForm(true);
  };
  const closeItemForm = () => { setShowItemForm(false); resetImg(); };

  const saveItem = async () => {
    if (!itemForm.name.trim()) return toast.error('Name is required');
    if (!itemForm.price || isNaN(itemForm.price)) return toast.error('Valid price required');
    if (!itemForm.categoryId) return toast.error('Category required');
    setSavingItem(true);
    try {
      const fd = new FormData();
      fd.append('name', itemForm.name.trim());
      fd.append('description', itemForm.description.trim() || '');
      fd.append('price', parseFloat(itemForm.price));
      fd.append('categoryId', parseInt(itemForm.categoryId));
      fd.append('available', itemForm.available);

      const cleanCustomizations = hasCustomizations
        ? (itemForm.customizations || []).filter((a) => a && a.name && a.name.trim() !== '')
        : [];
      fd.append('customizations', JSON.stringify(cleanCustomizations));

      if (imageFile) fd.append('image', imageFile);
      else if (existingImage) fd.append('image', existingImage);

      // Do NOT explicitly set 'Content-Type': 'multipart/form-data' in Axios (it strips boundary)
      editItem
        ? await api.put(`/admin/menu/${editItem.id}`, fd)
        : await api.post('/admin/menu', fd);

      toast.success(editItem ? 'Item updated!' : 'Item added to menu!');
      closeItemForm(); fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSavingItem(false); }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setDeletingItem(item.id);
    try { await api.delete(`/admin/menu/${item.id}`); toast.success('Item deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setDeletingItem(null); }
  };

  const toggleItem = async (item) => {
    try {
      const fd = new FormData();
      fd.append('available', !item.available);
      await api.put(`/admin/menu/${item.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  /* ── category actions ── */
  const saveCategory = async () => {
    const name = catName.trim();
    if (!name) return toast.error('Category name is required');
    setSavingCat(true);
    try {
      await api.post('/admin/categories', { name, sortOrder: categories.length });
      toast.success(`Category "${name}" added!`);
      setCatName(''); setShowCatForm(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add category'); }
    finally { setSavingCat(false); }
  };

  const deleteCategory = async (cat) => {
    const usedCount = items.filter((i) => i.categoryId === cat.id).length;
    if (usedCount > 0) {
      toast.error(`Cannot delete: ${usedCount} item${usedCount !== 1 ? 's' : ''} use this category`);
      return;
    }
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    setDeletingCat(cat.id);
    try { await api.delete(`/admin/categories/${cat.id}`); toast.success('Category deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setDeletingCat(null); }
  };

  const startEditCat = (cat) => {
    setEditCat(cat);
    setEditCatName(cat.name);
  };

  const saveEditCat = async () => {
    if (!editCatName.trim()) return toast.error('Name is required');
    try {
      await api.put(`/admin/categories/${editCat.id}`, { name: editCatName.trim() });
      toast.success('Category renamed!');
      setEditCat(null); setEditCatName('');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to rename'); }
  };

  /* ── combos helpers ── */
  const toggleCombosSectionMaster = async () => {
    const nextState = !combosEnabled;
    setCombosEnabled(nextState);
    localStorage.setItem('admin_combos_enabled', nextState ? 'true' : 'false');
    try {
      await api.put('/admin/settings', { combosEnabled: nextState });
      toast.success(`Combos section ${nextState ? 'enabled' : 'disabled'}`);
      window.dispatchEvent(new Event('combos-updated'));
    } catch {
      toast.error('Failed to update combo settings');
    }
  };

  const toggleSingleComboActive = async (id) => {
    const target = combosList.find((c) => c.id === id);
    if (!target) return;
    const newAvail = target.available === false ? true : false;
    try {
      await api.put(`/admin/combos/${id}`, { available: newAvail });
      toast.success('Combo toggle updated!');
      fetchData();
      window.dispatchEvent(new Event('combos-updated'));
    } catch {
      toast.error('Failed to update combo');
    }
  };

  const deleteSingleCombo = async (id) => {
    if (!window.confirm('Delete this combo meal?')) return;
    try {
      await api.delete(`/admin/combos/${id}`);
      toast.success('Combo deleted!');
      fetchData();
      window.dispatchEvent(new Event('combos-updated'));
    } catch {
      toast.error('Failed to delete combo');
    }
  };

  const openAddCombo = () => {
    setEditingCombo(null);
    setComboForm({ name: '', desc: '', originalPrice: '', comboPrice: '', badge: 'SPECIAL OFFER ⚡', image: '', available: true });
    setShowComboModal(true);
  };

  const openEditCombo = (c) => {
    setEditingCombo(c);
    setComboForm({
      name: c.name,
      desc: c.desc || c.description || '',
      originalPrice: c.originalPrice ? String(c.originalPrice) : '',
      comboPrice: String(c.comboPrice),
      badge: c.badge || '',
      image: c.image || '',
      available: c.available !== false,
    });
    setShowComboModal(true);
  };

  const saveCombo = async () => {
    if (!comboForm.name.trim()) return toast.error('Combo name is required');
    if (!comboForm.comboPrice || isNaN(comboForm.comboPrice)) return toast.error('Valid combo price required');

    const origPrice = comboForm.originalPrice ? parseFloat(comboForm.originalPrice) : null;
    const cPrice = parseFloat(comboForm.comboPrice);

    const payload = {
      name: comboForm.name.trim(),
      description: comboForm.desc.trim(),
      originalPrice: origPrice,
      comboPrice: cPrice,
      badge: comboForm.badge.trim(),
      image: comboForm.image.trim(),
      available: comboForm.available,
    };

    try {
      if (editingCombo && typeof editingCombo.id === 'number') {
        await api.put(`/admin/combos/${editingCombo.id}`, payload);
        toast.success('Combo updated!');
      } else {
        await api.post('/admin/combos', payload);
        toast.success('New combo created!');
      }
      fetchData();
      window.dispatchEvent(new Event('combos-updated'));
      setShowComboModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save combo');
    }
  };

  const filtered = filterCat ? items.filter((i) => i.categoryId === parseInt(filterCat)) : items;
  const currentImage = imagePreview || existingImage;

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav active="/admin/menu" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24 }}><span className="gradient-text">Menu Management</span></h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{items.length} items · {categories.length} categories · {combosList.length} combos</p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={tab === 'items' ? openAddItem : tab === 'combos' ? () => { setEditingCombo(null); setComboForm({ name: '', desc: '', originalPrice: '', comboPrice: '', badge: 'SPECIAL OFFER ⚡', image: '', available: true }); setShowComboModal(true); } : () => setShowCatForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 14,
              border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 15,
              background: 'linear-gradient(135deg, #e8901f, #c2700f)', color: '#fff',
              boxShadow: '0 4px 16px rgba(194,112,15,0.35)',
            }}>
            <Plus size={20} />
            {tab === 'items' ? 'Add to Menu' : tab === 'combos' ? 'Add New Combo' : 'Add Category'}
          </motion.button>
        </div>

        {/* ── Tab switcher ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-surface)', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid var(--color-border)' }}>
          {[
            { id: 'items', label: 'Menu Items', icon: UtensilsCrossed },
            { id: 'combos', label: 'Fast Food Combos', icon: Flame },
            { id: 'categories', label: 'Categories', icon: Tag },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 14,
                transition: 'all 0.2s',
                background: tab === id ? 'linear-gradient(135deg, #e8901f, #c2700f)' : 'transparent',
                color: tab === id ? '#fff' : 'var(--color-text-secondary)',
                boxShadow: tab === id ? '0 2px 8px rgba(194,112,15,0.25)' : 'none',
              }}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ══════════════════ ITEMS TAB ══════════════════ */}
        <AnimatePresence mode="wait">
          {tab === 'items' && (
            <motion.div key="items" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Category filter pills */}
              <div className="no-scrollbar" style={{ display: 'flex', gap: 7, marginBottom: 16, overflowX: 'auto', paddingBottom: 2, flexWrap: 'nowrap' }}>
                {['', ...categories.map((c) => String(c.id))].map((cid) => {
                  const cat = categories.find((c) => String(c.id) === cid);
                  const sel = filterCat === cid;
                  return (
                    <button key={cid} onClick={() => setFilterCat(cid)}
                      style={{
                        padding: '6px 13px', borderRadius: 99, fontFamily: 'Outfit', fontWeight: 700,
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

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 68, borderRadius: 12 }} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
                  <p style={{ fontWeight: 600, marginBottom: 10 }}>No items yet</p>
                  <button className="btn-primary" onClick={openAddItem} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Plus size={15} /> Add your first item
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filtered.map((item) => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                      style={{
                        background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 14,
                        padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12,
                        opacity: item.available ? 1 : 0.6, transition: 'all 0.2s',
                      }}>
                      <div style={{ width: 50, height: 50, borderRadius: 11, background: 'var(--color-surface)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Utensils size={22} color="var(--color-muted-light)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</p>
                          {(() => {
                            const custs = parseCustomizations(item.customizations);
                            if (custs.length === 0) return null;
                            return (
                              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-accent-dark)', background: 'var(--color-accent-bg)', padding: '2px 7px', borderRadius: 99, border: '1px solid var(--color-accent-border)' }}>
                                ✨ {custs.length} Add-on{custs.length > 1 ? 's' : ''}
                              </span>
                            );
                          })()}
                        </div>
                        <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>
                          {item.category?.name || 'Uncategorised'} · ₹{item.price}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => toggleItem(item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.available ? '#15803d' : 'var(--color-muted)', padding: 0 }}
                          title={item.available ? 'Mark unavailable' : 'Mark available'}>
                          {item.available ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                        <button onClick={() => openEditItem(item)}
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => deleteItem(item)} disabled={deletingItem === item.id}
                          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                          {deletingItem === item.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        {/* ══════════════════ COMBOS TAB ══════════════════ */}
        {tab === 'combos' && (
          <motion.div key="combos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {/* Master Toggle Header Card */}
            <div style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Flame size={22} fill="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>Fast Food Combo Meals Section</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Show or hide combo cards on customer pages</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCombosSectionMaster}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: combosEnabled ? '#15803d' : 'var(--color-muted)' }}
              >
                <span style={{ fontWeight: 800, fontSize: 13 }}>{combosEnabled ? 'ENABLED' : 'DISABLED'}</span>
                {combosEnabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
              </button>
            </div>

            {/* Combos list */}
            {combosList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                <Flame size={44} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontWeight: 600, marginBottom: 10 }}>No combos yet</p>
                <button className="btn-primary" onClick={openAddCombo} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Plus size={15} /> Add your first combo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {combosList.map((combo) => {
                  const DEFAULT_IMG = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
                  const savings = combo.savings || (combo.originalPrice && combo.originalPrice > combo.comboPrice ? combo.originalPrice - combo.comboPrice : null);
                  return (
                    <div key={combo.id} style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, opacity: combo.available !== false ? 1 : 0.55 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface)', flexShrink: 0 }}>
                        <img
                          src={combo.image?.trim() || DEFAULT_IMG}
                          alt={combo.name}
                          onError={(e) => { e.target.src = DEFAULT_IMG; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 800, fontSize: 15 }}>{combo.name}</p>
                          {combo.badge && (
                            <span style={{ fontSize: 10, fontWeight: 900, background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>
                              {combo.badge}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{combo.desc || combo.description || 'No description provided'}</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                          <span style={{ fontWeight: 900, fontSize: 15, color: '#dc2626' }}>₹{combo.comboPrice}</span>
                          {combo.originalPrice && <span style={{ fontSize: 12, color: 'var(--color-muted)', textDecoration: 'line-through' }}>₹{combo.originalPrice}</span>}
                          {savings && <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>Save ₹{savings}!</span>}
                        </div>
                      </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <button onClick={() => toggleSingleComboActive(combo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: combo.available !== false ? '#15803d' : 'var(--color-muted)', padding: 0 }} title={combo.available !== false ? 'Deactivate' : 'Activate'}>
                        {combo.available !== false ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                      <button onClick={() => openEditCombo(combo)} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}>
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => deleteSingleCombo(combo.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#dc2626', display: 'flex' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </motion.div>
        )}

          {/* ══════════════════ CATEGORIES TAB ══════════════════ */}
          {tab === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

              {/* Add Category inline form */}
              <AnimatePresence>
                {showCatForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ background: 'var(--color-card)', border: '2px solid var(--color-accent-border)', borderRadius: 18, padding: 22, boxShadow: '0 4px 20px var(--card-shadow)' }}>
                      <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New Category</h3>

                      {/* Name input */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                          Category Name *
                        </label>
                        <input
                          className="input-field"
                          type="text" placeholder="e.g. Beverages, Sandwiches…"
                          value={catName} onChange={(e) => setCatName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveCategory()}
                          autoFocus
                        />
                      </div>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setShowCatForm(false); setCatName(''); }} className="btn-secondary" style={{ flex: 1 }}>
                          Cancel
                        </button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={saveCategory} disabled={savingCat || !catName.trim()}
                          style={{
                            flex: 2, padding: '13px 20px', borderRadius: 12, border: 'none',
                            cursor: savingCat || !catName.trim() ? 'not-allowed' : 'pointer',
                            background: !catName.trim() ? 'var(--color-surface)' : 'linear-gradient(135deg, #e8901f, #c2700f)',
                            color: !catName.trim() ? 'var(--color-muted)' : '#fff',
                            fontFamily: 'Outfit', fontWeight: 800, fontSize: 15,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: catName.trim() ? '0 4px 14px rgba(194,112,15,0.28)' : 'none',
                            transition: 'all 0.2s',
                          }}>
                          {savingCat
                            ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
                            : <><Check size={17} /> Add Category</>}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category list */}
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 14 }} />)}
                </div>
              ) : categories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-muted)' }}>
                  <Tag size={44} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  <p style={{ fontWeight: 600, marginBottom: 10 }}>No categories yet</p>
                  <button className="btn-primary" onClick={() => setShowCatForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Plus size={15} /> Add first category
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categories.map((cat) => {
                    const itemCount = items.filter((i) => i.categoryId === cat.id).length;
                    const isEditing = editCat?.id === cat.id;
                    return (
                      <motion.div key={cat.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: 'var(--color-card)', border: `1.5px solid ${isEditing ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
                          borderRadius: 14, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12,
                          boxShadow: isEditing ? '0 2px 12px var(--card-shadow)' : 'none', transition: 'all 0.2s',
                        }}>
                        {/* Icon */}
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UtensilsCrossed size={20} color="var(--color-accent)" />
                        </div>

                        {/* Name / inline edit */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                className="input-field"
                                style={{ padding: '7px 12px', fontSize: 14, flex: 1 }}
                                value={editCatName}
                                onChange={(e) => setEditCatName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveEditCat(); if (e.key === 'Escape') setEditCat(null); }}
                                autoFocus
                              />
                              <button onClick={saveEditCat}
                                style={{ background: 'linear-gradient(135deg,#e8901f,#c2700f)', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Outfit', fontWeight: 700, fontSize: 13 }}>
                                <Check size={13} /> Save
                              </button>
                              <button onClick={() => setEditCat(null)}
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <p style={{ fontWeight: 700, fontSize: 15 }}>{cat.name}</p>
                              <p style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 2 }}>
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                              </p>
                            </>
                          )}
                        </div>

                        {!isEditing && (
                          <>
                            {/* Count badge */}
                            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 99, padding: '3px 11px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                              {itemCount}
                            </div>
                            {/* Rename */}
                            <button onClick={() => startEditCat(cat)} title="Rename"
                              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', flexShrink: 0 }}>
                              <Edit3 size={14} />
                            </button>
                            {/* Delete */}
                            <button onClick={() => deleteCategory(cat)} disabled={deletingCat === cat.id || itemCount > 0}
                              title={itemCount > 0 ? `${itemCount} item${itemCount !== 1 ? 's' : ''} use this — remove them first` : 'Delete category'}
                              style={{
                                background: itemCount > 0 ? 'var(--color-surface)' : '#fef2f2',
                                border: `1px solid ${itemCount > 0 ? 'var(--color-border)' : '#fecaca'}`,
                                borderRadius: 8, padding: 7, cursor: itemCount > 0 ? 'not-allowed' : 'pointer',
                                color: itemCount > 0 ? 'var(--color-muted)' : '#dc2626', display: 'flex', flexShrink: 0,
                                opacity: itemCount > 0 ? 0.45 : 1,
                              }}>
                              {deletingCat === cat.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </motion.div>
                    );
                  })}

                  <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', marginTop: 6, padding: '0 16px' }}>
                    💡 Categories with items cannot be deleted. Click ✏️ to rename.
                  </p>
                </div>

              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═════════════════ ADD / EDIT ITEM MODAL ═════════════════ */}
      <AnimatePresence>
        {showItemForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeItemForm}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(26,15,5,0.4)',
              backdropFilter: 'blur(4px)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
                background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 24,
                padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              }}>

              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 20 }}>{editItem ? 'Edit Menu Item' : 'Add to Menu'}</h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 3 }}>
                    {editItem ? 'Update item details' : 'Fill in the details below'}
                  </p>
                </div>
                <button onClick={closeItemForm}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--color-muted)', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Image upload */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Item Photo</label>
                  {currentImage ? (
                    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 160, background: 'var(--color-surface)', border: '2px solid var(--color-accent-border)' }}>
                      <img src={currentImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0, transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                        <button onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={14} /> Change
                        </button>
                        <button onClick={() => { setImageFile(null); setImagePreview(null); setExistingImage(null); }} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                      <button onClick={() => { setImageFile(null); setImagePreview(null); setExistingImage(null); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 99, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <motion.div whileHover={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-bg)' }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ height: 130, borderRadius: 14, border: '2px dashed var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-accent-bg)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={20} color="var(--color-accent)" />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-accent)' }}>Click to upload photo</p>
                        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>JPG, PNG, WEBP · Max 5MB</p>
                      </div>
                    </motion.div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Item Name *</label>
                  <input className="input-field" type="text" placeholder="e.g. Cappuccino" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Description</label>
                  <textarea className="input-field" rows={2} placeholder="Short description..." value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>

                {/* Price + Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Price (₹) *</label>
                    <input className="input-field" type="number" min="0" step="0.5" placeholder="0" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                      Category *
                      <button onClick={() => { closeItemForm(); setTab('categories'); setShowCatForm(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
                        + New
                      </button>
                    </label>
                    <select className="input-field" value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })} style={{ cursor: 'pointer' }}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Availability */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => setItemForm({ ...itemForm, available: !itemForm.available })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: itemForm.available ? '#15803d' : 'var(--color-muted)', padding: 0, display: 'flex' }}>
                    {itemForm.available ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                  </button>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: itemForm.available ? '#15803d' : 'var(--color-muted)' }}>
                      {itemForm.available ? 'Available on menu' : 'Hidden from menu'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                      {itemForm.available ? 'Customers can order this' : 'Item is hidden from customers'}
                    </p>
                  </div>
                </div>

                {/* ── CUSTOMIZATIONS & ADD-ONS EDITOR ── */}
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text)' }}>Item Add-ons &amp; Customizations</p>
                      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>Allow customers to add extra toppings/options</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !hasCustomizations;
                        setHasCustomizations(nextState);
                        if (nextState) {
                          const currentList = itemForm.customizations || [];
                          if (currentList.length === 0) {
                            setItemForm({ ...itemForm, customizations: [{ name: 'Extra Cheese', price: 20 }] });
                          }
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: hasCustomizations ? 'var(--color-accent)' : 'var(--color-muted)', padding: 0, display: 'flex' }}
                    >
                      {hasCustomizations ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                    </button>
                  </div>

                  {hasCustomizations && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--color-surface)', padding: 14, borderRadius: 14, border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Add-on Options List
                      </p>

                      {(itemForm.customizations || []).map((addon, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            className="input-field"
                            type="text"
                            placeholder="Add-on name (e.g. Extra Cheese)"
                            value={addon.name || ''}
                            onChange={(e) => {
                              const updated = [...itemForm.customizations];
                              updated[index].name = e.target.value;
                              setItemForm({ ...itemForm, customizations: updated });
                            }}
                            style={{ flex: 2, padding: '7px 11px', fontSize: 13 }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>+₹</span>
                            <input
                              className="input-field"
                              type="number"
                              min="0"
                              placeholder="Price"
                              value={addon.price !== undefined ? addon.price : ''}
                              onChange={(e) => {
                                const updated = [...itemForm.customizations];
                                updated[index].price = parseFloat(e.target.value) || 0;
                                setItemForm({ ...itemForm, customizations: updated });
                              }}
                              style={{ padding: '7px 9px', fontSize: 13 }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = itemForm.customizations.filter((_, i) => i !== index);
                              setItemForm({ ...itemForm, customizations: updated });
                            }}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', flexShrink: 0 }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const list = itemForm.customizations || [];
                            setItemForm({ ...itemForm, customizations: [...list, { name: '', price: 0 }] });
                          }}
                          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <Plus size={13} /> Add Customization Option
                        </button>
                      </div>

                      {/* Quick Add Presets */}
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                          Quick Add Presets
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {PRESET_ADDONS.map((preset) => {
                            const list = itemForm.customizations || [];
                            const exists = list.some((a) => a && a.name === preset.name);
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  if (!exists) {
                                    setItemForm({ ...itemForm, customizations: [...list, preset] });
                                  }
                                }}
                                disabled={exists}
                                style={{
                                  padding: '4px 9px', borderRadius: 99, border: '1px solid var(--color-border)',
                                  background: exists ? 'var(--color-surface)' : 'var(--color-card)',
                                  color: exists ? 'var(--color-muted)' : 'var(--color-text)',
                                  fontSize: 11, fontWeight: 600, cursor: exists ? 'default' : 'pointer',
                                  opacity: exists ? 0.5 : 1
                                }}
                              >
                                + {preset.name} (+₹{preset.price})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={closeItemForm} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={saveItem} disabled={savingItem}
                  style={{
                    flex: 2, padding: '14px 20px', borderRadius: 12, border: 'none', cursor: savingItem ? 'not-allowed' : 'pointer',
                    background: savingItem ? 'var(--color-border)' : 'linear-gradient(135deg, #e8901f, #c2700f)',
                    color: '#fff', fontFamily: 'Outfit', fontWeight: 800, fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: savingItem ? 'none' : '0 4px 16px rgba(194,112,15,0.3)', transition: 'all 0.2s',
                  }}>
                  {savingItem
                    ? <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
                    : editItem ? <><Check size={18} /> Update Item</> : <><Plus size={18} /> Add to Menu</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════ ADD / EDIT COMBO MODAL ═════════════════ */}
      <AnimatePresence>
        {showComboModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowComboModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'var(--color-card)', border: '1.5px solid var(--color-border)', borderRadius: 20, padding: 22, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontWeight: 800, fontSize: 17 }}>{editingCombo ? 'Edit Fast Food Combo' : 'New Fast Food Combo'}</h3>
                <button onClick={() => setShowComboModal(false)} style={{ background: 'var(--color-surface)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Combo Name *</label>
                  <input className="input-field" type="text" placeholder="e.g. Crispy Burger Saver Combo"
                    value={comboForm.name} onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Combo Description</label>
                  <textarea className="input-field" rows={2} placeholder="e.g. Double Cheeseburger + Large Fries + Coke"
                    value={comboForm.desc} onChange={(e) => setComboForm({ ...comboForm, desc: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Combo Price (₹) *</label>
                    <input className="input-field" type="number" placeholder="249"
                      value={comboForm.comboPrice} onChange={(e) => setComboForm({ ...comboForm, comboPrice: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Original Price (₹)</label>
                    <input className="input-field" type="number" placeholder="309"
                      value={comboForm.originalPrice} onChange={(e) => setComboForm({ ...comboForm, originalPrice: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Badge / Tag</label>
                    <input className="input-field" type="text" placeholder="e.g. BESTSELLER ⚡"
                      value={comboForm.badge} onChange={(e) => setComboForm({ ...comboForm, badge: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Image URL</label>
                  <input className="input-field" type="url" placeholder="https://..."
                    value={comboForm.image} onChange={(e) => setComboForm({ ...comboForm, image: e.target.value })} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Active / Visible on Store</span>
                  <button type="button" onClick={() => setComboForm({ ...comboForm, available: !comboForm.available })} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: comboForm.available ? '#15803d' : 'var(--color-muted)' }}>
                    {comboForm.available ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowComboModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
                  <button type="button" onClick={saveCombo} className="btn-primary" style={{ flex: 1, padding: 12 }}>
                    {editingCombo ? 'Update Combo' : 'Create Combo'}
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
