import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ViewPlanning() {
  const { stores, employees, shiftTypes, getSchedule, currentWeek, setCurrentWeek, currentYear, getWeekDatesForCurrentWeek } = useApp();
  const [selectedStore, setSelectedStore] = useState(stores[0]?.id || '');
  const weekDates = getWeekDatesForCurrentWeek(currentWeek);
  const schedule = getSchedule(selectedStore, currentWeek, currentYear);
  const storeEmployees = employees.filter(e => e.storeId === selectedStore);

  const getShift = (empId, dayIdx) => schedule[`${empId}_${dayIdx}`];
  const getShiftStyle = (typeId) => {
    const st = shiftTypes.find(s => s.id === typeId);
    if (!st) return { background: '#1E3A5F', color: '#93C5FD' };
    return { background: st.bgColor, color: st.color };
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 24 }}>📅 Planning</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Consultation des plannings</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}>‹</button>
          <div style={{
            background: 'rgba(0,184,212,0.12)', border: '1px solid rgba(0,184,212,0.3)',
            borderRadius: 10, padding: '8px 20px', textAlign: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>Semaine {currentWeek}</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setCurrentWeek(w => Math.min(52, w + 1))}>›</button>
        </div>
        <select className="input" value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={{ maxWidth: 200 }}>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Week dates header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '140px repeat(7, 1fr)',
        gap: 4, marginBottom: 8,
      }}>
        <div />
        {weekDates.map((wd, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{wd.day.slice(0, 3)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {wd.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        ))}
      </div>

      {/* Planning rows */}
      <div style={{ display: 'grid', gap: 4 }}>
        {storeEmployees.map(emp => (
          <div key={emp.id} style={{
            display: 'grid', gridTemplateColumns: '140px repeat(7, 1fr)', gap: 4,
            background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 4,
          }}>
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: emp.color || 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>{emp.name[0]}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {emp.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{emp.contractHours}h</div>
              </div>
            </div>
            {weekDates.map((_, i) => {
              const shift = getShift(emp.id, i);
              const style = shift ? getShiftStyle(shift.type) : null;
              const st = shift ? shiftTypes.find(s => s.id === shift.type) : null;
              return (
                <div key={i} style={{
                  borderRadius: 8,
                  background: shift ? style.background : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${shift ? style.color + '40' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '6px 4px', minHeight: 52,
                }}>
                  {shift ? (
                    <>
                      <span style={{ fontSize: 10, fontWeight: 700, color: style.color }}>{st?.label}</span>
                      {shift.startTime && (
                        <span style={{ fontSize: 9, color: style.color, opacity: 0.8 }}>
                          {shift.startTime}–{shift.endTime}
                        </span>
                      )}
                      {shift.hours && (
                        <span style={{ fontSize: 9, color: style.color, opacity: 0.7 }}>{shift.hours}h</span>
                      )}
                      {shift.depannage && (
                        <span style={{ fontSize: 8, color: '#F59E0B', marginTop: 1 }}>⚡Dep.</span>
                      )}
                    </>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 16 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {shiftTypes.map(st => (
          <div key={st.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            background: st.bgColor, borderRadius: 20, border: `1px solid ${st.color}30`,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
            <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
