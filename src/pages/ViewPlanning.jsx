import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function fmtH(decimalHours){
  if(decimalHours==null||isNaN(decimalHours)) return '0h';
  const totalMin=Math.round(decimalHours*60);
  const h=Math.floor(totalMin/60), m=totalMin%60;
  return m===0 ? `${h}h` : `${h}h${String(m).padStart(2,'0')}`;
}
function calcH(s,e,b){
  try{const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);
  const d=(eh*60+em)-(sh*60+sm);if(d<=0)return 0;
  return Math.max(0,parseFloat(((d-Math.round((b||0)*60))/60).toFixed(2)));}catch{return 0;}
}
function mainHours(sh){ if(!sh||!sh.startTime||!sh.endTime)return 0; return calcH(sh.startTime,sh.endTime,sh.breakH||0); }
function splitHours(sh){ if(!sh||!sh.split||!sh.split.startTime||!sh.split.endTime)return 0; return calcH(sh.split.startTime,sh.split.endTime,sh.split.breakH||0); }

export default function ViewPlanning() {
  const { stores, employees, shiftTypes, getSchedule, currentWeek, setCurrentWeek, currentYear, currentEmpId, authRole, getWeekDatesForCurrentWeek } = useApp();
  const [selectedStore, setSelectedStore] = useState('');
  const [detailPopup, setDetailPopup] = React.useState(null);
  const weekDates = getWeekDatesForCurrentWeek(currentWeek);

  // For vendeurs, default to their own store
  const myEmp = employees.find(e => e.id === currentEmpId);
  const effectiveStore = selectedStore || myEmp?.storeId || stores[0]?.id || '';
  const store = stores.find(s => s.id === effectiveStore);
  const storeEmps = employees.filter(e => e.storeId === effectiveStore);
  const schedule = getSchedule(effectiveStore, currentWeek, currentYear);

  const getShift = (empId, di) => schedule[`${empId}_${di}`];
  const getShiftMeta = (typeId) => shiftTypes.find(s => s.id === typeId) || { label: typeId, color: '#6366F1', bgColor: '#EEF2FF' };
  const handleShiftClick=(emp,di,sh,wd)=>{ if(sh) setDetailPopup({empId:emp.id,sh,day:wd}); };

  const ShiftPopup = () => {
    if(!detailPopup) return null;
    const emp=storeEmps.find(e=>e.id===detailPopup.empId);
    const sh=detailPopup.sh;
    if(!emp||!sh) return null;
    const st=getShiftMeta(sh.type);
    const st2=sh.split?getShiftMeta(sh.split.type):null;
    return(
      <div style={{position:'fixed',inset:0,background:'rgba(27,42,59,.5)',backdropFilter:'blur(5px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setDetailPopup(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,padding:'20px 20px 40px',boxShadow:'0 -8px 40px rgba(0,0,0,.2)',animation:'slideUp .25s ease'}}>
          <div style={{width:36,height:4,background:'#E2EBF0',borderRadius:2,margin:'0 auto 18px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:18}}>{emp.name[0]}</div>
            <div>
              <div style={{fontWeight:800,fontSize:18}}>{emp.name}</div>
              <div style={{fontSize:15,color:'var(--muted)',marginTop:2}}>{detailPopup.day.day} {detailPopup.day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
            </div>
          </div>
          <div style={{background:st.bgColor,border:`2px solid ${st.color}50`,borderRadius:14,padding:'16px 18px',marginBottom:st2?10:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontWeight:800,fontSize:18,color:st.color}}>{st.label}</span>
              {sh.hours>0&&<span style={{fontWeight:700,fontSize:20,color:st.color}}>{fmtH(mainHours(sh))}</span>}
            </div>
            {sh.startTime&&<div style={{fontSize:16,color:st.color}}>🕐 {sh.startTime} → {sh.endTime}{sh.breakH>0?` (-${sh.breakH}h pause)`:''}</div>}
            {sh.note&&<div style={{marginTop:8,fontSize:15,color:st.color,opacity:.7,fontStyle:'italic'}}>💬 {sh.note}</div>}
          </div>
          {st2&&sh.split&&(
            <div style={{background:st2.bgColor,border:`2px solid ${st2.color}50`,borderRadius:14,padding:'16px 18px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontWeight:800,fontSize:18,color:st2.color}}>{st2.label}</span>
                {sh.split.hours>0&&<span style={{fontWeight:700,fontSize:20,color:st2.color}}>{fmtH(splitHours(sh))}</span>}
              </div>
              {sh.split.startTime&&<div style={{fontSize:16,color:st2.color}}>🕐 {sh.split.startTime} → {sh.split.endTime}</div>}
            </div>
          )}
        </div>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      </div>
    );
  };

  return (
    <div className="anim-up">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:26, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">📅 Planning</h1>
          <p className="page-sub">Consultation · Semaine <strong style={{ color:'var(--teal-dark)' }}>S{currentWeek}</strong></p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentWeek(w => Math.max(1, w-1))}>‹ Préc.</button>
          <div style={{ background:'var(--teal-light)', border:'2px solid var(--teal-mid)', borderRadius:10, padding:'9px 18px', fontFamily:'var(--font-h)', fontWeight:800, color:'var(--teal-dark)', fontSize:17 }}>S{currentWeek}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentWeek(w => Math.min(52, w+1))}>Suiv. ›</button>
        </div>
      </div>

      {/* Store tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        {stores.map(s => (
          <button key={s.id} onClick={() => setSelectedStore(s.id)} style={{
            padding:'9px 18px', borderRadius:30, cursor:'pointer', flexShrink:0,
            border:`2px solid ${effectiveStore===s.id?s.color:s.color+'40'}`,
            background:effectiveStore===s.id?s.color:'#fff',
            color:effectiveStore===s.id?'#fff':s.color,
            fontFamily:'var(--font-b)', fontSize:14, fontWeight:effectiveStore===s.id?700:500,
            transition:'all .15s', boxShadow:effectiveStore===s.id?`0 4px 12px ${s.color}40`:'none',
          }}>{s.name}</button>
        ))}
      </div>

      {/* Mobile: card per employee */}
      <div style={{ display:'none' }} className="mobile-view">
        {storeEmps.map(emp => (
          <div key={emp.id} className="card" style={{ marginBottom:12, padding:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:40,height:40,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17 }}>{emp.name[0]}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{emp.name}</div>
                <div style={{ fontSize:13, color:'var(--dim)' }}>{emp.role} · {emp.contractHours}h</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {weekDates.map((wd, di) => {
                const sh = getShift(emp.id, di);
                const st = sh ? getShiftMeta(sh.type) : null;
                return (
                  <div key={di} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'var(--dim)', marginBottom:3 }}>{wd.day.slice(0,1)}</div>
                    <div style={{
                      borderRadius:7, padding:'5px 2px', minHeight:40,
                      background:sh?st.bgColor:'var(--card2)',
                      border:`1px solid ${sh?st.color+'40':'var(--border)'}`,
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    }}>
                      {sh ? (
                        <>
                          <span style={{ fontSize:9, fontWeight:700, color:st.color }}>{st.label.slice(0,3)}</span>
                          {sh.startTime && <span style={{ fontSize:8, color:st.color, opacity:.8 }}>{sh.startTime.slice(0,5)}</span>}
                        </>
                      ) : <span style={{ color:'var(--border)', fontSize:14 }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="desktop-view card" style={{ overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:750 }}>
            <thead>
              <tr style={{ background:'var(--card2)', borderBottom:'2px solid var(--border)' }}>
                <th style={{ padding:'16px 20px', textAlign:'left', fontSize:13, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', width:180 }}>Employé</th>
                {weekDates.map((wd, i) => (
                  <th key={i} style={{ padding:'14px 10px', textAlign:'center', minWidth:100 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{wd.day.slice(0,3)}</div>
                    <div style={{ fontSize:12, color:'var(--dim)', marginTop:3 }}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {storeEmps.map((emp, ei) => (
                <tr key={emp.id} style={{ borderBottom:'1px solid var(--border)', background:ei%2===0?'#fff':'var(--card2)' }}>
                  <td style={{ padding:'12px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                      <div style={{ width:38,height:38,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'#fff',flexShrink:0 }}>{emp.name[0]}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>{emp.name}</div>
                        <div style={{ fontSize:12, color:'var(--dim)' }}>{emp.contractHours}h/sem</div>
                      </div>
                    </div>
                  </td>
                  {weekDates.map((_, di) => {
                    const sh = getShift(emp.id, di);
                    const st = sh ? getShiftMeta(sh.type) : null;
                    return (
                      <td key={di} style={{ padding:'6px 6px' }}>
                        {sh ? (
                          <div style={{ background:st.bgColor, border:`1.5px solid ${st.color}50`, borderRadius:10, padding:'7px 5px', minHeight:58, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:st.color }}>{st.label}</span>
                            {sh.startTime && <span style={{ fontSize:11, color:st.color, opacity:.8 }}>{sh.startTime}–{sh.endTime}</span>}
                            {sh.hours > 0 && <span style={{ fontSize:11, color:st.color, opacity:.7 }}>{fmtH(mainHours(sh))}</span>}
                          </div>
                        ) : (
                          <div style={{ minHeight:58, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--border)', fontSize:20 }}>—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:18 }}>
        {shiftTypes.map(st => (
          <span key={st.id} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', background:st.bgColor, borderRadius:20, border:`1.5px solid ${st.color}35`, fontSize:13, color:st.color, fontWeight:700 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:st.color, display:'inline-block' }}/>{st.label}
          </span>
        ))}
      </div>

      <ShiftPopup/>
      <style>{`
        @media (max-width: 860px) {
          .mobile-view { display: block !important; }
          .desktop-view { display: none !important; }
        }
      `}</style>
    </div>
  );
}
