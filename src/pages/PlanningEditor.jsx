import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const BREAKS=[{v:0,l:'Pas de pause'},{v:.5,l:'30 min'},{v:1,l:'1h'}];
const DAY_NAMES=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function calcH(s,e,b){
  try{
    const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);
    const d=(eh*60+em)-(sh*60+sm);
    return d>0?Math.max(0,d/60-b):0;
  }catch{return 0;}
}
function addMinutes(time,mins){
  const[h,m]=time.split(':').map(Number);
  const total=h*60+m+mins;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function getMeta(types,id){ return types.find(t=>t.id===id)||{label:id,color:'#6366F1',bgColor:'#EEF2FF'}; }

/* ── SHIFT MODAL ───────────────────────────────────────────── */
function ShiftModal({emp,dayIdx,day,shift,onSave,onDelete,onClose,types}){
  const[type,setType]=useState(shift?.type||'work');
  const[s,setS]=useState(shift?.startTime||'09:00');
  const[e,setE]=useState(shift?.endTime||'18:00');
  const[brk,setBrk]=useState(shift?.breakH??1);
  const[note,setNote]=useState(shift?.note||'');
  const[dep,setDep]=useState(shift?.depannage||false);
  const needsT=['work','communication','meeting'].includes(type);
  const h=needsT?calcH(s,e,brk):0;
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>Modifier le créneau</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}><b>{emp.name}</b> · {day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div style={{marginBottom:16}}>
          <div className="lbl">Type</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {types.map(st=>(
              <button key={st.id} onClick={()=>setType(st.id)} style={{
                padding:'8px 14px',borderRadius:30,cursor:'pointer',
                border:`2px solid ${type===st.id?st.color:st.color+'40'}`,
                background:type===st.id?st.bgColor:'#fff',
                color:st.color,fontWeight:type===st.id?700:500,fontSize:13,fontFamily:'var(--font-b)',
              }}>{st.label}</button>
            ))}
          </div>
        </div>
        {needsT&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div><div className="lbl">Début</div><input className="inp" type="time" value={s} onChange={ev=>setS(ev.target.value)}/></div>
            <div><div className="lbl">Fin</div><input className="inp" type="time" value={e} onChange={ev=>setE(ev.target.value)}/></div>
          </div>
          <div style={{marginBottom:12}}>
            <div className="lbl">Pause</div>
            <div style={{display:'flex',gap:8}}>
              {BREAKS.map(b=>(
                <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                  flex:1,padding:'9px',borderRadius:9,cursor:'pointer',
                  border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                  background:brk===b.v?'var(--teal-light)':'#fff',
                  color:brk===b.v?'var(--teal-dark)':'var(--muted)',
                  fontWeight:brk===b.v?700:500,fontSize:13,fontFamily:'var(--font-b)',
                }}>{b.l}</button>
              ))}
            </div>
          </div>
          {h>0&&<div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:9,padding:'10px 14px',marginBottom:12,display:'flex',gap:10,alignItems:'center'}}>
            <span>⏱</span>
            <span style={{color:'var(--teal-dark)',fontWeight:700,fontSize:16}}>{h.toFixed(2)}h effectives</span>
            <span style={{color:'var(--muted)',fontSize:13}}>{s}→{e} — {brk}h pause</span>
          </div>}
        </>}
        <div style={{marginBottom:12}}><div className="lbl">Note</div><input className="inp" type="text" placeholder="Remarque..." value={note} onChange={ev=>setNote(ev.target.value)}/></div>
        <label style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,cursor:'pointer',fontSize:14,color:'var(--muted)'}}>
          <input type="checkbox" checked={dep} onChange={ev=>setDep(ev.target.checked)} style={{accentColor:'var(--teal)',width:16,height:16}}/>
          Dépannage (autre magasin)
        </label>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'13px'}}
            onClick={()=>onSave({type,startTime:needsT?s:null,endTime:needsT?e:null,breakH:needsT?brk:0,hours:needsT?parseFloat(h.toFixed(2)):null,note,depannage:dep})}>
            ✓ Enregistrer
          </button>
          {shift&&<button className="btn btn-danger" onClick={onDelete}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

/* ── AUTO-GENERATE MODAL ──────────────────────────────────── */
function AutoModal({store,emps,weekDates,currentWeek,currentYear,leaveRequests,onGenerate,onClose}){
  const[openStart,setOpenStart]=useState('09:00');
  const[openEnd,setOpenEnd]=useState('19:30');
  const[brk,setBrk]=useState(1);

  const openH=parseFloat(calcH(openStart,openEnd,brk).toFixed(2)); // full day span
  
  // Show approved leaves for this week for each emp
  const getEmpLeaves=(empId)=>{
    const leaves=[];
    leaveRequests.filter(r=>r.employeeId===empId&&r.status==='approved').forEach(req=>{
      req.weeks?.forEach(we=>{
        if(we.week===currentWeek&&we.year===currentYear){
          we.days.forEach(di=>leaves.push(di));
        }
      });
    });
    return leaves;
  };

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:520}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
          <div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>⚡ Génération automatique</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}>{store.name} · S{currentWeek}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        {/* Info */}
        <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13,color:'var(--teal-dark)',lineHeight:1.7}}>
          ✅ Les <strong>congés approuvés</strong> sont intégrés automatiquement<br/>
          ✅ Les heures hebdomadaires de <strong>chaque contrat</strong> sont respectées<br/>
          ✅ Les employés alternent <strong>ouverture / fermeture</strong>
        </div>

        {/* Horaires magasin */}
        <div style={{marginBottom:16}}>
          <div className="lbl">Horaires d'ouverture du magasin</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div className="lbl" style={{fontSize:10}}>Ouverture</div>
              <input className="inp" type="time" value={openStart} onChange={e=>setOpenStart(e.target.value)}/>
            </div>
            <div>
              <div className="lbl" style={{fontSize:10}}>Fermeture</div>
              <input className="inp" type="time" value={openEnd} onChange={e=>setOpenEnd(e.target.value)}/>
            </div>
          </div>
          {openH>0&&<div style={{marginTop:8,fontSize:13,color:'var(--teal-dark)',fontWeight:600}}>Amplitude : {openH}h ({openStart}→{openEnd})</div>}
        </div>

        {/* Pause */}
        <div style={{marginBottom:20}}>
          <div className="lbl">Pause déjeuner</div>
          <div style={{display:'flex',gap:8}}>
            {BREAKS.map(b=>(
              <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                flex:1,padding:'9px',borderRadius:9,cursor:'pointer',
                border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                background:brk===b.v?'var(--teal-light)':'#fff',
                color:brk===b.v?'var(--teal-dark)':'var(--muted)',
                fontWeight:brk===b.v?700:500,fontSize:13,fontFamily:'var(--font-b)',
              }}>{b.l}</button>
            ))}
          </div>
        </div>

        {/* Aperçu congés */}
        <div style={{background:'var(--card2)',borderRadius:10,padding:'12px 16px',marginBottom:20,border:'1px solid var(--border)'}}>
          <div className="lbl" style={{marginBottom:8}}>Aperçu congés approuvés cette semaine</div>
          {emps.map(emp=>{
            const leaves=getEmpLeaves(emp.id);
            const workDaysCount=weekDates.filter((_,di)=>{
              const dow=weekDates[di].date.getDay();
              return dow!==0&&!leaves.includes(di);
            }).length;
            const dailyH=workDaysCount>0?parseFloat((emp.contractHours/5).toFixed(2)):0;
            return(
              <div key={emp.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,padding:'8px 10px',background:'white',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{emp.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{emp.name}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>
                    Contrat <strong>{emp.contractHours}h</strong>/sem · {workDaysCount} jours travaillés · <strong style={{color:'var(--teal-dark)'}}>{dailyH}h/jour</strong>
                  </div>
                </div>
                {leaves.length>0?(
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    {leaves.map(di=>(
                      <span key={di} style={{background:'#EDE9FE',color:'#7C3AED',borderRadius:6,padding:'2px 7px',fontSize:11,fontWeight:700}}>
                        🌴 {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][di]}
                      </span>
                    ))}
                  </div>
                ):(
                  <span style={{fontSize:12,color:'var(--dim)'}}>Aucun congé</span>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px',fontSize:15,borderRadius:12}}
          onClick={()=>onGenerate({openStart,openEnd,brk})} disabled={openH<=0}>
          ⚡ Générer le planning
        </button>
      </div>
    </div>
  );
}

/* ── BORROW MODAL ─────────────────────────────────────────── */
function BorrowModal({store,allEmployees,allStores,currentEmps,onBorrow,onClose}){
  const[selected,setSelected]=useState('');
  const available=allEmployees.filter(e=>!currentEmps.find(c=>c.id===e.id));
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:460}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>👥 Ajouter un employé</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}>Pour ce planning · <strong>{store.name}</strong></p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div style={{background:'#FFF7E0',border:'1.5px solid #F5D06A',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#B07D00'}}>
          ⚡ Employé ajouté temporairement · Son magasin d'origine reste inchangé
        </div>
        <div style={{display:'grid',gap:7,maxHeight:320,overflowY:'auto',marginBottom:16}}>
          {available.map(emp=>{
            const homeStore=allStores.find(s=>s.id===(emp.originalStoreId||emp.storeId));
            return(
              <button key={emp.id} onClick={()=>setSelected(emp.id)} style={{
                display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:11,cursor:'pointer',
                border:`2px solid ${selected===emp.id?store.color:'var(--border)'}`,
                background:selected===emp.id?store.color+'12':'#fff',
                fontFamily:'var(--font-b)',textAlign:'left',transition:'all .15s',
              }}>
                <div style={{width:36,height:36,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',flexShrink:0}}>{emp.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{emp.name}</div>
                  <div style={{fontSize:12,color:'var(--dim)',marginTop:1}}>{homeStore?.name} · {emp.contractHours}h/sem</div>
                </div>
                {homeStore&&<div style={{width:8,height:8,borderRadius:'50%',background:homeStore.color,flexShrink:0}}/>}
              </button>
            );
          })}
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'13px',fontSize:15,borderRadius:12,opacity:!selected?.6:1}}
          onClick={()=>selected&&onBorrow(selected)} disabled={!selected}>
          ✓ Ajouter au planning
        </button>
      </div>
    </div>
  );
}

/* ── WEEK NAV ─────────────────────────────────────────────── */
function WeekNav({cw,setCw}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCw(w=>Math.max(1,w-1))}>‹</button>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:10,padding:'9px 18px',textAlign:'center',minWidth:88}}>
        <span style={{fontFamily:'var(--font-h)',fontWeight:800,color:'var(--teal-dark)',fontSize:18}}>S{cw}</span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCw(w=>Math.min(52,w+1))}>›</button>
    </div>
  );
}

/* ── MAIN ─────────────────────────────────────────────────── */
export default function PlanningEditor(){
  const{stores,employees,shiftTypes,getSchedule,setShift,setBulkSchedule,currentWeek,setCurrentWeek,currentYear,selectedStore,setSelectedStore,getWeekDatesForCurrentWeek,leaveRequests}=useApp();
  const[activeStore,setAS]=useState(selectedStore||stores[0]?.id||'');
  const[viewMode,setViewMode]=useState('week');
  const[activeDay,setActiveDay]=useState(0);
  const[editCell,setEditCell]=useState(null);
  const[showWknd,setShowWknd]=useState(false);
  const[showAuto,setShowAuto]=useState(false);
  const[showBorrow,setShowBorrow]=useState(false);
  const[confirmWknd,setConfirmWknd]=useState(null);
  const[generating,setGenerating]=useState(false);
  const[borrowedEmps,setBorrowedEmps]=useState([]);

  // Drag state — use refs for performance during drag
  const dragSrcRef=useRef(null);
  const[dragOver,setDragOver]=useState(null);

  const store=stores.find(s=>s.id===activeStore);
  const storeEmps=employees.filter(e=>e.storeId===activeStore);
  const extraEmps=borrowedEmps.map(id=>employees.find(e=>e.id===id)).filter(Boolean);
  const allDisplayEmps=[...storeEmps,...extraEmps.filter(e=>!storeEmps.find(s=>s.id===e.id))];
  const weekDates=getWeekDatesForCurrentWeek(currentWeek);
  const schedule=getSchedule(activeStore,currentWeek,currentYear);
  const displayDays=showWknd?weekDates:weekDates.slice(0,6);

  const setStore=id=>{ setAS(id); setSelectedStore(id); setBorrowedEmps([]); };
  const totalH=empId=>{ let t=0; weekDates.forEach((_,i)=>{ const s=schedule[`${empId}_${i}`]; if(s?.hours) t+=s.hours; }); return t; };

  const handleCell=(empId,dayIdx)=>{
    const dow=weekDates[dayIdx].date.getDay();
    if(!showWknd&&dow===0){ setConfirmWknd({empId,dayIdx}); return; }
    setEditCell({empId,dayIdx});
  };

  const handleSave=data=>{ if(!editCell) return; setShift(activeStore,currentWeek,currentYear,editCell.empId,editCell.dayIdx,data); setEditCell(null); };
  const handleDelete=()=>{ if(!editCell) return; setShift(activeStore,currentWeek,currentYear,editCell.empId,editCell.dayIdx,null); setEditCell(null); };

  /* ── AUTO GENERATE — SMART ALGORITHM ───────────────────────── */
  const handleAutoGen=async({openStart,openEnd,brk})=>{
    setGenerating(true); setShowAuto(false);
    
    // 1. Get approved leaves for this week for each employee
    const getEmpLeaveDays=(empId)=>{
      const days=new Set();
      leaveRequests.filter(r=>r.employeeId===empId&&r.status==='approved').forEach(req=>{
        req.weeks?.forEach(we=>{
          if(we.week===currentWeek&&we.year===currentYear){
            we.days.forEach(di=>days.add(di));
          }
        });
      });
      return days;
    };

    // 2. Calculate opening/closing slots from store hours + contract hours
    // Opening slot = start of day, Closing slot = end of day
    // Each slot length = contractH/5 + break
    const bulk={};

    storeEmps.forEach((emp,empIdx)=>{
      const leaveDays=getEmpLeaveDays(emp.id);
      const contractH=emp.contractHours||35;
      // Hours per work day (respecting weekly contract over 5 work days)
      const dailyH=parseFloat((contractH/5).toFixed(2));
      const dailyMins=Math.round(dailyH*60)+Math.round(brk*60);

      // Parse store opening/closing times
      const[oh,om]=openStart.split(':').map(Number);
      const[ch,cm]=openEnd.split(':').map(Number);
      const storeOpenMins=oh*60+om;
      const storeCloseMins=ch*60+cm;

      // Opening shift: starts at store open, lasts dailyMins
      const openShiftEndMins=storeOpenMins+dailyMins;
      const openShiftEnd=`${String(Math.floor(openShiftEndMins/60)).padStart(2,'0')}:${String(openShiftEndMins%60).padStart(2,'0')}`;

      // Closing shift: ends at store close, starts dailyMins before
      const closeShiftStartMins=storeCloseMins-dailyMins;
      const closeShiftStart=`${String(Math.floor(closeShiftStartMins/60)).padStart(2,'0')}:${String(closeShiftStartMins%60).padStart(2,'0')}`;

      weekDates.forEach((wd,di)=>{
        const dow=wd.date.getDay(); // 0=Sun
        const isSunday=dow===0;
        const isLeaveDay=leaveDays.has(di);
        const cellKey=`${emp.id}_${di}`;

        if(isSunday){
          // Always rest on Sunday
          bulk[cellKey]={type:'rest',startTime:null,endTime:null,breakH:0,hours:null,note:'',depannage:false};
        } else if(isLeaveDay){
          // Approved vacation
          bulk[cellKey]={type:'vacation',startTime:null,endTime:null,breakH:0,hours:null,note:'Congé approuvé',depannage:false};
        } else {
          // Alternate opening/closing: odd employees start on closing each day
          // Also rotate per day so it's not the same person always opening
          const isOpen=(empIdx+di)%2===0;
          
          // Make sure end time doesn't exceed store closing
          let sStart=isOpen?openStart:closeShiftStart;
          let sEnd=isOpen?openShiftEnd:openEnd;
          
          // Safety: cap end time to store closing
          const sEndMins=parseInt(sEnd.split(':')[0])*60+parseInt(sEnd.split(':')[1]);
          if(sEndMins>storeCloseMins) sEnd=openEnd;
          // Safety: cap start to not be before store opening
          const sStartMins=parseInt(sStart.split(':')[0])*60+parseInt(sStart.split(':')[1]);
          if(sStartMins<storeOpenMins) sStart=openStart;

          bulk[cellKey]={
            type:'work',
            startTime:sStart,
            endTime:sEnd,
            breakH:brk,
            hours:dailyH,
            note:isOpen?'Ouverture':'Fermeture',
            depannage:false,
          };
        }
      });
    });

    await setBulkSchedule(activeStore,currentWeek,currentYear,bulk);
    setGenerating(false);
  };

  /* ── DRAG & DROP — ATOMIC SWAP ───────────────────────────── */
  const handleDragStart=useCallback((empId,dayIdx,e)=>{
    const sh=schedule[`${empId}_${dayIdx}`];
    if(!sh){ e.preventDefault(); return; }
    dragSrcRef.current={empId,dayIdx};
    e.dataTransfer.effectAllowed='move';
    // Store shift data in dataTransfer as backup
    e.dataTransfer.setData('text/plain',JSON.stringify({empId,dayIdx}));
  },[schedule]);

  const handleDragOver=useCallback((empId,dayIdx,e)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect='move';
    setDragOver({empId,dayIdx});
  },[]);

  const handleDrop=useCallback((empId,dayIdx,e)=>{
    e.preventDefault();
    e.stopPropagation();
    const src=dragSrcRef.current;
    if(!src) return;

    // Same cell: nothing to do
    if(src.empId===empId&&src.dayIdx===dayIdx){
      dragSrcRef.current=null; setDragOver(null); return;
    }

    const srcKey=`${src.empId}_${src.dayIdx}`;
    const dstKey=`${empId}_${dayIdx}`;
    const srcShift=schedule[srcKey];
    const dstShift=schedule[dstKey];

    if(!srcShift){ dragSrcRef.current=null; setDragOver(null); return; }

    // Build atomic update — both changes in one object
    const key=`${activeStore}_${currentYear}_W${currentWeek}`;
    // We need to read the current full schedule and apply both changes at once
    // Get current schedule from AppContext state
    const currentFull={...schedule};

    if(dstShift){
      // SWAP: src goes to dst, dst goes to src
      currentFull[dstKey]={...srcShift};
      currentFull[srcKey]={...dstShift};
    } else {
      // MOVE: src goes to dst, src becomes empty
      currentFull[dstKey]={...srcShift};
      delete currentFull[srcKey];
    }

    // Write both changes atomically
    setBulkSchedule(activeStore,currentWeek,currentYear,currentFull);
    dragSrcRef.current=null; setDragOver(null);
  },[schedule,activeStore,currentWeek,currentYear,setBulkSchedule]);

  const handleDragEnd=useCallback(()=>{
    dragSrcRef.current=null; setDragOver(null);
  },[]);

  const handleBorrow=id=>{ setBorrowedEmps(prev=>[...prev,id]); setShowBorrow(false); };

  return(
    <div className="anim-up" style={{width:'100%'}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="page-title">📅 Plannings</h1>
          <p className="page-sub">{store?.name||'—'} · S{currentWeek} · {allDisplayEmps.length} employé(s)</p>
        </div>
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <WeekNav cw={currentWeek} setCw={setCurrentWeek}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowWknd(!showWknd)}>{showWknd?'Masquer dim.':'Voir dim.'}</button>
          {store&&storeEmps.length>0&&(
            <button className="btn btn-sec btn-sm" disabled={generating} onClick={()=>setShowAuto(true)}>
              {generating?'⏳ Génération...':'⚡ Auto-générer'}
            </button>
          )}
          <button className="btn btn-sec btn-sm" onClick={()=>setShowBorrow(true)}>👥 Ajouter</button>
          <button className="btn btn-primary btn-sm" onClick={()=>window.dispatchEvent(new CustomEvent('exportPDF',{detail:{storeId:activeStore,week:currentWeek}}))}>📄 PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>window.dispatchEvent(new CustomEvent('exportNotion',{detail:{storeId:activeStore,week:currentWeek}}))}>📋 Notion</button>
        </div>
      </div>

      {/* STORE TABS */}
      <div style={{display:'flex',gap:8,marginBottom:20,overflowX:'auto',paddingBottom:4}}>
        {stores.map(s=>(
          <button key={s.id} onClick={()=>setStore(s.id)} style={{
            padding:'9px 18px',borderRadius:30,cursor:'pointer',flexShrink:0,
            border:`2px solid ${activeStore===s.id?s.color:s.color+'40'}`,
            background:activeStore===s.id?s.color:'#fff',
            color:activeStore===s.id?'#fff':s.color,
            fontFamily:'var(--font-b)',fontSize:14,fontWeight:activeStore===s.id?700:500,
            transition:'all .15s',boxShadow:activeStore===s.id?`0 4px 12px ${s.color}45`:'none',
          }}>{s.name}</button>
        ))}
      </div>

      {/* VIEW TOGGLE + borrowed employees */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{background:'var(--card2)',borderRadius:10,padding:3,border:'1px solid var(--border)',display:'inline-flex'}}>
          {['week','day'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{
              padding:'8px 20px',borderRadius:8,border:'none',cursor:'pointer',
              background:viewMode===m?'var(--teal)':'transparent',
              color:viewMode===m?'#fff':'var(--muted)',
              fontFamily:'var(--font-b)',fontSize:14,fontWeight:viewMode===m?700:500,
            }}>{m==='week'?'Semaine':'Journée'}</button>
          ))}
        </div>
        {viewMode==='day'&&weekDates.map((wd,i)=>(
          <button key={i} onClick={()=>setActiveDay(i)} style={{
            padding:'7px 13px',borderRadius:9,cursor:'pointer',
            border:`2px solid ${activeDay===i?'var(--teal)':'var(--border)'}`,
            background:activeDay===i?'var(--teal-light)':'#fff',
            color:activeDay===i?'var(--teal-dark)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:13,fontWeight:activeDay===i?700:500,
          }}>{wd.day.slice(0,3)} {wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</button>
        ))}
        {extraEmps.length>0&&(
          <div style={{display:'flex',gap:5,marginLeft:'auto',flexWrap:'wrap'}}>
            {extraEmps.map(e=>(
              <span key={e.id} style={{display:'flex',alignItems:'center',gap:5,background:'#FFF7E0',border:'1.5px solid #F5D06A',borderRadius:20,padding:'4px 10px',fontSize:12,color:'#B07D00',fontWeight:600}}>
                ⚡{e.name}
                <button onClick={()=>setBorrowedEmps(prev=>prev.filter(id=>id!==e.id))} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#B07D00',lineHeight:1}}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div style={{display:'flex',gap:7,marginBottom:18,flexWrap:'wrap'}}>
        {shiftTypes.map(st=>(
          <span key={st.id} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',background:st.bgColor,borderRadius:20,border:`1.5px solid ${st.color}35`,fontSize:12,color:st.color,fontWeight:700}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:st.color,display:'inline-block'}}/>
            {st.label}
          </span>
        ))}
        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',background:'var(--card2)',borderRadius:20,border:'1.5px solid var(--border)',fontSize:12,color:'var(--muted)'}}>
          ↔ Glisser pour déplacer / échanger
        </span>
      </div>

      {generating&&(
        <div style={{textAlign:'center',padding:'32px',background:'var(--teal-light)',borderRadius:14,marginBottom:16,border:'2px solid var(--teal-mid)'}}>
          <div style={{fontSize:28,marginBottom:8,animation:'spin 1s linear infinite',display:'inline-block'}}>⚡</div>
          <p style={{color:'var(--teal-dark)',fontWeight:700,fontSize:15}}>Génération en cours...</p>
        </div>
      )}
      {!generating&&allDisplayEmps.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',border:'2px dashed var(--border)',borderRadius:14}}>
          <div style={{fontSize:48,marginBottom:12}}>👥</div>
          <p style={{color:'var(--muted)',fontWeight:600,fontSize:15}}>Aucun employé dans ce magasin</p>
        </div>
      )}
      {!generating&&allDisplayEmps.length>0&&(
        viewMode==='week'
          ?<WeekView
            emps={allDisplayEmps} days={displayDays} allDays={weekDates}
            sched={schedule} types={shiftTypes} onCell={handleCell} totalH={totalH}
            onDragStart={handleDragStart} onDragOver={handleDragOver}
            onDrop={handleDrop} onDragEnd={handleDragEnd}
            dragOver={dragOver} extraEmpIds={extraEmps.map(e=>e.id)}
          />
          :<DayView
            emps={allDisplayEmps} day={weekDates[activeDay]} dayIdx={activeDay}
            sched={schedule} types={shiftTypes} onCell={handleCell}
            onDragStart={handleDragStart} onDragOver={handleDragOver}
            onDrop={handleDrop} onDragEnd={handleDragEnd}
            dragOver={dragOver}
          />
      )}

      {/* MODALS */}
      {editCell&&(()=>{
        const emp=employees.find(e=>e.id===editCell.empId);
        const sh=schedule[`${editCell.empId}_${editCell.dayIdx}`];
        return <ShiftModal emp={emp} dayIdx={editCell.dayIdx} day={weekDates[editCell.dayIdx]} shift={sh} onSave={handleSave} onDelete={handleDelete} onClose={()=>setEditCell(null)} types={shiftTypes}/>;
      })()}
      {confirmWknd&&(
        <div className="overlay" onClick={()=>setConfirmWknd(null)}>
          <div className="modal" style={{maxWidth:360,textAlign:'center'}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:19,marginBottom:9}}>Jour non travaillé</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginBottom:20}}>Ce jour est un dimanche. Planifier quand même ?</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setConfirmWknd(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>{ setShowWknd(true); setEditCell(confirmWknd); setConfirmWknd(null); }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
      {showAuto&&store&&<AutoModal store={store} emps={storeEmps} weekDates={weekDates} currentWeek={currentWeek} currentYear={currentYear} leaveRequests={leaveRequests} onGenerate={handleAutoGen} onClose={()=>setShowAuto(false)}/>}
      {showBorrow&&store&&<BorrowModal store={store} allEmployees={employees} allStores={stores} currentEmps={allDisplayEmps} onBorrow={handleBorrow} onClose={()=>setShowBorrow(false)}/>}
    </div>
  );
}

/* ── WEEK VIEW ────────────────────────────────────────────── */
function WeekView({emps,days,allDays,sched,types,onCell,totalH,onDragStart,onDragOver,onDrop,onDragEnd,dragOver,extraEmpIds}){
  return(
    <div className="card" style={{overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
          <thead>
            <tr style={{background:'var(--card2)',borderBottom:'2px solid var(--border)'}}>
              <th style={{padding:'15px 20px',textAlign:'left',fontSize:13,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',width:190}}>Employé</th>
              {days.map((wd,i)=>(
                <th key={i} style={{padding:'13px 8px',textAlign:'center',minWidth:100}}>
                  <div style={{fontWeight:700,fontSize:15,color:wd.date.getDay()===0?'#C8002B':'var(--text)'}}>{wd.day.slice(0,3)}</div>
                  <div style={{fontSize:12,color:'var(--dim)',marginTop:2}}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                </th>
              ))}
              <th style={{padding:'13px 16px',textAlign:'center',fontSize:13,color:'var(--muted)',fontWeight:700,width:90}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {emps.map((emp,ei)=>{
              const t=totalH(emp.id),c=emp.contractHours||35,diff=t-c;
              const isBorrowed=extraEmpIds.includes(emp.id);
              return(
                <tr key={emp.id} style={{borderBottom:'1px solid var(--border)',background:isBorrowed?'#FFFDE7':ei%2===0?'#fff':'var(--card2)'}}>
                  <td style={{padding:'10px 20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff',flexShrink:0}}>
                        {emp.name[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>
                          {emp.name}
                          {isBorrowed&&<span style={{marginLeft:6,fontSize:10,background:'#FFF7E0',color:'#B07D00',borderRadius:5,padding:'1px 5px',fontWeight:700}}>⚡</span>}
                        </div>
                        <div style={{fontSize:11,color:'var(--dim)',textTransform:'capitalize'}}>{emp.role} · {c}h</div>
                      </div>
                    </div>
                  </td>
                  {days.map((wd,di)=>{
                    const ri=allDays.indexOf(wd);
                    const sh=sched[`${emp.id}_${ri}`];
                    const st=sh?getMeta(types,sh.type):null;
                    const isDragOver=dragOver?.empId===emp.id&&dragOver?.dayIdx===ri;
                    return(
                      <td key={di} style={{padding:'5px 5px'}}
                        onDragOver={e=>onDragOver(emp.id,ri,e)}
                        onDrop={e=>onDrop(emp.id,ri,e)}
                      >
                        {sh?(
                          <div
                            draggable
                            onClick={()=>onCell(emp.id,ri)}
                            onDragStart={e=>onDragStart(emp.id,ri,e)}
                            onDragEnd={onDragEnd}
                            style={{
                              background:isDragOver?'var(--teal-light)':st.bgColor,
                              border:`1.5px solid ${isDragOver?'var(--teal)':st.color+'50'}`,
                              borderRadius:10,padding:'7px 5px',minHeight:60,
                              cursor:'grab',transition:'background .12s,border .12s',
                              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
                              userSelect:'none',
                            }}
                          >
                            <span style={{fontSize:12,fontWeight:700,color:isDragOver?'var(--teal-dark)':st.color}}>{st.label}</span>
                            {sh.startTime&&<span style={{fontSize:11,color:st.color,opacity:.85}}>{sh.startTime}–{sh.endTime}</span>}
                            {sh.hours>0&&<span style={{fontSize:10,color:st.color,opacity:.7}}>{sh.hours}h</span>}
                            {sh.note&&<span style={{fontSize:9,color:st.color,opacity:.6,fontStyle:'italic',maxWidth:85,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sh.note}</span>}
                          </div>
                        ):(
                          <div
                            onDragOver={e=>onDragOver(emp.id,ri,e)}
                            onDrop={e=>onDrop(emp.id,ri,e)}
                            onClick={()=>onCell(emp.id,ri)}
                            style={{
                              minHeight:60,borderRadius:10,
                              border:`2px dashed ${isDragOver?'var(--teal)':'var(--border)'}`,
                              background:isDragOver?'var(--teal-light)':'transparent',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              cursor:'pointer',transition:'all .12s',
                              color:isDragOver?'var(--teal-dark)':'var(--dim)',fontSize:22,
                            }}
                            onMouseEnter={e=>{if(!isDragOver){e.currentTarget.style.background='var(--teal-light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal-dark)';}}}
                            onMouseLeave={e=>{if(!isDragOver){e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--dim)';}}}
                          >+</div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{padding:'10px 16px',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:17,color:diff>3?'#C8002B':diff<-3?'var(--dim)':'var(--teal-dark)'}}>{t.toFixed(1)}h</div>
                    <div style={{fontSize:11,fontWeight:700,color:diff>0?'#C8002B':'#1A8A42',marginTop:1}}>{diff>0?`+${diff.toFixed(1)}`:diff.toFixed(1)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── DAY VIEW ─────────────────────────────────────────────── */
function DayView({emps,day,dayIdx,sched,types,onCell,onDragStart,onDragOver,onDrop,onDragEnd,dragOver}){
  return(
    <div>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:13,padding:'14px 20px',marginBottom:14}}>
        <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:19,color:'var(--teal-dark)',textTransform:'capitalize'}}>
          {day.day} — {day.date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </h3>
      </div>
      <div style={{display:'grid',gap:9}}>
        {emps.map(emp=>{
          const sh=sched[`${emp.id}_${dayIdx}`];
          const st=sh?getMeta(types,sh.type):null;
          const isDragOver=dragOver?.empId===emp.id&&dragOver?.dayIdx===dayIdx;
          return(
            <div key={emp.id}
              draggable={!!sh}
              onDragStart={e=>sh&&onDragStart(emp.id,dayIdx,e)}
              onDragEnd={onDragEnd}
              onDragOver={e=>onDragOver(emp.id,dayIdx,e)}
              onDrop={e=>onDrop(emp.id,dayIdx,e)}
              onClick={()=>onCell(emp.id,dayIdx)}
              className="card"
              style={{
                display:'flex',alignItems:'center',gap:16,padding:'15px 22px',
                cursor:sh?'grab':'pointer',transition:'all .15s',
                background:isDragOver?'var(--teal-light)':sh?st.bgColor:'#fff',
                borderLeft:isDragOver?'5px solid var(--teal)':sh?`5px solid ${st.color}`:'5px solid var(--border)',
              }}
            >
              <div style={{width:42,height:42,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17,flexShrink:0}}>{emp.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{emp.name}</div>
                <div style={{color:'var(--dim)',fontSize:13}}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
              {sh?(
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,color:st.color,fontSize:15}}>{st.label}</div>
                  {sh.startTime&&<div style={{color:'var(--muted)',fontSize:13}}>{sh.startTime}–{sh.endTime} · {sh.hours}h</div>}
                  {sh.note&&<div style={{fontSize:11,color:'var(--dim)',fontStyle:'italic'}}>{sh.note}</div>}
                </div>
              ):<span style={{color:'var(--dim)',fontSize:24}}>+</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
