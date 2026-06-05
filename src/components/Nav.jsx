import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS_ADMIN = [
  { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
  { id: 'planning', label: 'Plannings', icon: '📅' },
  { id: 'employees', label: 'Employés', icon: '👥' },
  { id: 'stores', label: 'Magasins', icon: '🏪' },
  { id: 'settings', label: 'Paramètres', icon: '⚙️' },
];

const NAV_ITEMS_VENDEUR = [
  { id: 'view', label: 'Mon Planning', icon: '📅' },
];

export default function Nav({ currentPage, setCurrentPage }) {
  const { logout, authRole, stores, selectedStore, setSelectedStore } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = authRole === 'admin' || authRole === 'manager' ? NAV_ITEMS_ADMIN : NAV_ITEMS_VENDEUR;

  return (
    <>
      {/* Mobile top bar */}
      <div className="no-print" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
      }} id="mobile-topbar">
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 18 }}>
          Care <span className="gradient-text">Planning</span>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="no-print" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: collapsed ? 72 : 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s',
        zIndex: 40,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            minWidth: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), #0097B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0,184,212,0.3)',
            fontSize: 18,
          }}>📅</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                Care <span className="gradient-text">Planning</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                Semaine {useApp().currentWeek}
              </div>
            </div>
          )}
        </div>

        {/* Store selector */}
        {!collapsed && (authRole === 'admin' || authRole === 'manager') && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <label className="label" style={{ fontSize: 10 }}>Magasin actif</label>
            <select
              className="input"
              style={{ fontSize: 13, padding: '8px 10px' }}
              value={selectedStore || ''}
              onChange={e => setSelectedStore(e.target.value || null)}
            >
              <option value="">Tous les magasins</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 12, padding: '11px 16px',
                background: currentPage === item.id ? 'rgba(0,184,212,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: currentPage === item.id ? 'var(--primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: currentPage === item.id ? 600 : 400,
                transition: 'all 0.15s',
                borderLeft: currentPage === item.id ? '3px solid var(--primary)' : '3px solid transparent',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (currentPage !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                if (currentPage !== item.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 18, minWidth: 22 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Role badge + logout */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{
              background: 'rgba(0,184,212,0.1)', borderRadius: 8,
              padding: '8px 12px', marginBottom: 8,
              border: '1px solid rgba(0,184,212,0.2)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Connecté en tant que</div>
              <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                {authRole}
              </div>
            </div>
          )}
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', fontSize: 13 }}
            onClick={logout}
          >
            <span>🚪</span>
            {!collapsed && 'Déconnexion'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', right: -14, top: '50%',
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'var(--text-muted)', transition: 'all 0.2s',
            zIndex: 10,
          }}
          title={collapsed ? 'Ouvrir' : 'Réduire'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      {/* Spacer */}
      <div style={{ marginLeft: collapsed ? 72 : 240, transition: 'margin-left 0.25s', minHeight: '100vh' }}
        id="main-spacer" />
    </>
  );
}

// Hook to get sidebar width
export function useSidebarWidth() {
  return 240;
}
