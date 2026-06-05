import React from 'react';
import { useApp } from '../context/AppContext';

function Stat({ icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ padding:'22px 24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:16, top:16, fontSize:40, opacity:0.06 }}>{icon}</div>
      <div style={{ fontSize:30, marginBottom:10 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:34, fontWeight:800, color:color||'var(--care-teal-dark)', lineHeight:1 }}>{value}</div>
      <div style={{ color:'var(--text)', fontWeight:600, fontSize:14, marginTop:6 }}>{label}</div>
      {sub && <div style={{ color:'var(--text-dim)', fontSize:12, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ setCurrentPage }) {
  const { stores, employees, currentWeek, schedules, shiftTypes } = useApp();
  const totalShifts = Object.keys(schedules).filter(k=>k.includes(`_2026_W${currentWeek}`)).reduce((a,k)=>a+Object.keys(schedules[k]).length,0);
  const managers = employees.filter(e=>e.role==='manager'||e.role==='admin');

  return (
    <div className="fade-up" style={{ maxWidth:1400, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub">Semaine <strong style={{color:'var(--care-teal-dark)'}}>S{currentWeek}</strong> · 2026</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setCurrentPage&&setCurrentPage('planning')}>📅 Voir les plannings</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:36 }}>
        <Stat icon="🏪" label="Magasins" value={stores.length} sub="Configurés" color="var(--care-teal-dark)" />
        <Stat icon="👥" label="Employés" value={employees.length} sub={`${managers.length} managers`} color="#6B35C8" />
        <Stat icon="📅" label={`Créneaux S${currentWeek}`} value={totalShifts} sub="Ce planning" color="#1A8A42" />
        <Stat icon="⚡" label="Semaine" value={`S${currentWeek}`} sub="2026" color="#D05B00" />
      </div>

      <div style={{ marginBottom:32 }}>
        <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:16 }}>Magasins</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {stores.map(store=>{
            const emps=employees.filter(e=>e.storeId===store.id);
            const mgrs=emps.filter(e=>e.role==='manager'||e.role==='admin');
            const key=`${store.id}_2026_W${currentWeek}`;
            const shifts=schedules[key]?Object.keys(schedules[key]).length:0;
            return (
              <div key={store.id} className="card" style={{ padding:'18px 20px', borderTop:`3px solid ${store.color}`, cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:16 }}>{store.name}</div>
                  <span style={{ background:store.color+'18', color:store.color, borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700 }}>{emps.length} emp.</span>
                </div>
                <div style={{ color:'var(--text-dim)', fontSize:12.5, marginBottom:10 }}>
                  {mgrs.length>0?'👔 '+mgrs.map(m=>m.name).join(', '):'Aucun manager'}
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {emps.slice(0,7).map(e=>(
                    <div key={e.id} title={e.name} style={{ width:28,height:28,borderRadius:'50%',background:e.color||'var(--care-teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',border:'2px solid white',boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>{e.name[0]}</div>
                  ))}
                  {emps.length>7&&<div style={{ width:28,height:28,borderRadius:'50%',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'var(--text-muted)',border:'2px solid white' }}>+{emps.length-7}</div>}
                </div>
                <div style={{ marginTop:10,fontSize:12,color:'var(--text-dim)',borderTop:'1px solid var(--border-dark)',paddingTop:10 }}>
                  <span style={{ color:'var(--care-teal-dark)',fontWeight:700 }}>{shifts}</span> créneaux S{currentWeek}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700, marginBottom:14 }}>Codes couleurs</h2>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {shiftTypes.map(st=>(
            <span key={st.id} style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'8px 16px',background:st.bgColor,borderRadius:30,border:`1.5px solid ${st.color}30`,fontSize:13,color:st.color,fontWeight:700 }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:st.color,display:'inline-block' }} />{st.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
