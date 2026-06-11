import React, { useState, useMemo } from 'react';
import { useApp, MANAGER_ROLES } from '../context/AppContext';

function fmtH(d){ if(d==null||isNaN(d))return '0h'; const t=Math.round(d*60),h=Math.floor(t/60),m=t%60; return m===0?`${h}h`:`${h}h${String(m).padStart(2,'0')}`; }
function calcH(s,e,b){ try{const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);const d=(eh*60+em)-(sh*60+sm);if(d<=0)return 0;return Math.max(0,parseFloat(((d-Math.round((b||0)*60))/60).toFixed(2)));}catch{return 0;} }
function mainHours(sh){ if(!sh||!sh.startTime||!sh.endTime)return 0; return calcH(sh.startTime,sh.endTime,sh.breakH||0); }
function splitHours(sh){ if(!sh||!sh.split||!sh.split.startTime||!sh.split.endTime)return 0; return calcH(sh.split.startTime,sh.split.endTime,sh.split.breakH||0); }
function shiftH(sh){ return mainHours(sh)+splitHours(sh); }

const WORK=['work','communication','meeting','school'];
const DAY_SHORT=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

export default function ViewPlanning() {
  const { stores, employees, shiftTypes, getSchedule, schedules, currentWeek, setCurrentWeek, currentYear, currentEmpId, authRole, getWeekDatesForCurrentWeek } = useApp();
  const [selectedStore, setSelectedStore] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [popup, setPopup] = useState(null);

  const weekDates = getWeekDatesForCurrentWeek(currentWeek);
  const myEmp = employees.find(e => e.id === currentEmpId);
  const effectiveStore = selectedStore || myEmp?.storeId || stores[0]?.id || '';
  const store = stores.find(s => s.id === effectiveStore);

  const getShiftMeta = (id) => shiftTypes.find(s=>s.id===id)||{label:id,color:'#6366F1',bgColor:'#EEF2FF'};

  // Build merged schedule: home + déplacement shifts for all employees of this store
  const { storeEmps, mergedSchedule } = useMemo(() => {
    const ownSched = getSchedule(effectiveStore, currentWeek, currentYear);
    const merged = { ...ownSched };
    const homeEmps = employees.filter(e => e.storeId === effectiveStore);

    // For home employees: find their shifts in OTHER stores (déplacement)
    homeEmps.forEach(emp => {
      stores.forEach(st => {
        if (st.id === effectiveStore) return;
        const other = getSchedule(st.id, currentWeek, currentYear);
        for (let di=0;di<7;di++) {
          const key = `${emp.id}_${di}`;
          const sh = other[key];
          if (sh && WORK.includes(sh.type) && !merged[key]?.startTime) {
            merged[key] = {...sh, _away:true, _awayStoreId:st.id, _awayStoreName:st.name, _awayColor:st.color};
          }
        }
      });
    });

    // Visitors: employees from other stores with a shift here
    const visitors = employees.filter(e => {
      if (e.storeId === effectiveStore) return false;
      for (let di=0;di<7;di++) { const sh=ownSched[`${e.id}_${di}`]; if(sh&&WORK.includes(sh.type)) return true; }
      return false;
    });

    return { storeEmps:[...homeEmps,...visitors], mergedSchedule: merged };
  }, [employees, stores, effectiveStore, currentWeek, currentYear, schedules]);

  // Weekly totals per emp
  const weeklyH = (empId) => {
    let t=0;
    for (let di=0;di<7;di++) { const sh=mergedSchedule[`${empId}_${di}`]; if(sh&&WORK.includes(sh.type)){t+=shiftH(sh);} }
    return parseFloat(t.toFixed(2));
  };

  // Month view: weeks of current month
  const monthWeeks = useMemo(() => {
    // Current month from first day of currentWeek
    const firstDay = weekDates[0].date;
    const month = firstDay.getMonth();
    const year = firstDay.getFullYear();
    // Get ISO weeks that overlap this month: roughly 4-5 weeks
    const weeks = [];
    // Compute from week-1 of the month to week+5
    for (let wk = currentWeek - 1; wk <= currentWeek + 4; wk++) {
      if (wk < 1 || wk > 53) continue;
      const wd = getWeekDatesForCurrentWeek(wk);
      // include if any day falls in the same month/year
      if (wd.some(d => d.date.getMonth() === month && d.date.getFullYear() === year)) {
        weeks.push({ wk, wd });
      }
    }
    return { weeks, month, year, monthName: firstDay.toLocaleDateString('fr-FR',{month:'long',year:'numeric'}) };
  }, [currentWeek, weekDates]);

  // Shift detail popup
  const ShiftPopup = () => {
    if(!popup) return null;
    const { sh, empName, day } = popup;
    const st = getShiftMeta(sh.type);
    const st2 = sh.split ? getShiftMeta(sh.split.type) : null;
    const isMob = window.innerWidth <= 860;
    return (
      <div onClick={()=>setPopup(null)} style={{position:'fixed',inset:0,background:'rgba(27,42,59,.55)',backdropFilter:'blur(8px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:isMob?'10px':'20px',overflowY:'auto'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:isMob?18:20,width:'100%',maxWidth:460,margin:'auto',padding:isMob?'20px 18px 28px':'28px 32px',maxHeight:isMob?'88dvh':'calc(100vh - 40px)',overflowY:'auto',WebkitOverflowScrolling:'touch',boxShadow:'0 24px 80px rgba(0,0,0,.25)'}}>
          {isMob&&<div style={{width:38,height:4,background:'#E2EBF0',borderRadius:2,margin:'12px auto 18px'}}/>}
          <div style={{background:`linear-gradient(135deg,${st.bgColor},${st.bgColor}bb)`,border:`1.5px solid ${st.color}30`,borderRadius:14,padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div><div style={{fontSize:13,fontWeight:700,color:st.color}}>{day.day}</div><div style={{fontSize:18,fontWeight:800,color:'var(--text)'}}>{day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div></div>
            <button onClick={()=>setPopup(null)} style={{background:'rgba(0,0,0,.07)',border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14,color:'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          </div>
          <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>{empName}</div>
          {/* Main shift */}
          <div style={{background:st.bgColor,border:`2px solid ${st.color}40`,borderRadius:14,padding:'14px 16px',marginBottom:st2?10:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontWeight:800,fontSize:18,color:st.color}}>{sh._away?`✈ Déplacement — ${sh._awayStoreName}`:st.label}</span>{mainHours(sh)>0&&<div style={{background:st.color,color:'#fff',borderRadius:20,padding:'4px 12px',fontWeight:800,fontSize:16}}>{fmtH(mainHours(sh))}</div>}</div>
            {sh.startTime&&<div style={{display:'flex',gap:4,background:'rgba(255,255,255,.65)',borderRadius:9,padding:'9px 12px'}}><div style={{flex:1,textAlign:'center'}}><div style={{fontSize:10,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase'}}>Début</div><div style={{fontSize:24,fontWeight:800,color:st.color,fontVariantNumeric:'tabular-nums'}}>{sh.startTime}</div></div><div style={{display:'flex',alignItems:'center',color:st.color,opacity:.4,fontSize:20}}>→</div><div style={{flex:1,textAlign:'center'}}><div style={{fontSize:10,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase'}}>Fin</div><div style={{fontSize:24,fontWeight:800,color:st.color,fontVariantNumeric:'tabular-nums'}}>{sh.endTime}</div></div>{(sh.breakH||0)>0&&<div style={{flex:1,textAlign:'center',borderLeft:`1px solid ${st.color}20`,paddingLeft:8}}><div style={{fontSize:10,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase'}}>Pause</div><div style={{fontSize:20,fontWeight:800,color:st.color}}>{fmtH(sh.breakH)}</div></div>}</div>}
            {sh.note&&<div style={{marginTop:8,fontSize:13,color:st.color,opacity:.75,fontStyle:'italic'}}>💬 {sh.note}</div>}
          </div>
          {st2&&sh.split&&sh.split.startTime&&(
            <div style={{background:st2.bgColor,border:`2px solid ${st2.color}40`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontWeight:800,fontSize:18,color:st2.color}}>{st2.label}</span>{splitHours(sh)>0&&<div style={{background:st2.color,color:'#fff',borderRadius:20,padding:'4px 12px',fontWeight:800,fontSize:16}}>{fmtH(splitHours(sh))}</div>}</div>
              <div style={{display:'flex',gap:4,background:'rgba(255,255,255,.65)',borderRadius:9,padding:'9px 12px'}}><div style={{flex:1,textAlign:'center'}}><div style={{fontSize:10,fontWeight:700,color:st2.color,opacity:.7,textTransform:'uppercase'}}>Début</div><div style={{fontSize:24,fontWeight:800,color:st2.color,fontVariantNumeric:'tabular-nums'}}>{sh.split.startTime}</div></div><div style={{display:'flex',alignItems:'center',color:st2.color,opacity:.4,fontSize:20}}>→</div><div style={{flex:1,textAlign:'center'}}><div style={{fontSize:10,fontWeight:700,color:st2.color,opacity:.7,textTransform:'uppercase'}}>Fin</div><div style={{fontSize:24,fontWeight:800,color:st2.color,fontVariantNumeric:'tabular-nums'}}>{sh.split.endTime}</div></div></div>
            </div>
          )}
          <button onClick={()=>setPopup(null)} style={{marginTop:16,width:'100%',background:'var(--teal)',color:'#fff',border:'none',borderRadius:12,padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-b)'}}>Fermer</button>
        </div>
        <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      </div>
    );
  };

  // Single shift cell
  const ShiftCell = ({sh, emp, day, compact}) => {
    if (!sh) return <div style={{minHeight:compact?36:50,borderRadius:9,border:'1.5px dashed #E2EBF0',background:'#FAFCFC',display:'flex',alignItems:'center',justifyContent:'center',color:'#DDE3E8',fontSize:16}}>—</div>;
    const st = getShiftMeta(sh.type);
    const st2 = sh.split ? getShiftMeta(sh.split.type) : null;
    const isAway = sh._away;
    return (
      <div onClick={()=>setPopup({sh,empName:emp.name,day})} style={{
        background:isAway?`${sh._awayColor||st.color}12`:st.bgColor,
        border:`${isAway?'2px dashed':'1.5px solid'} ${isAway?sh._awayColor||st.color:st.color+'45'}`,
        borderRadius:9,padding:compact?'5px 6px':'8px 7px',
        minHeight:compact?36:50,cursor:'pointer',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:1,
        transition:'all .15s',position:'relative',
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow=`0 4px 14px ${st.color}40`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='none';}}
      >
        {isAway&&<span style={{position:'absolute',top:2,left:4,fontSize:7,fontWeight:800,color:sh._awayColor||st.color,background:'rgba(255,255,255,.85)',borderRadius:3,padding:'1px 3px'}}>✈ {sh._awayStoreName?.slice(0,8)}</span>}
        <span style={{fontSize:compact?10:12,fontWeight:700,color:st.color,marginTop:isAway?8:0}}>{isAway?'Déplacement':st.label}</span>
        {sh.startTime&&!compact&&<span style={{fontSize:11,color:st.color,opacity:.9,fontWeight:600}}>{sh.startTime}–{sh.endTime}</span>}
        {shiftH(sh)>0&&<span style={{fontSize:compact?9:11,color:st.color,opacity:.75,fontWeight:700}}>{fmtH(shiftH(sh))}</span>}
        {st2&&sh.split&&sh.split.startTime&&!compact&&(
          <><div style={{width:'70%',height:1,background:st.color,opacity:.25,margin:'2px 0'}}/>
          <span style={{fontSize:10,fontWeight:700,color:st2.color}}>{st2.label}</span>
          <span style={{fontSize:9,color:st2.color,opacity:.85}}>{sh.split.startTime}–{sh.split.endTime}</span>
          {splitHours(sh)>0&&<span style={{fontSize:9,color:st2.color,opacity:.7}}>{fmtH(splitHours(sh))}</span>}</>
        )}
      </div>
    );
  };

  // WEEK VIEW - like manager
  const WeekView = () => (
    <div style={{overflowX:'auto',borderRadius:14,border:'1.5px solid var(--border)',background:'#fff',boxShadow:'var(--shadow)'}}>
      <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed',minWidth:700}}>
        <thead>
          <tr style={{background:'#F4F7F9'}}>
            <th style={{padding:'14px 18px',textAlign:'left',fontSize:13,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.05em',width:190,borderBottom:'2px solid var(--border)'}}>Employé</th>
            {weekDates.map((wd,di)=>(
              <th key={di} style={{padding:'14px 6px',textAlign:'center',borderBottom:'2px solid var(--border)'}}>
                <div style={{fontWeight:800,fontSize:15,color:wd.date.getDay()===0?'#C8002B':'var(--text)'}}>{DAY_SHORT[di]}</div>
                <div style={{fontSize:12,color:'var(--dim)',marginTop:2}}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
              </th>
            ))}
            <th style={{padding:'14px 10px',textAlign:'center',borderBottom:'2px solid var(--border)',width:100,fontSize:13,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.05em'}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {storeEmps.map((emp,ei)=>{
            const t=weeklyH(emp.id);
            const diff=t-(emp.contractHours||35);
            const isVisitor=emp.storeId!==effectiveStore;
            const homeStore=isVisitor?stores.find(s=>s.id===emp.storeId):null;
            return (
              <tr key={emp.id} style={{borderBottom:'1px solid #F0F5F7',background:isVisitor?'#FFFDF0':ei%2===0?'#fff':'var(--card2)'}}>
                <td style={{padding:'12px 18px',verticalAlign:'middle'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:40,height:40,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17,flexShrink:0}}>{emp.name[0]}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,display:'flex',alignItems:'center',gap:6}}>
                        {emp.name}
                        {isVisitor&&homeStore&&<span style={{fontSize:10,fontWeight:700,color:homeStore.color,background:`${homeStore.color}1A`,border:`1px solid ${homeStore.color}55`,borderRadius:6,padding:'2px 7px'}}>✈ {homeStore.name}</span>}
                      </div>
                      <div style={{fontSize:12,color:'var(--muted)',marginTop:1,textTransform:'capitalize'}}>{emp.role} · {emp.contractHours}h</div>
                    </div>
                  </div>
                </td>
                {weekDates.map((wd,di)=>(
                  <td key={di} style={{padding:'5px 4px',verticalAlign:'middle',background:wd.date.getDay()===0?'#FFF8F8':''}}>
                    <ShiftCell sh={mergedSchedule[`${emp.id}_${di}`]} emp={emp} day={wd}/>
                  </td>
                ))}
                <td style={{padding:'8px 10px',textAlign:'center',verticalAlign:'middle'}}>
                  <div style={{fontFamily:'var(--font-b)',fontWeight:800,fontSize:19,color:diff>0.1?'#C8002B':diff<-0.1?'var(--dim)':'var(--teal-dark)',fontVariantNumeric:'tabular-nums'}}>{fmtH(t)}</div>
                  <div style={{fontSize:12,fontWeight:700,color:Math.abs(diff)<0.1?'var(--teal-dark)':diff>0?'#C8002B':'#1A8A42',marginTop:2}}>{diff>0?'+':diff<0?'-':''}{fmtH(Math.abs(diff))}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // MONTH VIEW
  const MonthView = () => {
    const { weeks, monthName } = monthWeeks;
    return (
      <div>
        <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:20,marginBottom:16,textTransform:'capitalize'}}>{monthName}</h3>
        {storeEmps.map(emp=>(
          <div key={emp.id} style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--border)',marginBottom:12,overflow:'hidden',boxShadow:'var(--shadow)'}}>
            {/* Emp header */}
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 18px',borderBottom:'1px solid var(--border)',background:'var(--card2)'}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16,flexShrink:0}}>{emp.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{emp.name}</div>
                <div style={{fontSize:12,color:'var(--muted)',textTransform:'capitalize'}}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
            </div>
            {/* Weeks grid */}
            {weeks.map(({wk,wd})=>{
              const wSched = getSchedule(effectiveStore, wk, currentYear);
              // also check other stores for déplacement
              const wMerged = {...wSched};
              stores.forEach(st=>{
                if(st.id===effectiveStore) return;
                const o=getSchedule(st.id,wk,currentYear);
                for(let di=0;di<7;di++){
                  const key=`${emp.id}_${di}`;
                  const sh=o[key];
                  if(sh&&WORK.includes(sh.type)&&!wMerged[key]?.startTime){
                    wMerged[key]={...sh,_away:true,_awayStoreId:st.id,_awayStoreName:st.name,_awayColor:st.color};
                  }
                }
              });
              const wTotal=wd.reduce((t,_,di)=>{const sh=wMerged[`${emp.id}_${di}`];if(sh&&WORK.includes(sh.type))return t+shiftH(sh);return t;},0);
              return (
                <div key={wk} style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr) 70px',borderBottom:'1px solid #F0F5F7'}}>
                  <div style={{padding:'8px 10px',background:'#F8FAFB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRight:'1px solid var(--border)'}}>
                    <div style={{fontWeight:800,fontSize:13,color:'var(--muted)'}}>S{wk}</div>
                  </div>
                  {wd.map((day,di)=>(
                    <div key={di} style={{padding:'4px 3px',background:day.date.getDay()===0?'#FFF8F8':''}}>
                      <div style={{fontSize:10,fontWeight:700,color:day.date.getDay()===0?'#C8002B':'var(--dim)',textAlign:'center',marginBottom:2}}>{DAY_SHORT[di]} {day.date.getDate()}</div>
                      <ShiftCell sh={wMerged[`${emp.id}_${di}`]} emp={emp} day={day} compact/>
                    </div>
                  ))}
                  <div style={{padding:'8px 6px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#F8FAFB',borderLeft:'1px solid var(--border)'}}>
                    <div style={{fontWeight:800,fontSize:14,color:'var(--teal-dark)',fontVariantNumeric:'tabular-nums'}}>{fmtH(wTotal)}</div>
                    <div style={{fontSize:10,color:'var(--dim)',marginTop:1}}>sem.</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="anim-up">
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="page-title">📅 Planning</h1>
          <p className="page-sub">Consultation · Semaine <strong style={{color:'var(--teal-dark)'}}>S{currentWeek}</strong> · {currentYear}</p>
        </div>
        {/* Week nav + view toggle */}
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setCurrentWeek(w=>Math.max(1,w-1))}>‹ Préc.</button>
          <div style={{padding:'8px 18px',background:'var(--teal)',color:'#fff',borderRadius:10,fontFamily:'var(--font-h)',fontWeight:800,fontSize:18,minWidth:64,textAlign:'center'}}>S{currentWeek}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setCurrentWeek(w=>Math.min(52,w+1))}>Suiv. ›</button>
          <div style={{display:'flex',gap:4,marginLeft:8,background:'var(--card2)',borderRadius:10,padding:3,border:'1.5px solid var(--border)'}}>
            <button onClick={()=>setViewMode('week')} style={{padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'var(--font-b)',fontSize:14,fontWeight:600,background:viewMode==='week'?'#fff':'transparent',color:viewMode==='week'?'var(--text)':'var(--muted)',boxShadow:viewMode==='week'?'var(--shadow)':'none',transition:'all .15s'}}>Semaine</button>
            <button onClick={()=>setViewMode('month')} style={{padding:'7px 16px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'var(--font-b)',fontSize:14,fontWeight:600,background:viewMode==='month'?'#fff':'transparent',color:viewMode==='month'?'var(--text)':'var(--muted)',boxShadow:viewMode==='month'?'var(--shadow)':'none',transition:'all .15s'}}>Mois</button>
          </div>
        </div>
      </div>

      {/* Store tabs */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {stores.map(s=>(
          <button key={s.id} onClick={()=>setSelectedStore(s.id)} style={{
            padding:'8px 18px',borderRadius:20,cursor:'pointer',
            border:`2px solid ${effectiveStore===s.id?s.color:s.color+'40'}`,
            background:effectiveStore===s.id?s.color:'white',
            color:effectiveStore===s.id?'white':s.color,
            fontFamily:'var(--font-b)',fontSize:14,fontWeight:effectiveStore===s.id?700:500,
            boxShadow:effectiveStore===s.id?`0 4px 12px ${s.color}45`:'none',
            transition:'all .18s',
          }}>{s.name}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        {shiftTypes.map(st=>(
          <span key={st.id} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',background:st.bgColor,borderRadius:20,border:`1.5px solid ${st.color}35`,fontSize:12,color:st.color,fontWeight:700}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:st.color,display:'inline-block'}}/>
            {st.label}
          </span>
        ))}
        <span style={{fontSize:13,color:'var(--dim)',marginLeft:4}}>👆 Appuyer sur une case pour voir les détails</span>
      </div>

      {/* Content */}
      {viewMode==='week' ? <WeekView/> : <MonthView/>}

      <ShiftPopup/>
    </div>
  );
}
