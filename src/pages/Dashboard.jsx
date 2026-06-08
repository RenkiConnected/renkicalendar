import React from 'react';
import { useApp } from '../context/AppContext';

function Stat({ icon, label, value, sub, color }) {
  return (
    <div className="card" style={{ padding:'28px 32px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:18, top:14, fontSize:44, opacity:.06 }}>{icon}</div>
      <div style={{ fontSize:38, marginBottom:14 }}>{icon}</div>
      <div className="num" style={{ fontFamily:'var(--font-b)', fontSize:42, fontWeight:800, color:color||'var(--teal-dark)', lineHeight:1, fontVariantNumeric:'tabular-nums lining-nums', letterSpacing:0 }}>{value}</div>
      <div style={{ color:'var(--text)', fontWeight:600, fontSize:17, marginTop:10 }}>{label}</div>
      {sub&&<div style={{ color:'var(--dim)', fontSize:14, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ setPage }) {
  const { stores, employees, currentWeek, schedules, shiftTypes } = useApp();
  const totalShifts = Object.keys(schedules).filter(k=>k.includes(`_2026_W${currentWeek}`)).reduce((a,k)=>a+Object.keys(schedules[k]).length,0);
  const managers = employees.filter(e=>e.role==='manager'||e.role==='admin');

  return (
    <div className="anim-up" style={{ maxWidth:1300, margin:'0 auto', width:'100%' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:36, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub">Vue d'ensemble · Semaine <strong style={{color:'var(--teal-dark)'}}>S{currentWeek}</strong> · 2026</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setPage&&setPage('planning')} style={{ fontSize:15, padding:'12px 24px' }}>
          📅 Plannings semaine
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:18, marginBottom:40 }}>
        <Stat icon="🏪" label="Magasins" value={stores.length} sub="Configurés" color="var(--teal-dark)" />
        <Stat icon="👥" label="Employés" value={employees.length} sub={`${managers.length} managers`} color="#6B35C8" />
        <Stat icon="📅" label={`Créneaux S${currentWeek}`} value={totalShifts} sub="Ce planning" color="#1A8A42" />
        <Stat icon="⚡" label="Semaine" value={`S${currentWeek}`} sub="2026" color="#D05B00" />
      </div>

      <div style={{ marginBottom:36 }}>
        <h2 className="section-title" style={{ marginBottom:18 }}>Magasins</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {stores.map(store=>{
            const emps=employees.filter(e=>e.storeId===store.id);
            const mgrs=emps.filter(e=>e.role==='manager'||e.role==='admin');
            const key=`${store.id}_2026_W${currentWeek}`;
            const shifts=schedules[key]?Object.keys(schedules[key]).length:0;
            return(
              <div key={store.id} className="card" style={{ padding:'20px 22px', borderTop:`4px solid ${store.color}`, cursor:'pointer', transition:'all .15s' }}
                onClick={()=>setPage&&setPage('planning')}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ fontFamily:'var(--font-h)', fontWeight:700, fontSize:17, color:'var(--text)' }}>{store.name}</div>
                  <span style={{ background:store.color+'18', color:store.color, borderRadius:20, padding:'4px 12px', fontSize:13, fontWeight:700 }}>{emps.length} emp.</span>
                </div>
                <div style={{ color:'var(--dim)', fontSize:13.5, marginBottom:14 }}>
                  {mgrs.length>0?'👔 '+mgrs.map(m=>m.name).join(', '):'Aucun manager assigné'}
                </div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                  {emps.slice(0,8).map(e=>(
                    <div key={e.id} title={e.name} style={{ width:30,height:30,borderRadius:'50%',background:e.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',border:'2.5px solid #fff',boxShadow:'0 1px 4px rgba(0,0,0,.1)' }}>{e.name[0]}</div>
                  ))}
                  {emps.length>8&&<div style={{ width:30,height:30,borderRadius:'50%',background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'var(--muted)',border:'2.5px solid #fff' }}>+{emps.length-8}</div>}
                </div>
                <div style={{ fontSize:13, color:'var(--muted)', borderTop:'1px solid var(--border)', paddingTop:12 }}>
                  <span style={{ color:'var(--teal-dark)', fontWeight:700, fontSize:16 }}>{shifts}</span> créneaux S{currentWeek}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="section-title" style={{ marginBottom:16 }}>Codes couleurs</h2>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {shiftTypes.map(st=>(
            <span key={st.id} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'9px 18px',background:st.bgColor,borderRadius:30,border:`1.5px solid ${st.color}40`,fontSize:15,color:st.color,fontWeight:700 }}>
              <span style={{ width:9,height:9,borderRadius:'50%',background:st.color,display:'inline-block'}}/>
              {st.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
