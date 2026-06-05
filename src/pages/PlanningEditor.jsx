import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const BREAKS = [{ v:0, l:'Pas de pause' },{ v:.5, l:'30 min' },{ v:1, l:'1h' }];

function calcH(s,e,b){ try{ const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number); const d=(eh*60+em)-(sh*60+sm); return d>0?Math.max(0,d/60-b):0; }catch{return 0;} }

function getMeta(shiftTypes,id){ return shiftTypes.find(s=>s.id===id)||{label:id,color:'#6366F1',bgColor:'#EEF2FF'}; }

/* ── SHIFT MODAL ─────────────────────────────────────────── */
function ShiftModal({ emp, dayIdx, day, shift, onSave, onDelete, onClose, shiftTypes }){
  const [type,setType]=useState(shift?.type||'work');
  const [s,setS]=useState(shift?.startTime||'09:00');
  const [e,setE]=useState(shift?.endTime||'18:00');
  const [brk,setBrk]=useState(shift?.breakH??1);
  const [note,setNote]=useState(shift?.note||'');
  const [dep,setDep]=useState(shift?.depannage||false);
  const needsTime=['work','communication','meeting'].includes(type);
  const hours=needsTime?calcH(s,e,brk):0;

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
          <div>
            <h2 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20,color:'var(--text)'}}>Modifier le créneau</h2>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}><b>{emp.name}</b> · {day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        {/* Types */}
        <div style={{marginBottom:18}}>
          <div className="lbl">Type de créneau</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {shiftTypes.map(st=>(
              <button key={st.id} onClick={()=>setType(st.id)} style={{
                padding:'8px 16px',borderRadius:30,cursor:'pointer',fontFamily:'var(--font-b)',fontSize:13,
                border:`2px solid ${type===st.id?st.color:st.color+'40'}`,
                background:type===st.id?st.bgColor:'#fff',
                color:st.color, fontWeight:type===st.id?700:500, transition:'all .15s',
              }}>{st.label}</button>
            ))}
          </div>
        </div>

        {/* Times */}
        {needsTime&&(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div><div className="lbl">Début</div><input className="inp" type="time" value={s} onChange={ev=>setS(ev.target.value)}/></div>
              <div><div className="lbl">Fin</div><input className="inp" type="time" value={e} onChange={ev=>setE(ev.target.value)}/></div>
            </div>
            <div style={{marginBottom:14}}>
              <div className="lbl">Pause déjeuner</div>
              <div style={{display:'flex',gap:8}}>
                {BREAKS.map(b=>(
                  <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                    flex:1,padding:'10px 0',borderRadius:9,cursor:'pointer',fontFamily:'var(--font-b)',fontSize:13,
                    border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                    background:brk===b.v?'var(--teal-light)':'#fff',
                    color:brk===b.v?'var(--teal-dark)':'var(--muted)', fontWeight:brk===b.v?700:500,
                  }}>{b.l}</button>
                ))}
              </div>
            </div>
            {hours>0&&(
              <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'11px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:22}}>⏱</span>
                <span style={{color:'var(--teal-dark)',fontWeight:700,fontSize:16}}>{hours.toFixed(2)}h effectives</span>
                <span style={{color:'var(--muted)',fontSize:13}}>{s}→{e} - {brk}h pause</span>
              </div>
            )}
          </>
        )}

        <div style={{marginBottom:14}}>
          <div className="lbl">Note</div>
          <input className="inp" type="text" placeholder="Remarque..." value={note} onChange={ev=>setNote(ev.target.value)}/>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:10,marginBottom:22,cursor:'pointer',fontSize:14,color:'var(--muted)'}}>
          <input type="checkbox" checked={dep} onChange={ev=>setDep(ev.target.checked)} style={{accentColor:'var(--teal)',width:17,height:17}}/>
          Dépannage (employé d'un autre magasin)
        </label>

        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'13px'}}
            onClick={()=>onSave({type,startTime:needsTime?s:null,endTime:needsTime?e:null,breakH:needsTime?brk:0,hours:needsTime?parseFloat(hours.toFixed(2)):null,note,depannage:dep})}>
            ✓ Enregistrer
          </button>
          {shift&&<button className="btn btn-danger" onClick={onDelete}>🗑 Supprimer</button>}
        </div>
      </div>
    </div>
  );
}

/* ── AUTO-GENERATE MODAL ─────────────────────────────────── */
function AutoModal({ store, employees, onGenerate, onClose }){
  const [restDay,setRestDay]=useState(1); // 0=Lun
  const [brk,setBrk]=useState(1);
  const [openStart,setOpenStart]=useState('09:00');
  const [openEnd,setOpenEnd]=useState('19:00');
  const [closeStart,setCloseStart]=useState('10:00');
  const [closeEnd,setCloseEnd]=useState('20:00');
  const [alternateMode,setAlternateMode]=useState(true);

  const restDayNames=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const openH=calcH(openStart,openEnd,brk);
  const closeH=calcH(closeStart,closeEnd,brk);

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:560}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <h2 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>⚡ Génération automatique</h2>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}>{store.name}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:14,color:'var(--teal-dark)'}}>
          ℹ️ <b>Dimanche = Repos systématique</b> + 1 jour de repos choisi en semaine.<br/>
          Les employés alternent automatiquement <b>ouverture / fermeture</b> chaque jour.
        </div>

        {/* Jour de repos */}
        <div style={{marginBottom:18}}>
          <div className="lbl">Jour de repos en semaine (en plus du dimanche)</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {restDayNames.map((d,i)=>(
              <button key={i} onClick={()=>setRestDay(i)} style={{
                padding:'9px 16px',borderRadius:30,cursor:'pointer',fontFamily:'var(--font-b)',fontSize:13,
                border:`2px solid ${restDay===i?'var(--teal)':'var(--border)'}`,
                background:restDay===i?'var(--teal-light)':'#fff',
                color:restDay===i?'var(--teal-dark)':'var(--muted)',fontWeight:restDay===i?700:500,
              }}>{d}</button>
            ))}
          </div>
        </div>

        {/* Horaires ouverture */}
        <div style={{background:'#EBF8FF',borderRadius:10,padding:'14px 16px',marginBottom:12,border:'1px solid #B3E0FF'}}>
          <div className="lbl" style={{color:'#1D6FD8',marginBottom:10}}>🌅 Créneau ouverture</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><div className="lbl">Début</div><input className="inp" type="time" value={openStart} onChange={ev=>setOpenStart(ev.target.value)}/></div>
            <div><div className="lbl">Fin</div><input className="inp" type="time" value={openEnd} onChange={ev=>setOpenEnd(ev.target.value)}/></div>
          </div>
          {openH>0&&<div style={{marginTop:8,fontSize:13,color:'#1D6FD8',fontWeight:600}}>⏱ {openH.toFixed(1)}h effectives</div>}
        </div>

        {/* Horaires fermeture */}
        <div style={{background:'#FFF3E0',borderRadius:10,padding:'14px 16px',marginBottom:14,border:'1px solid #FFCC80'}}>
          <div className="lbl" style={{color:'#D05B00',marginBottom:10}}>🌆 Créneau fermeture</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><div className="lbl">Début</div><input className="inp" type="time" value={closeStart} onChange={ev=>setCloseStart(ev.target.value)}/></div>
            <div><div className="lbl">Fin</div><input className="inp" type="time" value={closeEnd} onChange={ev=>setCloseEnd(ev.target.value)}/></div>
          </div>
          {closeH>0&&<div style={{marginTop:8,fontSize:13,color:'#D05B00',fontWeight:600}}>⏱ {closeH.toFixed(1)}h effectives</div>}
        </div>

        {/* Pause */}
        <div style={{marginBottom:18}}>
          <div className="lbl">Pause déjeuner (pour les deux créneaux)</div>
          <div style={{display:'flex',gap:8}}>
            {BREAKS.map(b=>(
              <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                flex:1,padding:'10px 0',borderRadius:9,cursor:'pointer',fontFamily:'var(--font-b)',fontSize:13,
                border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                background:brk===b.v?'var(--teal-light)':'#fff',
                color:brk===b.v?'var(--teal-dark)':'var(--muted)',fontWeight:brk===b.v?700:500,
              }}>{b.l}</button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{background:'var(--card2)',borderRadius:10,padding:'12px 16px',marginBottom:20,border:'1px solid var(--border)'}}>
          <div style={{fontSize:13,color:'var(--muted)',marginBottom:8,fontWeight:600}}>Aperçu pour {employees.length} employé(s) :</div>
          {employees.slice(0,4).map((emp,idx)=>(
            <div key={emp.id} style={{fontSize:13,color:'var(--text)',marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>{emp.name[0]}</div>
              <b>{emp.name}</b> — alterne <span style={{color:'#1D6FD8'}}>ouverture</span> / <span style={{color:'#D05B00'}}>fermeture</span> selon parité du jour
            </div>
          ))}
          {employees.length>4&&<div style={{fontSize:13,color:'var(--dim)'}}>+{employees.length-4} autre(s)...</div>}
        </div>

        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px',fontSize:15}}
          onClick={()=>onGenerate({restDay,brk,openStart,openEnd,closeStart,closeEnd})}>
          ⚡ Générer le planning maintenant
        </button>
      </div>
    </div>
  );
}

/* ── WEEK NAV ──────────────────────────────────────────────── */
function WeekNav({ cw, setCw }){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCw(w=>Math.max(1,w-1))}>‹ Préc.</button>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:10,padding:'9px 20px',textAlign:'center',minWidth:100}}>
        <span style={{fontFamily:'var(--font-h)',fontWeight:800,color:'var(--teal-dark)',fontSize:18}}>S{cw}</span>
        <span style={{color:'var(--dim)',fontSize:13,marginLeft:6}}>/ 2026</span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCw(w=>Math.min(52,w+1))}>Suiv. ›</button>
    </div>
  );
}

/* ── MAIN ─────────────────────────────────────────────────── */
export default function PlanningEditor(){
  const { stores, employees, shiftTypes, getSchedule, setShift, currentWeek, setCurrentWeek, currentYear, selectedStore, setSelectedStore, getWeekDatesForCurrentWeek } = useApp();
  const [activeStore,setActiveStoreLocal]=useState(selectedStore||stores[0]?.id||'');
  const [viewMode,setViewMode]=useState('week');
  const [activeDay,setActiveDay]=useState(0);
  const [editCell,setEditCell]=useState(null);
  const [showWeekend,setShowWeekend]=useState(false);
  const [showAutoModal,setShowAutoModal]=useState(false);
  const [confirmWknd,setConfirmWknd]=useState(null);

  const store=stores.find(s=>s.id===activeStore);
  const storeEmps=employees.filter(e=>e.storeId===activeStore);
  const weekDates=getWeekDatesForCurrentWeek(currentWeek);
  const schedule=getSchedule(activeStore,currentWeek,currentYear);
  const displayDays=showWeekend?weekDates:weekDates.slice(0,6);

  const setStore=id=>{ setActiveStoreLocal(id); setSelectedStore(id); };

  const totalH=empId=>{ let t=0; weekDates.forEach((_,i)=>{ const sh=schedule[`${empId}_${i}`]; if(sh?.hours) t+=sh.hours; }); return t; };

  const handleCell=(empId,dayIdx)=>{
    const dow=weekDates[dayIdx].date.getDay();
    if(!showWeekend&&dow===0){ setConfirmWknd({empId,dayIdx}); return; }
    setEditCell({empId,dayIdx});
  };

  const handleSave=data=>{ if(!editCell) return; setShift(activeStore,currentWeek,currentYear,editCell.empId,editCell.dayIdx,data); setEditCell(null); };
  const handleDelete=()=>{ if(!editCell) return; setShift(activeStore,currentWeek,currentYear,editCell.empId,editCell.dayIdx,null); setEditCell(null); };

  /* AUTO-GENERATE: alterne ouverture/fermeture par employé et par jour */
  const handleAutoGen=({ restDay, brk, openStart, openEnd, closeStart, closeEnd })=>{
    const openH=parseFloat(calcH(openStart,openEnd,brk).toFixed(2));
    const closeH=parseFloat(calcH(closeStart,closeEnd,brk).toFixed(2));

    storeEmps.forEach((emp,empIdx)=>{
      weekDates.forEach((wd,dayIdx)=>{
        const dow=wd.date.getDay(); // 0=dim,1=lun...6=sam
        // 0=Lun...5=Sam dans notre système
        const mapped=dow===0?6:dow-1;

        // Dimanche OU jour de repos choisi → Repos
        if(mapped===6 || mapped===restDay){
          setShift(activeStore,currentWeek,currentYear,emp.id,dayIdx,{
            type:'rest', startTime:null, endTime:null, breakH:0, hours:null, note:'', depannage:false
          });
          return;
        }

        // Alterner : employé pair commence en ouverture, impair en fermeture
        // + alterner chaque jour pour varier
        const isOpen=(empIdx+dayIdx)%2===0;

        setShift(activeStore,currentWeek,currentYear,emp.id,dayIdx,{
          type:'work',
          startTime: isOpen?openStart:closeStart,
          endTime:   isOpen?openEnd:closeEnd,
          breakH: brk,
          hours: isOpen?openH:closeH,
          note: isOpen?'Ouverture':'Fermeture',
          depannage:false,
        });
      });
    });
    setShowAutoModal(false);
  };

  return(
    <div className="anim-up" style={{maxWidth:1500,margin:'0 auto'}}>
      {/* ── Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:14}}>
        <div>
          <h1 className="page-title">📅 Plannings</h1>
          <p className="page-sub">Cliquez sur une case pour éditer · {storeEmps.length} employé(s)</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <WeekNav cw={currentWeek} setCw={setCurrentWeek}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowWeekend(!showWeekend)}>
            {showWeekend?'Masquer dim.':'Afficher dim.'}
          </button>
          {store&&storeEmps.length>0&&(
            <button className="btn btn-sec btn-sm" onClick={()=>setShowAutoModal(true)}>
              ⚡ Auto-générer
            </button>
          )}
          <button className="btn btn-primary btn-sm"
            onClick={()=>window.dispatchEvent(new CustomEvent('exportPDF',{detail:{storeId:activeStore,week:currentWeek}}))}>
            📄 Exporter PDF
          </button>
          <button className="btn btn-ghost btn-sm"
            onClick={()=>window.dispatchEvent(new CustomEvent('exportNotion',{detail:{storeId:activeStore,week:currentWeek}}))}>
            📋 Notion
          </button>
        </div>
      </div>

      {/* ── Store tabs */}
      <div style={{display:'flex',gap:8,marginBottom:22,overflowX:'auto',paddingBottom:4,flexWrap:'wrap'}}>
        {stores.map(s=>(
          <button key={s.id} onClick={()=>setStore(s.id)} style={{
            padding:'10px 20px',borderRadius:30,cursor:'pointer',fontFamily:'var(--font-b)',fontSize:14,
            border:`2px solid ${activeStore===s.id?s.color:s.color+'35'}`,
            background:activeStore===s.id?s.color:'#fff',
            color:activeStore===s.id?'#fff':s.color,
            fontWeight:activeStore===s.id?700:500,
            transition:'all .15s', flexShrink:0,
            boxShadow:activeStore===s.id?`0 4px 12px ${s.color}40`:'none',
          }}>{s.name}</button>
        ))}
      </div>

      {/* ── View toggle */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{background:'var(--card2)',borderRadius:10,padding:3,border:'1px solid var(--border)',display:'flex'}}>
          {['week','day'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{
              padding:'9px 20px',borderRadius:8,border:'none',cursor:'pointer',
              background:viewMode===m?'var(--teal)':'transparent',
              color:viewMode===m?'#fff':'var(--muted)',
              fontFamily:'var(--font-b)',fontSize:14,fontWeight:viewMode===m?700:500,transition:'all .15s',
            }}>{m==='week'?'Semaine':'Journée'}</button>
          ))}
        </div>
        {viewMode==='day'&&(
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {weekDates.map((wd,i)=>(
              <button key={i} onClick={()=>setActiveDay(i)} style={{
                padding:'8px 14px',borderRadius:9,cursor:'pointer',fontFamily:'var(--font-b)',fontSize:13,
                border:`2px solid ${activeDay===i?'var(--teal)':'var(--border)'}`,
                background:activeDay===i?'var(--teal-light)':'#fff',
                color:activeDay===i?'var(--teal-dark)':'var(--muted)',fontWeight:activeDay===i?700:500,
              }}>{wd.day.slice(0,3)} {wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Legend */}
      <div style={{display:'flex',gap:8,marginBottom:22,flexWrap:'wrap'}}>
        {shiftTypes.map(st=>(
          <span key={st.id} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',background:st.bgColor,borderRadius:20,border:`1.5px solid ${st.color}35`,fontSize:13,color:st.color,fontWeight:700}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:st.color,display:'inline-block'}}/>
            {st.label}
          </span>
        ))}
      </div>

      {/* ── Grid */}
      {storeEmps.length===0?(
        <div style={{textAlign:'center',padding:'70px 20px',background:'var(--card)',border:'2px dashed var(--border)',borderRadius:16}}>
          <div style={{fontSize:52,marginBottom:14}}>👥</div>
          <p style={{color:'var(--muted)',fontWeight:600,fontSize:16}}>Aucun employé dans ce magasin</p>
          <p style={{color:'var(--dim)',fontSize:14,marginTop:6}}>Ajoutez des employés via la section Employés</p>
        </div>
      ):viewMode==='week'?(
        <WeekView emps={storeEmps} days={displayDays} allDays={weekDates} sched={schedule} types={shiftTypes} onCell={handleCell} totalH={totalH}/>
      ):(
        <DayView emps={storeEmps} day={weekDates[activeDay]} dayIdx={activeDay} sched={schedule} types={shiftTypes} onCell={handleCell}/>
      )}

      {/* ── Modals */}
      {editCell&&(()=>{
        const emp=employees.find(e=>e.id===editCell.empId);
        const sh=schedule[`${editCell.empId}_${editCell.dayIdx}`];
        return <ShiftModal emp={emp} dayIdx={editCell.dayIdx} day={weekDates[editCell.dayIdx]} shift={sh} onSave={handleSave} onDelete={handleDelete} onClose={()=>setEditCell(null)} shiftTypes={shiftTypes}/>;
      })()}

      {confirmWknd&&(
        <div className="overlay" onClick={()=>setConfirmWknd(null)}>
          <div className="modal" style={{maxWidth:380,textAlign:'center'}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:14}}>⚠️</div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20,marginBottom:10}}>Jour non travaillé</h3>
            <p style={{color:'var(--muted)',fontSize:15,marginBottom:22}}>Ce jour est un dimanche. Voulez-vous quand même planifier ?</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setConfirmWknd(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>{ setShowWeekend(true); setEditCell(confirmWknd); setConfirmWknd(null); }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {showAutoModal&&store&&(
        <AutoModal store={store} employees={storeEmps} onGenerate={handleAutoGen} onClose={()=>setShowAutoModal(false)}/>
      )}
    </div>
  );
}

/* ── WEEK VIEW ──────────────────────────────────────────── */
function WeekView({ emps, days, allDays, sched, types, onCell, totalH }){
  return(
    <div className="card" style={{overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:750}}>
          <thead>
            <tr style={{background:'var(--card2)',borderBottom:'2px solid var(--border)'}}>
              <th style={{padding:'16px 18px',textAlign:'left',fontSize:13,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',width:180,whiteSpace:'nowrap'}}>Employé</th>
              {days.map((wd,i)=>(
                <th key={i} style={{padding:'14px 10px',textAlign:'center',minWidth:110}}>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{wd.day.slice(0,3)}</div>
                  <div style={{fontSize:12,color:'var(--dim)',marginTop:3}}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                </th>
              ))}
              <th style={{padding:'14px 16px',textAlign:'center',fontSize:13,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',width:90}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {emps.map((emp,ei)=>{
              const t=totalH(emp.id);
              const contract=emp.contractHours||35;
              const diff=t-contract;
              return(
                <tr key={emp.id} style={{borderBottom:'1px solid var(--border)',background:ei%2===0?'#fff':'var(--card2)',transition:'background .1s'}}>
                  <td style={{padding:'12px 18px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:11}}>
                      <div style={{width:38,height:38,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'#fff',flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,.12)'}}>
                        {emp.name[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{emp.name}</div>
                        <div style={{fontSize:12,color:'var(--dim)',textTransform:'capitalize'}}>{emp.role} · {contract}h/sem</div>
                      </div>
                    </div>
                  </td>
                  {days.map((wd,di)=>{
                    const realIdx=allDays.indexOf(wd);
                    const sh=sched[`${emp.id}_${realIdx}`];
                    const st=sh?getMeta(types,sh.type):null;
                    return(
                      <td key={di} style={{padding:'6px 6px'}}>
                        {sh?(
                          <div onClick={()=>onCell(emp.id,realIdx)} style={{
                            background:st.bgColor, border:`1.5px solid ${st.color}50`,
                            borderRadius:10, padding:'8px 6px', minHeight:60,
                            cursor:'pointer', transition:'all .15s',
                            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
                          }}
                            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)';e.currentTarget.style.boxShadow=`0 3px 12px ${st.color}40`;}}
                            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
                          >
                            <span style={{fontSize:12,fontWeight:700,color:st.color}}>{st.label}</span>
                            {sh.startTime&&<span style={{fontSize:11,color:st.color,opacity:.85}}>{sh.startTime}–{sh.endTime}</span>}
                            {sh.hours>0&&<span style={{fontSize:11,color:st.color,opacity:.7}}>{sh.hours}h{sh.breakH>0?` -${sh.breakH}h`:''}</span>}
                            {sh.note&&<span style={{fontSize:10,color:st.color,opacity:.6,fontStyle:'italic'}}>{sh.note}</span>}
                            {sh.depannage&&<span style={{fontSize:10,color:'#D05B00'}}>⚡Dep</span>}
                          </div>
                        ):(
                          <div onClick={()=>onCell(emp.id,realIdx)} style={{
                            minHeight:60,borderRadius:10,
                            border:'2px dashed var(--border)',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            cursor:'pointer',transition:'all .15s',
                            color:'var(--dim)',fontSize:22,
                          }}
                            onMouseEnter={e=>{e.currentTarget.style.background='var(--teal-light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.borderColor='';e.currentTarget.style.color='';}}
                          >+</div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{padding:'12px 16px',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:18,color:diff>3?'#C8002B':diff<-3?'var(--dim)':'var(--teal-dark)'}}>{t.toFixed(1)}h</div>
                    <div style={{fontSize:12,fontWeight:700,color:diff>0?'#C8002B':'#1A8A42'}}>{diff>0?`+${diff.toFixed(1)}`:diff.toFixed(1)}</div>
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

/* ── DAY VIEW ───────────────────────────────────────────── */
function DayView({ emps, day, dayIdx, sched, types, onCell }){
  return(
    <div>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:14,padding:'16px 22px',marginBottom:18}}>
        <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:20,textTransform:'capitalize',color:'var(--teal-dark)'}}>
          {day.day} — {day.date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </h3>
      </div>
      <div style={{display:'grid',gap:10}}>
        {emps.map(emp=>{
          const sh=sched[`${emp.id}_${dayIdx}`];
          const st=sh?getMeta(types,sh.type):null;
          return(
            <div key={emp.id} onClick={()=>onCell(emp.id,dayIdx)} className="card" style={{
              display:'flex',alignItems:'center',gap:18,padding:'18px 22px',
              cursor:'pointer',transition:'all .15s',
              background:sh?st.bgColor:'#fff',
              borderLeft:sh?`5px solid ${st.color}`:'5px solid var(--border)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(5px)';e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.1)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
            >
              <div style={{width:46,height:46,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:18,flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,.12)'}}>
                {emp.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:'var(--text)'}}>{emp.name}</div>
                <div style={{color:'var(--dim)',fontSize:13}}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
              {sh?(
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,color:st.color,fontSize:16}}>{st.label}</div>
                  {sh.startTime&&<div style={{color:'var(--muted)',fontSize:13}}>{sh.startTime}–{sh.endTime} · {sh.hours}h{sh.breakH>0?` (-${sh.breakH}h)`:''}</div>}
                  {sh.note&&<div style={{fontSize:12,color:'var(--dim)',fontStyle:'italic'}}>{sh.note}</div>}
                </div>
              ):<span style={{color:'var(--dim)',fontSize:26,fontWeight:300}}>+</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
