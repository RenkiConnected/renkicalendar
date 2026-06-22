import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const UNIT = { smartphone:5, box:5, forfait999:10, forfait699:5, forfaitEngage:10, accessoire:1, extLow:3, extMid:4, extHigh:5 };
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
  const { employees, stores, currentEmp, currentUser, primes, submitPrimeChangeRequest, primeRequests } = useApp();
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
