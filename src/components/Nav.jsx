import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const NAV_ADMIN = [
  { id:'dashboard', label:'Dashboard', icon:'⚡' },
  { id:'planning',  label:'Plannings', icon:'📅' },
  { id:'employees', label:'Employés',  icon:'👥' },
  { id:'stores',    label:'Magasins',  icon:'🏪' },
  { id:'settings',  label:'Paramètres',icon:'⚙️' },
];
const NAV_VENDEUR = [
  { id:'view', label:'Mon Planning', icon:'📅' },
];

export default function Nav({ currentPage, setCurrentPage }) {
  const { logout, authRole, stores, selectedStore, setSelectedStore, currentWeek } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = (authRole === 'admin' || authRole === 'manager') ? NAV_ADMIN : NAV_VENDEUR;

  const NavItem = ({ item }) => (
    <button
      onClick={() => { setCurrentPage(item.id); setMobileOpen(false); }}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:12,
        padding: collapsed ? '12px 0' : '11px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: currentPage === item.id
          ? 'linear-gradient(90deg, rgba(0,201,177,0.12), rgba(0,201,177,0.04))'
          : 'transparent',
        border:'none', cursor:'pointer',
        color: currentPage === item.id ? 'var(--care-teal-dark)' : 'var(--text-muted)',
        fontFamily:'var(--font-body)', fontSize:14,
        fontWeight: currentPage === item.id ? 700 : 500,
        transition:'all 0.15s',
        borderLeft: currentPage === item.id ? '3px solid var(--care-teal)' : '3px solid transparent',
        borderRadius: '0 8px 8px 0',
        textAlign:'left',
      }}
    >
      <span style={{ fontSize:18, minWidth:22, textAlign:'center' }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </button>
  );

  const SidebarContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid var(--border-dark)', display:'flex', alignItems:'center', gap:12 }}>
        <img src="care-logo.png" alt="Care"
          style={{ height: collapsed ? 32 : 36, objectFit:'contain', transition:'height 0.2s' }}
          onError={e => { e.target.style.display='none'; }}
        />
        {!collapsed && (
          <div>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:17, color:'var(--text)', lineHeight:1 }}>
              Planning
            </div>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>Semaine {currentWeek} · 2026</div>
          </div>
        )}
      </div>

      {/* Store selector */}
      {!collapsed && (authRole==='admin'||authRole==='manager') && (
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border-dark)' }}>
          <label className="label" style={{ fontSize:10 }}>Magasin actif</label>
          <select className="input" style={{ fontSize:13, padding:'8px 10px' }} value={selectedStore||''} onChange={e=>setSelectedStore(e.target.value||null)}>
            <option value="">Tous</option>
            {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
        {items.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* Role + logout */}
      <div style={{ padding:'14px 12px', borderTop:'1px solid var(--border-dark)' }}>
        {!collapsed && (
          <div style={{ background:'var(--care-teal-light)', borderRadius:9, padding:'8px 12px', marginBottom:10, border:'1px solid var(--care-teal-mid)' }}>
            <div style={{ fontSize:11, color:'var(--text-dim)' }}>Connecté</div>
            <div style={{ fontSize:13, color:'var(--care-teal-dark)', fontWeight:700, textTransform:'capitalize' }}>{authRole}</div>
          </div>
        )}
        <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent: collapsed?'center':'flex-start' }} onClick={logout}>
          <span>🚪</span>{!collapsed && 'Déconnexion'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="no-print" style={{
        position:'fixed', left:0, top:0, bottom:0,
        width: collapsed ? 68 : 230,
        background:'var(--bg-card)',
        borderRight:'1px solid var(--border-dark)',
        transition:'width 0.22s',
        zIndex:40,
        overflow:'hidden',
        boxShadow:'2px 0 12px rgba(0,0,0,0.06)',
        display:'flex', flexDirection:'column',
      }}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button onClick={()=>setCollapsed(!collapsed)} style={{
          position:'absolute', right:-13, top:72,
          width:26, height:26, borderRadius:'50%',
          background:'var(--bg-card)', border:'1.5px solid var(--border-dark)',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, color:'var(--text-muted)', boxShadow:'0 2px 6px rgba(0,0,0,0.1)',
          zIndex:10, transition:'all 0.2s',
        }}>
          {collapsed ? '›' : '‹'}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="no-print" style={{
        display:'none', position:'fixed', top:0, left:0, right:0, zIndex:50,
        background:'var(--bg-card)', borderBottom:'1px solid var(--border-dark)',
        padding:'10px 16px', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
      }} id="mobile-bar">
        <img src="care-logo.png" alt="Care" style={{ height:32, objectFit:'contain' }} onError={e=>e.target.style.display='none'} />
        <button className="btn btn-ghost btn-sm" onClick={()=>setMobileOpen(!mobileOpen)}>☰</button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:100 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }} onClick={()=>setMobileOpen(false)} />
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:240, background:'var(--bg-card)', boxShadow:'4px 0 20px rgba(0,0,0,0.15)' }}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content spacer */}
      <div id="nav-spacer" style={{ marginLeft: collapsed ? 68 : 230, transition:'margin-left 0.22s', minHeight:'100vh', flex:1 }} />

      <style>{`
        @media (max-width:768px) {
          aside { display: none !important; }
          #mobile-bar { display: flex !important; }
          #nav-spacer { margin-left: 0 !important; padding-top: 56px; }
        }
      `}</style>
    </>
  );
}
