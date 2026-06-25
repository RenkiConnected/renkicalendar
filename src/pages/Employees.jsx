import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const ROLE_MAP = { admin:'Admin', dirigeant:'Dirigeant', manager:'Manager', vendeur:'Vendeur' };
const ROLE_COLOR = { admin:'#6366F1', dirigeant:'#0EA5E9', manager:'#F59E0B', vendeur:'#10B981' };

function EmpModal({ emp, stores, allEmps, onSave, onClose, onResetPw, onSetPw }) {
  const [form, setForm] = useState(emp || { name:'', role:'vendeur', storeId:stores[0]?.id||'', contractHours:35, color:'#00C9B1' });
  const originalHours = emp ? emp.contractHours : null;
  const todayISO = new Date().toISOString().slice(0,10);
  const [contractFromDate, setContractFromDate] = useState(todayISO);
  const hoursChanged = emp && form.contractHours !== originalHours;
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
          {form.role==='vendeur' && (
            <div>
              <label style={{display:'flex',alignItems:'center',gap:11,cursor:'pointer',background:form.isFloating?'#FFF3E0':'var(--card2)',border:`1.5px solid ${form.isFloating?'#F5B764':'var(--border)'}`,borderRadius:12,padding:'13px 15px'}}>
                <input type="checkbox" checked={!!form.isFloating} onChange={e=>set('isFloating',e.target.checked)} style={{width:20,height:20,cursor:'pointer',accentColor:'#F5A623',flexShrink:0}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:form.isFloating?'#B05A00':'var(--text)'}}>✈ Vendeur volant</div>
                  <div style={{fontSize:12.5,color:'var(--muted)',marginTop:2}}>Peut être placé sur n'importe quelle boutique (déplacement + auto-génération), visible par tous les managers et dirigeants.</div>
                </div>
              </label>
            </div>
          )}
          {(form.role==='manager'||form.role==='dirigeant'||form.role==='admin')&&(
            <div>
              <div className="lbl">📧 Email du responsable</div>
              <input className="inp" type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} placeholder="manager@exemple.com"/>
              <div style={{fontSize:13,color:'var(--dim)',marginTop:5}}>Reçoit les emails de congés des boutiques gérées ci-dessous.</div>
            </div>
          )}
          {(form.role==='manager'||form.role==='dirigeant'||form.role==='admin')&&(
            <div>
              <div className="lbl">🏪 Boutiques gérées (responsable)</div>
              <div style={{fontSize:13,color:'var(--dim)',marginBottom:10}}>Ce manager peut gérer les plannings et reçoit les emails de congés de ces boutiques.</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {stores.map(s=>{
                  const managed=(form.managedStores||[]).includes(s.id);
                  return (
                    <button key={s.id} type="button"
                      onClick={()=>{
                        const cur=form.managedStores||[];
                        set('managedStores', managed ? cur.filter(id=>id!==s.id) : [...cur, s.id]);
                      }}
                      style={{
                        padding:'8px 14px',borderRadius:20,cursor:'pointer',
                        border:`2px solid ${managed?s.color:s.color+'40'}`,
                        background:managed?s.color:'#fff',
                        color:managed?'#fff':s.color,
                        fontFamily:'var(--font-b)',fontSize:13,fontWeight:managed?700:500,
                        transition:'all .15s',
                      }}>
                      {managed?'✓ ':''}{s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
            {hoursChanged && (
              <div style={{ marginTop:12, background:'#FFF3E0', border:'1.5px solid #F5B764', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:'#B05A00', marginBottom:7 }}>📅 Nouveau contrat ({originalHours}h → {form.contractHours}h) à partir de :</div>
                <input className="inp" type="date" value={contractFromDate} onChange={e=>setContractFromDate(e.target.value)} style={{ fontSize:15, padding:'9px 12px' }} />
                <div style={{ fontSize:12, color:'#8A5A20', marginTop:7, lineHeight:1.4 }}>
                  Les plannings <strong>avant cette date</strong> (et la semaine en cours) gardent {originalHours}h. Le nouveau contrat de {form.contractHours}h s'applique à partir de la semaine contenant cette date.
                </div>
              </div>
            )}
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

        {emp && onResetPw && (
          <div style={{ marginTop:18, padding:'14px 16px', background:'#FFF7E0', border:'1.5px solid #F5D06A', borderRadius:12 }}>
            <div style={{ fontWeight:700, color:'#B07D00', fontSize:15, marginBottom:4 }}>🔑 Mot de passe</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>
              {emp.password ? 'Un mot de passe est défini.' : 'Aucun mot de passe — sera créé à la première connexion.'}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button type="button" className="btn btn-sm" style={{ background:'#fff', border:'1.5px solid #F5D06A', color:'#B07D00', fontWeight:700 }}
                onClick={async()=>{ if(window.confirm(`Réinitialiser le mot de passe de ${emp.name} ? La personne devra en créer un nouveau à sa prochaine connexion.`)){ await onResetPw(emp.id); alert('✅ Mot de passe réinitialisé. La personne en créera un à sa prochaine connexion.'); } }}>
                ♻️ Réinitialiser (nouvelle création)
              </button>
              <button type="button" className="btn btn-sm" style={{ background:'#fff', border:'1.5px solid #F5D06A', color:'#B07D00', fontWeight:700 }}
                onClick={async()=>{ const np=window.prompt('Définir un nouveau mot de passe pour '+emp.name+' :'); if(np&&np.length>=4){ await onSetPw(emp.id, np); alert('✅ Nouveau mot de passe défini.'); } else if(np){ alert('Le mot de passe doit faire au moins 4 caractères.'); } }}>
                ✏️ Définir un mot de passe
              </button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button className="btn btn-primary" style={{ flex:1, justifyContent:'center', padding:'13px' }} onClick={()=>{
            if(!form.name) return;
            let out = { ...form };
            if (hoursChanged) {
              // Convert the application date to ISO week/year
              const d = new Date(contractFromDate + 'T12:00:00');
              const tmp = new Date(d); tmp.setHours(0,0,0,0);
              tmp.setDate(tmp.getDate() + 4 - (tmp.getDay()||7));
              const fromYear = tmp.getFullYear();
              const yearStart = new Date(fromYear, 0, 1);
              const fromWeek = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
              // Existing history, or seed with the previous contract starting "forever ago"
              const prevHist = Array.isArray(emp.contractHistory) && emp.contractHistory.length
                ? [...emp.contractHistory]
                : [{ hours: originalHours, fromYear: 2000, fromWeek: 1 }];
              // Remove any entry already at this exact start, then add the new one
              const filtered = prevHist.filter(h => !(h.fromYear === fromYear && h.fromWeek === fromWeek));
              filtered.push({ hours: form.contractHours, fromYear, fromWeek });
              filtered.sort((a,b)=>(a.fromYear*100+a.fromWeek)-(b.fromYear*100+b.fromWeek));
              out.contractHistory = filtered;
            }
            onSave(out);
          }}>✓ Enregistrer</button>            
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
  const { employees, stores, addEmployee, updateEmployee, deleteEmployee, pwResetRequests, resetEmployeePassword, setEmployeePassword, dismissPwResetRequest, getVisibleStoreIds } = useApp();
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

      {/* Password reset requests */}
      {(()=>{
        const vis = getVisibleStoreIds ? getVisibleStoreIds() : stores.map(s=>s.id);
        const reqs = (pwResetRequests||[]).filter(r=>vis.includes(r.storeId));
        if(reqs.length===0) return null;
        return (
          <div style={{ background:'#FFF7E0', border:'1.5px solid #F5D06A', borderRadius:14, padding:'16px 20px', marginBottom:24 }}>
            <div style={{ fontWeight:800, color:'#B07D00', fontSize:16, marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              🔑 Demandes de réinitialisation de mot de passe ({reqs.length})
            </div>
            <div style={{ display:'grid', gap:10 }}>
              {reqs.map(r=>{
                const e = employees.find(x=>x.id===r.employeeId);
                const st = stores.find(s=>s.id===r.storeId);
                return (
                  <div key={r.id} style={{ background:'#fff', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', border:'1px solid #F0E0A8' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', background:e?.color||'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:16 }}>{(e?.name||r.employeeName||'?')[0]}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{e?.name||r.employeeName}</div>
                        <div style={{ fontSize:13, color:'var(--muted)' }}>{st?.name||'—'} · a oublié son mot de passe</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button className="btn btn-sm" style={{ background:'#1A8A42', color:'#fff', border:'none', fontWeight:700 }}
                        onClick={async()=>{ await resetEmployeePassword(r.employeeId); alert(`✅ Mot de passe réinitialisé. ${e?.name||r.employeeName} en créera un nouveau à sa prochaine connexion.`); }}>
                        ♻️ Réinitialiser
                      </button>
                      <button className="btn btn-sm" style={{ background:'#fff', border:'1.5px solid #F5D06A', color:'#B07D00', fontWeight:700 }}
                        onClick={async()=>{ const np=window.prompt('Définir un nouveau mot de passe pour '+(e?.name||r.employeeName)+' :'); if(np&&np.length>=4){ await setEmployeePassword(r.employeeId, np); alert('✅ Nouveau mot de passe défini.'); } else if(np){ alert('Min. 4 caractères.'); } }}>
                        ✏️ Définir
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>dismissPwResetRequest(r.id)}>Ignorer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                        {emp.isFloating && (
                          <span style={{ background:'#FFF3E0', color:'#B05A00', border:'1px solid #F5B764', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                            ✈ Volant
                          </span>
                        )}
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
          onResetPw={resetEmployeePassword}
          onSetPw={setEmployeePassword}
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
