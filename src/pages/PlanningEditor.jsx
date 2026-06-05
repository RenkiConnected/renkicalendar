import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const BREAKS=[{v:0,l:'Pas de pause'},{v:.5,l:'30 min'},{v:1,l:'1 heure'}];

function calcH(s,e,b){
  try{
    const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);
    const d=(eh*60+em)-(sh*60+sm);
    return d>0?Math.max(0,d/60-b):0;
  }catch{return 0;}
}
function getMeta(types,id){ return types.find(t=>t.id===id)||{label:id,color:'#6366F1',bgColor:'#EEF2FF'}; }

/* ─── SHIFT MODAL ─────────────────────────────────────────────── */
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
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22}}>
          <div>
            <h2 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:21}}>Modifier le créneau</h2>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}><b>{emp.name}</b> · {day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <div style={{marginBottom:18}}>
          <div className="lbl">Type</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {types.map(st=>(
              <button key={st.id} onClick={()=>setType(st.id)} style={{
                padding:'8px 16px',borderRadius:30,cursor:'pointer',
                border:`2px solid ${type===st.id?st.color:st.color+'40'}`,
                background:type===st.id?st.bgColor:'#fff',
                color:st.color,fontWeight:type===st.id?700:500,
                fontSize:13,fontFamily:'var(--font-b)',transition:'all .15s',
              }}>{st.label}</button>
            ))}
          </div>
        </div>

        {needsT&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div><div className="lbl">Début</div><input className="inp" type="time" value={s} onChange={ev=>setS(ev.target.value)}/></div>
            <div><div className="lbl">Fin</div><input className="inp" type="time" value={e} onChange={ev=>setE(ev.target.value)}/></div>
          </div>
          <div style={{marginBottom:14}}>
            <div className="lbl">Pause déjeuner</div>
            <div style={{display:'flex',gap:8}}>
              {BREAKS.map(b=>(
                <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                  flex:1,padding:'10px',borderRadius:9,cursor:'pointer',
                  border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                  background:brk===b.v?'var(--teal-light)':'#fff',
                  color:brk===b.v?'var(--teal-dark)':'var(--muted)',
                  fontWeight:brk===b.v?700:500,fontSize:13,fontFamily:'var(--font-b)',
                }}>{b.l}</button>
              ))}
            </div>
          </div>
          {h>0&&(
            <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:22}}>⏱</span>
              <span style={{color:'var(--teal-dark)',fontWeight:800,fontSize:17}}>{h.toFixed(2)}h effectives</span>
              <span style={{color:'var(--muted)',fontSize:13}}>{s}→{e} — {brk}h pause</span>
            </div>
          )}
        </>}

        <div style={{marginBottom:14}}><div className="lbl">Note</div><input className="inp" type="text" placeholder="Remarque..." value={note} onChange={ev=>setNote(ev.target.value)}/></div>
        <label style={{display:'flex',alignItems:'center',gap:10,marginBottom:22,cursor:'pointer',fontSize:14,color:'var(--muted)'}}>
          <input type="checkbox" checked={dep} onChange={ev=>setDep(ev.target.checked)} style={{accentColor:'var(--teal)',width:17,height:17}}/>
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

/* ─── AUTO-GENERATE MODAL ─────────────────────────────────────── */
function AutoModal({store,emps,weekDates,onGenerate,onClose}){
  const[restDay,setRestDay]=useState(1);
  const[brk,setBrk]=useState(1);
  const[oS,setOS]=useState('09:00');
  const[oE,setOE]=useState('13:30');
  const[fS,setFS]=useState('10:30');
  const[fE,setFE]=useState('19:30');
  const oH=calcH(oS,oE,brk), fH=calcH(fS,fE,brk);
  const DAY_NAMES=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

  // Preview: show what each emp gets for each day
  const preview=emps.map((emp,ei)=>{
    return weekDates.map((wd,di)=>{
      const dow=wd.date.getDay();
      const mapped=dow===0?6:dow-1;
      if(mapped===6||mapped===restDay) return 'repos';
      return (ei+di)%2===0?'ouv':'ferm';
    });
  });

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:600}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <h2 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:22}}>⚡ Génération automatique</h2>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}>{store.name} · {emps.length} employé(s)</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:14,color:'var(--teal-dark)',lineHeight:1.6}}>
          ℹ️ <b>Dimanche</b> = Repos automatique · <b>1 jour</b> de repos choisi<br/>
          Les employés alternent <b>Ouverture</b> et <b>Fermeture</b> chaque jour
        </div>

        {/* Jour de repos */}
        <div style={{marginBottom:18}}>
          <div className="lbl">Jour de repos en semaine</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {DAY_NAMES.map((d,i)=>(
              <button key={i} onClick={()=>setRestDay(i)} style={{
                padding:'9px 18px',borderRadius:30,cursor:'pointer',
                border:`2px solid ${restDay===i?'var(--teal)':'var(--border)'}`,
                background:restDay===i?'var(--teal-light)':'#fff',
                color:restDay===i?'var(--teal-dark)':'var(--muted)',
                fontWeight:restDay===i?700:500,fontSize:14,fontFamily:'var(--font-b)',
              }}>{d}</button>
            ))}
          </div>
        </div>

        {/* Horaires */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          <div style={{background:'#EBF8FF',borderRadius:12,padding:'14px 16px',border:'1px solid #B3E0FF'}}>
            <div className="lbl" style={{color:'#1D6FD8'}}>🌅 Ouverture</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><div className="lbl">Début</div><input className="inp" type="time" value={oS} onChange={ev=>setOS(ev.target.value)}/></div>
              <div><div className="lbl">Fin</div><input className="inp" type="time" value={oE} onChange={ev=>setOE(ev.target.value)}/></div>
            </div>
            {oH>0&&<div style={{fontSize:13,color:'#1D6FD8',fontWeight:700}}>⏱ {oH.toFixed(1)}h effectives</div>}
          </div>
          <div style={{background:'#FFF3E0',borderRadius:12,padding:'14px 16px',border:'1px solid #FFCC80'}}>
            <div className="lbl" style={{color:'#D05B00'}}>🌆 Fermeture</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><div className="lbl">Début</div><input className="inp" type="time" value={fS} onChange={ev=>setFS(ev.target.value)}/></div>
              <div><div className="lbl">Fin</div><input className="inp" type="time" value={fE} onChange={ev=>setFE(ev.target.value)}/></div>
            </div>
            {fH>0&&<div style={{fontSize:13,color:'#D05B00',fontWeight:700}}>⏱ {fH.toFixed(1)}h effectives</div>}
          </div>
        </div>

        {/* Pause */}
        <div style={{marginBottom:18}}>
          <div className="lbl">Pause déjeuner</div>
          <div style={{display:'flex',gap:8}}>
            {BREAKS.map(b=>(
              <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                flex:1,padding:'10px',borderRadius:9,cursor:'pointer',
                border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                background:brk===b.v?'var(--teal-light)':'#fff',
                color:brk===b.v?'var(--teal-dark)':'var(--muted)',
                fontWeight:brk===b.v?700:500,fontSize:13,fontFamily:'var(--font-b)',
              }}>{b.l}</button>
            ))}
          </div>
        </div>

        {/* Preview tableau */}
        {emps.length>0&&(
          <div style={{marginBottom:20,overflowX:'auto'}}>
            <div className="lbl">Aperçu du planning généré</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'var(--card2)'}}>
                  <th style={{padding:'8px 12px',textAlign:'left',color:'var(--muted)',fontWeight:700,borderRadius:'8px 0 0 0'}}>Employé</th>
                  {weekDates.slice(0,7).map((wd,i)=>(
                    <th key={i} style={{padding:'8px 6px',textAlign:'center',color:'var(--muted)',fontWeight:700,fontSize:11}}>
                      {wd.day.slice(0,3)}<br/>{wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emps.map((emp,ei)=>(
                  <tr key={emp.id} style={{borderTop:'1px solid var(--border)'}}>
                    <td style={{padding:'7px 12px',fontWeight:600,fontSize:13}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:24,height:24,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{emp.name[0]}</div>
                        {emp.name}
                      </div>
                    </td>
                    {preview[ei].map((type,di)=>(
                      <td key={di} style={{padding:'5px 4px',textAlign:'center'}}>
                        {type==='repos'?(
                          <span style={{background:'#FEF9C3',color:'#B07D00',borderRadius:6,padding:'3px 6px',fontSize:11,fontWeight:700}}>Repos</span>
                        ):type==='ouv'?(
                          <span style={{background:'#EBF8FF',color:'#1D6FD8',borderRadius:6,padding:'3px 6px',fontSize:11,fontWeight:700}}>Ouv.</span>
                        ):(
                          <span style={{background:'#FFF3E0',color:'#D05B00',borderRadius:6,padding:'3px 6px',fontSize:11,fontWeight:700}}>Ferm.</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'15px',fontSize:16,borderRadius:12}}
          onClick={()=>onGenerate({restDay,brk,oS,oE,fS,fE})}>
          ⚡ Générer le planning maintenant
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN ────────────────────────────────────────────────────── */
export default function PlanningEditor(){
  const { stores,employees,shiftTypes,getSchedule,setShift,setBulkSchedule,currentWeek,setCurrentWeek,currentYear,selectedStore,setSelectedStore,getWeekDatesForCurrentWeek } = useApp();
  const [activeStore,setAS]=useState(selectedStore||stores[0]?.id||'');
  const [viewMode,setViewMode]=useState('week');
  const [activeDay,setActiveDay]=useState(0);
  const [editCell,setEditCell]=useState(null);
  const [showWknd,setShowWknd]=useState(false);
  const [showAuto,setShowAuto]=useState(false);
  const [confirmWknd,setConfirmWknd]=useState(null);
  const [generating,setGenerating]=useState(false);

  const store=stores.find(s=>s.id===activeStore);
  const storeEmps=employees.filter(e=>e.storeId===activeStore);
  const weekDates=getWeekDatesForCurrentWeek(currentWeek);
  const schedule=getSchedule(activeStore,currentWeek,currentYear);
  const displayDays=showWknd?weekDates:weekDates.slice(0,6);

  const setStore=id=>{ setAS(id); setSelectedStore(id); };
  const totalH=empId=>{ let t=0; weekDates.forEach((_,i)=>{ const s=schedule[`${empId}_${i}`]; if(s?.hours) t+=s.hours; }); return t; };

  const handleCell=(empId,dayIdx)=>{
    const dow=weekDates[dayIdx].date.getDay();
    if(!showWknd&&dow===0){ setConfirmWknd({empId,dayIdx}); return; }
    setEditCell({empId,dayIdx});
  };

  const handleSave=data=>{ if(!editCell) return; setShift(activeStore,currentWeek,currentYear,editCell.empId,editCell.dayIdx,data); setEditCell(null); };
  const handleDelete=()=>{ if(!editCell) return; setShift(activeStore,currentWeek,currentYear,editCell.empId,editCell.dayIdx,null); setEditCell(null); };

  /* ── AUTO-GENERATE : build full schedule then save ONCE ─────── */
  const handleAutoGen=async({restDay,brk,oS,oE,fS,fE})=>{
    setGenerating(true);
    setShowAuto(false);
    const oH=parseFloat(calcH(oS,oE,brk).toFixed(2));
    const fH=parseFloat(calcH(fS,fE,brk).toFixed(2));
    const bulk={};

    storeEmps.forEach((emp,ei)=>{
      weekDates.forEach((wd,di)=>{
        const dow=wd.date.getDay();
        const mapped=dow===0?6:dow-1; // 0=Lun…6=Dim
        const cellKey=`${emp.id}_${di}`;

        if(mapped===6||mapped===restDay){
          bulk[cellKey]={type:'rest',startTime:null,endTime:null,breakH:0,hours:null,note:'',depannage:false};
        } else {
          const isOpen=(ei+di)%2===0;
          bulk[cellKey]={
            type:'work',
            startTime:isOpen?oS:fS,
            endTime:  isOpen?oE:fE,
            breakH:brk,
            hours:isOpen?oH:fH,
            note:isOpen?'Ouverture':'Fermeture',
            depannage:false,
          };
        }
      });
    });

    await setBulkSchedule(activeStore,currentWeek,currentYear,bulk);
    setGenerating(false);
  };

  return(
    <div className="anim-up" style={{width:'100%'}}>
      {/* ── HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:14}}>
        <div>
          <h1 className="page-title">📅 Plannings</h1>
          <p className="page-sub">{store?.name||'Sélectionnez un magasin'} · S{currentWeek} · {storeEmps.length} employé(s)</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          {/* Week nav */}
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setCurrentWeek(w=>Math.max(1,w-1))}>‹</button>
            <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:10,padding:'9px 20px',textAlign:'center',minWidth:90}}>
              <span style={{fontFamily:'var(--font-h)',fontWeight:800,color:'var(--teal-dark)',fontSize:18}}>S{currentWeek}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setCurrentWeek(w=>Math.min(52,w+1))}>›</button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowWknd(!showWknd)}>
            {showWknd?'Masquer dim.':'Voir dim.'}
          </button>
          {store&&storeEmps.length>0&&(
            <button className="btn btn-sec" disabled={generating} onClick={()=>setShowAuto(true)}
              style={{fontWeight:700,fontSize:14,padding:'10px 18px',opacity:generating?.6:1}}>
              {generating?'⏳ Génération...':'⚡ Auto-générer'}
            </button>
          )}
          <button className="btn btn-primary" style={{fontWeight:700,fontSize:14,padding:'10px 18px'}}
            onClick={()=>window.dispatchEvent(new CustomEvent('exportPDF',{detail:{storeId:activeStore,week:currentWeek}}))}>
            📄 Exporter PDF
          </button>
          <button className="btn btn-ghost btn-sm"
            onClick={()=>window.dispatchEvent(new CustomEvent('exportNotion',{detail:{storeId:activeStore,week:currentWeek}}))}>
            📋 Notion
          </button>
        </div>
      </div>

      {/* ── STORE TABS */}
      <div style={{display:'flex',gap:8,marginBottom:22,overflowX:'auto',paddingBottom:4}}>
        {stores.map(s=>(
          <button key={s.id} onClick={()=>setStore(s.id)} style={{
            padding:'10px 22px',borderRadius:30,cursor:'pointer',flexShrink:0,
            border:`2px solid ${activeStore===s.id?s.color:s.color+'40'}`,
            background:activeStore===s.id?s.color:'#fff',
            color:activeStore===s.id?'#fff':s.color,
            fontFamily:'var(--font-b)',fontSize:14,fontWeight:activeStore===s.id?700:500,
            transition:'all .15s',
            boxShadow:activeStore===s.id?`0 4px 14px ${s.color}45`:'none',
          }}>{s.name}</button>
        ))}
      </div>

      {/* ── VIEW TOGGLE */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
        <div style={{background:'var(--card2)',borderRadius:10,padding:3,border:'1px solid var(--border)',display:'inline-flex'}}>
          {['week','day'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{
              padding:'9px 22px',borderRadius:8,border:'none',cursor:'pointer',
              background:viewMode===m?'var(--teal)':'transparent',
              color:viewMode===m?'#fff':'var(--muted)',
              fontFamily:'var(--font-b)',fontSize:14,fontWeight:viewMode===m?700:500,
            }}>{m==='week'?'Semaine':'Journée'}</button>
          ))}
        </div>
        {viewMode==='day'&&weekDates.map((wd,i)=>(
          <button key={i} onClick={()=>setActiveDay(i)} style={{
            padding:'8px 14px',borderRadius:9,cursor:'pointer',
            border:`2px solid ${activeDay===i?'var(--teal)':'var(--border)'}`,
            background:activeDay===i?'var(--teal-light)':'#fff',
            color:activeDay===i?'var(--teal-dark)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:13,fontWeight:activeDay===i?700:500,
          }}>{wd.day.slice(0,3)} {wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</button>
        ))}
      </div>

      {/* ── LEGEND */}
      <div style={{display:'flex',gap:8,marginBottom:22,flexWrap:'wrap'}}>
        {shiftTypes.map(st=>(
          <span key={st.id} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',background:st.bgColor,borderRadius:20,border:`1.5px solid ${st.color}40`,fontSize:13,color:st.color,fontWeight:700}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:st.color,display:'inline-block'}}/>
            {st.label}
          </span>
        ))}
      </div>

      {/* ── GRID */}
      {generating&&(
        <div style={{textAlign:'center',padding:'40px',background:'var(--teal-light)',borderRadius:16,marginBottom:20,border:'2px solid var(--teal-mid)'}}>
          <div style={{fontSize:36,marginBottom:10,animation:'spin 1s linear infinite',display:'inline-block'}}>⚡</div>
          <p style={{color:'var(--teal-dark)',fontWeight:700,fontSize:16}}>Génération en cours...</p>
        </div>
      )}

      {!generating&&storeEmps.length===0&&(
        <div style={{textAlign:'center',padding:'70px 20px',background:'#fff',border:'2px dashed var(--border)',borderRadius:16}}>
          <div style={{fontSize:52,marginBottom:14}}>👥</div>
          <p style={{color:'var(--muted)',fontWeight:600,fontSize:16}}>Aucun employé dans ce magasin</p>
        </div>
      )}

      {!generating&&storeEmps.length>0&&(
        viewMode==='week'
          ?<WeekView emps={storeEmps} days={displayDays} allDays={weekDates} sched={schedule} types={shiftTypes} onCell={handleCell} totalH={totalH}/>
          :<DayView emps={storeEmps} day={weekDates[activeDay]} dayIdx={activeDay} sched={schedule} types={shiftTypes} onCell={handleCell}/>
      )}

      {/* ── MODALS */}
      {editCell&&(()=>{
        const emp=employees.find(e=>e.id===editCell.empId);
        const sh=schedule[`${editCell.empId}_${editCell.dayIdx}`];
        return <ShiftModal emp={emp} dayIdx={editCell.dayIdx} day={weekDates[editCell.dayIdx]} shift={sh} onSave={handleSave} onDelete={handleDelete} onClose={()=>setEditCell(null)} types={shiftTypes}/>;
      })()}

      {confirmWknd&&(
        <div className="overlay" onClick={()=>setConfirmWknd(null)}>
          <div className="modal" style={{maxWidth:380,textAlign:'center'}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:14}}>⚠️</div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20,marginBottom:10}}>Jour non travaillé</h3>
            <p style={{color:'var(--muted)',fontSize:15,marginBottom:22}}>Ce jour est un dimanche. Planifier quand même ?</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setConfirmWknd(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>{ setShowWknd(true); setEditCell(confirmWknd); setConfirmWknd(null); }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {showAuto&&store&&(
        <AutoModal store={store} emps={storeEmps} weekDates={weekDates} onGenerate={handleAutoGen} onClose={()=>setShowAuto(false)}/>
      )}
    </div>
  );
}

/* ─── WEEK VIEW ────────────────────────────────────────────────── */
function WeekView({emps,days,allDays,sched,types,onCell,totalH}){
  return(
    <div className="card" style={{overflow:'hidden',borderRadius:14}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
          <thead>
            <tr style={{background:'var(--card2)',borderBottom:'2px solid var(--border)'}}>
              <th style={{padding:'16px 20px',textAlign:'left',fontSize:13,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',width:190}}>Employé</th>
              {days.map((wd,i)=>(
                <th key={i} style={{padding:'14px 10px',textAlign:'center',minWidth:110}}>
                  <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{wd.day.slice(0,3)}</div>
                  <div style={{fontSize:12,color:'var(--dim)',marginTop:3}}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                </th>
              ))}
              <th style={{padding:'14px 18px',textAlign:'center',fontSize:13,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',width:90}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {emps.map((emp,ei)=>{
              const t=totalH(emp.id),c=emp.contractHours||35,d=t-c;
              return(
                <tr key={emp.id} style={{borderBottom:'1px solid var(--border)',background:ei%2===0?'#fff':'var(--card2)'}}>
                  <td style={{padding:'12px 20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'#fff',flexShrink:0,boxShadow:'0 2px 6px rgba(0,0,0,.12)'}}>
                        {emp.name[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:'var(--text)'}}>{emp.name}</div>
                        <div style={{fontSize:12,color:'var(--dim)',textTransform:'capitalize'}}>{emp.role} · {c}h/sem</div>
                      </div>
                    </div>
                  </td>
                  {days.map((wd,di)=>{
                    const ri=allDays.indexOf(wd);
                    const sh=sched[`${emp.id}_${ri}`];
                    const st=sh?getMeta(types,sh.type):null;
                    return(
                      <td key={di} style={{padding:'6px 6px'}}>
                        {sh?(
                          <div onClick={()=>onCell(emp.id,ri)} style={{
                            background:st.bgColor,border:`1.5px solid ${st.color}50`,
                            borderRadius:10,padding:'8px 6px',minHeight:62,
                            cursor:'pointer',transition:'all .15s',
                            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
                          }}
                            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow=`0 4px 14px ${st.color}45`;}}
                            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
                          >
                            <span style={{fontSize:12,fontWeight:700,color:st.color}}>{st.label}</span>
                            {sh.startTime&&<span style={{fontSize:11,color:st.color,opacity:.85}}>{sh.startTime}–{sh.endTime}</span>}
                            {sh.hours>0&&<span style={{fontSize:11,color:st.color,opacity:.75}}>{sh.hours}h{sh.breakH>0?` -${sh.breakH}h`:''}</span>}
                            {sh.note&&<span style={{fontSize:10,color:st.color,opacity:.65,fontStyle:'italic',maxWidth:90,textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sh.note}</span>}
                          </div>
                        ):(
                          <div onClick={()=>onCell(emp.id,ri)} style={{
                            minHeight:62,borderRadius:10,border:'2px dashed var(--border)',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            cursor:'pointer',transition:'all .15s',color:'var(--dim)',fontSize:24,
                          }}
                            onMouseEnter={e=>{e.currentTarget.style.background='var(--teal-light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal-dark)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.borderColor='';e.currentTarget.style.color='';}}
                          >+</div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{padding:'12px 18px',textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:18,color:d>3?'#C8002B':d<-3?'var(--dim)':'var(--teal-dark)'}}>{t.toFixed(1)}h</div>
                    <div style={{fontSize:12,fontWeight:700,color:d>0?'#C8002B':'#1A8A42',marginTop:2}}>{d>0?`+${d.toFixed(1)}`:d.toFixed(1)}</div>
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

/* ─── DAY VIEW ─────────────────────────────────────────────────── */
function DayView({emps,day,dayIdx,sched,types,onCell}){
  return(
    <div>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:14,padding:'16px 22px',marginBottom:18}}>
        <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:20,color:'var(--teal-dark)',textTransform:'capitalize'}}>
          {day.day} — {day.date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </h3>
      </div>
      <div style={{display:'grid',gap:10}}>
        {emps.map(emp=>{
          const sh=sched[`${emp.id}_${dayIdx}`];
          const st=sh?getMeta(types,sh.type):null;
          return(
            <div key={emp.id} onClick={()=>onCell(emp.id,dayIdx)} className="card" style={{
              display:'flex',alignItems:'center',gap:18,padding:'18px 24px',cursor:'pointer',
              background:sh?st.bgColor:'#fff',
              borderLeft:sh?`5px solid ${st.color}`:'5px solid var(--border)',
              transition:'all .15s',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(5px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
            >
              <div style={{width:46,height:46,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:18,flexShrink:0}}>
                {emp.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16}}>{emp.name}</div>
                <div style={{color:'var(--dim)',fontSize:13}}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
              {sh?(
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,color:st.color,fontSize:16}}>{st.label}</div>
                  {sh.startTime&&<div style={{color:'var(--muted)',fontSize:13}}>{sh.startTime}–{sh.endTime} · {sh.hours}h</div>}
                  {sh.note&&<div style={{fontSize:12,color:'var(--dim)',fontStyle:'italic'}}>{sh.note}</div>}
                </div>
              ):<span style={{color:'var(--dim)',fontSize:26}}>+</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
