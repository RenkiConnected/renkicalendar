import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const DAY_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

export default function PublicPlanning({ onLogin }) {
  const { stores, employees, shiftTypes, schedules, currentWeek, setCurrentWeek, currentYear, getWeekDatesForCurrentWeek } = useApp();
  const [activeStore, setActiveStore] = useState(stores[0]?.id || '');
  const [popup, setPopup] = useState(null); // {emp, shift, st, day}
  const weekDates = getWeekDatesForCurrentWeek(currentWeek);
  const store = stores.find(s => s.id === activeStore);
  const storeEmps = employees.filter(e => e.storeId === activeStore);
  const schedKey = `${activeStore}_${currentYear}_W${currentWeek}`;
  const sched = schedules[schedKey] || {};

  const getMeta = (typeId) => shiftTypes.find(s => s.id === typeId) || { label: typeId, color: '#6366F1', bgColor: '#EEF2FF' };

  const startDate = weekDates[0]?.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const endDate = weekDates[6]?.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const ShiftPopup2 = () => {
    if(!popup) return null;
    const {emp,shift,st,st2,day} = popup;
    return(
      <div style={{position:'fixed',inset:0,background:'rgba(27,42,59,.5)',backdropFilter:'blur(5px)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setPopup(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,padding:'20px 20px 40px',boxShadow:'0 -8px 40px rgba(0,0,0,.2)'}}>
          <div style={{width:36,height:4,background:'#E2EBF0',borderRadius:2,margin:'0 auto 16px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17}}>{emp.name[0]}</div>
            <div>
              <div style={{fontWeight:800,fontSize:17}}>{emp.name}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>{day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
            </div>
          </div>
          <div style={{background:st.bgColor,border:`2px solid ${st.color}50`,borderRadius:14,padding:'14px 16px',marginBottom:st2?8:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:800,fontSize:17,color:st.color}}>{st.label}</span>
              {shift.hours>0&&<span style={{fontWeight:700,fontSize:18,color:st.color}}>{shift.hours}h</span>}
            </div>
            {shift.startTime&&<div style={{fontSize:15,color:st.color}}>🕐 {shift.startTime} → {shift.endTime}{shift.breakH>0?` (-${shift.breakH}h pause)`:''}</div>}
            {shift.note&&<div style={{marginTop:6,fontSize:12,color:st.color,opacity:.7,fontStyle:'italic'}}>💬 {shift.note}</div>}
          </div>
          {st2&&shift.split&&(
            <div style={{background:st2.bgColor,border:`2px solid ${st2.color}50`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontWeight:800,fontSize:17,color:st2.color}}>{st2.label}</span>
                {shift.split.hours>0&&<span style={{fontWeight:700,fontSize:18,color:st2.color}}>{shift.split.hours}h</span>}
              </div>
              {shift.split.startTime&&<div style={{fontSize:15,color:st2.color}}>🕐 {shift.split.startTime} → {shift.split.endTime}</div>}
            </div>
          )}
          <button onClick={()=>setPopup(null)} style={{marginTop:16,width:'100%',background:'var(--teal)',color:'#fff',border:'none',borderRadius:12,padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-b)'}}>
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #EAF7F5 0%, #F4F7F9 60%, #EEF2FF 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* TOP HEADER */}
      <div style={{
        background: 'white',
        borderBottom: '1.5px solid #E2EBF0',
        padding: '0 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="care-logo.png" alt="Care" style={{ height: 30, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            <div>
              <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Care Planning</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Planning des équipes</div>
            </div>
          </div>
          <button onClick={onLogin} style={{
            background: 'var(--teal)', color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-b)',
          }}>
            Se connecter
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: '16px 12px 80px' }}>
        {/* Week nav */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16, background: 'white', borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 2px 10px rgba(0,0,0,.06)', border: '1.5px solid #E2EBF0',
        }}>
          <button onClick={() => setCurrentWeek(w => Math.max(1, w-1))} style={{
            background: 'none', border: '1.5px solid #E2EBF0', borderRadius: 8,
            width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 18, color: 'var(--teal-dark)' }}>
              Semaine {currentWeek}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {startDate} → {endDate}
            </div>
          </div>
          <button onClick={() => setCurrentWeek(w => Math.min(52, w+1))} style={{
            background: 'none', border: '1.5px solid #E2EBF0', borderRadius: 8,
            width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        </div>

        {/* Store tabs - horizontal scroll */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {stores.map(s => (
            <button key={s.id} onClick={() => setActiveStore(s.id)} style={{
              padding: '8px 16px', borderRadius: 20, border: `2px solid ${activeStore===s.id?s.color:s.color+'40'}`,
              background: activeStore===s.id?s.color:'white',
              color: activeStore===s.id?'white':s.color,
              fontFamily: 'var(--font-b)', fontSize: 13, fontWeight: activeStore===s.id?700:500,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: activeStore===s.id?`0 3px 10px ${s.color}45`:'none',
              transition: 'all .15s',
            }}>{s.name}</button>
          ))}
        </div>

        {/* Planning cards - mobile friendly */}
        {storeEmps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 15 }}>
            Aucun employé dans ce magasin
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {storeEmps.map(emp => {
              const empShifts = weekDates.map((wd, di) => ({
                wd, di, sh: sched[`${emp.id}_${di}`]
              }));
              const totalH = empShifts.reduce((t, { sh }) => {
                if (!sh?.hours) return t;
                const workTypes = ['work','communication','meeting','school'];
                return workTypes.includes(sh.type) ? t + sh.hours : t;
              }, 0);
              const ShiftPopup2 = () => {
    if(!popup) return null;
    const {emp,shift,st,st2,day} = popup;
    return(
      <div style={{position:'fixed',inset:0,background:'rgba(27,42,59,.5)',backdropFilter:'blur(5px)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setPopup(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,padding:'20px 20px 40px',boxShadow:'0 -8px 40px rgba(0,0,0,.2)'}}>
          <div style={{width:36,height:4,background:'#E2EBF0',borderRadius:2,margin:'0 auto 16px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17}}>{emp.name[0]}</div>
            <div>
              <div style={{fontWeight:800,fontSize:17}}>{emp.name}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>{day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
            </div>
          </div>
          <div style={{background:st.bgColor,border:`2px solid ${st.color}50`,borderRadius:14,padding:'14px 16px',marginBottom:st2?8:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:800,fontSize:17,color:st.color}}>{st.label}</span>
              {shift.hours>0&&<span style={{fontWeight:700,fontSize:18,color:st.color}}>{shift.hours}h</span>}
            </div>
            {shift.startTime&&<div style={{fontSize:15,color:st.color}}>🕐 {shift.startTime} → {shift.endTime}{shift.breakH>0?` (-${shift.breakH}h pause)`:''}</div>}
            {shift.note&&<div style={{marginTop:6,fontSize:12,color:st.color,opacity:.7,fontStyle:'italic'}}>💬 {shift.note}</div>}
          </div>
          {st2&&shift.split&&(
            <div style={{background:st2.bgColor,border:`2px solid ${st2.color}50`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontWeight:800,fontSize:17,color:st2.color}}>{st2.label}</span>
                {shift.split.hours>0&&<span style={{fontWeight:700,fontSize:18,color:st2.color}}>{shift.split.hours}h</span>}
              </div>
              {shift.split.startTime&&<div style={{fontSize:15,color:st2.color}}>🕐 {shift.split.startTime} → {shift.split.endTime}</div>}
            </div>
          )}
          <button onClick={()=>setPopup(null)} style={{marginTop:16,width:'100%',background:'var(--teal)',color:'#fff',border:'none',borderRadius:12,padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-b)'}}>
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
                <div key={emp.id} style={{
                  background: 'white', borderRadius: 14, overflow: 'hidden',
                  border: '1.5px solid #E2EBF0', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                }}>
                  {/* Emp header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #F0F5F7' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: emp.color || 'var(--teal)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: 'white', fontSize: 15, flexShrink: 0,
                    }}>{emp.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'capitalize' }}>{emp.role} · {emp.contractHours}h/sem</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-h)', fontWeight: 800, fontSize: 16, color: 'var(--teal-dark)' }}>{totalH.toFixed(1)}h</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)' }}>cette semaine</div>
                    </div>
                  </div>
                  {/* Days grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: '8px' }}>
                    {empShifts.map(({ wd, di, sh }) => {
                      const st = sh ? getMeta(sh.type) : null;
                      const isSun = wd.date.getDay() === 0;
                      const ShiftPopup2 = () => {
    if(!popup) return null;
    const {emp,shift,st,st2,day} = popup;
    return(
      <div style={{position:'fixed',inset:0,background:'rgba(27,42,59,.5)',backdropFilter:'blur(5px)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setPopup(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,padding:'20px 20px 40px',boxShadow:'0 -8px 40px rgba(0,0,0,.2)'}}>
          <div style={{width:36,height:4,background:'#E2EBF0',borderRadius:2,margin:'0 auto 16px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17}}>{emp.name[0]}</div>
            <div>
              <div style={{fontWeight:800,fontSize:17}}>{emp.name}</div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>{day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
            </div>
          </div>
          <div style={{background:st.bgColor,border:`2px solid ${st.color}50`,borderRadius:14,padding:'14px 16px',marginBottom:st2?8:0}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:800,fontSize:17,color:st.color}}>{st.label}</span>
              {shift.hours>0&&<span style={{fontWeight:700,fontSize:18,color:st.color}}>{shift.hours}h</span>}
            </div>
            {shift.startTime&&<div style={{fontSize:15,color:st.color}}>🕐 {shift.startTime} → {shift.endTime}{shift.breakH>0?` (-${shift.breakH}h pause)`:''}</div>}
            {shift.note&&<div style={{marginTop:6,fontSize:12,color:st.color,opacity:.7,fontStyle:'italic'}}>💬 {shift.note}</div>}
          </div>
          {st2&&shift.split&&(
            <div style={{background:st2.bgColor,border:`2px solid ${st2.color}50`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontWeight:800,fontSize:17,color:st2.color}}>{st2.label}</span>
                {shift.split.hours>0&&<span style={{fontWeight:700,fontSize:18,color:st2.color}}>{shift.split.hours}h</span>}
              </div>
              {shift.split.startTime&&<div style={{fontSize:15,color:st2.color}}>🕐 {shift.split.startTime} → {shift.split.endTime}</div>}
            </div>
          )}
          <button onClick={()=>setPopup(null)} style={{marginTop:16,width:'100%',background:'var(--teal)',color:'#fff',border:'none',borderRadius:12,padding:'13px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'var(--font-b)'}}>
            Fermer
          </button>
        </div>
      </div>
    );
  };

  return (
                        <div key={di} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: isSun?'#C8002B':'var(--dim)', textTransform: 'uppercase' }}>
                            {DAY_SHORT[di]}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--dim)' }}>
                            {wd.date.getDate()}
                          </div>
                          <div style={{
                            width: '100%', minHeight: 44, borderRadius: 6,
                            background: sh ? st.bgColor : isSun ? '#FFF5F5' : '#F8FAFB',
                            border: `1px solid ${sh ? st.color+'35' : isSun?'#FFCDD2':'#E2EBF0'}`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: 1, padding: '3px 2px',
                          }}>
                            {sh ? (
                              <>
                                <span style={{ fontSize: 9, fontWeight: 700, color: st.color, textAlign: 'center' }}>{st.label.slice(0,4)}</span>
                                {sh.startTime && <span style={{ fontSize: 8, color: st.color, opacity: .8 }}>{sh.startTime}</span>}
                                {sh.hours > 0 && <span style={{ fontSize: 8, color: st.color, opacity: .7 }}>{sh.hours}h</span>}
                              </>
                            ) : (
                              <span style={{ color: '#DDE3E8', fontSize: 12 }}>—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          {shiftTypes.map(st => (
            <span key={st.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', background: st.bgColor, borderRadius: 20,
              border: `1px solid ${st.color}35`, fontSize: 11, color: st.color, fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
              {st.label}
            </span>
          ))}
        </div>
      </div>

      <ShiftPopup2/>
      {/* BOTTOM CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1.5px solid #E2EBF0',
        padding: '12px 16px', display: 'flex', gap: 10,
        boxShadow: '0 -4px 20px rgba(0,0,0,.08)', zIndex: 40,
      }}>
        <button onClick={onLogin} style={{
          flex: 1, background: 'var(--teal)', color: 'white', border: 'none',
          borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-b)',
          boxShadow: '0 3px 14px rgba(0,201,177,.4)',
        }}>
          🔐 Se connecter pour gérer
        </button>
      </div>
    </div>
  );
}
