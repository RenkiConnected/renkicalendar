import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const MONTH_NAMES=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_SHORT=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

function getWeekNumber(d){
  const date=new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate()+4-(date.getDay()||7));
  const y=new Date(date.getFullYear(),0,1);
  return Math.ceil((((date-y)/86400000)+1)/7);
}
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDayOfMonth(y,m){ const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function getWeekDatesArr(wn,year){
  const jan4=new Date(year,0,4); const s=new Date(jan4);
  s.setDate(jan4.getDate()-jan4.getDay()+1);
  const ws=new Date(s); ws.setDate(s.getDate()+(wn-1)*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(ws); d.setDate(ws.getDate()+i); return d; });
}
function datesToWeekGroups(dates){
  const groups={};
  dates.forEach(d=>{
    const wn=getWeekNumber(d),yr=d.getFullYear(),key=`${yr}_W${wn}`;
    if(!groups[key]) groups[key]={week:wn,year:yr,days:[]};
    const wd=getWeekDatesArr(wn,yr);
    const idx=wd.findIndex(w=>w.toDateString()===d.toDateString());
    if(idx>=0&&!groups[key].days.includes(idx)) groups[key].days.push(idx);
  });
  return Object.values(groups);
}

const STATUS_MAP={
  pending:  {label:'En attente',bg:'#FFF7E0',color:'#B07D00',icon:'⏳',ring:'#F5D06A'},
  approved: {label:'Approuvé',  bg:'#E8FAF0',color:'#1A8A42',icon:'✅',ring:'var(--teal)'},
  rejected: {label:'Refusé',    bg:'#FFF0F2',color:'#C8002B',icon:'❌',ring:'#FFAAB6'},
};
const LEAVE_TYPES=[
  {id:'vacation',label:'Congés payés', icon:'🌴',color:'#7C3AED',bg:'#F3EDFF'},
  {id:'sick',    label:'Maladie',      icon:'🤒',color:'#C8002B',bg:'#FFF0F2'},
  {id:'personal',label:'Motif perso',  icon:'👤',color:'#D05B00',bg:'#FFF3E0'},
  {id:'training',label:'Formation',    icon:'📚',color:'#1D6FD8',bg:'#EBF8FF'},
];

function StatusBadge({status}){
  const s=STATUS_MAP[status]||STATUS_MAP.pending;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,background:s.bg,color:s.color,fontSize:12,fontWeight:700}}>{s.icon} {s.label}</span>;
}

function CalendarPicker({selectedDates,onToggle}){
  const today=new Date();
  const[vy,setVy]=useState(today.getFullYear());
  const[vm,setVm]=useState(today.getMonth());
  const days=getDaysInMonth(vy,vm),first=getFirstDayOfMonth(vy,vm);
  const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>new Date(vy,vm,i+1))];
  const prev=()=>{ if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); };
  const next=()=>{ if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); };
  const isSel=d=>d&&selectedDates.some(s=>s.toDateString()===d.toDateString());
  const isPast=d=>d&&d<new Date(today.getFullYear(),today.getMonth(),today.getDate());
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <button onClick={prev} className="btn btn-ghost btn-sm" style={{padding:'8px 12px'}}>‹</button>
        <span style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17}}>{MONTH_NAMES[vm]} {vy}</span>
        <button onClick={next} className="btn btn-ghost btn-sm" style={{padding:'8px 12px'}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:6}}>
        {DAY_SHORT.map(d=><div key={d} style={{textAlign:'center',fontSize:12,fontWeight:700,color:'var(--dim)',padding:'4px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const sel=isSel(d),past=isPast(d),sun=d.getDay()===0;
          return(
            <button key={i} onClick={()=>!past&&onToggle(d)} disabled={past} style={{
              aspectRatio:'1',borderRadius:10,border:'none',cursor:past?'not-allowed':'pointer',
              background:sel?'var(--teal)':sun?'#FEF2F2':'#fff',
              color:sel?'#fff':past?'var(--dim)':sun?'#C8002B':'var(--text)',
              fontWeight:sel?700:500,fontSize:14,transition:'all .15s',fontFamily:'var(--font-b)',
              opacity:past?.4:1,
              boxShadow:sel?'0 3px 10px rgba(0,201,177,.4)':'0 1px 3px rgba(0,0,0,.06)',
              transform:sel?'scale(1.08)':'scale(1)',
              border:sel?'2px solid var(--teal-dark)':'1.5px solid var(--border)',
            }}
              onMouseEnter={e=>{ if(!past&&!sel) e.currentTarget.style.background='var(--teal-light)'; }}
              onMouseLeave={e=>{ if(!past&&!sel) e.currentTarget.style.background=sun?'#FEF2F2':'#fff'; }}
            >{d.getDate()}</button>
          );
        })}
      </div>
      {selectedDates.length>0&&(
        <div style={{marginTop:14,padding:'10px 14px',background:'var(--teal-light)',borderRadius:10,border:'1px solid var(--teal-mid)'}}>
          <span style={{color:'var(--teal-dark)',fontWeight:700,fontSize:13}}>{selectedDates.length} jour(s) sélectionné(s)</span>
          <span style={{color:'var(--muted)',fontSize:12,marginLeft:8}}>· Cliquez pour désélectionner</span>
        </div>
      )}
    </div>
  );
}

function LeaveCalendar({employeeId,leaveRequests}){
  const today=new Date();
  const[vy,setVy]=useState(today.getFullYear());
  const[vm,setVm]=useState(today.getMonth());
  const days=getDaysInMonth(vy,vm),first=getFirstDayOfMonth(vy,vm);
  const dateMap=useMemo(()=>{
    const m={};
    leaveRequests.filter(r=>r.employeeId===employeeId).forEach(req=>{
      req.weeks.forEach(wEntry=>{
        const wd=getWeekDatesArr(wEntry.week,wEntry.year);
        wEntry.days.forEach(di=>{ if(wd[di]) m[wd[di].toDateString()]=req.status; });
      });
    });
    return m;
  },[leaveRequests,employeeId]);
  const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>new Date(vy,vm,i+1))];
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button onClick={()=>{ if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); }} className="btn btn-ghost btn-sm">‹</button>
        <span style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:16}}>{MONTH_NAMES[vm]} {vy}</span>
        <button onClick={()=>{ if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); }} className="btn btn-ghost btn-sm">›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
        {DAY_SHORT.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:700,color:'var(--dim)'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i}/>;
          const st=STATUS_MAP[dateMap[d.toDateString()]];
          const isToday=d.toDateString()===today.toDateString();
          return(
            <div key={i} style={{
              aspectRatio:'1',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
              background:st?st.bg:'#fff',
              border:isToday?'2px solid var(--teal)':st?`2px solid ${st.ring}`:'1.5px solid var(--border)',
              fontSize:13,fontWeight:isToday||st?700:400,
              color:st?st.color:isToday?'var(--teal-dark)':d.getDay()===0?'#C8002B':'var(--text)',
            }}>{d.getDate()}</div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:14,marginTop:14,flexWrap:'wrap'}}>
        {Object.entries(STATUS_MAP).map(([k,s])=>(
          <div key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--muted)'}}>
            <div style={{width:10,height:10,borderRadius:3,background:s.bg,border:`2px solid ${s.ring}`}}/>
            {s.icon} {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeaveRequestPage(){
  const{currentUser,employees,leaveRequests,submitLeaveRequest,deleteLeaveRequest}=useApp();
  const { currentEmpId } = useApp();
  const emp = employees.find(e => e.id === currentEmpId || e.name === currentUser);
  const[selDates,setSelDates]=useState([]);
  const[reason,setReason]=useState('');
  const[type,setType]=useState('vacation');
  const[submitting,setSubmitting]=useState(false);
  const[success,setSuccess]=useState(false);
  const[tab,setTab]=useState('new');

  const myReqs=leaveRequests.filter(r=>r.employeeId===emp?.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const toggleDate=d=>setSelDates(prev=>{
    const ex=prev.some(p=>p.toDateString()===d.toDateString());
    return ex?prev.filter(p=>p.toDateString()!==d.toDateString()):[...prev,d];
  });

  const handleSubmit=async()=>{
    if(!selDates.length||!emp) return;
    setSubmitting(true);
    await submitLeaveRequest({
      employeeId:emp.id, employeeName:emp.name, storeId:emp.storeId,
      type, reason, weeks:datesToWeekGroups(selDates),
      dates:selDates.map(d=>d.toISOString()),
    });
    setSelDates([]); setReason(''); setSuccess(true);
    setTimeout(()=>setSuccess(false),3000);
    setSubmitting(false); setTab('history');
  };

  if(!emp) return(
    <div style={{textAlign:'center',padding:'80px 20px'}}>
      <div style={{fontSize:52,marginBottom:14}}>🔒</div>
      <p style={{color:'var(--muted)',fontSize:16,fontWeight:600}}>Connectez-vous avec votre prénom</p>
    </div>
  );

  return(
    <div className="anim-up" style={{maxWidth:960,margin:'0 auto'}}>
      <div style={{marginBottom:32}}>
        <h1 className="page-title">🌴 Mes congés</h1>
        <p className="page-sub">Bonjour <strong style={{color:'var(--teal-dark)'}}>{emp.name}</strong> · {myReqs.length} demande(s)</p>
      </div>

      {success&&(
        <div style={{background:'#E8FAF0',border:'2px solid var(--teal-mid)',borderRadius:14,padding:'16px 22px',marginBottom:24,display:'flex',alignItems:'center',gap:14,animation:'fadeUp .3s ease'}}>
          <span style={{fontSize:32}}>🎉</span>
          <div><div style={{fontWeight:700,color:'#1A8A42',fontSize:16}}>Demande envoyée !</div><div style={{color:'var(--muted)',fontSize:13,marginTop:2}}>Votre manager va la traiter bientôt.</div></div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'var(--card2)',borderRadius:12,padding:4,marginBottom:26,border:'1px solid var(--border)',width:'fit-content'}}>
        {[{id:'new',l:'✏️ Nouvelle'},{id:'history',l:`📋 Historique (${myReqs.length})`},{id:'calendar',l:'📅 Calendrier'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'9px 18px',borderRadius:9,border:'none',cursor:'pointer',
            background:tab===t.id?'#fff':'transparent',
            color:tab===t.id?'var(--text)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:14,fontWeight:tab===t.id?700:500,
            boxShadow:tab===t.id?'var(--shadow)':'none',transition:'all .15s',
          }}>{t.l}</button>
        ))}
      </div>

      {/* NEW */}
      {tab==='new'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          <div className="card" style={{padding:26}}>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17,marginBottom:18}}>📅 Choisissez vos jours</h3>
            <CalendarPicker selectedDates={selDates} onToggle={toggleDate}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="card" style={{padding:20}}>
              <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:16,marginBottom:14}}>Type de congé</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {LEAVE_TYPES.map(lt=>(
                  <button key={lt.id} onClick={()=>setType(lt.id)} style={{
                    padding:'14px 10px',borderRadius:12,cursor:'pointer',textAlign:'left',
                    border:`2px solid ${type===lt.id?lt.color:lt.color+'30'}`,
                    background:type===lt.id?lt.bg:'#fff',
                    fontFamily:'var(--font-b)',transition:'all .15s',
                  }}>
                    <div style={{fontSize:24,marginBottom:6}}>{lt.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:type===lt.id?lt.color:'var(--text)'}}>{lt.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{padding:20}}>
              <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:16,marginBottom:12}}>Motif</h3>
              <textarea className="inp" rows={3} placeholder="Précisez si nécessaire..." value={reason} onChange={e=>setReason(e.target.value)} style={{resize:'vertical',lineHeight:1.6}}/>
              {selDates.length>0&&(
                <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'12px 14px',margin:'14px 0',fontSize:13}}>
                  <div style={{fontWeight:700,color:'var(--teal-dark)',marginBottom:6}}>Récapitulatif :</div>
                  {selDates.sort((a,b)=>a-b).slice(0,4).map(d=>(
                    <div key={d.toDateString()} style={{color:'var(--muted)',lineHeight:1.7}}>
                      📅 {d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                    </div>
                  ))}
                  {selDates.length>4&&<div style={{color:'var(--dim)'}}>+{selDates.length-4} autre(s)...</div>}
                </div>
              )}
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px',fontSize:15,borderRadius:12,marginTop:4}}
                onClick={handleSubmit} disabled={!selDates.length||submitting}>
                {submitting?'⏳ Envoi...':`📤 Envoyer · ${selDates.length} jour(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab==='history'&&(
        <div>
          {myReqs.length===0?(
            <div style={{textAlign:'center',padding:'70px 20px',background:'#fff',border:'2px dashed var(--border)',borderRadius:16}}>
              <div style={{fontSize:52,marginBottom:14}}>🌴</div>
              <p style={{color:'var(--muted)',fontWeight:600,fontSize:16}}>Aucune demande pour l'instant</p>
            </div>
          ):(
            <div style={{display:'grid',gap:12}}>
              {myReqs.map(req=>{
                const lt=LEAVE_TYPES.find(l=>l.id===req.type)||LEAVE_TYPES[0];
                const total=req.dates?.length||req.weeks?.reduce((a,w)=>a+w.days.length,0)||0;
                const st=STATUS_MAP[req.status];
                return(
                  <div key={req.id} className="card" style={{
                    padding:'18px 22px',display:'flex',alignItems:'center',gap:16,
                    borderLeft:`5px solid ${st.ring}`,transition:'all .15s',
                  }}>
                    <div style={{fontSize:34,flexShrink:0}}>{lt.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:6}}>
                        <span style={{fontWeight:700,fontSize:15}}>{lt.label}</span>
                        <StatusBadge status={req.status}/>
                      </div>
                      <div style={{fontSize:13,color:'var(--muted)'}}>
                        <strong style={{color:'var(--text)'}}>{total} jour(s)</strong>
                        {req.reason&&<span> · {req.reason}</span>}
                        <span style={{color:'var(--dim)',marginLeft:8}}>· {new Date(req.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</span>
                      </div>
                      <div style={{marginTop:6,display:'flex',gap:5,flexWrap:'wrap'}}>
                        {req.weeks?.map((w,i)=>(
                          <span key={i} style={{background:'var(--card2)',color:'var(--muted)',borderRadius:6,padding:'2px 8px',fontSize:11,border:'1px solid var(--border)'}}>S{w.week} · {w.days.length}j</span>
                        ))}
                      </div>
                    </div>
                    {req.status==='pending'&&(
                      <button className="btn btn-ghost btn-xs" onClick={()=>deleteLeaveRequest(req.id)} style={{color:'var(--dim)',flexShrink:0}}>Annuler</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR */}
      {tab==='calendar'&&(
        <div className="card" style={{padding:28}}>
          <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17,marginBottom:20}}>📅 Mes congés sur le calendrier</h3>
          <LeaveCalendar employeeId={emp.id} leaveRequests={leaveRequests}/>
        </div>
      )}
    </div>
  );
}
