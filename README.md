import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const ROLE_MAP = { admin:'Admin', dirigeant:'Dirigeant', manager:'Manager', vendeur:'Vendeur' };
const ROLE_COLOR = { admin:'#6366F1', dirigeant:'#0EA5E9', manager:'#F59E0B', vendeur:'#10B981' };

function EmpModal({ emp, stores, allEmps, onSave, onClose }) {
  const [form, setForm] = useState(emp || { name:'', role:'vendeur', storeId:stores[0]?.id||'', contractHours:35, color:'#00C9B1' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h3 style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:21 }}>{emp ? 'Modifier l\'employé' : 'Nouvel employé'}</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div style={{ display:'grid', gap:16 }}>
          <div><div className="lbl">Prénom / Nom</div><input className="inp" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Marie"/></div>
          <div>
            <div className="lbl">Rôle</div>
            <select className="inp" value={form.role} onChange={e=>set('role',e.target.value)}>
              <option value="vendeur">Vendeur</option>
              <option value="manager">Manager</option>
              <option value="dirigeant">Dirigeant</option>
            </select>
          </div>
          <div>
            <div className="lbl">Magasin principal</div>
            <select className="inp" value={form.storeId} onChange={e=>set('storeId',e.target.value)}>
              {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="lbl">Contrat heures/semaine</div>
            <div style={{ display:'flex', gap:8 }}>
              {[28,35,39].map(h=>(
                <button key={h} type="button" onClick={()=>set('contractHours',h)} style={{
                  flex:1, padding:'11px', borderRadius:9, border:`2px solid ${form.contractHours===h?'var(--teal)':'var(--border)'}`,
                  background:form.contractHours===h?'var(--teal-light)':'#fff',
                  color:form.contractHours===h?'var(--teal-dark)':'var(--muted)',
                  fontFamily:'var(--font-b)', fontSize:15, fontWeight:form.contractHours===h?700:500, cursor:'pointer',
                }}>{h}h</button>
              ))}
              <input className="inp" type="number" min="1" max="48" value={form.contractHours}
                onChange={e=>set('contractHours',parseInt(e.target.value)||35)} style={{ width:80, flex:'none' }}/>
            </div>
          </div>
          <div>
            <div className="lbl">Couleur</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <input type="color" value={form.color} onChange={e=>set('color',e.target.value)}
                style={{ width:52, height:42, border:'none', borderRadius:9, cursor:'pointer' }}/>
              <div style={{ width:44,height:44,borderRadius:'50%',background:form.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:18,boxShadow:'0 2px 8px rgba(0,0,0,.14)' }}>
                {form.name[0]||'?'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button className="btn btn-primary" style={{ flex:1, justifyContent:'center', padding:'13px' }} onClick={()=>form.name&&onSave(form)}>✓ Enregistrer</button>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

/* ── DÉPANNAGE MODAL ─────────────────────────────────── */
function DepannageModal({ emp, stores, currentStoreId, onAssign, onClose }) {
  const [targetStore, setTargetStore] = useState('');
  const otherStores = stores.filter(s => s.id !== currentStoreId);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:20 }}>⚡ Dépannage ponctuel</h3>
            <p style={{ color:'var(--muted)', fontSize:14, marginTop:3 }}>Envoyer <strong>{emp.name}</strong> dans un autre magasin</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <div style={{ background:'var(--teal-light)', border:'1.5px solid var(--teal-mid)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ fontSize:14, color:'var(--teal-dark)', fontWeight:600, lineHeight:1.6 }}>
            ℹ️ Cela ajoute temporairement {emp.name} à un autre magasin.<br/>
            Son magasin principal reste <strong>{stores.find(s=>s.id===currentStoreId)?.name}</strong>.
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <div className="lbl">Envoyer vers quel magasin ?</div>
          <div style={{ display:'grid', gap:8 }}>
            {otherStores.map(s => (
              <button key={s.id} onClick={() => setTargetStore(s.id)} style={{
                padding:'13px 16px', borderRadius:11, cursor:'pointer', textAlign:'left',
                border:`2px solid ${targetStore===s.id?s.color:'var(--border)'}`,
                background:targetStore===s.id?s.color+'18':'#fff',
                fontFamily:'var(--font-b)', fontSize:15, fontWeight:targetStore===s.id?700:500,
                color:targetStore===s.id?s.color:'var(--text)',
                display:'flex', alignItems:'center', gap:10, transition:'all .15s',
              }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:s.color, flexShrink:0 }}/>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:16, opacity:!targetStore?.5:1 }}
          onClick={() => targetStore && onAssign(emp.id, targetStore)} disabled={!targetStore}>
          ⚡ Envoyer en dépannage
        </button>
      </div>
    </div>
  );
}

export default function Employees() {
  const { employees, stores, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [editing, setEditing] = useState(null);
  const [depannage, setDepannage] = useState(null);
  const [filterStore, setFilterStore] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e => {
    if (filterStore !== 'all' && e.storeId !== filterStore) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = (form) => {
    if (editing === 'new') addEmployee(form);
    else updateEmployee(editing.id, form);
    setEditing(null);
  };

  const handleDepannage = (empId, targetStoreId) => {
    // Temporarily add employee to another store by updating their storeId
    // but keep originalStoreId for reference
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    updateEmployee(empId, {
      storeId: targetStoreId,
      originalStoreId: emp.originalStoreId || emp.storeId,
      isDepannage: true,
    });
    setDepannage(null);
  };

  const handleReturnHome = (empId) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp?.originalStoreId) return;
    updateEmployee(empId, {
      storeId: emp.originalStoreId,
      originalStoreId: null,
      isDepannage: false,
    });
  };

  return (
    <div className="anim-up">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 className="page-title">👥 Employés</h1>
          <p className="page-sub">{employees.length} employés · {stores.length} magasins</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Nouvel employé</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <input className="inp" placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:240, fontSize:15 }}/>
        <select className="inp" value={filterStore} onChange={e=>setFilterStore(e.target.value)} style={{ maxWidth:220 }}>
          <option value="all">Tous les magasins</option>
          {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* By store */}
      {stores.map(store => {
        const storeEmps = filtered.filter(e => e.storeId === store.id);
        if (filterStore !== 'all' && filterStore !== store.id) return null;
        return (
          <div key={store.id} style={{ marginBottom:30 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:13, height:13, borderRadius:'50%', background:store.color }}/>
              <h2 className="section-title" style={{ fontSize:17 }}>{store.name}</h2>
              <span style={{ color:'var(--dim)', fontSize:14 }}>— {storeEmps.length} employé(s)</span>
            </div>
            {storeEmps.length === 0 ? (
              <div style={{ padding:'16px 20px', borderRadius:12, border:'2px dashed var(--border)', color:'var(--dim)', fontSize:14 }}>
                Aucun employé{search?' correspondant':''}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:12 }}>
                {storeEmps.map(emp => (
                  <div key={emp.id} className="card" style={{
                    padding:'16px 20px', display:'flex', alignItems:'center', gap:13,
                    borderLeft: emp.isDepannage ? `4px solid #F59E0B` : `4px solid ${store.color}`,
                    position:'relative',
                  }}>
                    {emp.isDepannage && (
                      <div style={{ position:'absolute', top:8, right:8, background:'#FFF7E0', color:'#B07D00', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700, border:'1px solid #F5D06A' }}>
                        ⚡ Dépannage
                      </div>
                    )}
                    <div style={{ width:46,height:46,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,fontWeight:800,color:'#fff',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.13)' }}>
                      {emp.name[0]}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:16, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{emp.name}</div>
                      <div style={{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' }}>
                        <span style={{ background:(ROLE_COLOR[emp.role]||'#6366F1')+'18', color:ROLE_COLOR[emp.role]||'#6366F1', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                          {ROLE_MAP[emp.role]||emp.role}
                        </span>
                        <span style={{ background:'var(--card2)', color:'var(--muted)', borderRadius:20, padding:'3px 10px', fontSize:12 }}>
                          {emp.contractHours}h/sem
                        </span>
                      </div>
                      {emp.isDepannage && emp.originalStoreId && (
                        <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>
                          🏠 {stores.find(s=>s.id===emp.originalStoreId)?.name}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setEditing(emp)}>✏️</button>
                      {emp.role === 'vendeur' && !emp.isDepannage && (
                        <button className="btn btn-xs" onClick={() => setDepannage(emp)} title="Envoyer en dépannage" style={{ background:'#FFF7E0', color:'#B07D00', border:'1px solid #F5D06A', borderRadius:7 }}>⚡</button>
                      )}
                      {emp.isDepannage && (
                        <button className="btn btn-xs" onClick={() => handleReturnHome(emp.id)} title="Retour magasin principal" style={{ background:'#E8FAF0', color:'#1A8A42', border:'1px solid #A5D6A7', borderRadius:7 }}>🏠</button>
                      )}
                      <button className="btn btn-danger btn-xs" onClick={() => { if(window.confirm('Supprimer ?')) deleteEmployee(emp.id); }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      {editing && (
        <EmpModal
          emp={editing === 'new' ? null : editing}
          stores={stores}
          allEmps={employees}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
      {depannage && (
        <DepannageModal
          emp={depannage}
          stores={stores}
          currentStoreId={depannage.storeId}
          onAssign={handleDepannage}
          onClose={() => setDepannage(null)}
        />
      )}
    </div>
  );
}
