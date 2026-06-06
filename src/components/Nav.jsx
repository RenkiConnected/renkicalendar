import React, { useState } from 'react';
import { useApp, MANAGER_ROLES } from '../context/AppContext';

const ITEMS_MANAGER = [
  { id:'dashboard', label:'Dashboard',    icon:'⚡' },
  { id:'planning',  label:'Plannings',    icon:'📅' },
  { id:'leaves',    label:'Congés équipe',icon:'🗂️', badge:true },
  { id:'myleaves',  label:'Mes congés',   icon:'🌴' },
  { id:'employees', label:'Employés',     icon:'👥' },
  { id:'stores',    label:'Magasins',     icon:'🏪' },
  { id:'settings',  label:'Paramètres',   icon:'⚙️' },
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
      padding: '14px 24px',
      background: page===it.id ? 'linear-gradient(90deg,var(--teal-light),rgba(0,201,177,.03))' : 'transparent',
      border: 'none', cursor: 'pointer',
      color: page===it.id ? 'var(--teal-dark)' : 'var(--muted)',
      fontFamily: 'var(--font-b)', fontSize: 16, fontWeight: page===it.id ? 700 : 500,
      transition: 'all .14s', textAlign: 'left',
      borderLeft: page===it.id ? '3px solid var(--teal)' : '3px solid transparent',
    }}
      onMouseEnter={e => { if (page!==it.id) { e.currentTarget.style.background='var(--card2)'; e.currentTarget.style.color='var(--text)'; } }}
      onMouseLeave={e => { if (page!==it.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted)'; } }}
    >
      <span style={{ fontSize:21, width:26, textAlign:'center', flexShrink:0 }}>{it.icon}</span>
      <span style={{ flex:1 }}>{it.label}</span>
      {it.badge && pending>0 && (
        <span style={{ background:'#C8002B', color:'#fff', borderRadius:10, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{pending}</span>
      )}
    </button>
  );

  const SidebarBody = ({ onItemClick }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'24px 24px 18px', borderBottom:'1.5px solid var(--border)', background:'linear-gradient(135deg,var(--teal-light) 0%,#fff 100%)' }}>
        <img src={logoUrl||'care-logo.png'} alt="Care"
          style={{ height:38, maxWidth:160, objectFit:'contain', display:'block' }}
          onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
        />
        <div style={{ display:'none', alignItems:'center', gap:8 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff' }}>📅</div>
          <span style={{ fontFamily:'var(--font-h)',fontWeight:800,fontSize:15 }}>Care Planning</span>
        </div>
        <div style={{ marginTop:8,fontSize:13,color:'var(--muted)',fontWeight:500 }}>
          Semaine <strong style={{color:'var(--teal-dark)',fontSize:15}}>S{currentWeek}</strong> · 2026
        </div>
      </div>
      {isManager && (
        <div style={{ padding:'11px 14px', borderBottom:'1.5px solid var(--border)' }}>
          <div className="lbl" style={{marginBottom:5}}>Magasin actif</div>
          <select className="inp" style={{fontSize:13,padding:'8px 10px'}} value={selectedStore||''} onChange={e=>setSelectedStore(e.target.value||null)}>
            <option value="">Tous les magasins</option>
            {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <nav style={{ flex:1, paddingTop:6, paddingBottom:6, overflowY:'auto' }}>
        {items.map(it=><NavItem key={it.id} it={it} onClick={onItemClick}/>)}
      </nav>
      <div style={{ padding:'13px 14px', borderTop:'1.5px solid var(--border)' }}>
        <div style={{ background:'var(--teal-light)', borderRadius:9, padding:'9px 12px', marginBottom:9, border:'1px solid var(--teal-mid)' }}>
          <div style={{ fontSize:11,color:'var(--dim)',marginBottom:1 }}>Connecté</div>
          <div style={{ fontSize:13,color:'var(--teal-dark)',fontWeight:700,textTransform:'capitalize' }}>
            {authRole==='dirigeant'?'👑 Dirigeant':authRole==='manager'?'👔 Manager':'🛍️ Vendeur'}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{width:'100%',justifyContent:'flex-start'}} onClick={logout}>
          🚪 Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP sidebar */}
      <aside className="sidebar no-print">
        <SidebarBody/>
      </aside>

      {/* MOBILE topbar */}
      <div className="mob-topbar no-print">
        <img src={logoUrl||'care-logo.png'} alt="" style={{height:30,objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>
        <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:16,color:'var(--text)'}}>
          Care <span className="grad">Planning</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {pending>0&&<span style={{background:'#C8002B',color:'#fff',borderRadius:10,padding:'3px 8px',fontSize:12,fontWeight:700}}>{pending}</span>}
          <button className="btn btn-ghost btn-sm" onClick={()=>setMobOpen(true)} style={{padding:'7px 10px'}}>☰</button>
        </div>
      </div>

      {/* MOBILE bottom nav */}
      <div className="mob-bottom no-print">
        {items.slice(0,5).map(it=>(
          <button key={it.id} onClick={()=>setPage(it.id)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:3, background:'transparent', border:'none', cursor:'pointer',
            color: page===it.id?'var(--teal-dark)':'var(--dim)',
            padding:'6px 2px',
            borderTop: page===it.id?'2px solid var(--teal)':'2px solid transparent',
            transition:'all .15s',
          }}>
            <span style={{fontSize:21}}>{it.icon}</span>
            <span style={{fontSize:9,fontWeight:page===it.id?700:500,fontFamily:'var(--font-b)',letterSpacing:'.02em'}}>
              {it.label.split(' ')[0]}
            </span>
            {it.badge&&pending>0&&(
              <span style={{position:'absolute',top:8,background:'#C8002B',color:'#fff',borderRadius:8,padding:'1px 5px',fontSize:8,fontWeight:700}}>{pending}</span>
            )}
          </button>
        ))}
        {items.length>5&&(
          <button onClick={()=>setMobOpen(true)} style={{
            flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            gap:3,background:'transparent',border:'none',cursor:'pointer',
            color:'var(--dim)',padding:'6px 2px',borderTop:'2px solid transparent',
          }}>
            <span style={{fontSize:21}}>⋯</span>
            <span style={{fontSize:9,fontFamily:'var(--font-b)'}}>Plus</span>
          </button>
        )}
      </div>

      {/* MOBILE full drawer */}
      {mobOpen && (
        <div style={{position:'fixed',inset:0,zIndex:200}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)'}} onClick={()=>setMobOpen(false)}/>
          <div style={{position:'absolute',left:0,top:0,bottom:0,width:280,background:'var(--card)',boxShadow:'5px 0 24px rgba(0,0,0,.18)',overflow:'auto',animation:'slideIn .2s ease'}}>
            <SidebarBody onItemClick={()=>setMobOpen(false)}/>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @media(max-width:860px){
          aside.sidebar{display:none!important}
        }
      `}</style>
    </>
  );
}
