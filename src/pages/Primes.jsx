import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

// ── Bonus rules ──────────────────────────────────────────
const UNIT = {
  smartphone: 5,
  box: 5,
  forfait999: 10,
  forfait699: 5,
  forfaitEngage: 10,
  accessoire: 1,
  extLow: 3,    // extension < 500
  extMid: 4,    // extension 500-1000
  extHigh: 5,   // extension > 1000
};
const ASSURANCES = [16.90, 15.90, 10.90, 6.90, 3.90];

const ITEM_ROWS = [
  ['smartphone', 'Smartphones', '5 € / pièce'],
  ['box', 'Box', '5 € / pièce'],
  ['forfait999', 'Forfaits 9,99', '10 € / pièce'],
  ['forfait699', 'Forfaits 6,99', '5 € / pièce'],
  ['forfaitEngage', 'Forfaits avec engagement', '10 € / pièce'],
  ['accessoire', 'Accessoires (one-shot)', '1 € / pièce'],
];
const EXT_ROWS = [
  ['extLow', 'Extensions < 500 €', '3 € / pièce'],
  ['extMid', 'Extensions 500–1000 €', '4 € / pièce'],
  ['extHigh', 'Extensions > 1000 €', '5 € / pièce'],
];

const eur = n => (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

// Additional-sales rate: single rate based on total margin
function addRate(margin) {
  if (margin <= 0) return 0;
  if (margin <= 500) return 0.10;
  if (margin <= 1500) return 0.15;
  return 0.20;
}

// Compute a single vendeur's total bonus (excluding store bonus share & travel)
function vendeurBase(v) {
  let t = 0;
  for (const [k] of ITEM_ROWS) t += (Number(v[k]) || 0) * UNIT[k];
  for (const [k] of EXT_ROWS) t += (Number(v[k]) || 0) * UNIT[k];
  ASSURANCES.forEach((amt, i) => { t += (Number(v[`ass${i}`]) || 0) * amt; });
  const addMargin = Number(v.addMargin) || 0;
  t += addMargin * addRate(addMargin);
  return t;
}

function NumField({ label, hint, value, onChange, step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{hint}</div>}
      </div>
      <input className="inp" type="number" min="0" step={step || 1} value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{ width: 100, textAlign: 'center', fontSize: 15, padding: '8px 10px' }} placeholder="0" />
    </div>
  );
}

function VendeurCard({ emp, data, onChange, storeBonusPool }) {
  const v = data || {};
  const base = vendeurBase(v);
  const sharePct = Number(v.storeBonusPct) || 0;
  const storeShare = storeBonusPool * sharePct / 100;
  const total = base + storeShare;
  const travel = Number(v.travel) || 0;
  const addMargin = Number(v.addMargin) || 0;
  const set = (k, val) => onChange(emp.id, { ...v, [k]: val });

  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: open ? 'var(--card2)' : 'transparent' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: emp.color || 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16, flexShrink: 0 }}>{emp.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Vendeur · {emp.contractHours || 35}h/sem</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 20, color: 'var(--teal-dark)' }}>{eur(total)}</div>
          {travel > 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>+ {eur(travel)} frais</div>}
        </div>
        <span style={{ fontSize: 18, color: 'var(--dim)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>
      </div>

      {open && (
        <div style={{ padding: '4px 16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Ventes</div>
          {ITEM_ROWS.map(([k, label, hint]) => (
            <NumField key={k} label={label} hint={hint} value={v[k]} onChange={val => set(k, val)} />
          ))}

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 4px' }}>Extensions de garantie</div>
          {EXT_ROWS.map(([k, label, hint]) => (
            <NumField key={k} label={label} hint={hint} value={v[k]} onChange={val => set(k, val)} />
          ))}

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 4px' }}>Assurances</div>
          {ASSURANCES.map((amt, i) => (
            <NumField key={i} label={`Assurance ${eur(amt)}`} hint={`${eur(amt)} / coche`} value={v[`ass${i}`]} onChange={val => set(`ass${i}`, val)} />
          ))}

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 4px' }}>Ventes additionnelles</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Marge additionnelle (€)</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Taux appliqué : {(addRate(addMargin) * 100)}% → prime {eur(addMargin * addRate(addMargin))}
              </div>
            </div>
            <input className="inp" type="number" min="0" step="0.01" value={v.addMargin ?? ''} onChange={e => set('addMargin', e.target.value)}
              style={{ width: 110, textAlign: 'center', fontSize: 15, padding: '8px 10px' }} placeholder="0" />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 4px' }}>Prime magasin (part de ce vendeur)</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Pourcentage attribué</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {sharePct}% de {eur(storeBonusPool)} → {eur(storeShare)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input className="inp" type="number" min="0" max="100" step="0.5" value={v.storeBonusPct ?? ''} onChange={e => set('storeBonusPct', e.target.value)}
                style={{ width: 80, textAlign: 'center', fontSize: 15, padding: '8px 10px' }} placeholder="0" />
              <span style={{ fontWeight: 700, color: 'var(--muted)' }}>%</span>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', margin: '16px 0 4px' }}>Frais de déplacement</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Frais (€)</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Affiché à part, ne s'ajoute pas à la prime</div>
            </div>
            <input className="inp" type="number" min="0" step="0.01" value={v.travel ?? ''} onChange={e => set('travel', e.target.value)}
              style={{ width: 110, textAlign: 'center', fontSize: 15, padding: '8px 10px' }} placeholder="0" />
          </div>

          {/* Recap */}
          <div style={{ marginTop: 16, background: 'var(--teal-light)', border: '1.5px solid var(--teal-mid)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 4 }}>
              <span>Prime ventes + assurances + add.</span><strong>{eur(base)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 8 }}>
              <span>Part prime magasin</span><strong>{eur(storeShare)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--teal-dark)', borderTop: '1.5px solid var(--teal-mid)', paddingTop: 8 }}>
              <span>TOTAL PRIME</span><span>{eur(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginTop: 6, color: 'var(--muted)' }}>
              <span>Frais de déplacement (à part)</span><strong>{eur(travel)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Primes() {
  const { stores, employees, currentWeek, setCurrentWeek, currentYear, getVisibleStoreIds, primes, savePrimeData, currentEmp, currentUser } = useApp();

  // Restricted to Michael only for now (testing phase)
  const allowed = (currentEmp?.name === 'Michael') || (currentUser === 'Michael');
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

  const keyFor = sid => `${sid}_${currentYear}_W${currentWeek}`;

  // Update a vendeur's data within a store's prime doc
  const updateVendeur = (sid, empId, vData) => {
    const k = keyFor(sid);
    const cur = primes[k] || {};
    const vendeurs = { ...(cur.vendeurs || {}), [empId]: vData };
    savePrimeData(k, { ...cur, storeId: sid, year: currentYear, week: currentWeek, vendeurs });
  };
  const updateStoreField = (sid, patch) => {
    const k = keyFor(sid);
    const cur = primes[k] || {};
    savePrimeData(k, { ...cur, storeId: sid, year: currentYear, week: currentWeek, ...patch });
  };

  return (
    <div className="anim-up">
      <div style={{ marginBottom: 22 }}>
        <h1 className="page-title">Primes vendeurs & managers</h1>
        <p className="page-sub">Calcul automatique des primes · Semaine {currentWeek} · {currentYear}</p>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}>‹ Semaine préc.</button>
        <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 18, color: 'var(--teal-dark)' }}>S{currentWeek} · {currentYear}</div>
        <button className="btn btn-ghost" onClick={() => setCurrentWeek(w => Math.min(53, w + 1))}>Semaine suiv. ›</button>
      </div>

      {visibleStores.map(store => {
        const k = keyFor(store.id);
        const sd = primes[k] || {};
        const storeMargin = Number(sd.storeMargin) || 0;
        const palier1 = Number(sd.palier1) || 0;
        const palier2 = Number(sd.palier2) || 0;
        // Determine reached palier & store bonus pool
        let storeBonusPool = 0, palierLabel = 'Aucun palier atteint';
        if (palier2 > 0 && storeMargin >= palier2) { storeBonusPool = storeMargin * 0.03; palierLabel = 'Palier 2 atteint (3 %)'; }
        else if (palier1 > 0 && storeMargin >= palier1) { storeBonusPool = storeMargin * 0.015; palierLabel = 'Palier 1 atteint (1,5 %)'; }

        const storeEmps = employees.filter(e => e.storeId === store.id && e.role === 'vendeur');
        const vendeurs = sd.vendeurs || {};

        // Totals
        const totalShare = storeEmps.reduce((t, e) => t + (storeBonusPool * (Number(vendeurs[e.id]?.storeBonusPct) || 0) / 100), 0);
        const totalPrimes = storeEmps.reduce((t, e) => {
          const v = vendeurs[e.id] || {};
          return t + vendeurBase(v) + (storeBonusPool * (Number(v.storeBonusPct) || 0) / 100);
        }, 0);
        const totalTravel = storeEmps.reduce((t, e) => t + (Number(vendeurs[e.id]?.travel) || 0), 0);

        return (
          <div key={store.id} style={{ marginBottom: 32 }}>
            {/* Store header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: store.color }} />
              <h2 style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 22 }}>{store.name}</h2>
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>· {storeEmps.length} vendeur(s)</span>
            </div>

            {/* Store bonus / paliers */}
            <div style={{ background: 'var(--card)', border: `2px solid ${store.color}40`, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Prime magasin (paliers du mois)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
                <div>
                  <label className="lbl">Marge magasin (€)</label>
                  <input className="inp" type="number" min="0" step="0.01" value={sd.storeMargin ?? ''} onChange={e => updateStoreField(store.id, { storeMargin: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="lbl">Palier 1 (€)</label>
                  <input className="inp" type="number" min="0" step="0.01" value={sd.palier1 ?? ''} onChange={e => updateStoreField(store.id, { palier1: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="lbl">Palier 2 (€)</label>
                  <input className="inp" type="number" min="0" step="0.01" value={sd.palier2 ?? ''} onChange={e => updateStoreField(store.id, { palier2: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
                <span style={{ background: storeBonusPool > 0 ? '#E8FAF0' : 'var(--card2)', color: storeBonusPool > 0 ? '#1A8A42' : 'var(--muted)', border: `1.5px solid ${storeBonusPool > 0 ? '#A5D6A7' : 'var(--border)'}`, borderRadius: 20, padding: '6px 14px', fontWeight: 700, fontSize: 14 }}>
                  {palierLabel}
                </span>
                <span style={{ fontSize: 15 }}>Enveloppe prime magasin : <strong style={{ color: 'var(--teal-dark)' }}>{eur(storeBonusPool)}</strong></span>
                <span style={{ fontSize: 15, color: totalShare > storeBonusPool + 0.01 ? '#C8002B' : 'var(--muted)' }}>
                  Répartie : <strong>{eur(totalShare)}</strong>{totalShare > storeBonusPool + 0.01 ? ' (dépassement !)' : ''}
                </span>
              </div>
            </div>

            {/* Vendeurs */}
            {storeEmps.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontStyle: 'italic', padding: '8px 0' }}>Aucun vendeur attitré à ce magasin.</div>
            ) : (
              storeEmps.map(emp => (
                <VendeurCard key={emp.id} emp={emp} data={vendeurs[emp.id]} onChange={(id, vData) => updateVendeur(store.id, id, vData)} storeBonusPool={storeBonusPool} />
              ))
            )}

            {/* Store totals */}
            <div style={{ background: 'var(--teal-light)', border: '1.5px solid var(--teal-mid)', borderRadius: 14, padding: '16px 20px', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total primes {store.name}</div>
                <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 26, color: 'var(--teal-dark)' }}>{eur(totalPrimes)}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Frais déplacement (à part)</div>
                <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 26, color: 'var(--text)' }}>{eur(totalTravel)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
