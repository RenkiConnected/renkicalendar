import React, { useState } from 'react';
import { useApp, MANAGER_ROLES } from '../context/AppContext';

const ITEMS_MANAGER = [
  { id:'dashboard', label:'Dashboard',     icon:'⚡' },
  { id:'planning',  label:'Plannings',      icon:'📅' },
  { id:'leaves',    label:'Congés équipe',  icon:'🗂️', badge:true },
  { id:'myleaves',  label:'Mes congés',     icon:'🌴' },
  { id:'employees', label:'Employés',       icon:'👥' },
  { id:'stores',    label:'Magasins',       icon:'🏪' },
  { id:'settings',  label:'Paramètres',     icon:'⚙️' },
];
const ITEMS_VENDEUR = [
  { id:'view',     label:'Mon Planning', icon:'📅' },
  { id:'myleaves', label:'Mes congés',   icon:'🌴' },
];

export default function Nav({ page, setPage, logoUrl }) {
  const { logout, authRole, stores, selectedStore, setSelectedStore, currentWeek, leaveRequests } = useApp();
  const [mobOpen, setMobOpen] = useState(false);
  const isManager = MANAGER_ROLES.includes(authRole);
  const items = isManager ? ITEMS_MANAGER : ITEMS_VENDEUR;
  const pending = leaveRequests?.filter(r => r.status === 'pending').length || 0;

  const NavItem = ({ it, onClick }) => (
    <button onClick={() => { setPage(it.id); onClick?.(); }} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 13,
      padding: '13px 22px',
      background: page === it.id ? 'linear-gradient(90deg, var(--teal-light), rgba(0,201,177,.04))' : 'transparent',
      border: 'none', cursor: 'pointer',
      color: page === it.id ? 'var(--teal-dark)' : 'var(--muted)',
      fontFamily: 'var(--font-b)', fontSize: 15, fontWeight: page === it.id ? 700 : 500,
      transition: 'all .14s', textAlign: 'left',
      borderLeft: page === it.id ? '3px solid var(--teal)' : '3px solid transparent',
    }}
      onMouseEnter={e => { if (page !== it.id) { e.currentTarget.style.background = 'var(--card2)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (page !== it.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; } }}
    >
      <span style={{ fontSize: 20, width: 24, textAlign: 'center', flexShrink: 0 }}>{it.icon}</span>
      <span style={{ flex: 1 }}>{it.label}</span>
      {it.badge && pending > 0 && (
        <span style={{ background: '#C8002B', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{pending}</span>
      )}
    </button>
  );

  const SidebarContent = ({ onItemClick }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '22px 22px 16px', borderBottom: '1.5px solid var(--border)' }}>
        <img src={logoUrl || 'care-logo.png'} alt="Care"
          style={{ height: 42, maxWidth: 170, objectFit: 'contain', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
        <div style={{ display: 'none', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: '#fff' }}>📅</div>
          <span style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Care Planning</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--dim)' }}>
          Semaine <strong style={{ color: 'var(--teal-dark)' }}>S{currentWeek}</strong> · 2026
        </div>
      </div>

      {/* Store selector */}
      {isManager && (
        <div style={{ padding: '12px 16px', borderBottom: '1.5px solid var(--border)' }}>
          <div className="lbl" style={{ fontSize: 10, marginBottom: 5 }}>Magasin actif</div>
          <select className="inp" style={{ fontSize: 13, padding: '8px 10px' }}
            value={selectedStore || ''} onChange={e => setSelectedStore(e.target.value || null)}>
            <option value="">Tous les magasins</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8, overflowY: 'auto' }}>
        {items.map(it => <NavItem key={it.id} it={it} onClick={onItemClick} />)}
      </nav>

      {/* Role + logout */}
      <div style={{ padding: '14px 16px', borderTop: '1.5px solid var(--border)' }}>
        <div style={{ background: 'var(--teal-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 10, border: '1px solid var(--teal-mid)' }}>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 2 }}>Connecté en tant que</div>
          <div style={{ fontSize: 14, color: 'var(--teal-dark)', fontWeight: 700, textTransform: 'capitalize' }}>
            {authRole === 'dirigeant' ? '👑 Dirigeant' : authRole === 'manager' ? '👔 Manager' : '🛍️ Vendeur'}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={logout}>
          🚪 Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP sidebar */}
      <aside className="sidebar no-print">
        <SidebarContent />
      </aside>

      {/* MOBILE top bar */}
      <div className="mob-bar no-print" style={{ display: 'none' }}>
        <img src={logoUrl || 'care-logo.png'} alt="" style={{ height: 34, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {pending > 0 && <span style={{ background: '#C8002B', color: '#fff', borderRadius: 12, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{pending}</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => setMobOpen(true)} style={{ padding: '8px 12px' }}>☰</button>
        </div>
      </div>

      {/* MOBILE bottom nav tabs */}
      <div className="mob-bottom-nav no-print" style={{ display: 'none' }}>
        {items.slice(0, 5).map(it => (
          <button key={it.id} onClick={() => setPage(it.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 2px',
            color: page === it.id ? 'var(--teal-dark)' : 'var(--dim)',
            transition: 'all .15s',
          }}>
            <span style={{ fontSize: 22 }}>{it.icon}</span>
            <span style={{ fontSize: 10, fontWeight: page === it.id ? 700 : 500, fontFamily: 'var(--font-b)' }}>
              {it.label.split(' ')[0]}
            </span>
            {it.badge && pending > 0 && (
              <span style={{ position: 'absolute', top: 6, background: '#C8002B', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>{pending}</span>
            )}
          </button>
        ))}
        {items.length > 5 && (
          <button onClick={() => setMobOpen(true)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 2px',
            color: 'var(--dim)', transition: 'all .15s',
          }}>
            <span style={{ fontSize: 22 }}>⋯</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-b)' }}>Plus</span>
          </button>
        )}
      </div>

      {/* MOBILE full drawer */}
      {mobOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setMobOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, background: 'var(--card)', boxShadow: '5px 0 24px rgba(0,0,0,.18)', overflow: 'auto', animation: 'fadeIn .2s ease' }}>
            <SidebarContent onItemClick={() => setMobOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
