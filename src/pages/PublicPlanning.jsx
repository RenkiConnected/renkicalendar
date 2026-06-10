import React, { useState, useMemo } from 'react';
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

const DAY_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

function ShiftPopup({ data, onClose }) {
  if (!data) return null;
  const { emp, sh, st, st2, day } = data;
  const isMob = window.innerWidth <= 860;

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:500,
        background:'rgba(27,42,59,.55)',
        backdropFilter:'blur(8px)',
        display:'flex',
        alignItems: isMob ? 'flex-end' : 'center',
        justifyContent:'center',
        padding: isMob ? 0 : '20px',
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:'#fff',
          borderRadius: isMob ? '24px 24px 0 0' : 22,
          width:'100%', maxWidth:520,
          padding: isMob ? '8px 22px 44px' : '30px 36px',
          maxHeight: isMob ? '90vh' : 'calc(100vh - 40px)',
          overflowY: 'auto',
          boxShadow: isMob ? '0 -12px 60px rgba(0,0,0,.25)' : '0 24px 80px rgba(0,0,0,.22)',
          animation: isMob ? 'slideUp .28s cubic-bezier(.32,0,.67,0) forwards' : 'popIn .25s cubic-bezier(.34,1.56,.64,1) forwards',
        }}
      >
        {/* Handle mobile */}
        {isMob && <div style={{width:38,height:4,background:'#E2EBF0',borderRadius:2,margin:'12px auto 20px'}}/>}

        {/* Date header */}
        <div style={{
          background:`linear-gradient(135deg,${st.bgColor},${st.bgColor}bb)`,
          border:`1.5px solid ${st.color}30`,
          borderRadius:14, padding:'12px 16px', marginBottom:16,
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:st.color,textTransform:'capitalize',letterSpacing:'.05em'}}>
              {day.day}
            </div>
            <div style={{fontSize:19,fontWeight:800,color:'var(--text)',marginTop:2}}>
              {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(0,0,0,.07)', border:'none', borderRadius:'50%',
            width:32, height:32, cursor:'pointer', fontSize:16, color:'var(--muted)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>

        {/* Employee */}
        <div style={{
          display:'flex', alignItems:'center', gap:12, marginBottom:18,
          padding:'11px 14px', background:'var(--card2)', borderRadius:12,
          border:'1px solid var(--border)',
        }}>
          <div style={{
            width:44, height:44, borderRadius:'50%',
            background: emp.color||'var(--teal)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, color:'#fff', fontSize:18, flexShrink:0,
            boxShadow:`0 4px 12px ${emp.color||'#00C9B1'}55`,
          }}>{emp.name[0]}</div>
          <div>
            <div style={{fontWeight:800,fontSize:17}}>{emp.name}</div>
            <div style={{fontSize:14,color:'var(--muted)',marginTop:2,textTransform:'capitalize'}}>{emp.role} · {emp.contractHours}h/sem</div>
          </div>
        </div>

        {/* Main shift */}
        <ShiftBlock sh={sh} st={st}/>

        {/* Split */}
        {st2 && sh.split && <ShiftBlock sh={sh.split} st={st2} style={{marginTop:10}}/>}

        <button onClick={onClose} style={{
          marginTop:18, width:'100%',
          background:'var(--teal)', color:'#fff', border:'none',
          borderRadius:12, padding:'14px', fontSize:16, fontWeight:700,
          cursor:'pointer', fontFamily:'var(--font-b)',
          boxShadow:'0 3px 14px rgba(0,201,177,.4)',
        }}>
          Fermer
        </button>
      </div>

      <style>{`
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes popIn   { from{transform:scale(.88) translateY(12px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}

function ShiftBlock({ sh, st, style }) {
  return (
    <div style={{
      background:st.bgColor, border:`2px solid ${st.color}40`,
      borderRadius:16, padding:'16px 18px', ...style,
    }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:st.color}}/>
          <span style={{fontWeight:800,fontSize:18,color:st.color}}>{st.label}</span>
        </div>
        {(sh.hours||0)>0 && (
          <div style={{background:st.color,color:'#fff',borderRadius:20,padding:'5px 14px',fontWeight:800,fontSize:17}}>
            {sh.hours}h
          </div>
        )}
      </div>
      {sh.startTime ? (
        <div style={{display:'flex',alignItems:'stretch',background:'rgba(255,255,255,.65)',borderRadius:10,overflow:'hidden'}}>
          <div style={{flex:1,textAlign:'center',padding:'10px 8px'}}>
            <div style={{fontSize:12,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Début</div>
            <div style={{fontSize:30,fontWeight:800,color:st.color,lineHeight:1.1,fontVariantNumeric:'tabular-nums lining-nums',letterSpacing:0}}>{sh.startTime}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',color:st.color,opacity:.4,fontSize:22,padding:'0 4px'}}>→</div>
          <div style={{flex:1,textAlign:'center',padding:'10px 8px'}}>
            <div style={{fontSize:12,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Fin</div>
            <div style={{fontSize:30,fontWeight:800,color:st.color,lineHeight:1.1,fontVariantNumeric:'tabular-nums lining-nums',letterSpacing:0}}>{sh.endTime}</div>
          </div>
          {(sh.breakH||0)>0 && (
            <div style={{flex:1,textAlign:'center',padding:'10px 8px',borderLeft:`1px solid ${st.color}20`}}>
              <div style={{fontSize:12,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Pause</div>
              <div style={{fontSize:22,fontWeight:800,color:st.color}}>{sh.breakH}h</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{textAlign:'center',fontSize:15,color:st.color,fontWeight:600,opacity:.8}}>Journée complète</div>
      )}
      {sh.note && (
        <div style={{marginTop:8,fontSize:14,color:st.color,opacity:.7,fontStyle:'italic'}}>💬 {sh.note}</div>
      )}
    </div>
  );
}

export default function PublicPlanning({ onLogin }) {
  const { stores, employees, shiftTypes, schedules, currentWeek, setCurrentWeek, currentYear, getWeekDatesForCurrentWeek } = useApp();
  const [activeStore, setActiveStore] = useState(stores[0]?.id || '');
  const [popup, setPopup] = useState(null);
  const [viewMode, setViewMode] = useState('week');

  const weekDates = getWeekDatesForCurrentWeek(currentWeek);
  const store = stores.find(s => s.id === activeStore);
  const baseSched = schedules[`${activeStore}_${currentYear}_W${currentWeek}`] || {};
  const homeEmps = employees.filter(e => e.storeId === activeStore);

  // Build a merged schedule that ALSO includes home employees' shifts in OTHER stores (déplacements)
  const sched = useMemo(() => {
    const merged = { ...baseSched };
    const wt = ['work','communication','meeting','school'];
    homeEmps.forEach(emp => {
      for (let di=0; di<7; di++) {
        const key = `${emp.id}_${di}`;
        // If no shift here (or it's empty) but the employee works in another store this day → show away
        const here = merged[key];
        if (here && wt.includes(here.type)) continue; // already working here
        // Search other stores for this employee's shift this day
        for (const s of stores) {
          if (s.id === activeStore) continue;
          const otherSched = schedules[`${s.id}_${currentYear}_W${currentWeek}`] || {};
          const sh = otherSched[key];
          if (sh && wt.includes(sh.type)) {
            merged[key] = { ...sh, _away: true, _awayStore: s.name };
            break;
          }
        }
      }
    });
    return merged;
  }, [baseSched, homeEmps, stores, schedules, activeStore, currentWeek, currentYear]);

  // Visitors: employees from other stores who have a shift here this week
  const visitorEmps = employees.filter(e => {
    if (e.storeId === activeStore) return false;
    const wt = ['work','communication','meeting','school'];
    for (let di=0; di<7; di++) {
      const sh = baseSched[`${e.id}_${di}`];
      if (sh && wt.includes(sh.type)) return true;
    }
    return false;
  });
  const storeEmps = [...homeEmps, ...visitorEmps];
  const getMeta = id => shiftTypes.find(s => s.id === id) || { label:id, color:'#6366F1', bgColor:'#EEF2FF' };
  const startDate = weekDates[0]?.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
  const endDate   = weekDates[6]?.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  // Month weeks computation
  const monthWeeks = useMemo(()=>{
    const fd = weekDates[0]?.date;
    if(!fd) return [];
    const month=fd.getMonth(), year=fd.getFullYear();
    const wks=[];
    for(let wk=currentWeek-2;wk<=currentWeek+5;wk++){
      if(wk<1||wk>53) continue;
      const wd=getWeekDatesForCurrentWeek(wk);
      if(wd.some(d=>d.date.getMonth()===month&&d.date.getFullYear()===year)) wks.push({wk,wd});
    }
    return wks;
  },[weekDates,currentWeek]);

  const handleCellClick = (emp, di) => {
    const sh = sched[`${emp.id}_${di}`];
    if (!sh) return;
    const st = getMeta(sh.type);
    const st2 = sh.split ? getMeta(sh.split.type) : null;
    setPopup({ emp, sh, st, st2, day: weekDates[di] });
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(145deg,#EAF7F5 0%,#F4F7F9 60%,#EEF2FF 100%)', display:'flex', flexDirection:'column' }}>

      {/* TOP HEADER */}
      <div style={{ background:'white', borderBottom:'1.5px solid #E2EBF0', padding:'0 16px', boxShadow:'0 2px 12px rgba(0,0,0,.07)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:700, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="care-logo.png" alt="Care" style={{ height:30, objectFit:'contain' }} onError={e=>e.target.style.display='none'}/>
            <div>
              <div style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:15 }}>Care Planning</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>Planning des équipes</div>
            </div>
          </div>
          <button onClick={onLogin} style={{ background:'var(--teal)', color:'white', border:'none', borderRadius:8, padding:'8px 16px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-b)' }}>
            Se connecter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex:1, maxWidth:700, margin:'0 auto', width:'100%', padding:'16px 12px 100px' }}>

        {/* Week nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, background:'white', borderRadius:14, padding:'12px 16px', boxShadow:'0 2px 10px rgba(0,0,0,.06)', border:'1.5px solid #E2EBF0' }}>
          <button onClick={()=>setCurrentWeek(w=>Math.max(1,w-1))} style={{ background:'none', border:'1.5px solid #E2EBF0', borderRadius:8, width:38, height:38, cursor:'pointer', fontSize:18, color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:18, color:'var(--teal-dark)' }}>Semaine {currentWeek}</div>
            <div style={{ fontSize:14, color:'var(--muted)', marginTop:2 }}>{startDate} → {endDate}</div>
          </div>
          <button onClick={()=>setCurrentWeek(w=>Math.min(52,w+1))} style={{ background:'none', border:'1.5px solid #E2EBF0', borderRadius:8, width:38, height:38, cursor:'pointer', fontSize:18, color:'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        </div>

        {/* View toggle */}
        <div style={{display:'flex',justifyContent:'center',gap:4,marginBottom:12,background:'var(--card2)',borderRadius:10,padding:3,border:'1.5px solid var(--border)',width:'fit-content',margin:'0 auto 14px'}}>
          {[['week','Semaine'],['month','Mois']].map(([m,label])=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{padding:'7px 20px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'var(--font-b)',fontSize:14,fontWeight:viewMode===m?700:500,background:viewMode===m?'var(--card)':'transparent',color:viewMode===m?'var(--text)':'var(--muted)',boxShadow:viewMode===m?'var(--shadow)':'none',transition:'all .15s'}}>{label}</button>
          ))}
        </div>

        {/* Store tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:14, overflowX:'auto', paddingBottom:4 }}>
          {stores.map(s=>(
            <button key={s.id} onClick={()=>setActiveStore(s.id)} style={{
              padding:'8px 16px', borderRadius:20, flexShrink:0, cursor:'pointer',
              border:`2px solid ${activeStore===s.id?s.color:s.color+'40'}`,
              background:activeStore===s.id?s.color:'white',
              color:activeStore===s.id?'white':s.color,
              fontFamily:'var(--font-b)', fontSize:15, fontWeight:activeStore===s.id?700:500,
              boxShadow:activeStore===s.id?`0 3px 10px ${s.color}45`:'none',
              transition:'all .15s', whiteSpace:'nowrap',
            }}>{s.name}</button>
          ))}
        </div>

        {/* Employee cards - WEEK */}
        {viewMode==='week'&&<div style={{ display:'grid', gap:10 }}>
          {storeEmps.map(emp => {
            const workTypes=['work','communication','meeting','school'];
            const totalH = weekDates.reduce((t,_,di)=>{
              const sh=sched[`${emp.id}_${di}`];
              if(sh && workTypes.includes(sh.type)) return t+mainHours(sh)+(workTypes.includes(sh.split?.type)?splitHours(sh):0);
              return t;
            }, 0);

            return (
              <div key={emp.id} style={{ background:'white', borderRadius:14, overflow:'hidden', border:'1.5px solid #E2EBF0', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:'1px solid #F0F5F7' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:emp.color||'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'white', fontSize:16, flexShrink:0 }}>
                    {emp.name[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      {emp.name}
                      {emp.storeId!==activeStore&&(()=>{
                        const hs=stores.find(s=>s.id===emp.storeId);
                        return <span style={{fontSize:10,fontWeight:700,color:hs?.color||'#B07D00',background:`${hs?.color||'#B07D00'}1A`,border:`1px solid ${hs?.color||'#B07D00'}55`,borderRadius:5,padding:'2px 7px'}}>✈ {hs?.name||'renfort'}</span>;
                      })()}
                    </div>
                    <div style={{ fontSize:13, color:'var(--dim)', textTransform:'capitalize' }}>{emp.role} · {emp.contractHours}h/sem</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-h)', fontWeight:800, fontSize:16, color:'var(--teal-dark)' }}>{fmtH(totalH)}</div>
                    <div style={{ fontSize:12, color:'var(--dim)' }}>cette sem.</div>
                  </div>
                </div>

                {/* Days grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, padding:'8px' }}>
                  {weekDates.map((wd, di) => {
                    const sh = sched[`${emp.id}_${di}`];
                    const st = sh ? getMeta(sh.type) : null;
                    const isSun = wd.date.getDay() === 0;
                    return (
                      <div key={di}
                        onClick={() => handleCellClick(emp, di)}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor: sh?'pointer':'default' }}
                      >
                        <div style={{ fontSize:11, fontWeight:700, color:isSun?'#C8002B':'var(--dim)', textTransform:'uppercase' }}>
                          {DAY_SHORT[di]}
                        </div>
                        <div style={{ fontSize:12, color:'var(--dim)' }}>{wd.date.getDate()}</div>
                        <div
                          style={{
                            width:'100%', minHeight:54, borderRadius:7,
                            background: sh ? st.bgColor : isSun?'#FFF5F5':'#F8FAFB',
                            border: `1.5px solid ${sh ? st.color+'40' : isSun?'#FFCDD2':'#E8EDF0'}`,
                            display:'flex', flexDirection:'column', alignItems:'center',
                            justifyContent:'center', gap:1, padding:'3px 2px',
                            transition: sh ? 'all .15s' : 'none',
                          }}
                          onMouseEnter={e=>{ if(sh){ e.currentTarget.style.transform='scale(1.06)'; e.currentTarget.style.boxShadow=`0 4px 14px ${st.color}40`; e.currentTarget.style.zIndex='2'; } }}
                          onMouseLeave={e=>{ e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.zIndex='1'; }}
                        >
                          {sh ? (
                            <>
                              {sh._away && <span style={{ fontSize:9, fontWeight:800, color:'#fff', background:st.color, borderRadius:5, padding:'1px 5px', marginBottom:1 }}>✈ {sh._awayStore}</span>}
                              <span style={{ fontSize:11, fontWeight:700, color:st.color, textAlign:'center', lineHeight:1.2 }}>{st.label.slice(0,5)}</span>
                              {sh.startTime && <span style={{ fontSize:11, color:st.color, opacity:.85 }}>{sh.startTime}</span>}
                              {(sh.hours||0) > 0 && <span style={{ fontSize:11, color:st.color, opacity:.7 }}>{fmtH(mainHours(sh))}</span>}
                            </>
                          ) : (
                            <span style={{ color:'#DDE3E8', fontSize:11 }}>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>}

        {/* Employee cards - MONTH */}
        {viewMode==='month'&&(
          <div>
            <div style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17,marginBottom:14,textTransform:'capitalize',color:'var(--teal-dark)'}}>
              {weekDates[0]?.date.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}
            </div>
            {storeEmps.map(emp=>(
              <div key={emp.id} style={{background:'white',borderRadius:14,border:'1.5px solid #E2EBF0',marginBottom:10,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,.06)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderBottom:'1px solid #F0F5F7',background:'#F8FAFB'}}>
                  <div style={{width:34,height:34,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:15}}>{emp.name[0]}</div>
                  <div><div style={{fontWeight:700,fontSize:15}}>{emp.name}</div><div style={{fontSize:11,color:'var(--dim)',textTransform:'capitalize'}}>{emp.role} · {emp.contractHours}h/sem</div></div>
                </div>
                {monthWeeks.map(({wk,wd})=>{
                  const wSched=schedules[`${activeStore}_${currentYear}_W${wk}`]||{};
                  return(
                    <div key={wk} style={{display:'grid',gridTemplateColumns:'44px repeat(7,1fr)',borderBottom:'1px solid #F8FAFB'}}>
                      <div style={{padding:'4px 6px',background:'#F4F7F9',display:'flex',alignItems:'center',justifyContent:'center',borderRight:'1px solid #F0F5F7'}}>
                        <span style={{fontSize:10,fontWeight:700,color:'var(--muted)'}}>S{wk}</span>
                      </div>
                      {wd.map((day,di)=>{
                        const sh=wSched[`${emp.id}_${di}`];
                        const st=sh?getMeta(sh.type):null;
                        const isSun=day.date.getDay()===0;
                        return(
                          <div key={di} onClick={()=>sh&&st&&setPopup({emp,sh,st,st2:sh.split?getMeta(sh.split.type):null,day})}
                            style={{padding:'2px',background:isSun?'#FFF8F8':'',cursor:sh?'pointer':'default'}}>
                            <div style={{fontSize:8,color:isSun?'#C8002B':'var(--dim)',textAlign:'center',marginBottom:1}}>{['L','M','M','J','V','S','D'][di]} {day.date.getDate()}</div>
                            <div style={{borderRadius:5,padding:'3px 2px',minHeight:32,background:sh?st.bgColor:'#F8FAFB',border:`1px solid ${sh?st.color+'35':'#EAEEF0'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0}}>
                              {sh?<><span style={{fontSize:8,fontWeight:700,color:st.color,textAlign:'center'}}>{st.label.slice(0,4)}</span>{sh.startTime&&<span style={{fontSize:7,color:st.color,opacity:.8}}>{sh.startTime}</span>}</>:<span style={{color:'#DDE3E8',fontSize:9}}>—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:16, justifyContent:'center' }}>
          {shiftTypes.map(st=>(
            <span key={st.id} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', background:st.bgColor, borderRadius:20, border:`1px solid ${st.color}35`, fontSize:13, color:st.color, fontWeight:700 }}>
              <span style={{ width:6,height:6,borderRadius:'50%',background:st.color,display:'inline-block' }}/>
              {st.label}
            </span>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:10, fontSize:14, color:'var(--dim)' }}>
          👆 Cliquez sur une tuile pour voir les horaires en détail
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1.5px solid #E2EBF0', padding:'12px 16px', boxShadow:'0 -4px 20px rgba(0,0,0,.08)', zIndex:40 }}>
        <button onClick={onLogin} style={{ width:'100%', maxWidth:700, display:'block', margin:'0 auto', background:'var(--teal)', color:'white', border:'none', borderRadius:12, padding:'14px', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-b)', boxShadow:'0 3px 14px rgba(0,201,177,.4)' }}>
          🔐 Se connecter pour gérer
        </button>
      </div>

      {/* POPUP */}
      {popup && <ShiftPopup data={popup} onClose={()=>setPopup(null)}/>}
    </div>
  );
}
