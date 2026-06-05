import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const ITEMS_ADMIN = [
  { id:'dashboard', label:'Dashboard',  icon:'⚡' },
  { id:'planning',  label:'Plannings',  icon:'📅' },
  { id:'leaves',    label:'Congés',     icon:'🌴', badge:true },
  { id:'employees', label:'Employés',   icon:'👥' },
  { id:'stores',    label:'Magasins',   icon:'🏪' },
  { id:'settings',  label:'Paramètres', icon:'⚙️' },
];
const ITEMS_VENDEUR = [
  { id:'view',     label:'Mon Planning', icon:'📅' },
  { id:'myleaves', label:'Mes congés',   icon:'🌴' },
];

export default function Nav({ page, setPage, logoUrl }) {
  const { logout, authRole, stores, selectedStore, setSelectedStore, currentWeek, leaveRequests } = useApp();
  const [mob, setMob] = useState(false);
  const items = (authRole==='admin'||authRole==='manager'||authRole==='dirigeant') ? ITEMS_ADMIN : ITEMS_VENDEUR;
  const pendingCount = leaveRequests?.filter(r=>r.status==='pending').length || 0;

  const Item = ({ it }) => (
    <button onClick={()=>{ setPage(it.id); setMob(false); }} style={{
      width:'100%', display:'flex', alignItems:'center', gap:13,
      padding:'13px 20px',
      background: page===it.id ? 'var(--teal-light)' : 'transparent',
      border:'none', cursor:'pointer',
      color: page===it.id ? 'var(--teal-dark)' : 'var(--muted)',
      fontFamily:'var(--font-b)', fontSize:15, fontWeight: page===it.id ? 700 : 500,
      transition:'all .15s', textAlign:'left',
      borderLeft: page===it.id ? '3px solid var(--teal)' : '3px solid transparent',
    }}
      onMouseEnter={e=>{ if(page!==it.id) e.currentTarget.style.background='var(--card2)'; }}
      onMouseLeave={e=>{ if(page!==it.id) e.currentTarget.style.background='transparent'; }}
    >
      <span style={{ fontSize:20, width:24, textAlign:'center' }}>{it.icon}</span>
      <span style={{ flex:1 }}>{it.label}</span>
      {it.badge && pendingCount > 0 && (
        <span style={{ background:'#C8002B', color:'#fff', borderRadius:12, padding:'2px 8px', fontSize:11, fontWeight:700 }}>
          {pendingCount}
        </span>
      )}
    </button>
  );

  const Sidebar = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)' }}>
        <img src={logoUrl||'care-logo.png'} alt="Care"
          style={{ height:40, maxWidth:160, objectFit:'contain', display:'block' }}
          onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
        />
        <div style={{ display:'none', alignItems:'center', gap:8 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff' }}>📅</div>
          <span style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:16 }}>Care Planning</span>
        </div>
        <div style={{ marginTop:8, fontSize:12, color:'var(--dim)' }}>
          Semaine <strong style={{color:'var(--teal-dark)'}}>S{currentWeek}</strong> · 2026
        </div>
      </div>

      {/* Store selector (managers) */}
      {(authRole==='admin'||authRole==='manager'||authRole==='dirigeant') && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <div className="lbl" style={{ marginBottom:6 }}>Magasin actif</div>
          <select className="inp" style={{ fontSize:14, padding:'9px 12px' }}
            value={selectedStore||''} onChange={e=>setSelectedStore(e.target.value||null)}>
            <option value="">Tous les magasins</option>
            {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, paddingTop:8, paddingBottom:8, overflowY:'auto' }}>
        {items.map(it=><Item key={it.id} it={it}/>)}
      </nav>

      {/* User + logout */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
        <div style={{ background:'var(--teal-light)', borderRadius:10, padding:'10px 13px', marginBottom:10, border:'1px solid var(--teal-mid)' }}>
          <div style={{ fontSize:11, color:'var(--dim)', marginBottom:2 }}>Connecté</div>
          <div style={{ fontSize:14, color:'var(--teal-dark)', fontWeight:700, textTransform:'capitalize' }}>
            {authRole==='dirigeant'?'Dirigeant':authRole}
          </div>
        </div>
        <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', fontSize:14 }} onClick={logout}>
          🚪 Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print" style={{
        position:'fixed', left:0, top:0, bottom:0,
        width:'var(--sidebar)', background:'var(--card)',
        borderRight:'1px solid var(--border)',
        zIndex:40, overflow:'hidden',
        display:'flex', flexDirection:'column',
        boxShadow:'2px 0 10px rgba(0,0,0,.05)',
      }}>
        <Sidebar/>
      </aside>

      {/* Mobile bar */}
      <div className="no-print" id="mob-bar" style={{
        display:'none', position:'fixed', top:0, left:0, right:0, zIndex:50,
        background:'var(--card)', borderBottom:'1px solid var(--border)',
        padding:'11px 16px', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 2px 8px rgba(0,0,0,.07)',
      }}>
        <img src={logoUrl||'care-logo.png'} alt="" style={{ height:34, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {pendingCount > 0 && <span style={{ background:'#C8002B', color:'#fff', borderRadius:12, padding:'3px 9px', fontSize:12, fontWeight:700 }}>{pendingCount}</span>}
          <button className="btn btn-ghost btn-sm" onClick={()=>setMob(true)}>☰</button>
        </div>
      </div>

      {mob && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.35)' }} onClick={()=>setMob(false)}/>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:260, background:'var(--card)', boxShadow:'4px 0 20px rgba(0,0,0,.15)', overflow:'auto' }}>
            <Sidebar/>
          </div>
        </div>
      )}

      <style>{`@media(max-width:860px){ aside.no-print{display:none!important} #mob-bar{display:flex!important} }`}</style>
    </>
  );
}
