import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function StoreModal({ store, managers, onSave, onClose }) {
  const [form, setForm] = useState(store || {
    name:'', color:'#00C9B1',
    openTime:'09:00', closeTime:'19:30',
    lunchStart:'12:00', lunchEnd:'14:00', lunchBreak:false,
  });
  // Which managers are assigned to this store (managedStores includes it, or home store)
  const [assignedMgrs, setAssignedMgrs] = useState(
    store ? (managers||[]).filter(m => (m.managedStores||[]).includes(store.id) || m.storeId===store.id).map(m=>m.id) : []
  );
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:880}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:21}}>{store?'Modifier le magasin':'Nouveau magasin'}</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <div className="store-form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'start'}}>
          {/* LEFT COLUMN */}
          <div style={{display:'grid',gap:16}}>
            <div>
              <div className="lbl">Nom du magasin</div>
              <input className="inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Save Marseille"/>
            </div>

            <div>
              <div className="lbl">📧 Email de notification</div>
              <input className="inp" type="email" value={form.notifyEmail||''} onChange={e=>set('notifyEmail',e.target.value)} placeholder="cogolin@exemple.com"/>
              <div style={{fontSize:12,color:'var(--dim)',marginTop:5}}>Reçoit un email quand un employé pose un congé (+ direction).</div>
            </div>

            <div>
              <div className="lbl">Couleur du magasin</div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <input type="color" value={form.color} onChange={e=>set('color',e.target.value)}
                  style={{width:52,height:42,border:'none',borderRadius:9,cursor:'pointer'}}/>
                <div style={{padding:'8px 18px',borderRadius:10,background:form.color+'18',border:`2px solid ${form.color}`,color:form.color,fontWeight:700,fontSize:15}}>
                  {form.name||'Aperçu'}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{display:'grid',gap:16}}>
            <div>
              <div className="lbl">👔 Responsable(s) du magasin</div>
              {(managers||[]).length===0?(
                <div style={{fontSize:13,color:'var(--muted)',fontStyle:'italic'}}>Aucun manager créé.</div>
              ):(
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {(managers||[]).map(m=>{
                    const on=assignedMgrs.includes(m.id);
                    return (
                      <button key={m.id} type="button"
                        onClick={()=>setAssignedMgrs(cur=>on?cur.filter(id=>id!==m.id):[...cur,m.id])}
                        style={{
                          display:'flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:20,cursor:'pointer',
                          border:`2px solid ${on?(form.color||'#00C9B1'):'var(--border)'}`,
                          background:on?(form.color||'#00C9B1'):'#fff',
                          color:on?'#fff':'var(--muted)',
                          fontFamily:'var(--font-b)',fontSize:13,fontWeight:on?700:500,transition:'all .15s',
                        }}>
                        <span style={{width:22,height:22,borderRadius:'50%',background:on?'rgba(255,255,255,.25)':(m.color||'var(--teal)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff'}}>{m.name[0]}</span>
                        {on?'✓ ':''}{m.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Horaires */}
            <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:12,padding:'14px'}}>
              <div className="lbl" style={{color:'var(--teal-dark)',marginBottom:10}}>🕐 Horaires du magasin</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
                <div>
                  <div className="lbl" style={{fontSize:12}}>Ouverture</div>
                  <input className="inp" type="time" value={form.openTime||'09:00'} onChange={e=>set('openTime',e.target.value)}/>
                </div>
                <div>
                  <div className="lbl" style={{fontSize:12}}>Fermeture</div>
                  <input className="inp" type="time" value={form.closeTime||'19:30'} onChange={e=>set('closeTime',e.target.value)}/>
                </div>
              </div>

              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'9px 12px',background:'white',borderRadius:9,border:'1px solid var(--teal-mid)',marginBottom:form.lunchBreak?10:0}}>
                <input type="checkbox" checked={!!form.lunchBreak} onChange={e=>set('lunchBreak',e.target.checked)}
                  style={{accentColor:'var(--teal)',width:17,height:17}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>🍽️ Fermeture déjeuner</div>
                  <div style={{fontSize:13,color:'var(--muted)',marginTop:1}}>Ferme pendant la pause midi</div>
                </div>
              </label>

              {form.lunchBreak&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,padding:'11px',background:'white',borderRadius:9,border:'1px solid var(--teal-mid)'}}>
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
        </div>

        <div style={{display:'flex',gap:10,marginTop:22}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'14px',fontSize:16}}
            onClick={()=>form.name&&onSave(form, assignedMgrs)}>✓ Enregistrer</button>
          <button className="btn btn-ghost" style={{padding:'14px 24px'}} onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function Stores() {
  const { stores, addStore, updateStore, deleteStore, employees, updateEmployee } = useApp();
  const [editing, setEditing] = useState(null);

  const managers = employees.filter(e=>['manager','dirigeant','admin'].includes(e.role));

  const handleSave = async (form, assignedMgrs=[]) => {
    let storeId;
    if(editing==='new'){ const n=await addStore(form); storeId=n.id; }
    else { await updateStore(editing.id, form); storeId=editing.id; }

    // Sync managers' managedStores with the assignment
    if(storeId){
      for(const m of managers){
        const cur = m.managedStores||[];
        const shouldHave = assignedMgrs.includes(m.id);
        const has = cur.includes(storeId);
        if(shouldHave && !has){
          await updateEmployee(m.id, { managedStores:[...cur, storeId] });
        } else if(!shouldHave && has && m.storeId!==storeId){
          // Remove only if it's not their home store
          await updateEmployee(m.id, { managedStores: cur.filter(id=>id!==storeId) });
        }
      }
    }
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
          const mgrs=employees.filter(e=>['manager','dirigeant','admin'].includes(e.role)&&(e.storeId===store.id||(e.managedStores||[]).includes(store.id)));
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

      {editing&&<StoreModal store={editing==='new'?null:editing} managers={managers} onSave={handleSave} onClose={()=>setEditing(null)}/>}
    </div>
  );
}
