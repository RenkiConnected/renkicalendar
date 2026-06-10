import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function StoreModal({ store, onSave, onClose }) {
  const [form, setForm] = useState(store || {
    name:'', color:'#00C9B1',
    openTime:'09:00', closeTime:'19:30',
    lunchStart:'12:00', lunchEnd:'14:00', lunchBreak:false,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>{store?'Modifier le magasin':'Nouveau magasin'}</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <div style={{display:'grid',gap:16}}>
          <div>
            <div className="lbl">Nom du magasin</div>
            <input className="inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Save Marseille"/>
          </div>

          <div>
            <div className="lbl">📧 Email de notification du magasin</div>
            <input className="inp" type="email" value={form.notifyEmail||''} onChange={e=>set('notifyEmail',e.target.value)} placeholder="cogolin@exemple.com"/>
            <div style={{fontSize:13,color:'var(--dim)',marginTop:5}}>Reçoit un email quand un employé de ce magasin pose un congé (en plus de la direction).</div>
          </div>

          <div>
            <div className="lbl">Couleur</div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <input type="color" value={form.color} onChange={e=>set('color',e.target.value)}
                style={{width:52,height:42,border:'none',borderRadius:9,cursor:'pointer'}}/>
              <div style={{padding:'8px 18px',borderRadius:10,background:form.color+'18',border:`2px solid ${form.color}`,color:form.color,fontWeight:700,fontSize:15}}>
                {form.name||'Aperçu'}
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:12,padding:'16px'}}>
            <div className="lbl" style={{color:'var(--teal-dark)',marginBottom:12}}>🕐 Horaires du magasin</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <div className="lbl" style={{fontSize:12}}>Ouverture</div>
                <input className="inp" type="time" value={form.openTime||'09:00'} onChange={e=>set('openTime',e.target.value)}/>
              </div>
              <div>
                <div className="lbl" style={{fontSize:12}}>Fermeture</div>
                <input className="inp" type="time" value={form.closeTime||'19:30'} onChange={e=>set('closeTime',e.target.value)}/>
              </div>
            </div>

            {/* Lunch break toggle */}
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 12px',background:'white',borderRadius:9,border:'1px solid var(--teal-mid)',marginBottom:form.lunchBreak?10:0}}>
              <input type="checkbox" checked={!!form.lunchBreak} onChange={e=>set('lunchBreak',e.target.checked)}
                style={{accentColor:'var(--teal)',width:17,height:17}}/>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>🍽️ Fermeture déjeuner</div>
                <div style={{fontSize:14,color:'var(--muted)',marginTop:1}}>Le magasin ferme pendant la pause midi</div>
              </div>
            </label>

            {form.lunchBreak&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'12px',background:'white',borderRadius:9,border:'1px solid var(--teal-mid)'}}>
                <div>
                  <div className="lbl" style={{fontSize:12}}>Fermeture midi</div>
                  <input className="inp" type="time" value={form.lunchStart||'12:00'} onChange={e=>set('lunchStart',e.target.value)}/>
                </div>
                <div>
                  <div className="lbl" style={{fontSize:12}}>Réouverture midi</div>
                  <input className="inp" type="time" value={form.lunchEnd||'14:00'} onChange={e=>set('lunchEnd',e.target.value)}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview horaires */}
        <div style={{marginTop:14,background:'var(--card2)',borderRadius:10,padding:'10px 14px',border:'1px solid var(--border)',fontSize:15,color:'var(--muted)'}}>
          <span style={{fontWeight:700,color:'var(--text)'}}>Amplitude : </span>
          {form.openTime} → {form.closeTime}
          {form.lunchBreak&&` (fermé ${form.lunchStart}–${form.lunchEnd})`}
        </div>

        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'13px'}}
            onClick={()=>form.name&&onSave(form)}>✓ Enregistrer</button>
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
              <div style={{marginBottom:12,background:'var(--teal-light)',border:'1px solid var(--teal-mid)',borderRadius:9,padding:'9px 13px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:store.lunchBreak?4:0}}>
                  <span>🕐</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--teal-dark)'}}>
                    {store.openTime||'?'} → {store.closeTime||'?'}
                  </span>
                </div>
                {store.lunchBreak&&(
                  <div style={{fontSize:14,color:'var(--muted)',marginLeft:22}}>
                    🍽️ Fermé {store.lunchStart}–{store.lunchEnd}
                  </div>
                )}
              </div>

              <div style={{color:'var(--dim)',fontSize:13,marginBottom:12}}>
                {mgrs.length>0?'👔 '+mgrs.map(m=>m.name).join(', '):'Aucun manager'}
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {emps.slice(0,8).map(e=>(
                  <div key={e.id} title={e.name} style={{width:28,height:28,borderRadius:'50%',background:e.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',border:'2px solid #fff',boxShadow:'0 1px 3px rgba(0,0,0,.1)'}}>
                    {e.name[0]}
                  </div>
                ))}
                {emps.length>8&&<div style={{width:28,height:28,borderRadius:'50%',background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'var(--muted)',border:'2px solid #fff'}}>+{emps.length-8}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editing&&<StoreModal store={editing==='new'?null:editing} onSave={handleSave} onClose={()=>setEditing(null)}/>}
    </div>
  );
}
