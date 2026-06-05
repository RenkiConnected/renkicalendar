import React from 'react';
import { useApp } from '../context/AppContext';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: -10, top: -10, fontSize: 60, opacity: 0.05,
        userSelect: 'none',
      }}>{icon}</div>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: color || 'var(--primary)' }}>
        {value}
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { stores, employees, currentWeek, schedules, shiftTypes } = useApp();

  const totalShiftsThisWeek = Object.keys(schedules).filter(k => k.includes(`_2026_W${currentWeek}`))
    .reduce((acc, k) => acc + Object.keys(schedules[k]).length, 0);

  const managers = employees.filter(e => e.role === 'manager' || e.role === 'admin');
  const vendeurs = employees.filter(e => e.role === 'vendeur');

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 26 }}>
          ⚡ Dashboard
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Vue d'ensemble — <span style={{ color: 'var(--primary)' }}>Semaine {currentWeek} / 2026</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon="🏪" label="Magasins" value={stores.length} sub="Actifs" color="var(--primary)" />
        <StatCard icon="👥" label="Employés" value={employees.length} sub={`${managers.length} managers · ${vendeurs.length} vendeurs`} color="#A78BFA" />
        <StatCard icon="📅" label="Créneaux S{currentWeek}" value={totalShiftsThisWeek} sub="Ce planning" color="#34D399" />
        <StatCard icon="📊" label="Semaine actuelle" value={`S${currentWeek}`} sub="2026" color="#F59E0B" />
      </div>

      {/* Stores overview */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          Magasins
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {stores.map(store => {
            const storeEmps = employees.filter(e => e.storeId === store.id);
            const storeManagers = storeEmps.filter(e => e.role === 'manager');
            const key = `${store.id}_2026_W${currentWeek}`;
            const storeShifts = schedules[key] ? Object.keys(schedules[key]).length : 0;

            return (
              <div key={store.id} className="glass-card" style={{
                padding: '16px 20px',
                borderLeft: `3px solid ${store.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{store.name}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>
                      {storeManagers.length > 0 ? storeManagers.map(m => m.name).join(', ') : 'Aucun manager'}
                    </div>
                  </div>
                  <div style={{
                    background: store.color + '20', color: store.color,
                    borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                  }}>
                    {storeEmps.length} emp.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{storeShifts}</span> créneaux S{currentWeek}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{storeEmps.length}</span> personnes
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          Codes couleurs
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {shiftTypes.map(st => (
            <div key={st.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: st.bgColor, borderRadius: 12,
              border: `1px solid ${st.color}40`,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
              <span style={{ color: st.color, fontWeight: 600, fontSize: 13 }}>{st.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
