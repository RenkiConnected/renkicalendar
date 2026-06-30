import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportPrimesPDF, exportPrimesNotion, buildStorePrime, exportMargeVisuel } from '../utils/pdfExport';

const UNIT = {
  smartphone: 5, box: 5, forfait999: 10, forfait699: 5, forfaitEngage: 10, accessoire: 1,
  extLow: 3, extMid: 4, extHigh: 5,
};
const ASSURANCES = [16.90, 15.90, 10.90, 6.90, 3.90];

const ITEM_ROWS = [
  ['smartphone', 'Smartphones', '5 €', '📱'],
  ['box', 'Box', '5 €', '📦'],
  ['forfait999', 'Forfaits 9,99', '10 €', '📶'],
  ['forfait699', 'Forfaits 6,99', '5 €', '📶'],
  ['forfaitEngage', 'Forfaits engagement', '10 €', '✍️'],
  ['accessoire', 'Accessoires one-shot', '1 €', '🎧'],
];
const EXT_ROWS = [
  ['extLow', 'Ext. < 500 €', '3 €', '🛡️'],
  ['extMid', 'Ext. 500–1000 €', '4 €', '🛡️'],
  ['extHigh', 'Ext. > 1000 €', '5 €', '🛡️'],
];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Remaining worked days (Mon–Sat) in a month from today, excluding given holiday dates (YYYY-MM-DD)
function remainingWorkDays(year, month, holidays) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = new Date(year, month + 1, 0).getDate();
  // Start from today if we're in the same month/year, else from day 1 (future month) or none (past)
  let startDay = 1;
  if (today.getFullYear() === year && today.getMonth() === month) startDay = today.getDate();
  else if (today.getFullYear() > year || (today.getFullYear() === year && today.getMonth() > month)) return 0;
  const hset = new Set((holidays || []));
  let count = 0;
  for (let d = startDay; d <= last; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0) continue; // Sunday off
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (hset.has(iso)) continue; // holiday excluded
    count++;
  }
  return count;
}

const eur = n => (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const fmtHrs = h => { const m = Math.round(h * 60); const H = Math.floor(m / 60); const M = m % 60; return M === 0 ? `${H}` : `${H}h${String(M).padStart(2, '0')}`; };
const sumList = arr => (Array.isArray(arr) ? arr.reduce((t, x) => t + (Number(x) || 0), 0) : (Number(arr) || 0));

// Safely evaluate a basic arithmetic expression (+ - * / and parentheses, decimals with . or ,)
function evalExpr(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/,/g, '.').replace(/\s+/g, '');
  if (s === '') return NaN;
  // Only allow digits, operators, parentheses and dots
  if (!/^[0-9+\-*/().]+$/.test(s)) return NaN;
  // Disallow weird sequences
  try {
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict";return (' + s + ')')();
    return (typeof val === 'number' && isFinite(val)) ? val : NaN;
  } catch { return NaN; }
}

function addRate(margin) {
  if (margin <= 0) return 0;
  if (margin <= 500) return 0.10;
  if (margin <= 1500) return 0.15;
  return 0.20;
}

function vendeurBase(v) {
  let t = 0;
  for (const [k] of ITEM_ROWS) t += (Number(v[k]) || 0) * UNIT[k];
  for (const [k] of EXT_ROWS) t += (Number(v[k]) || 0) * UNIT[k];
  ASSURANCES.forEach((amt, i) => { t += (Number(v[`ass${i}`]) || 0) * amt; });
  const addMargin = sumList(v.addEntries);
  t += addMargin * addRate(addMargin);
  return t;
}

const btnStep = { width: 34, height: 38, borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--card2)', fontSize: 20, fontWeight: 700, color: 'var(--teal-dark)', cursor: 'pointer', flexShrink: 0, lineHeight: 1 };
const tileGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: 10, marginBottom: 8 };

function SectionLabel({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.03em', margin: '18px 0 8px' }}>{children}</div>;
}

function CountTile({ icon, label, unit, value, onChange }) {
  const qty = Number(value) || 0;
  return (
    <div style={{ background: 'var(--card)', border: `1.5px solid ${qty > 0 ? 'var(--teal-mid)' : 'var(--border)'}`, borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: qty > 0 ? '0 2px 10px rgba(0,201,177,.12)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{unit} / pièce</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" onClick={() => onChange(Math.max(0, qty - 1))} style={btnStep}>−</button>
        <input className="inp" type="number" min="0" value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '8px 4px' }} placeholder="0" />
        <button type="button" onClick={() => onChange(qty + 1)} style={btnStep}>+</button>
      </div>
    </div>
  );
}

function EntryList({ title, hint, entries, onChange, accent }) {
  const list = Array.isArray(entries) ? entries : [];
  const total = sumList(list);
  const [draft, setDraft] = useState('');
  const preview = evalExpr(draft);
  const hasCalc = /[+\-*/]/.test(String(draft).trim().replace(/^-/, '')); // operator beyond a leading minus
  const add = () => {
    const n = evalExpr(draft);
    if (!isNaN(n) && n !== 0) { onChange([...list, parseFloat(n.toFixed(2))]); setDraft(''); }
  };
  const remove = i => onChange(list.filter((_, idx) => idx !== i));
  return (
    <div style={{ background: 'var(--card)', border: `1.5px solid ${accent}55`, borderRadius: 14, padding: '16px' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{hint}</div>}
      <div style={{ display: 'flex', gap: 6, marginBottom: hasCalc && !isNaN(preview) ? 4 : 10 }}>
        <input className="inp" type="text" inputMode="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} style={{ flex: 1, fontSize: 15, padding: '9px 12px' }} placeholder="Montant ou calcul ex: 120+50*2-30" />
        <button type="button" onClick={add} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>+ Ajouter</button>
      </div>
      {hasCalc && draft.trim() !== '' && (
        <div style={{ fontSize: 12.5, marginBottom: 10, color: isNaN(preview) ? '#C8002B' : accent, fontWeight: 600 }}>
          {isNaN(preview) ? '⚠️ Calcul invalide' : `= ${eur(preview)}`}
        </div>
      )}
      {list.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {list.map((x, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accent + '18', color: accent, borderRadius: 20, padding: '5px 10px 5px 12px', fontSize: 14, fontWeight: 700 }}>
              {eur(x)}
              <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Total cumulé</span>
        <strong style={{ fontSize: 18, color: accent }}>{eur(total)}</strong>
      </div>
    </div>
  );
}

function VendeurCard({ emp, data, onChange, storeBonusPool, overtimeToPay = 0 }) {
  const v = data || {};
  const base = vendeurBase(v);
  const sharePct = Number(v.storeBonusPct) || 0;
  const storeShare = storeBonusPool * sharePct / 100;
  const total = base + storeShare;
  const travel = Number(v.travel) || 0;
  const autoOvertime = Number(overtimeToPay) || 0;
  const manualOvertime = Number(v.manualOvertime) || 0;
  const totalOvertime = parseFloat((autoOvertime + manualOvertime).toFixed(2));
  const addMargin = sumList(v.addEntries);
  const set = (k, val) => onChange(emp.id, { ...v, [k]: val });
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'var(--card)', border: `1.5px solid ${open ? 'var(--teal-mid)' : 'var(--border)'}`, borderRadius: 16, marginBottom: 14, overflow: 'hidden', boxShadow: open ? '0 6px 24px rgba(0,201,177,.13)' : '0 1px 6px rgba(0,0,0,.05)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', cursor: 'pointer', background: open ? 'linear-gradient(90deg,var(--teal-light),transparent)' : 'transparent' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: emp.color || 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 18, flexShrink: 0 }}>{emp.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{emp.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{emp.role === 'manager' ? 'Manager' : 'Vendeur'} · {emp.contractHours || 35}h/sem</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 22, color: 'var(--teal-dark)' }}>{eur(total)}</div>
          {travel > 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>+ {eur(travel)} frais</div>}
          {totalOvertime > 0 && <div style={{ fontSize: 12, color: '#B05A00', fontWeight: 700 }}>+ {fmtHrs(totalOvertime)} h. supp à payer</div>}
        </div>
        <span style={{ fontSize: 20, color: 'var(--dim)', transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
      </div>
      {open && (
        <div style={{ padding: '6px 18px 20px' }}>
          <SectionLabel>Ventes</SectionLabel>
          <div style={tileGrid}>
            {ITEM_ROWS.map(([k, label, unit, icon]) => (<CountTile key={k} icon={icon} label={label} unit={unit} value={v[k]} onChange={val => set(k, val)} />))}
          </div>
          <SectionLabel>Extensions de garantie</SectionLabel>
          <div style={tileGrid}>
            {EXT_ROWS.map(([k, label, unit, icon]) => (<CountTile key={k} icon={icon} label={label} unit={unit} value={v[k]} onChange={val => set(k, val)} />))}
          </div>
          <SectionLabel>Assurances</SectionLabel>
          <div style={tileGrid}>
            {ASSURANCES.map((amt, i) => (<CountTile key={i} icon="🔒" label={`Assurance ${eur(amt)}`} unit={eur(amt)} value={v[`ass${i}`]} onChange={val => set(`ass${i}`, val)} />))}
          </div>
          <SectionLabel>Ventes additionnelles</SectionLabel>
          <EntryList title="Marges additionnelles (cumul)" accent="#7C4DFF" hint={`Taux unique selon le total · actuel : ${(addRate(addMargin) * 100)}% → prime ${eur(addMargin * addRate(addMargin))}`} entries={v.addEntries} onChange={val => set('addEntries', val)} />
          <SectionLabel>Part de la prime magasin</SectionLabel>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Pourcentage attribué à ce vendeur</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sharePct}% de {eur(storeBonusPool)} → <strong style={{ color: 'var(--teal-dark)' }}>{eur(storeShare)}</strong></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input className="inp" type="number" min="0" max="100" step="0.5" value={v.storeBonusPct ?? ''} onChange={e => set('storeBonusPct', e.target.value)} style={{ width: 90, textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '8px 10px' }} placeholder="0" />
              <span style={{ fontWeight: 700, color: 'var(--muted)' }}>%</span>
            </div>
          </div>
          <SectionLabel>Frais de déplacement</SectionLabel>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Frais (€)</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Affiché à part, ne s'ajoute pas à la prime</div>
            </div>
            <input className="inp" type="number" min="0" step="0.01" value={v.travel ?? ''} onChange={e => set('travel', e.target.value)} style={{ width: 120, textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '8px 10px' }} placeholder="0" />
          </div>
          <SectionLabel>Heures supplémentaires à payer</SectionLabel>
          <div style={{ background: 'var(--card)', border: '1.5px solid #F5B764', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#B05A00' }}>Heures supp. à payer (h)</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Saisie manuelle · affichée à part, ne s'ajoute pas à la prime{autoOvertime > 0 ? ` · +${fmtHrs(autoOvertime)} h auto (validées)` : ''}</div>
            </div>
            <input className="inp" type="number" min="0" step="0.25" value={v.manualOvertime ?? ''} onChange={e => set('manualOvertime', e.target.value)} style={{ width: 120, textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '8px 10px', color: '#B05A00' }} placeholder="0" />
          </div>
          <div style={{ marginTop: 18, background: 'linear-gradient(135deg,var(--teal-light),#EEF6FF)', border: '1.5px solid var(--teal-mid)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 5 }}><span>Ventes + assurances + add.</span><strong>{eur(base)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 8 }}><span>Part prime magasin</span><strong>{eur(storeShare)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 800, color: 'var(--teal-dark)', borderTop: '1.5px solid var(--teal-mid)', paddingTop: 8 }}><span>TOTAL PRIME</span><span>{eur(total)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 6, color: 'var(--muted)' }}><span>Frais de déplacement (à part)</span><strong>{eur(travel)}</strong></div>
            {travel > 0 && <div style={{ marginTop: 6, background: '#FFF7E0', border: '1.5px solid #F5C96B', color: '#9A6A00', borderRadius: 9, padding: '8px 11px', fontSize: 12.5, fontWeight: 600 }}>⚠️ Pensez à envoyer vos justificatifs de déplacement par mail.</div>}
            {totalOvertime > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4, color: '#B05A00' }}><span>Heures supplémentaires à payer (à part)</span><strong>{fmtHrs(totalOvertime)} h</strong></div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Primes() {
  const { stores, employees, getVisibleStoreIds, primes, savePrimeData, currentEmp, currentUser, isDirigeant, authRole, primeRequests, approvePrimeChangeRequest, rejectPrimeChangeRequest, getEmpOvertimeToPay } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const allowed = ['manager', 'dirigeant', 'admin'].includes(authRole);
  if (!allowed) {
    return (
      <div className="anim-up">
        <h1 className="page-title">Primes</h1>
        <p className="page-sub" style={{ marginTop: 12 }}>Cette section est en cours de test et n'est pas encore disponible pour votre compte.</p>
      </div>
    );
  }

  const visIds = getVisibleStoreIds ? getVisibleStoreIds() : stores.map(s => s.id);
  const visibleStores = stores.filter(s => visIds.includes(s.id));
  const keyFor = sid => `${sid}_${year}_M${month}`;
  const updateVendeur = (sid, empId, vData) => {
    const k = keyFor(sid); const cur = primes[k] || {};
    savePrimeData(k, { ...cur, storeId: sid, year, month, vendeurs: { ...(cur.vendeurs || {}), [empId]: vData } });
  };
  const updateStoreField = (sid, patch) => {
    const k = keyFor(sid); const cur = primes[k] || {};
    savePrimeData(k, { ...cur, storeId: sid, year, month, ...patch });
  };
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="anim-up">
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Primes vendeurs</h1>
        <p className="page-sub">Calcul automatique des primes · vue mensuelle</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 26, background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '12px 18px', maxWidth: 420, marginInline: 'auto' }}>
        <button onClick={prevMonth} style={{ width: 40, height: 40, borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--card2)', fontSize: 20, cursor: 'pointer', color: 'var(--teal-dark)' }}>‹</button>
        <div style={{ textAlign: 'center', minWidth: 150 }}>
          <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 20, color: 'var(--teal-dark)' }}>{MONTHS[month]}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{year}</div>
        </div>
        <button onClick={nextMonth} style={{ width: 40, height: 40, borderRadius: 11, border: '1.5px solid var(--border)', background: 'var(--card2)', fontSize: 20, cursor: 'pointer', color: 'var(--teal-dark)' }}>›</button>
      </div>

      {/* Export buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
        <button className="btn btn-primary btn-sm" onClick={() => {
          const sdata = visibleStores.map(s => ({ store: s, data: buildStorePrime(s, employees, primes[keyFor(s.id)] || {}, getEmpOvertimeToPay, year, month) }));
          exportPrimesPDF({ storesData: sdata, month, year, scope: 'manager', mode: 'preview' });
        }}>👁️ Aperçu PDF</button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const sdata = visibleStores.map(s => ({ store: s, data: buildStorePrime(s, employees, primes[keyFor(s.id)] || {}, getEmpOvertimeToPay, year, month) }));
          exportPrimesPDF({ storesData: sdata, month, year, scope: 'manager', mode: 'download' });
        }}>📄 Télécharger PDF</button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const sdata = visibleStores.map(s => ({ store: s, data: buildStorePrime(s, employees, primes[keyFor(s.id)] || {}, getEmpOvertimeToPay, year, month) }));
          exportPrimesNotion({ storesData: sdata, month, year, scope: 'manager' });
        }}>🗒️ Export Notion</button>
        {isDirigeant && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const sdata = stores.map(s => ({ store: s, data: buildStorePrime(s, employees, primes[keyFor(s.id)] || {}, getEmpOvertimeToPay, year, month) }));
              exportPrimesPDF({ storesData: sdata, month, year, scope: 'direction', mode: 'preview' });
            }}>👁️ Aperçu Direction</button>
            <button className="btn btn-primary btn-sm" onClick={() => {
              const sdata = stores.map(s => ({ store: s, data: buildStorePrime(s, employees, primes[keyFor(s.id)] || {}, getEmpOvertimeToPay, year, month) }));
              exportPrimesPDF({ storesData: sdata, month, year, scope: 'direction', mode: 'download' });
            }}>👑 Télécharger PDF Direction</button>
          </>
        )}
      </div>
      {/* Vendeur change suggestions */}
      {(()=>{
        const vis = getVisibleStoreIds ? getVisibleStoreIds() : stores.map(s=>s.id);
        const reqs = (primeRequests||[]).filter(r => r.status==='pending' && vis.includes(r.storeId) && r.year===year && r.month===month);
        if(reqs.length===0) return null;
        return (
          <div style={{ background:'#FFF7E0', border:'1.5px solid #F5D06A', borderRadius:14, padding:'16px 20px', marginBottom:26 }}>
            <div style={{ fontWeight:800, color:'#B07D00', fontSize:16, marginBottom:12 }}>✏️ Demandes de modification des vendeurs ({reqs.length})</div>
            <div style={{ display:'grid', gap:10 }}>
              {reqs.map(r=>{
                const st = stores.find(s=>s.id===r.storeId);
                const labels = { smartphone:'Smartphones', box:'Box', forfait999:'Forfaits 9,99', forfait699:'Forfaits 6,99', forfaitEngage:'Forfaits engagement', accessoire:'Accessoires', extLow:'Ext. <500€', extMid:'Ext. 500-1000€', extHigh:'Ext. >1000€', ass0:'Assurance 16,90€', ass1:'Assurance 15,90€', ass2:'Assurance 10,90€', ass3:'Assurance 6,90€', ass4:'Assurance 3,90€' };
                return (
                  <div key={r.id} style={{ background:'#fff', borderRadius:10, padding:'14px 16px', border:'1px solid #F0E0A8' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{r.empName} <span style={{ fontSize:12, color:'var(--muted)', fontWeight:500 }}>· {st?.name}</span></div>
                        <div style={{ fontSize:14, color:'#7A5C00', marginTop:4 }}>
                          {Object.entries(r.changes||{}).map(([k,val])=>(
                            <div key={k}>{labels[k]||k} → <strong>{val}</strong></div>
                          ))}
                          {r.note && <div style={{ fontStyle:'italic', color:'var(--muted)', marginTop:3 }}>"{r.note}"</div>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <button className="btn btn-sm" style={{ background:'#1A8A42', color:'#fff', border:'none', fontWeight:700 }}
                          onClick={async()=>{ await approvePrimeChangeRequest(r); }}>✅ Valider</button>
                        <button className="btn btn-sm" style={{ background:'#fff', border:'1.5px solid #FFAAB6', color:'#C8002B', fontWeight:700 }}
                          onClick={async()=>{ await rejectPrimeChangeRequest(r.id); }}>❌ Refuser</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {visibleStores.map(store => {
        const k = keyFor(store.id);
        const sd = primes[k] || {};
        const storeMargin = sumList(sd.marginEntries);
        const lastYearMargin = Number(sd.lastYearMargin) || 0;
        const evolPct = lastYearMargin > 0 ? ((storeMargin - lastYearMargin) / lastYearMargin) * 100 : null;
        const evolColor = evolPct == null ? 'var(--muted)' : (evolPct > 0.5 ? '#1A8A42' : (evolPct < -0.5 ? '#C8002B' : '#E08A00'));
        const evolLabel = evolPct == null ? '' : (evolPct > 0.5 ? '▲ Hausse' : (evolPct < -0.5 ? '▼ Baisse' : '● Maintien'));
        const palier1 = Number(sd.palier1) || 0;
        const palier2 = Number(sd.palier2) || 0;
        let storeBonusPool = 0, palierLabel = 'Aucun palier atteint', palierColor = 'var(--muted)';
        if (palier2 > 0 && storeMargin >= palier2) { storeBonusPool = storeMargin * 0.03; palierLabel = 'Palier 2 atteint · 3 %'; palierColor = '#1A8A42'; }
        else if (palier1 > 0 && storeMargin >= palier1) { storeBonusPool = storeMargin * 0.015; palierLabel = 'Palier 1 atteint · 1,5 %'; palierColor = '#1A8A42'; }
        const storeEmps = employees.filter(e => e.storeId === store.id && (e.role === 'vendeur' || e.role === 'manager'));
        const vendeurs = sd.vendeurs || {};
        const totalShare = storeEmps.reduce((t, e) => t + (storeBonusPool * (Number(vendeurs[e.id] ? vendeurs[e.id].storeBonusPct : 0) || 0) / 100), 0);
        const totalPrimes = storeEmps.reduce((t, e) => { const v = vendeurs[e.id] || {}; return t + vendeurBase(v) + (storeBonusPool * (Number(v.storeBonusPct) || 0) / 100); }, 0);
        const totalTravel = storeEmps.reduce((t, e) => t + (Number(vendeurs[e.id] ? vendeurs[e.id].travel : 0) || 0), 0);

        // Remaining to reach each palier + daily target (worked days Mon-Sat, minus holidays)
        const holidays = sd.holidays || [];
        const workDaysLeft = remainingWorkDays(year, month, holidays);
        const rem1 = Math.max(0, palier1 - storeMargin);
        const rem2 = Math.max(0, palier2 - storeMargin);
        const daily1 = workDaysLeft > 0 ? rem1 / workDaysLeft : 0;
        const daily2 = workDaysLeft > 0 ? rem2 / workDaysLeft : 0;
        return (
          <div key={store.id} style={{ marginBottom: 38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: store.color }} />
              <h2 style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 23 }}>{store.name}</h2>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>· {storeEmps.length} vendeur(s)</span>
            </div>
            <div style={{ background: 'var(--card)', border: `2px solid ${store.color}40`, borderRadius: 18, padding: '20px', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 14 }}>Prime magasin du mois</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                <EntryList title="Marge magasin (cumul)" accent={store.color} hint="Ajoutez un ou plusieurs montants, ils s'additionnent" entries={sd.marginEntries} onChange={val => updateStoreField(store.id, { marginEntries: val })} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label className="lbl">Palier 1 (€)</label><input className="inp" type="number" min="0" step="0.01" value={sd.palier1 ?? ''} onChange={e => updateStoreField(store.id, { palier1: e.target.value })} placeholder="0" /></div>
                  <div><label className="lbl">Palier 2 (€)</label><input className="inp" type="number" min="0" step="0.01" value={sd.palier2 ?? ''} onChange={e => updateStoreField(store.id, { palier2: e.target.value })} placeholder="0" /></div>
                  <div>
                    <label className="lbl">Marge année dernière · même mois (€)</label>
                    <input className="inp" type="number" min="0" step="0.01" value={sd.lastYearMargin ?? ''} onChange={e => updateStoreField(store.id, { lastYearMargin: e.target.value })} placeholder="0" />
                  </div>
                  {evolPct != null && (
                    <div style={{ background: evolColor + '14', border: `1.5px solid ${evolColor}55`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Évolution vs {MONTHS[month]} {year - 1}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{eur(lastYearMargin)} → {eur(storeMargin)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: evolColor }}>{evolPct > 0 ? '+' : ''}{evolPct.toFixed(1)} %</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: evolColor }}>{evolLabel}</div>
                      </div>
                    </div>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ justifyContent:'center' }}
                    onClick={()=>exportMargeVisuel({ store, storeMargin, lastYearMargin, month, year })}>
                    📲 Visuel WhatsApp (JPG) · chiffre vs N-1
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
                <span style={{ background: storeBonusPool > 0 ? '#E8FAF0' : 'var(--card2)', color: palierColor, border: `1.5px solid ${storeBonusPool > 0 ? '#A5D6A7' : 'var(--border)'}`, borderRadius: 20, padding: '7px 16px', fontWeight: 800, fontSize: 14 }}>{palierLabel}</span>
                <span style={{ fontSize: 15 }}>Marge cumulée : <strong>{eur(storeMargin)}</strong></span>
                <span style={{ fontSize: 15 }}>Enveloppe : <strong style={{ color: 'var(--teal-dark)' }}>{eur(storeBonusPool)}</strong></span>
                <span style={{ fontSize: 15, color: totalShare > storeBonusPool + 0.01 ? '#C8002B' : 'var(--muted)' }}>Répartie : <strong>{eur(totalShare)}</strong>{totalShare > storeBonusPool + 0.01 ? ' (dépassement !)' : ''}</span>
              </div>

              {/* Objectifs paliers : restant + journalier */}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
                {[{ n: 1, p: palier1, rem: rem1, daily: daily1, pct: 1.5 }, { n: 2, p: palier2, rem: rem2, daily: daily2, pct: 3 }].map(pl => (
                  <div key={pl.n} style={{ background: pl.p > 0 && pl.rem === 0 ? '#E8FAF0' : 'var(--card2)', border: `1.5px solid ${pl.p > 0 && pl.rem === 0 ? '#A5D6A7' : 'var(--border)'}`, borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>Palier {pl.n} <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>({pl.pct} %)</span></span>
                      <span style={{ fontSize: 14, color: 'var(--muted)' }}>{pl.p > 0 ? eur(pl.p) : '—'}</span>
                    </div>
                    {pl.p <= 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Palier non défini</div>
                    ) : pl.rem === 0 ? (
                      <div style={{ fontSize: 15, color: '#1A8A42', fontWeight: 700 }}>✅ Palier atteint !</div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                          <span style={{ color: 'var(--muted)' }}>Restant à faire</span>
                          <strong style={{ color: store.color }}>{eur(pl.rem)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ color: 'var(--muted)' }}>Par jour ({workDaysLeft} j restants)</span>
                          <strong style={{ color: 'var(--teal-dark)' }}>{workDaysLeft > 0 ? eur(pl.daily) + '/j' : '—'}</strong>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Jours fériés à exclure */}
              <div style={{ marginTop: 14, background: 'var(--card2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--muted)' }}>📅 Jours fériés / non travaillés ce mois ({workDaysLeft} jours ouvrés restants)</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="date" className="inp" id={`hol-${store.id}`}
                      min={`${year}-${String(month + 1).padStart(2, '0')}-01`}
                      max={`${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`}
                      style={{ fontSize: 14, padding: '7px 10px', width: 'auto' }} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                      const el = document.getElementById(`hol-${store.id}`);
                      const val = el && el.value;
                      if (val && !holidays.includes(val)) updateStoreField(store.id, { holidays: [...holidays, val] });
                      if (el) el.value = '';
                    }}>+ Exclure ce jour</button>
                  </div>
                </div>
                {holidays.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {[...holidays].sort().map(h => (
                      <span key={h} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF0F2', color: '#C8002B', borderRadius: 20, padding: '4px 9px 4px 12px', fontSize: 13, fontWeight: 600 }}>
                        {new Date(h + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        <button type="button" onClick={() => updateStoreField(store.id, { holidays: holidays.filter(x => x !== h) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C8002B', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {storeEmps.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '8px 0' }}>Aucun vendeur attitré à ce magasin.</div>
            ) : (
              storeEmps.map(emp => (<VendeurCard key={emp.id} emp={emp} data={vendeurs[emp.id]} onChange={(id, vData) => updateVendeur(store.id, id, vData)} storeBonusPool={storeBonusPool} overtimeToPay={getEmpOvertimeToPay ? getEmpOvertimeToPay(emp.id, year, month) : 0} />))
            )}
            <div style={{ background: 'linear-gradient(135deg,var(--teal-light),#EEF6FF)', border: '1.5px solid var(--teal-mid)', borderRadius: 16, padding: '18px 22px', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 800 }}>Total primes {store.name}</div>
                <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 28, color: 'var(--teal-dark)' }}>{eur(totalPrimes)}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 800 }}>Frais déplacement (à part)</div>
                <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>{eur(totalTravel)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
