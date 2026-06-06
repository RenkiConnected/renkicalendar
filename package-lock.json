import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const MONTHS = ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
const MONTH_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const LEAVE_TYPES = [
  {id:'vacation', label:'Congés payés', icon:'🌴', color:'#7C3AED', bg:'#F3EDFF'},
  {id:'sick',     label:'Maladie',      icon:'🤒', color:'#C8002B', bg:'#FFF0F2'},
  {id:'personal', label:'Motif perso',  icon:'👤', color:'#D05B00', bg:'#FFF3E0'},
  {id:'training', label:'Formation',    icon:'📚', color:'#1D6FD8', bg:'#EBF8FF'},
];

const STATUS_MAP = {
  pending:  {label:'En attente', bg:'#FFF7E0', color:'#B07D00', icon:'⏳', ring:'#F5D06A'},
  approved: {label:'Approuvé',   bg:'#E8FAF0', color:'#1A8A42', icon:'✅', ring:'var(--teal)'},
  rejected: {label:'Refusé',     bg:'#FFF0F2', color:'#C8002B', icon:'❌', ring:'#FFAAB6'},
};

function getWeekNumber(d) {
  // ISO week: week 1 = week containing Jan 4, Monday first
  // MUST match AppContext.getWeekDates exactly
  const date = new Date(d); date.setHours(0,0,0,0);
  const dow = date.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysToMon);
  const yr = monday.getFullYear();
  const jan4 = new Date(yr, 0, 4);
  const jan4dow = jan4.getDay();
  const j4dtm = jan4dow === 0 ? -6 : 1 - jan4dow;
  const startW1 = new Date(jan4);
  startW1.setDate(jan4.getDate() + j4dtm);
  const diff = monday - startW1;
  const wn = Math.round(diff / (7 * 86400000)) + 1;
  if (wn < 1) { return getWeekNumber(new Date(yr - 1, 11, 28)); }
  return wn;
}
function getWeekDates(wn, year) {
  // Same ISO calculation as AppContext.getWeekDates
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const startW1 = new Date(jan4);
  startW1.setDate(jan4.getDate() + daysToMon);
  const ws = new Date(startW1);
  ws.setDate(startW1.getDate() + (wn - 1) * 7);
  return Array.from({length:7}, (_,i) => { const d=new Date(ws); d.setDate(ws.getDate()+i); return d; });
}
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDayOfMonth(y,m){ const d=new Date(y,m,1).getDay(); return d===0?6:d-1; }
function datesToWeekGroups(dates) {
  const groups={};
  dates.forEach(d=>{
    const wn=getWeekNumber(d), yr=d.getFullYear(), key=`${yr}_W${wn}`;
    if(!groups[key]) groups[key]={week:wn,year:yr,days:[]};
    const wd=getWeekDates(wn,yr);
    const idx=wd.findIndex(w=>w.toDateString()===d.toDateString());
    if(idx>=0 && !groups[key].days.includes(idx)) groups[key].days.push(idx);
  });
  return Object.values(groups);
}

function StatusBadge({status}) {
  const s=STATUS_MAP[status]||STATUS_MAP.pending;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,background:s.bg,color:s.color,fontSize:12,fontWeight:700}}>{s.icon} {s.label}</span>;
}

/* ── CALENDAR PICKER ──────────────────────────────── */
function CalendarPicker({ selectedDates, onToggle, onSelectWeek }) {
  const today = new Date();
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());

  const days = getDaysInMonth(vy,vm);
  const first = getFirstDayOfMonth(vy,vm);
  const cells = [...Array(first).fill(null), ...Array.from({length:days},(_,i)=>new Date(vy,vm,i+1))];

  // Group cells into weeks
  const weeks = [];
  for (let i=0; i<cells.length; i+=7) weeks.push(cells.slice(i,i+7));
  // Pad last week
  while(weeks.length>0 && weeks[weeks.length-1].length<7) weeks[weeks.length-1].push(null);

  const isSel = d => d && selectedDates.some(s=>s.toDateString()===d.toDateString());
  const isPast = d => d && d < new Date(today.getFullYear(),today.getMonth(),today.getDate());

  // Check if whole week is selected
  const isWeekSel = (week) => {
    const workDays = week.filter(d=>d && !isPast(d));
    return workDays.length > 0 && workDays.every(d => isSel(d));
  };

  const handleSelectWeek = (week) => {
    const workDays = week.filter(d => d && !isPast(d));
    if (workDays.length === 0) return;
    onSelectWeek(workDays);
  };

  const prev = () => { if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); };
  const next = () => { if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); };

  return (
    <div>
      {/* Month nav */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <button onClick={prev} className="btn btn-ghost btn-sm" style={{padding:'8px 12px'}}>‹</button>
        <span style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17}}>{MONTH_FULL[vm]} {vy}</span>
        <button onClick={next} className="btn btn-ghost btn-sm" style={{padding:'8px 12px'}}>›</button>
      </div>

      {/* Header */}
      <div style={{display:'grid',gridTemplateColumns:'36px repeat(7,1fr)',gap:3,marginBottom:4}}>
        <div style={{fontSize:10,color:'var(--dim)',textAlign:'center',paddingTop:4}}>Sem.</div>
        {DAYS_SHORT.map(d=>(
          <div key={d} style={{textAlign:'center',fontSize:12,fontWeight:700,color:'var(--dim)',padding:'4px 0'}}>{d}</div>
        ))}
      </div>

      {/* Weeks with week selector */}
      {weeks.map((week, wi) => {
        const weekDays = week.filter(d=>d);
        if(weekDays.length===0) return null;
        const wn = getWeekNumber(weekDays[0]);
        const allSel = isWeekSel(week);
        return (
          <div key={wi} style={{display:'grid',gridTemplateColumns:'36px repeat(7,1fr)',gap:3,marginBottom:3}}>
            {/* Week number button */}
            <button onClick={()=>handleSelectWeek(week)} style={{
              borderRadius:8, border:`1.5px solid ${allSel?'var(--teal)':'var(--border)'}`,
              background:allSel?'var(--teal)':'var(--card2)',
              color:allSel?'#fff':'var(--muted)',
              fontFamily:'var(--font-b)',fontSize:11,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              transition:'all .15s',padding:'2px',
            }} title={`Sélectionner toute la semaine ${wn}`}>
              S{wn}
            </button>
            {/* Day cells */}
            {week.map((d,di)=>{
              if(!d) return <div key={di}/>;
              const sel=isSel(d), past=isPast(d), sun=d.getDay()===0;
              return(
                <button key={di} onClick={()=>!past&&onToggle(d)} disabled={past} style={{
                  aspectRatio:'1',borderRadius:9,border:`1.5px solid ${sel?'var(--teal-dark)':sun?'#FFCDD2':'var(--border)'}`,
                  background:sel?'var(--teal)':sun?'#FEF2F2':'#fff',
                  color:sel?'#fff':past?'var(--dim)':sun?'#C8002B':'var(--text)',
                  fontWeight:sel?700:400,fontSize:14,cursor:past?'not-allowed':'pointer',
                  opacity:past?.4:1,fontFamily:'var(--font-b)',
                  transition:'all .13s',
                  boxShadow:sel?'0 2px 8px rgba(0,201,177,.35)':'none',
                  transform:sel?'scale(1.07)':'scale(1)',
                }}
                  onMouseEnter={e=>{ if(!past&&!sel) e.currentTarget.style.background='var(--teal-light)'; }}
                  onMouseLeave={e=>{ if(!past&&!sel) e.currentTarget.style.background=sun?'#FEF2F2':'#fff'; }}
                >{d.getDate()}</button>
              );
            })}
          </div>
        );
      })}

      {/* Selected summary */}
      {selectedDates.length > 0 && (
        <div style={{marginTop:14,padding:'10px 14px',background:'var(--teal-light)',borderRadius:10,border:'1px solid var(--teal-mid)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'var(--teal-dark)',fontWeight:700,fontSize:14}}>✓ {selectedDates.length} jour(s) sélectionné(s)</span>
          <button className="btn btn-ghost btn-xs" onClick={()=>selectedDates.forEach(d=>onToggle(d))} style={{fontSize:12}}>Tout effacer</button>
        </div>
      )}
    </div>
  );
}

/* ── LEAVE CALENDAR (overview) ────────────────────── */
function LeaveCalendar({ empId, leaveRequests }) {
  const today = new Date();
  const [vy,setVy] = useState(today.getFullYear());
  const [vm,setVm] = useState(today.getMonth());
  const days=getDaysInMonth(vy,vm), first=getFirstDayOfMonth(vy,vm);
  const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>new Date(vy,vm,i+1))];

  const dateMap = useMemo(()=>{
    const m={};
    leaveRequests.filter(r=>r.employeeId===empId).forEach(req=>{
      req.weeks?.forEach(we=>{
        const wd=getWeekDates(we.week,we.year);
        we.days.forEach(di=>{ if(wd[di]) m[wd[di].toDateString()]=req.status; });
      });
    });
    return m;
  },[leaveRequests,empId]);

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button onClick={()=>{ if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1); }} className="btn btn-ghost btn-sm">‹</button>
        <span style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:16}}>{MONTH_FULL[vm]} {vy}</span>
        <button onClick={()=>{ if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1); }} className="btn btn-ghost btn-sm">›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
        {DAYS_SHORT.map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:700,color:'var(--dim)'}}>{d}</div>)}
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
              border:isToday?'2.5px solid var(--teal)':st?`2px solid ${st.ring}`:'1.5px solid var(--border)',
              fontSize:13,fontWeight:isToday||st?700:400,
              color:st?st.color:isToday?'var(--teal-dark)':d.getDay()===0?'#C8002B':'var(--text)',
            }}>{d.getDate()}</div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:12,marginTop:14,flexWrap:'wrap'}}>
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

/* ── MAIN ─────────────────────────────────────────── */
export default function LeaveRequestPage() {
  const { currentUser, currentEmpId, employees, leaveRequests, submitLeaveRequest, deleteLeaveRequest } = useApp();
  const emp = employees.find(e=>e.id===currentEmpId||e.name===currentUser);
  const [selDates, setSelDates] = useState([]);
  const [type, setType] = useState('vacation');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState('new');

  const myReqs = leaveRequests.filter(r=>r.employeeId===emp?.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const toggleDate = d => setSelDates(prev => {
    const ex=prev.some(p=>p.toDateString()===d.toDateString());
    return ex?prev.filter(p=>p.toDateString()!==d.toDateString()):[...prev,d];
  });

  // Select/deselect a whole week
  const toggleWeek = (days) => {
    const allSel = days.every(d=>selDates.some(s=>s.toDateString()===d.toDateString()));
    if (allSel) {
      setSelDates(prev=>prev.filter(p=>!days.some(d=>d.toDateString()===p.toDateString())));
    } else {
      const toAdd = days.filter(d=>!selDates.some(s=>s.toDateString()===d.toDateString()));
      setSelDates(prev=>[...prev,...toAdd]);
    }
  };

  const handleSubmit = async () => {
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
      <p style={{color:'var(--muted)',fontSize:16,fontWeight:600}}>Impossible de trouver votre profil</p>
      <p style={{color:'var(--dim)',fontSize:14,marginTop:6}}>Déconnectez-vous et reconnectez-vous</p>
    </div>
  );

  return (
    <div className="anim-up">
      <div style={{marginBottom:28}}>
        <h1 className="page-title">🌴 Mes congés</h1>
        <p className="page-sub">Bonjour <strong style={{color:'var(--teal-dark)'}}>{emp.name}</strong> · {myReqs.length} demande(s)</p>
      </div>

      {/* Success */}
      {success && (
        <div style={{background:'#E8FAF0',border:'2px solid var(--teal-mid)',borderRadius:14,padding:'16px 22px',marginBottom:24,display:'flex',alignItems:'center',gap:14,animation:'fadeUp .3s ease'}}>
          <span style={{fontSize:30}}>🎉</span>
          <div><div style={{fontWeight:700,color:'#1A8A42',fontSize:16}}>Demande envoyée !</div><div style={{color:'var(--muted)',fontSize:14,marginTop:2}}>Votre manager va la traiter bientôt.</div></div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'var(--card2)',borderRadius:12,padding:4,marginBottom:26,border:'1.5px solid var(--border)',width:'fit-content'}}>
        {[{id:'new',l:'✏️ Nouvelle'},{id:'history',l:`📋 Historique (${myReqs.length})`},{id:'calendar',l:'📅 Calendrier'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 18px',borderRadius:9,border:'none',cursor:'pointer',
            background:tab===t.id?'#fff':'transparent',
            color:tab===t.id?'var(--text)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:14,fontWeight:tab===t.id?700:500,
            boxShadow:tab===t.id?'var(--shadow)':'none',transition:'all .15s',
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── NOUVELLE DEMANDE */}
      {tab==='new' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          {/* Calendrier */}
          <div className="card" style={{padding:26}}>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17,marginBottom:6}}>📅 Choisissez vos jours</h3>
            <p style={{color:'var(--muted)',fontSize:13,marginBottom:18}}>
              Cliquez sur un <strong>jour</strong> ou sur le bouton <strong>Sem.</strong> pour toute la semaine
            </p>
            <CalendarPicker selectedDates={selDates} onToggle={toggleDate} onSelectWeek={toggleWeek}/>
          </div>

          {/* Détails */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Type */}
            <div className="card" style={{padding:20}}>
              <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:16,marginBottom:14}}>Type de congé</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {LEAVE_TYPES.map(lt=>(
                  <button key={lt.id} onClick={()=>setType(lt.id)} style={{
                    padding:'14px 12px',borderRadius:12,cursor:'pointer',textAlign:'left',
                    border:`2px solid ${type===lt.id?lt.color:lt.color+'30'}`,
                    background:type===lt.id?lt.bg:'#fff',
                    fontFamily:'var(--font-b)',transition:'all .15s',
                  }}>
                    <div style={{fontSize:26,marginBottom:7}}>{lt.icon}</div>
                    <div style={{fontSize:13,fontWeight:700,color:type===lt.id?lt.color:'var(--text)'}}>{lt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motif + envoi */}
            <div className="card" style={{padding:20}}>
              <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:16,marginBottom:12}}>Motif (optionnel)</h3>
              <textarea className="inp" rows={3} placeholder="Précisez si nécessaire..." value={reason} onChange={e=>setReason(e.target.value)} style={{lineHeight:1.6}}/>

              {selDates.length>0 && (
                <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:11,padding:'13px 16px',margin:'14px 0'}}>
                  <div style={{fontWeight:700,color:'var(--teal-dark)',fontSize:14,marginBottom:8}}>
                    📋 Récapitulatif — {selDates.length} jour(s)
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {selDates.sort((a,b)=>a-b).map(d=>(
                      <span key={d.toDateString()} style={{background:'white',border:'1px solid var(--teal-mid)',borderRadius:7,padding:'3px 9px',fontSize:12,color:'var(--teal-dark)',fontWeight:600}}>
                        {d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'15px',fontSize:15,borderRadius:12}}
                onClick={handleSubmit} disabled={!selDates.length||submitting}>
                {submitting?'⏳ Envoi...':`📤 Envoyer · ${selDates.length} jour(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIQUE */}
      {tab==='history' && (
        myReqs.length===0?(
          <div style={{textAlign:'center',padding:'70px 20px',background:'#fff',border:'2px dashed var(--border)',borderRadius:16}}>
            <div style={{fontSize:52,marginBottom:14}}>🌴</div>
            <p style={{color:'var(--muted)',fontWeight:600,fontSize:16}}>Aucune demande pour l'instant</p>
          </div>
        ):(
          <div style={{display:'grid',gap:12}}>
            {myReqs.map(req=>{
              const lt=LEAVE_TYPES.find(l=>l.id===req.type)||LEAVE_TYPES[0];
              const total=req.dates?.length||req.weeks?.reduce((a,w)=>a+w.days.length,0)||0;
              const s=STATUS_MAP[req.status];
              return(
                <div key={req.id} className="card" style={{
                  padding:'18px 22px',display:'flex',alignItems:'center',gap:16,
                  borderLeft:`5px solid ${s.ring}`,
                }}>
                  <span style={{fontSize:34,flexShrink:0}}>{lt.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
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
        )
      )}

      {/* ── CALENDRIER */}
      {tab==='calendar' && (
        <div className="card" style={{padding:28,maxWidth:520}}>
          <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:17,marginBottom:20}}>📅 Mes congés sur le calendrier</h3>
          <LeaveCalendar empId={emp.id} leaveRequests={leaveRequests}/>
        </div>
      )}
    </div>
  );
}
