import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AdminNav } from './AdminDashboard';

const EMPTY = { name:'', description:'', price:'', categoryId:'', available:true, image:'' };

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
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

  const openAdd = () => { setEditItem(null); setForm({...EMPTY, categoryId: categories[0]?.id||''}); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ name:item.name, description:item.description||'', price:item.price, categoryId:item.categoryId, available:item.available, image:item.image||'' }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.price || isNaN(form.price)) return toast.error('Valid price required');
    if (!form.categoryId) return toast.error('Category required');
    setSaving(true);
    try {
      const payload = { name:form.name.trim(), description:form.description.trim()||undefined, price:parseFloat(form.price), categoryId:parseInt(form.categoryId), available:form.available, image:form.image.trim()||undefined };
      editItem ? await api.put(`/admin/menu/${editItem.id}`, payload) : await api.post('/admin/menu', payload);
      toast.success(editItem ? 'Item updated!' : 'Item added!');
      setShowForm(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error||'Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setDeleting(item.id);
    try { await api.delete(`/admin/menu/${item.id}`); toast.success('Deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.error||'Failed'); }
    finally { setDeleting(null); }
  };

  const toggle = async (item) => {
    try { await api.put(`/admin/menu/${item.id}`, { available: !item.available }); fetchData(); }
    catch { toast.error('Failed to update'); }
  };

  const filtered = filterCat ? items.filter((i) => i.categoryId === parseInt(filterCat)) : items;

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)' }}>
      <AdminNav active="/admin/menu" />
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20 }}>
          <div>
            <h1 style={{ fontWeight:800, fontSize:24 }}><span className="gradient-text">Menu Items</span></h1>
            <p style={{ color:'var(--color-muted)', fontSize:14 }}>{items.length} items</p>
          </div>
          <button onClick={openAdd} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Plus size={17}/> Add Item
          </button>
        </div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:7, marginBottom:18, flexWrap:'wrap' }}>
          {['', ...categories.map((c)=>String(c.id))].map((cid) => {
            const cat = categories.find((c)=>String(c.id)===cid);
            const sel = filterCat === cid;
            return (
              <button key={cid} onClick={()=>setFilterCat(cid)}
                style={{ padding:'6px 13px', borderRadius:99, fontFamily:'Outfit', fontWeight:700, fontSize:13, cursor:'pointer', border:'none', transition:'all 0.15s',
                  background: sel ? 'linear-gradient(135deg,#e8901f,#c2700f)' : '#fff',
                  color: sel ? '#fff' : 'var(--color-text-secondary)',
                  border: sel ? 'none' : '1px solid var(--color-border)',
                }}>
                {cat ? cat.name : 'All'}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {Array.from({length:5}).map((_,i)=><div key={i} className="shimmer" style={{height:68,borderRadius:12}}/>)}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map((item)=>(
              <motion.div key={item.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                style={{ background:'#fff', border:'1px solid var(--color-border)', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:13, opacity:item.available?1:0.6, transition:'opacity 0.2s' }}>
                <div style={{ width:48, height:48, borderRadius:11, background:'var(--color-surface)', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '🍴'}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontWeight:700,fontSize:14}}>{item.name}</p>
                  <p style={{color:'var(--color-muted)',fontSize:12}}>{item.category?.name}</p>
                </div>
                <div style={{minWidth:60,textAlign:'right'}}>
                  <p style={{fontWeight:800,color:'var(--color-accent-dark)',fontSize:15}}>₹{item.price}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <button onClick={()=>toggle(item)} title={item.available?'Mark unavailable':'Mark available'}
                    style={{background:'none',border:'none',cursor:'pointer',color:item.available?'#15803d':'var(--color-muted)',padding:2}}>
                    {item.available ? <ToggleRight size={26}/> : <ToggleLeft size={26}/>}
                  </button>
                  <button onClick={()=>openEdit(item)}
                    style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:8,padding:6,cursor:'pointer',color:'var(--color-text-secondary)',display:'flex'}}>
                    <Edit3 size={14}/>
                  </button>
                  <button onClick={()=>del(item)} disabled={deleting===item.id}
                    style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:6,cursor:'pointer',color:'#dc2626',display:'flex'}}>
                    {deleting===item.id ? <div className="spinner" style={{width:14,height:14}}/> : <Trash2 size={14}/>}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>setShowForm(false)}
              style={{position:'fixed',inset:0,background:'rgba(26,15,5,0.35)',zIndex:100}}/>
            <motion.div initial={{opacity:0,scale:0.96,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:16}}
              style={{ position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)', width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto',
                background:'#fff',border:'1px solid var(--color-border)',borderRadius:22,padding:28,zIndex:101,
                boxShadow:'0 20px 60px rgba(100,60,20,0.18)' }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
                <h2 style={{fontWeight:800,fontSize:19}}>{editItem?'Edit Item':'Add New Item'}</h2>
                <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-muted)'}}><X size={21}/></button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[['Name *','text','e.g. Cappuccino','name'],['Description','text','Short description…','description'],['Image URL','url','https://…','image']].map(([lbl,type,ph,key])=>(
                  <div key={key}>
                    <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--color-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{lbl}</label>
                    <input className="input-field" type={type} placeholder={ph} value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})}/>
                  </div>
                ))}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--color-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Price (₹) *</label>
                    <input className="input-field" type="number" min="0" step="0.5" placeholder="0" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--color-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Category *</label>
                    <select className="input-field" value={form.categoryId} onChange={(e)=>setForm({...form,categoryId:e.target.value})} style={{cursor:'pointer'}}>
                      {categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <button type="button" onClick={()=>setForm({...form,available:!form.available})}
                    style={{background:'none',border:'none',cursor:'pointer',color:form.available?'#15803d':'var(--color-muted)',padding:0}}>
                    {form.available ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                  </button>
                  <span style={{fontSize:14,fontWeight:600,color:form.available?'#15803d':'var(--color-muted)'}}>
                    {form.available?'Available':'Unavailable'}
                  </span>
                </div>
              </div>
              <div style={{display:'flex',gap:11,marginTop:22}}>
                <button onClick={()=>setShowForm(false)} className="btn-secondary" style={{flex:1}}>Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  {saving ? <><div className="spinner" style={{borderColor:'rgba(255,255,255,0.3)',borderTopColor:'#fff'}}/> Saving…</> : <><Check size={15}/> {editItem?'Update':'Add Item'}</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
