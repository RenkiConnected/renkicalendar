import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

const BREAK_OPTIONS = [
  { value: 0, label: 'Pas de pause' },
  { value: 0.5, label: '30 min' },
  { value: 1, label: '1 heure' },
];

function getShiftMeta(shiftTypes, typeId) {
  return shiftTypes.find(s=>s.id===typeId) || { label:typeId, color:'#6366F1', bgColor:'#EEF2FF' };
}

function calcHours(start, end, breakH) {
  try {
    const [sh,sm]=start.split(':').map(Number);
    const [eh,em]=end.split(':').map(Number);
    const diff = (eh*60+em)-(sh*60+sm);
    return diff>0 ? Math.max(0, diff/60 - breakH) : 0;
  } catch { return 0; }
}

/* ── SHIFT MODAL ─────────────────────────────── */
function ShiftModal({ emp, dayIndex, day, shift, onSave, onDelete, onClose, shiftTypes }) {
  const [type, setType] = useState(shift?.type||'work');
  const [start, setStart] = useState(shift?.startTime||'09:00');
  const [end, setEnd] = useState(shift?.endTime||'18:00');
  const [breakH, setBreakH] = useState(shift?.breakH ?? 1);
  const [note, setNote] = useState(shift?.note||'');
  const [depannage, setDepannage] = useState(shift?.depannage||false);

  const needsTime = ['work','communication','meeting'].includes(type);
  const hours = needsTime ? calcHours(start,end,breakH) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, color:'var(--text)' }}>Modifier le créneau</h3>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>
              <strong>{emp.name}</strong> · {day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Type */}
        <div style={{ marginBottom:18 }}>
          <label className="label">Type de créneau</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {shiftTypes.map(st=>(
              <button key={st.id} onClick={()=>setType(st.id)} style={{
                padding:'7px 14px', borderRadius:30, border:`1.5px solid ${type===st.id?st.color:st.color+'40'}`,
                background: type===st.id ? st.bgColor : 'white',
                color: st.color, fontWeight: type===st.id ? 700 : 500,
                fontSize:13, cursor:'pointer', transition:'all 0.15s',
                fontFamily:'var(--font-body)',
              }}>{st.label}</button>
            ))}
          </div>
        </div>

        {/* Times */}
        {needsTime && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label className="label">Début</label>
                <input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} />
              </div>
              <div>
                <label className="label">Fin</label>
                <input className="input" type="time" value={end} onChange={e=>setEnd(e.target.value)} />
              </div>
            </div>

            {/* Pause */}
            <div style={{ marginBottom:14 }}>
              <label className="label">Pause déjeuner</label>
              <div style={{ display:'flex', gap:8 }}>
                {BREAK_OPTIONS.map(b=>(
                  <button key={b.value} onClick={()=>setBreakH(b.value)} style={{
                    flex:1, padding:'9px', borderRadius:9, border:`1.5px solid ${breakH===b.value?'var(--care-teal)':'var(--border-dark)'}`,
                    background: breakH===b.value ? 'var(--care-teal-light)' : 'white',
                    color: breakH===b.value ? 'var(--care-teal-dark)' : 'var(--text-muted)',
                    fontSize:13, fontWeight: breakH===b.value ? 700 : 500,
                    cursor:'pointer', fontFamily:'var(--font-body)',
                  }}>{b.label}</button>
                ))}
              </div>
            </div>

            {/* Hours calculated */}
            {hours > 0 && (
              <div style={{ background:'var(--care-teal-light)', border:'1px solid var(--care-teal-mid)', borderRadius:9, padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>⏱</span>
                <div>
                  <span style={{ color:'var(--care-teal-dark)', fontWeight:700, fontSize:15 }}>{hours.toFixed(2)}h</span>
                  <span style={{ color:'var(--text-muted)', fontSize:12, marginLeft:8 }}>({start}→{end} - {breakH}h pause)</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Note */}
        <div style={{ marginBottom:14 }}>
          <label className="label">Note</label>
          <input className="input" type="text" placeholder="Remarque optionnelle..." value={note} onChange={e=>setNote(e.target.value)} />
        </div>

        {/* Dépannage */}
        <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22, cursor:'pointer', fontSize:13, color:'var(--text-muted)' }}>
          <input type="checkbox" checked={depannage} onChange={e=>setDepannage(e.target.checked)} style={{ accentColor:'var(--care-teal)', width:16, height:16 }} />
          Dépannage (employé d'un autre magasin)
        </label>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}
            onClick={()=>onSave({ type, startTime:needsTime?start:null, endTime:needsTime?end:null, breakH:needsTime?breakH:0, hours:needsTime?parseFloat(hours.toFixed(2)):null, note, depannage })}>
            ✓ Enregistrer
          </button>
          {shift && <button className="btn btn-danger" onClick={onDelete}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

/* ── AUTO-GENERATE MODAL ──────────────────────── */
function AutoGenModal({ store, employees, onGenerate, onClose, shiftTypes }) {
  const [restDay, setRestDay] = useState('0'); // 0=Lundi
  const [breakH, setBreakH] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const DAYS_SHORT = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20 }}>⚡ Génération automatique</h3>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>{store.name}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ background:'var(--care-teal-light)', border:'1px solid var(--care-teal-mid)', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--care-teal-dark)' }}>
          ℹ️ Repos automatique : <strong>Dimanche</strong> + <strong>1 jour choisi</strong> dans la semaine
        </div>

        <div style={{ marginBottom:16 }}>
          <label className="label">Jour de repos en semaine</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {DAYS_SHORT.map((d,i)=>(
              <button key={i} onClick={()=>setRestDay(String(i))} style={{
                padding:'8px 14px', borderRadius:9, border:`1.5px solid ${restDay===String(i)?'var(--care-teal)':'var(--border-dark)'}`,
                background: restDay===String(i)?'var(--care-teal-light)':'white',
                color: restDay===String(i)?'var(--care-teal-dark)':'var(--text-muted)',
                fontSize:13, fontWeight: restDay===String(i)?700:500,
                cursor:'pointer', fontFamily:'var(--font-body)',
              }}>{d}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div><label className="label">Heure début</label><input className="input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} /></div>
          <div><label className="label">Heure fin</label><input className="input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} /></div>
        </div>

        <div style={{ marginBottom:22 }}>
          <label className="label">Pause déjeuner</label>
          <div style={{ display:'flex', gap:8 }}>
            {BREAK_OPTIONS.map(b=>(
              <button key={b.value} onClick={()=>setBreakH(b.value)} style={{
                flex:1, padding:'9px', borderRadius:9,
                border:`1.5px solid ${breakH===b.value?'var(--care-teal)':'var(--border-dark)'}`,
                background: breakH===b.value?'var(--care-teal-light)':'white',
                color: breakH===b.value?'var(--care-teal-dark)':'var(--text-muted)',
                fontSize:13, fontWeight: breakH===b.value?700:500,
                cursor:'pointer', fontFamily:'var(--font-body)',
              }}>{b.label}</button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px' }}
          onClick={()=>onGenerate({ restDay:parseInt(restDay), breakH, startTime, endTime })}>
          ⚡ Générer le planning
        </button>
      </div>
    </div>
  );
}

/* ── WEEK NAV ─────────────────────────────────── */
function WeekNav({ currentWeek, setCurrentWeek }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCurrentWeek(w=>Math.max(1,w-1))}>‹</button>
      <div style={{ background:'var(--care-teal-light)', border:'1px solid var(--care-teal-mid)', borderRadius:10, padding:'8px 20px', minWidth:90, textAlign:'center' }}>
        <span style={{ fontFamily:'var(--font-head)', fontWeight:800, color:'var(--care-teal-dark)', fontSize:17 }}>S{currentWeek}</span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCurrentWeek(w=>Math.min(52,w+1))}>›</button>
    </div>
  );
}

/* ── MAIN COMPONENT ───────────────────────────── */
export default function PlanningEditor() {
  const { stores, employees, shiftTypes, getSchedule, setShift, currentWeek, setCurrentWeek, currentYear, selectedStore, setSelectedStore, getWeekDatesForCurrentWeek } = useApp();
  const [activeStore, setActiveStoreLocal] = useState(selectedStore||stores[0]?.id||'');
  const [viewMode, setViewMode] = useState('week');
  const [activeDay, setActiveDay] = useState(0);
  const [editingCell, setEditingCell] = useState(null);
  const [allowWeekend, setAllowWeekend] = useState(false);
  const [showAutoGen, setShowAutoGen] = useState(false);
  const [confirmWeekend, setConfirmWeekend] = useState(null);

  const store = stores.find(s=>s.id===activeStore);
  const storeEmps = employees.filter(e=>e.storeId===activeStore);
  const weekDates = getWeekDatesForCurrentWeek(currentWeek);
  const schedule = getSchedule(activeStore, currentWeek, currentYear);
  const displayDays = allowWeekend ? weekDates : weekDates.slice(0,6);

  const setStore = (id) => { setActiveStoreLocal(id); setSelectedStore(id); };

  const totalH = (empId) => {
    let t=0;
    weekDates.forEach((_,i)=>{ const s=schedule[`${empId}_${i}`]; if(s?.hours) t+=s.hours; });
    return t;
  };

  const handleCell = (empId, dayIdx) => {
    const dow = weekDates[dayIdx].date.getDay();
    if(!allowWeekend && (dow===0||dow===6)) { setConfirmWeekend({empId,dayIdx}); return; }
    setEditingCell({empId,dayIdx});
  };

  const handleSave = (data) => { if(!editingCell) return; setShift(activeStore,currentWeek,currentYear,editingCell.empId,editingCell.dayIdx,data); setEditingCell(null); };
  const handleDelete = () => { if(!editingCell) return; setShift(activeStore,currentWeek,currentYear,editingCell.empId,editingCell.dayIdx,null); setEditingCell(null); };

  const handleAutoGenerate = ({ restDay, breakH, startTime, endTime }) => {
    const h = calcHours(startTime, endTime, breakH);
    storeEmps.forEach(emp => {
      weekDates.forEach((wd, i) => {
        const dow = wd.date.getDay(); // 0=Sun,1=Mon...6=Sat
        const mappedDay = dow === 0 ? 6 : dow - 1; // convert to Mon=0..Sun=6
        const isRestDay = mappedDay === restDay;
        const isSunday = dow === 0;
        if (isSunday || isRestDay) {
          setShift(activeStore, currentWeek, currentYear, emp.id, i, { type:'rest', startTime:null, endTime:null, breakH:0, hours:null, note:'', depannage:false });
        } else {
          setShift(activeStore, currentWeek, currentYear, emp.id, i, { type:'work', startTime, endTime, breakH, hours:parseFloat(h.toFixed(2)), note:'', depannage:false });
        }
      });
    });
    setShowAutoGen(false);
  };

  return (
    <div className="fade-up" style={{ maxWidth:1400, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 className="page-title">📅 Plannings</h1>
          <p className="page-sub">Édition des horaires · Glissez ou cliquez sur une case</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <WeekNav currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} />
          <button className="btn btn-secondary btn-sm" onClick={()=>setAllowWeekend(!allowWeekend)}>
            {allowWeekend?'Masquer dim.':'Voir dim.'}
          </button>
          {store && (
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowAutoGen(true)}>
              ⚡ Auto-générer
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={()=>window.dispatchEvent(new CustomEvent('exportPDF',{detail:{storeId:activeStore,week:currentWeek}}))}>
            📄 PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={()=>window.dispatchEvent(new CustomEvent('exportNotion',{detail:{storeId:activeStore,week:currentWeek}}))}>
            📋 Notion
          </button>
        </div>
      </div>

      {/* Store tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        {stores.map(s=>(
          <button key={s.id} onClick={()=>setStore(s.id)} style={{
            padding:'9px 18px', borderRadius:30, border:`1.5px solid ${activeStore===s.id?s.color:s.color+'30'}`,
            background: activeStore===s.id ? s.color : 'white',
            color: activeStore===s.id ? 'white' : s.color,
            fontFamily:'var(--font-body)', fontSize:13, fontWeight: activeStore===s.id ? 700 : 500,
            cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
            boxShadow: activeStore===s.id ? `0 4px 12px ${s.color}40` : 'none',
          }}>{s.name}</button>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', background:'var(--bg-card2)', borderRadius:10, padding:3, border:'1px solid var(--border-dark)' }}>
          {['week','day'].map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{
              padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer',
              background: viewMode===m ? 'var(--care-teal)' : 'transparent',
              color: viewMode===m ? 'white' : 'var(--text-muted)',
              fontFamily:'var(--font-body)', fontSize:13, fontWeight: viewMode===m?700:500,
              transition:'all 0.15s',
            }}>{m==='week'?'Semaine':'Journée'}</button>
          ))}
        </div>
        {viewMode==='day' && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {weekDates.map((wd,i)=>(
              <button key={i} onClick={()=>setActiveDay(i)} style={{
                padding:'6px 12px', borderRadius:8, border:`1.5px solid ${activeDay===i?'var(--care-teal)':'var(--border-dark)'}`,
                background: activeDay===i?'var(--care-teal-light)':'white',
                color: activeDay===i?'var(--care-teal-dark)':'var(--text-muted)',
                fontSize:12, fontWeight: activeDay===i?700:400,
                cursor:'pointer', fontFamily:'var(--font-body)',
              }}>
                {wd.day.slice(0,3)} {wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend pills */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {shiftTypes.map(st=>(
          <span key={st.id} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', background:st.bgColor, borderRadius:20, border:`1px solid ${st.color}30`, fontSize:12, color:st.color, fontWeight:600 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:st.color, display:'inline-block' }} />
            {st.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      {storeEmps.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--bg-card2)', border:'2px dashed var(--border-dark)', borderRadius:16 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
          <p style={{ color:'var(--text-muted)', fontWeight:600 }}>Aucun employé dans ce magasin</p>
          <p style={{ color:'var(--text-dim)', fontSize:13, marginTop:6 }}>Ajoutez des employés via la section Employés</p>
        </div>
      ) : viewMode==='week' ? (
        <WeekView employees={storeEmps} displayDays={displayDays} weekDates={weekDates} schedule={schedule} shiftTypes={shiftTypes} onCell={handleCell} totalH={totalH} />
      ) : (
        <DayView employees={storeEmps} day={weekDates[activeDay]} dayIdx={activeDay} schedule={schedule} shiftTypes={shiftTypes} onCell={handleCell} />
      )}

      {/* Modals */}
      {editingCell && (() => {
        const emp=employees.find(e=>e.id===editingCell.empId);
        const shift=schedule[`${editingCell.empId}_${editingCell.dayIdx}`];
        return <ShiftModal emp={emp} dayIndex={editingCell.dayIdx} day={weekDates[editingCell.dayIdx]} shift={shift} onSave={handleSave} onDelete={handleDelete} onClose={()=>setEditingCell(null)} shiftTypes={shiftTypes} />;
      })()}

      {confirmWeekend && (
        <div className="modal-overlay" onClick={()=>setConfirmWeekend(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ maxWidth:360, textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <h3 style={{ fontFamily:'var(--font-head)', fontWeight:800, marginBottom:8 }}>Jour non travaillé</h3>
            <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:20 }}>Ce jour est un dimanche ou férié. Confirmer quand même ?</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button className="btn btn-ghost" onClick={()=>setConfirmWeekend(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>{ setAllowWeekend(true); setEditingCell(confirmWeekend); setConfirmWeekend(null); }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {showAutoGen && store && (
        <AutoGenModal store={store} employees={storeEmps} onGenerate={handleAutoGenerate} onClose={()=>setShowAutoGen(false)} shiftTypes={shiftTypes} />
      )}
    </div>
  );
}

/* ── WEEK VIEW ────────────────────────────────── */
function WeekView({ employees, displayDays, weekDates, schedule, shiftTypes, onCell, totalH }) {
  return (
    <div className="card" style={{ overflowX:'auto', padding:0 }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
        <thead>
          <tr style={{ background:'var(--bg-card2)', borderBottom:'2px solid var(--border-dark)' }}>
            <th style={{ padding:'14px 16px', textAlign:'left', fontSize:12, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', width:160, whiteSpace:'nowrap' }}>Employé</th>
            {displayDays.map((wd,i)=>(
              <th key={i} style={{ padding:'12px 8px', textAlign:'center', minWidth:90 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{wd.day.slice(0,3)}</div>
                <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
              </th>
            ))}
            <th style={{ padding:'12px 14px', textAlign:'center', fontSize:12, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', width:80 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp,ei)=>{
            const t=totalH(emp.id);
            const contract=emp.contractHours||35;
            const diff=t-contract;
            return (
              <tr key={emp.id} style={{ borderBottom:'1px solid var(--border-dark)', background: ei%2===0?'white':'var(--bg-card2)' }}>
                <td style={{ padding:'10px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:emp.color||'var(--care-teal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'white', flexShrink:0, boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>{emp.name[0]}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{emp.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-dim)', textTransform:'capitalize' }}>{emp.role} · {contract}h</div>
                    </div>
                  </div>
                </td>
                {displayDays.map((wd,di)=>{
                  const realIdx=weekDates.indexOf(wd);
                  const shift=schedule[`${emp.id}_${realIdx}`];
                  const st=shift?getShiftMeta2(shiftTypes,shift.type):null;
                  return (
                    <td key={di} style={{ padding:'6px 5px' }}>
                      {shift ? (
                        <div onClick={()=>onCell(emp.id,realIdx)} className="shift-pill" style={{
                          background:st.bgColor, border:`1px solid ${st.color}40`,
                          padding:'6px 4px', minHeight:52, cursor:'pointer',
                        }}>
                          <span style={{ fontSize:11, fontWeight:700, color:st.color }}>{st.label}</span>
                          {shift.startTime && <span style={{ fontSize:10, color:st.color, opacity:0.8 }}>{shift.startTime}–{shift.endTime}</span>}
                          {shift.hours>0 && <span style={{ fontSize:10, color:st.color, opacity:0.7 }}>{shift.hours}h{shift.breakH>0?` (-${shift.breakH}h)`:''}</span>}
                          {shift.depannage && <span style={{ fontSize:9, color:'#D05B00' }}>⚡Dep</span>}
                        </div>
                      ) : (
                        <div onClick={()=>onCell(emp.id,realIdx)} style={{
                          minHeight:52, borderRadius:9, border:'1.5px dashed var(--border-dark)',
                          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
                          transition:'all 0.15s', color:'var(--text-dim)', fontSize:18,
                        }}
                          onMouseEnter={e=>{e.currentTarget.style.background='var(--care-teal-light)';e.currentTarget.style.borderColor='var(--care-teal)';e.currentTarget.style.color='var(--care-teal)';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.borderColor='';e.currentTarget.style.color='';}}
                        >+</div>
                      )}
                    </td>
                  );
                })}
                <td style={{ padding:'10px 14px', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:16, color: diff>2?'#C8002B':diff<-2?'var(--text-dim)':'var(--care-teal-dark)' }}>
                    {t.toFixed(1)}h
                  </div>
                  <div style={{ fontSize:10, color: diff>0?'#C8002B':'#1A8A42', fontWeight:600 }}>
                    {diff>0?`+${diff.toFixed(1)}`:diff.toFixed(1)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── DAY VIEW ─────────────────────────────────── */
function DayView({ employees, day, dayIdx, schedule, shiftTypes, onCell }) {
  return (
    <div>
      <div className="card-teal" style={{ padding:'14px 20px', marginBottom:16 }}>
        <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, textTransform:'capitalize' }}>
          {day.day} — {day.date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </h3>
      </div>
      <div style={{ display:'grid', gap:10 }}>
        {employees.map(emp=>{
          const shift=schedule[`${emp.id}_${dayIdx}`];
          const st=shift?getShiftMeta2(shiftTypes,shift.type):null;
          return (
            <div key={emp.id} onClick={()=>onCell(emp.id,dayIdx)} className="card" style={{
              display:'flex', alignItems:'center', gap:16, padding:'16px 20px',
              cursor:'pointer', transition:'all 0.15s',
              background: shift?st.bgColor:'white',
              borderLeft: shift?`4px solid ${st.color}`:'4px solid var(--border-dark)',
            }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}
            >
              <div style={{ width:42, height:42, borderRadius:'50%', background:emp.color||'var(--care-teal)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'white', fontSize:16, flexShrink:0 }}>{emp.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{emp.name}</div>
                <div style={{ color:'var(--text-dim)', fontSize:12 }}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
              {shift ? (
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700, color:st.color, fontSize:15 }}>{st.label}</div>
                  {shift.startTime && <div style={{ color:'var(--text-muted)', fontSize:12 }}>{shift.startTime}–{shift.endTime} · {shift.hours}h</div>}
                  {shift.breakH>0 && <div style={{ color:'var(--text-dim)', fontSize:11 }}>Pause {shift.breakH}h</div>}
                </div>
              ) : <span style={{ color:'var(--text-dim)', fontSize:24, fontWeight:300 }}>+</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getShiftMeta2(shiftTypes, typeId) {
  return shiftTypes.find(s=>s.id===typeId)||{label:typeId,color:'#6366F1',bgColor:'#EEF2FF'};
}
