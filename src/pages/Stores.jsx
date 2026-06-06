import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function StoreModal({ store, onSave, onClose }) {
  const [form, setForm] = useState(store || { name:'', color:'#00C9B1', openTime:'09:00', closeTime:'19:30' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>{store?'Modifier le magasin':'Nouveau magasin'}</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div style={{display:'grid',gap:16}}>
          <div><div className="lbl">Nom du magasin</div><input className="inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Save Marseille"/></div>
          <div>
            <div className="lbl">Couleur</div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <input type="color" value={form.color} onChange={e=>set('color',e.target.value)} style={{width:52,height:42,border:'none',borderRadius:9,cursor:'pointer'}}/>
              <div style={{padding:'8px 18px',borderRadius:10,background:form.color+'18',border:`2px solid ${form.color}`,color:form.color,fontWeight:700,fontSize:15}}>
                {form.name||'Aperçu'}
              </div>
            </div>
          </div>
          <div>
            <div className="lbl">🕐 Horaires d'ouverture du magasin</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <div className="lbl" style={{fontSize:10}}>Ouverture</div>
                <input className="inp" type="time" value={form.openTime||'09:00'} onChange={e=>set('openTime',e.target.value)}/>
              </div>
              <div>
                <div className="lbl" style={{fontSize:10}}>Fermeture</div>
                <input className="inp" type="time" value={form.closeTime||'19:30'} onChange={e=>set('closeTime',e.target.value)}/>
              </div>
            </div>
            <div style={{marginTop:8,fontSize:13,color:'var(--muted)'}}>
              Ces horaires seront utilisés pour la génération automatique du planning
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:22}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'13px'}} onClick={()=>form.name&&onSave(form)}>✓ Enregistrer</button>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function Stores() {
  const { stores, addStore, updateStore, deleteStore, employees } = useApp();
  const [editing, setEditing] = useState(null);

  const handleSave = (form) => {
    if(editing==='new') addStore(form);
    else updateStore(editing.id, form);
    setEditing(null);
  };

  const handleDelete = (id) => {
    const emps = employees.filter(e=>e.storeId===id);
    if(emps.length>0){ alert(`Ce magasin a ${emps.length} employé(s). Réassignez-les d'abord.`); return; }
    if(window.confirm('Supprimer ce magasin ?')) deleteStore(id);
  };

  return(
    <div className="anim-up">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:14}}>
        <div>
          <h1 className="page-title">🏪 Magasins</h1>
          <p className="page-sub">{stores.length} magasins configurés</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setEditing('new')}>+ Nouveau magasin</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
        {stores.map(store=>{
          const emps=employees.filter(e=>e.storeId===store.id);
          const mgrs=emps.filter(e=>['manager','dirigeant','admin'].includes(e.role));
          return(
            <div key={store.id} className="card" style={{padding:'20px 22px',borderTop:`4px solid ${store.color}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17}}>{store.name}</div>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn btn-ghost btn-xs" onClick={()=>setEditing(store)}>✏️</button>
                  <button className="btn btn-danger btn-xs" onClick={()=>handleDelete(store.id)}>🗑</button>
                </div>
              </div>

              {/* Horaires */}
              {(store.openTime||store.closeTime)&&(
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,background:'var(--teal-light)',border:'1px solid var(--teal-mid)',borderRadius:9,padding:'8px 12px'}}>
                  <span style={{fontSize:16}}>🕐</span>
                  <span style={{fontSize:13,fontWeight:600,color:'var(--teal-dark)'}}>
                    {store.openTime||'?'} → {store.closeTime||'?'}
                  </span>
                </div>
              )}

              <div style={{color:'var(--dim)',fontSize:13,marginBottom:12}}>
                {mgrs.length>0?'👔 '+mgrs.map(m=>m.name).join(', '):'Aucun manager'}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div style={{background:'var(--card2)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:22,color:store.color}}>{emps.length}</div>
                  <div style={{fontSize:11,color:'var(--dim)'}}>Employé(s)</div>
                </div>
                <div style={{background:'var(--card2)',borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:22,color:'var(--teal-dark)'}}>{mgrs.length}</div>
                  <div style={{fontSize:11,color:'var(--dim)'}}>Manager(s)</div>
                </div>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {emps.slice(0,8).map(e=>(
                  <div key={e.id} title={e.name} style={{width:28,height:28,borderRadius:'50%',background:e.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',border:'2px solid #fff',boxShadow:'0 1px 3px rgba(0,0,0,.1)'}}>
                    {e.name[0]}
                  </div>
                ))}
                {emps.length>8&&<div style={{width:28,height:28,borderRadius:'50%',background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'var(--muted)',border:'2px solid #fff'}}>+{emps.length-8}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing&&<StoreModal store={editing==='new'?null:editing} onSave={handleSave} onClose={()=>setEditing(null)}/>}
    </div>
  );
}
