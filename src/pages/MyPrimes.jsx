import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const UNIT = { smartphone:5, box:5, forfait999:10, forfait699:5, forfaitEngage:10, accessoire:1, extLow:3, extMid:4, extHigh:5 };
const PALIER2_CONDITIONS = [
  'Stock et SAV à jour (noté dans Notion)',
  'Inventaire tournant sans écart',
  'Avis Google positifs',
  'Offre complémentaire à jour dans WIN',
  'Propreté et assiduité',
];
const ASSURANCES = [16.90,15.90,10.90,6.90,3.90];
const ITEM_ROWS = [
  ['smartphone','Smartphones','5 €','📱'],['box','Box','5 €','📦'],
  ['forfait999','Forfaits 9,99','10 €','📶'],['forfait699','Forfaits 6,99','5 €','📶'],
  ['forfaitEngage','Forfaits engagement','10 €','✍️'],['accessoire','Accessoires one-shot','1 €','🎧'],
];
const EXT_ROWS = [['extLow','Ext. < 500 €','3 €','🛡️'],['extMid','Ext. 500–1000 €','4 €','🛡️'],['extHigh','Ext. > 1000 €','5 €','🛡️']];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const eur = n => (Math.round((n+Number.EPSILON)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const sumList = arr => Array.isArray(arr)?arr.reduce((t,x)=>t+(Number(x)||0),0):(Number(arr)||0);
function addRate(m){ if(m<=0)return 0; if(m<=500)return .10; if(m<=1500)return .15; return .20; }
function vendeurBase(v){ let t=0; for(const[k]of ITEM_ROWS)t+=(Number(v[k])||0)*UNIT[k]; for(const[k]of EXT_ROWS)t+=(Number(v[k])||0)*UNIT[k]; ASSURANCES.forEach((a,i)=>t+=(Number(v['ass'+i])||0)*a); const am=sumList(v.addEntries); t+=am*addRate(am); return t; }
// Safe arithmetic evaluator (+ - * / parentheses, decimals with . or ,)
function evalExpr(raw){ if(raw==null)return NaN; let s=String(raw).trim().replace(/,/g,'.').replace(/\s+/g,''); if(s==='')return NaN; if(!/^[0-9+\-*/().]+$/.test(s))return NaN; try{ const val=Function('"use strict";return ('+s+')')(); return (typeof val==='number'&&isFinite(val))?val:NaN; }catch{ return NaN; } }

// Stepper tile to edit a count (vendeur self-entry)
function CountTile({ icon, label, unit, value, onChange }) {
  const n = Number(value) || 0;
  return (
    <div style={{ background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:14, padding:'12px', textAlign:'center' }}>
      <div style={{ fontSize:22 }}>{icon}</div>
      <div style={{ fontSize:12.5, fontWeight:700, margin:'4px 0 2px' }}>{label}</div>
      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>{unit}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <button type="button" onClick={()=>onChange(Math.max(0,n-1))} style={{ width:30, height:30, borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:18, fontWeight:700 }}>−</button>
        <input type="number" min="0" value={value ?? ''} onChange={e=>onChange(e.target.value)} style={{ width:46, textAlign:'center', fontSize:17, fontWeight:800, border:'1.5px solid var(--border)', borderRadius:8, padding:'5px 2px' }} />
        <button type="button" onClick={()=>onChange(n+1)} style={{ width:30, height:30, borderRadius:8, border:'1.5px solid var(--teal)', background:'var(--teal)', color:'#fff', cursor:'pointer', fontSize:18, fontWeight:700 }}>+</button>
      </div>
    </div>
  );
}

// Editable cumulative list with calculation support
function EditEntryList({ title, hint, entries, onChange, accent }) {
  const list = Array.isArray(entries) ? entries : [];
  const total = sumList(list);
  const [draft, setDraft] = useState('');
  const preview = evalExpr(draft);
  const hasCalc = /[+\-*/]/.test(String(draft).trim().replace(/^-/, ''));
  const add = () => { const x = evalExpr(draft); if(!isNaN(x)&&x!==0){ onChange([...list, parseFloat(x.toFixed(2))]); setDraft(''); } };
  const remove = i => onChange(list.filter((_,idx)=>idx!==i));
  return (
    <div style={{ background:'var(--card)', border:`1.5px solid ${accent}55`, borderRadius:14, padding:'16px' }}>
      <div style={{ fontSize:14, fontWeight:800, marginBottom:2 }}>{title}</div>
      {hint && <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>{hint}</div>}
      <div style={{ display:'flex', gap:6, marginBottom: hasCalc&&!isNaN(preview)?4:10 }}>
        <input className="inp" type="text" value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add(); } }} style={{ flex:1, fontSize:15, padding:'9px 12px' }} placeholder="Montant ou calcul ex: 120+50*2" />
        <button type="button" onClick={add} className="btn btn-primary btn-sm" style={{ flexShrink:0 }}>+ Ajouter</button>
      </div>
      {hasCalc && draft.trim()!=='' && <div style={{ fontSize:12.5, marginBottom:10, color:isNaN(preview)?'#C8002B':accent, fontWeight:600 }}>{isNaN(preview)?'⚠️ Calcul invalide':`= ${eur(preview)}`}</div>}
      {list.length>0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          {list.map((x,i)=>(<span key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, background:accent+'18', color:accent, borderRadius:20, padding:'5px 10px 5px 12px', fontSize:14, fontWeight:700 }}>{eur(x)}<button type="button" onClick={()=>remove(i)} style={{ background:'none', border:'none', cursor:'pointer', color:accent, fontSize:16, lineHeight:1, padding:0 }}>×</button></span>))}
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', borderTop:'1px solid var(--border)', paddingTop:8 }}>
        <span style={{ fontSize:13, color:'var(--muted)', fontWeight:600 }}>Total cumulé</span>
        <strong style={{ fontSize:18, color:accent }}>{eur(total)}</strong>
      </div>
    </div>
  );
}

function DetailRow({ label, qty, unit, sub, note }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ fontSize:14 }}>{label}{note&&<span style={{ color:'var(--dim)', fontSize:12 }}> ({note})</span>}</div>
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        {qty!=null && <span style={{ fontSize:13, color:'var(--muted)' }}>{qty} × {eur(unit)}</span>}
        <strong style={{ fontSize:14, minWidth:70, textAlign:'right' }}>{eur(sub)}</strong>
      </div>
    </div>
  );
}

export default function MyPrimes() {
  const { employees, stores, currentEmp, currentUser, primes, submitPrimeChangeRequest, primeRequests, getEmpOvertimeToPay, savePrimeData } = useApp();
  const [editMode, setEditMode] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const me = currentEmp || employees.find(e => e.name === currentUser);
  if (!me) return <div className="anim-up"><h1 className="page-title">Mes primes</h1><p className="page-sub" style={{marginTop:12}}>Profil introuvable.</p></div>;

  const store = stores.find(s => s.id === me.storeId);
  // Find this vendeur's prime data for the month — search their home store first,
  // then any store doc that contains their entry (covers floating/displaced cases)
  let key = `${me.storeId}_${year}_M${month}`;
  let sd = primes[key] || {};
  let v = (sd.vendeurs && sd.vendeurs[me.id]) || null;
  if (!v) {
    for (const [k, doc] of Object.entries(primes)) {
      if (k.endsWith(`_${year}_M${month}`) && doc.vendeurs && doc.vendeurs[me.id]) {
        key = k; sd = doc; v = doc.vendeurs[me.id]; break;
      }
    }
  }
  if (!v) v = {};

  // Store bonus pool + my share
  const storeMargin = sumList(sd.marginEntries);
  const p1 = Number(sd.palier1)||0, p2 = Number(sd.palier2)||0;
  let pool = 0, palierLabel = 'Aucun palier atteint';
  if (p2>0 && storeMargin>=p2) { pool=storeMargin*0.03; palierLabel='Palier 2 atteint (3 %)'; }
  else if (p1>0 && storeMargin>=p1) { pool=storeMargin*0.015; palierLabel='Palier 1 atteint (1,5 %)'; }
  const sharePct = Number(v.storeBonusPct)||0;
  const myShare = pool*sharePct/100;
  const base = vendeurBase(v);
  const total = base + myShare;
  const travel = Number(v.travel)||0;
  const myOvertime = parseFloat(((getEmpOvertimeToPay ? getEmpOvertimeToPay(me.id, year, month) : 0) + (Number(v.manualOvertime)||0)).toFixed(2));
  const fmtHrs = h => { const m=Math.round(h*60); const H=Math.floor(m/60); const M=m%60; return M===0?`${H}`:`${H}h${String(M).padStart(2,'0')}`; };
  const addMargin = sumList(v.addEntries);

  // Build detail
  const detail = [];
  ITEM_ROWS.concat(EXT_ROWS).forEach(([k,label])=>{ const q=Number(v[k])||0; if(q>0) detail.push({label, qty:q, unit:UNIT[k], sub:q*UNIT[k]}); });
  ASSURANCES.forEach((a,i)=>{ const q=Number(v['ass'+i])||0; if(q>0) detail.push({label:'Assurance '+eur(a), qty:q, unit:a, sub:q*a}); });
  if(addMargin>0) detail.push({label:'Ventes additionnelles ('+(addRate(addMargin)*100)+'%)', qty:null, unit:null, sub:addMargin*addRate(addMargin), note:eur(addMargin)+' de marge'});

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  // My pending requests this month
  const myPending = (primeRequests||[]).filter(r => r.empId===me.id && r.year===year && r.month===month && r.status==='pending');

  // ── Change request form ──
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({});
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const setField = (k,val) => setDraft(d => ({ ...d, [k]: val }));

  const submit = async () => {
    // Only keep changed fields that have a value
    const changes = {};
    Object.entries(draft).forEach(([k,val])=>{ if(val!=='' && val!=null) changes[k]=Number(val); });
    if(Object.keys(changes).length===0 && !note.trim()){ alert('Indiquez au moins une modification ou une note.'); return; }
    // Use the store where the prime data actually lives (derived from key), fallback to home store
    const resolvedStoreId = key.replace(`_${year}_M${month}`, '') || me.storeId;
    await submitPrimeChangeRequest({ empId:me.id, empName:me.name, storeId:resolvedStoreId, year, month, changes, note:note.trim() });
    setSent(true); setShowForm(false); setDraft({}); setNote('');
    setTimeout(()=>setSent(false), 5000);
  };

  // ── Self-edit: vendeur saves their own prime data and can update store margin ──
  const resolvedStoreId = key.replace(`_${year}_M${month}`, '') || me.storeId;
  const saveKey = `${resolvedStoreId}_${year}_M${month}`;
  const [draftV, setDraftV] = useState(null);
  const editV = (editMode && draftV) ? draftV : v;
  const startEdit = () => { setDraftV({ ...v }); setEditMode(true); };
  const cancelEdit = () => { setDraftV(null); setEditMode(false); };
  const setVField = (k, val) => setDraftV(d => ({ ...(d||{}), [k]: val }));
  const saveOwn = async () => {
    const cur = primes[saveKey] || {};
    await savePrimeData(saveKey, { ...cur, storeId: resolvedStoreId, year, month, vendeurs: { ...(cur.vendeurs || {}), [me.id]: draftV } });
    setDraftV(null); setEditMode(false);
    setSent(true); setTimeout(()=>setSent(false), 4000);
  };
  const saveStoreMargin = async (newEntries) => {
    const cur = primes[saveKey] || {};
    await savePrimeData(saveKey, { ...cur, storeId: resolvedStoreId, year, month, marginEntries: newEntries });
  };
  const myAck = (sd.palier2Ack || {})[me.id];
  const toggleAck = async (checked) => {
    const cur = primes[saveKey] || {};
    const acks = { ...(cur.palier2Ack || {}) };
    if (checked) acks[me.id] = { name: me.name, date: new Date().toISOString() };
    else delete acks[me.id];
    await savePrimeData(saveKey, { ...cur, storeId: resolvedStoreId, year, month, palier2Ack: acks });
  };

  return (
    <div className="anim-up">
      <div style={{ marginBottom:18 }}>
        <h1 className="page-title">Mes primes</h1>
        <p className="page-sub">{me.name} · {store?.name||'—'} · mise à jour en temps réel</p>
      </div>

      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:22, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:14, padding:'12px 18px', maxWidth:400, margin:'0 auto 22px' }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <div style={{ textAlign:'center', minWidth:140 }}>
          <div style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:20, color:'var(--teal-dark)' }}>{MONTHS[month]}</div>
          <div style={{ fontSize:14, color:'var(--muted)' }}>{year}</div>
        </div>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {sent && <div style={{ background:'#E8FAF0', border:'1.5px solid #A5D6A7', color:'#1A8A42', borderRadius:12, padding:'12px 16px', marginBottom:16, fontWeight:600 }}>✅ Votre demande de modification a été envoyée au manager.</div>}

      {myPending.length>0 && (
        <div style={{ background:'#FFF7E0', border:'1.5px solid #F5D06A', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
          <div style={{ fontWeight:700, color:'#B07D00', marginBottom:6 }}>⏳ Demande(s) en attente de validation ({myPending.length})</div>
          {myPending.map(r=>(
            <div key={r.id} style={{ fontSize:14, color:'#7A5C00', marginBottom:3 }}>
              {Object.entries(r.changes||{}).map(([k,val])=>`${k} → ${val}`).join(', ')}{r.note?` · "${r.note}"`:''}
            </div>
          ))}
        </div>
      )}

      {/* Total card */}
      <div style={{ background:'linear-gradient(135deg,var(--teal-light),#EEF6FF)', border:'1.5px solid var(--teal-mid)', borderRadius:18, padding:'24px', marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:14, color:'var(--muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'.04em' }}>Total prime du mois</div>
        <div style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:42, color:'var(--teal-dark)', margin:'4px 0' }}>{eur(total)}</div>
        {travel>0 && <div style={{ fontSize:15, color:'var(--muted)' }}>+ {eur(travel)} de frais de déplacement (à part)</div>}
        {travel>0 && <div style={{ marginTop:8, background:'#FFF7E0', border:'1.5px solid #F5C96B', color:'#9A6A00', borderRadius:10, padding:'10px 13px', fontSize:13.5, fontWeight:600 }}>⚠️ Pensez à envoyer vos justificatifs de déplacement par mail.</div>}
        {myOvertime>0 && <div style={{ fontSize:15, color:'#B05A00', fontWeight:700 }}>+ {fmtHrs(myOvertime)} h supplémentaires à payer (à part)</div>}
      </div>

      {/* Detail */}
      <div className="card" style={{ padding:'22px', marginBottom:20 }}>
        <h2 className="section-title" style={{ marginBottom:14 }}>Détail de mes ventes</h2>
        {detail.length===0 ? (
          <div style={{ color:'var(--muted)', fontStyle:'italic' }}>Aucune vente enregistrée pour ce mois pour l'instant.</div>
        ) : detail.map((d,i)=><DetailRow key={i} {...d} />)}

        <div style={{ marginTop:16, paddingTop:14, borderTop:'2px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, marginBottom:5 }}><span>Prime ventes + assurances + add.</span><strong>{eur(base)}</strong></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, marginBottom:5 }}>
            <span>Part prime magasin ({sharePct}% de {eur(pool)})</span><strong>{eur(myShare)}</strong>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>{palierLabel} · marge magasin {eur(storeMargin)}</div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:19, fontWeight:800, color:'var(--teal-dark)', borderTop:'1.5px solid var(--border)', paddingTop:8 }}><span>TOTAL</span><span>{eur(total)}</span></div>
        </div>
      </div>

      {/* ── Saisie de mes primes (vendeur) ── */}
      <div className="card" style={{ padding:'22px', marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:editMode?16:0 }}>
          <h2 className="section-title" style={{ margin:0 }}>Saisir mes primes</h2>
          {!editMode ? (
            <button className="btn btn-primary btn-sm" onClick={startEdit}>✏️ Saisir / modifier mes ventes</button>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Annuler</button>
              <button className="btn btn-primary btn-sm" onClick={saveOwn}>✓ Enregistrer</button>
            </div>
          )}
        </div>
        {sent && <div style={{ background:'#E8FAF0', border:'1.5px solid #A5D6A7', color:'#1A8A42', borderRadius:10, padding:'10px 14px', fontSize:14, fontWeight:600, marginTop:12 }}>✅ Vos primes ont été enregistrées.</div>}

        {editMode && (
          <>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.03em', margin:'4px 0 10px' }}>Ventes</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
              {ITEM_ROWS.map(([k,label,unit,icon])=>(<CountTile key={k} icon={icon} label={label} unit={unit} value={editV[k]} onChange={val=>setVField(k,val)} />))}
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.03em', margin:'4px 0 10px' }}>Extensions de garantie</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
              {EXT_ROWS.map(([k,label,unit,icon])=>(<CountTile key={k} icon={icon} label={label} unit={unit} value={editV[k]} onChange={val=>setVField(k,val)} />))}
            </div>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.03em', margin:'4px 0 10px' }}>Assurances</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:16 }}>
              {ASSURANCES.map((a,i)=>(<CountTile key={i} icon="🔒" label={'Assurance '+eur(a)} unit={eur(a)} value={editV['ass'+i]} onChange={val=>setVField('ass'+i,val)} />))}
            </div>
            <div style={{ marginBottom:8 }}>
              <EditEntryList title="Mes ventes additionnelles (marge)" hint="Saisissez la marge ; le taux s'applique automatiquement" accent="var(--teal)" entries={editV.addEntries} onChange={val=>setVField('addEntries',val)} />
            </div>
          </>
        )}
      </div>

      {/* ── Chiffre magasin (modifiable) ── */}
      <div className="card" style={{ padding:'22px', marginBottom:16 }}>
        <h2 className="section-title" style={{ marginBottom:6 }}>Chiffre magasin</h2>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14 }}>Marge cumulée de {store?.name||'la boutique'} pour {MONTHS[month]} {year}. Vous pouvez la mettre à jour.</p>
        <EditEntryList title="Marge magasin (cumul)" hint="Ajoutez un ou plusieurs montants, ils s'additionnent" accent={store?.color||'var(--teal)'} entries={sd.marginEntries} onChange={saveStoreMargin} />
      </div>

      {/* ── Palier 2 : conditions + lu et approuvé ── */}
      <div className="card" style={{ padding:'22px', marginBottom:16, background:'#F3F0FF', border:'1.5px solid #C4B5FD' }}>
        <h2 className="section-title" style={{ marginBottom:8, color:'#5B21B6' }}>🎯 Palier 2 validé uniquement si :</h2>
        <ul style={{ margin:'0 0 16px', paddingLeft:20, color:'#4C1D95' }}>
          {PALIER2_CONDITIONS.map((c,i)=>(<li key={i} style={{ fontSize:14, marginBottom:5, lineHeight:1.4 }}>{c}</li>))}
        </ul>
        <label style={{ display:'flex', alignItems:'center', gap:12, background: myAck?'#E8FAF0':'#fff', border:`1.5px solid ${myAck?'#A5D6A7':'var(--border)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer' }}>
          <input type="checkbox" checked={!!myAck} onChange={e=>toggleAck(e.target.checked)} style={{ width:22, height:22, cursor:'pointer', accentColor:'#1A8A42', flexShrink:0 }} />
          <div>
            <div style={{ fontSize:15, fontWeight:700, color: myAck?'#1A8A42':'var(--text)' }}>Lu et approuvé pour {MONTHS[month]} {year}</div>
            {myAck && <div style={{ fontSize:12.5, color:'#1A8A42', marginTop:2 }}>✓ Validé le {new Date(myAck.date).toLocaleDateString('fr-FR')}</div>}
          </div>
        </label>
      </div>

      {/* Change request */}
      {!showForm ? (
        <button className="btn btn-ghost" onClick={()=>setShowForm(true)} style={{ width:'100%', justifyContent:'center', padding:'14px' }}>
          ✏️ Demander une modification
        </button>
      ) : (
        <div className="card" style={{ padding:'22px' }}>
          <h2 className="section-title" style={{ marginBottom:6 }}>Demande de modification</h2>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>Indiquez les bonnes quantités pour les points à corriger. Seuls les champs remplis seront proposés au manager, qui validera ou refusera.</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:16 }}>
            {ITEM_ROWS.concat(EXT_ROWS).map(([k,label,unit,icon])=>(
              <div key={k} style={{ background:'var(--card2)', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px' }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{icon} {label}</div>
                <input className="inp" type="number" min="0" placeholder={`Actuel : ${Number(v[k])||0}`} value={draft[k] ?? ''} onChange={e=>setField(k,e.target.value)} style={{ fontSize:15, padding:'8px 10px' }} />
              </div>
            ))}
            {ASSURANCES.map((a,i)=>(
              <div key={i} style={{ background:'var(--card2)', border:'1.5px solid var(--border)', borderRadius:12, padding:'10px 12px' }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>🔒 Assurance {eur(a)}</div>
                <input className="inp" type="number" min="0" placeholder={`Actuel : ${Number(v['ass'+i])||0}`} value={draft['ass'+i] ?? ''} onChange={e=>setField('ass'+i,e.target.value)} style={{ fontSize:15, padding:'8px 10px' }} />
              </div>
            ))}
          </div>

          <label className="lbl">Note / précision (optionnel)</label>
          <textarea className="inp" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex : j'ai vendu 2 smartphones de plus mardi..." style={{ marginBottom:16, resize:'vertical' }} />

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={submit}>📨 Envoyer la demande</button>
            <button className="btn btn-ghost" onClick={()=>{ setShowForm(false); setDraft({}); setNote(''); }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
const navBtn = { width:40, height:40, borderRadius:11, border:'1.5px solid var(--border)', background:'var(--card2)', fontSize:20, cursor:'pointer', color:'var(--teal-dark)' };
