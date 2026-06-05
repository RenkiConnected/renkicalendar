import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

const HOURS = ['8H', '9H', '10H', '11H', '12H', '13H', '14H', '15H', '16H', '17H', '18H', '19H', '20H'];

function getShiftStyle(shiftTypes, typeId) {
  const st = shiftTypes.find(s => s.id === typeId);
  if (!st) return { background: 'rgba(99,102,241,0.2)', color: '#818CF8' };
  return { background: st.bgColor, color: st.color };
}

function WeekNav({ currentWeek, setCurrentWeek }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button className="btn btn-secondary" style={{ padding: '8px 12px' }}
        onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}>‹</button>
      <div style={{
        background: 'rgba(0,184,212,0.12)', border: '1px solid rgba(0,184,212,0.3)',
        borderRadius: 10, padding: '8px 16px', minWidth: 100, textAlign: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>
          S{currentWeek}
        </span>
        <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 6 }}>/ 52</span>
      </div>
      <button className="btn btn-secondary" style={{ padding: '8px 12px' }}
        onClick={() => setCurrentWeek(w => Math.min(52, w + 1))}>›</button>
    </div>
  );
}

function ShiftCell({ shift, onClick, shiftTypes }) {
  if (!shift) return (
    <div onClick={onClick} style={{
      height: 44, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.08)',
      cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ color: 'var(--text-dim)', fontSize: 18 }}>+</span>
    </div>
  );

  const style = getShiftStyle(shiftTypes, shift.type);
  const st = shiftTypes.find(s => s.id === shift.type);

  return (
    <div onClick={onClick} className="shift-pill" style={{
      ...style, height: 44, borderRadius: 8,
      border: `1px solid ${style.color}40`,
      cursor: 'pointer', fontSize: 11, flexDirection: 'column', gap: 1,
    }}>
      <span style={{ fontWeight: 700, fontSize: 10 }}>{st?.label || shift.type}</span>
      {shift.startTime && shift.endTime && (
        <span style={{ opacity: 0.8, fontSize: 10 }}>{shift.startTime}–{shift.endTime}</span>
      )}
      {shift.hours && (
        <span style={{ opacity: 0.7, fontSize: 9 }}>{shift.hours}h</span>
      )}
    </div>
  );
}

function ShiftModal({ emp, dayIndex, day, shift, onSave, onDelete, onClose, shiftTypes, allowWeekend }) {
  const [type, setType] = useState(shift?.type || 'work');
  const [startTime, setStartTime] = useState(shift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(shift?.endTime || '18:00');
  const [note, setNote] = useState(shift?.note || '');
  const [depannage, setDepannage] = useState(shift?.depannage || false);

  const calcHours = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? (diff / 60).toFixed(1) : 0;
    } catch { return 0; }
  };

  const hours = calcHours();
  const needsTime = ['work', 'communication', 'meeting'].includes(type);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>
              Modifier le créneau
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>
              {emp.name} — {day.day} {day.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="label">Type de créneau</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {shiftTypes.map(st => (
              <button
                key={st.id}
                onClick={() => setType(st.id)}
                className="shift-pill"
                style={{
                  background: type === st.id ? st.bgColor : 'rgba(255,255,255,0.05)',
                  color: type === st.id ? st.color : 'var(--text-muted)',
                  border: `1px solid ${type === st.id ? st.color + '60' : 'var(--border)'}`,
                  padding: '8px 14px',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {needsTime && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="label">Début</label>
              <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Fin</label>
              <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        )}

        {needsTime && hours > 0 && (
          <div style={{
            background: 'rgba(0,184,212,0.1)', border: '1px solid rgba(0,184,212,0.2)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13,
          }}>
            ⏱ Durée calculée : <strong style={{ color: 'var(--primary)' }}>{hours}h</strong>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="label">Note (optionnel)</label>
          <input className="input" type="text" placeholder="Remarque..." value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="depannage" checked={depannage} onChange={e => setDepannage(e.target.checked)} />
          <label htmlFor="depannage" style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
            Dépannage (employé d'un autre magasin)
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onSave({ type, startTime: needsTime ? startTime : null, endTime: needsTime ? endTime : null, hours: needsTime ? parseFloat(hours) : null, note, depannage })}
          >
            ✓ Enregistrer
          </button>
          {shift && (
            <button className="btn btn-danger" onClick={onDelete}>
              🗑 Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlanningEditor() {
  const { stores, employees, shiftTypes, getSchedule, setShift, currentWeek, setCurrentWeek, currentYear, selectedStore, getWeekDatesForCurrentWeek } = useApp();
  const [activeStore, setActiveStore] = useState(selectedStore || (stores[0]?.id));
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'day'
  const [activeDay, setActiveDay] = useState(0);
  const [editingCell, setEditingCell] = useState(null); // { empId, dayIndex }
  const [allowWeekend, setAllowWeekend] = useState(false);
  const [showHolidayConfirm, setShowHolidayConfirm] = useState(false);

  const store = stores.find(s => s.id === activeStore);
  const storeEmployees = employees.filter(e => e.storeId === activeStore);
  const weekDates = getWeekDatesForCurrentWeek(currentWeek);
  const schedule = getSchedule(activeStore, currentWeek, currentYear);
  const displayDays = allowWeekend ? weekDates : weekDates.slice(0, 6);

  const totalHoursForEmp = (empId) => {
    let total = 0;
    weekDates.forEach((_, i) => {
      const s = schedule[`${empId}_${i}`];
      if (s?.hours) total += s.hours;
    });
    return total.toFixed(1);
  };

  const handleCellClick = (empId, dayIndex) => {
    const wd = weekDates[dayIndex];
    const dayOfWeek = wd.date.getDay();
    if (!allowWeekend && (dayOfWeek === 0 || dayOfWeek === 6)) {
      setShowHolidayConfirm({ empId, dayIndex });
      return;
    }
    setEditingCell({ empId, dayIndex });
  };

  const handleSaveShift = (data) => {
    if (!editingCell) return;
    setShift(activeStore, currentWeek, currentYear, editingCell.empId, editingCell.dayIndex, data);
    setEditingCell(null);
  };

  const handleDeleteShift = () => {
    if (!editingCell) return;
    setShift(activeStore, currentWeek, currentYear, editingCell.empId, editingCell.dayIndex, null);
    setEditingCell(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 24 }}>
            📅 Plannings
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Édition et gestion des horaires</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <WeekNav currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} />
          <button
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: '9px 14px' }}
            onClick={() => setAllowWeekend(!allowWeekend)}
          >
            {allowWeekend ? '📅 Masquer Dim' : '📅 Voir Week-end'}
          </button>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '9px 14px' }}
            onClick={() => window.dispatchEvent(new CustomEvent('exportPDF', { detail: { storeId: activeStore, week: currentWeek } }))}
          >
            📄 Exporter PDF
          </button>
        </div>
      </div>

      {/* Store tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {stores.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStore(s.id)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeStore === s.id ? s.color : 'rgba(255,255,255,0.06)',
              color: activeStore === s.id ? 'white' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: activeStore === s.id ? 600 : 400,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              boxShadow: activeStore === s.id ? `0 0 15px ${s.color}50` : 'none',
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => setViewMode('week')}>
          Vue semaine
        </button>
        <button className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => setViewMode('day')}>
          Vue journée
        </button>
        {viewMode === 'day' && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {weekDates.map((wd, i) => (
              <button key={i}
                onClick={() => setActiveDay(i)}
                className={`btn ${activeDay === i ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12, padding: '6px 10px' }}
              >
                {wd.day.slice(0, 3)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {shiftTypes.map(st => (
          <div key={st.id} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            background: st.bgColor, borderRadius: 20, border: `1px solid ${st.color}40`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
            <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Planning grid */}
      {storeEmployees.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: 16,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ color: 'var(--text-muted)' }}>Aucun employé dans ce magasin</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 6 }}>Ajoutez des employés via la section Employés</p>
        </div>
      ) : viewMode === 'week' ? (
        <WeekView
          employees={storeEmployees}
          displayDays={displayDays}
          weekDates={weekDates}
          schedule={schedule}
          shiftTypes={shiftTypes}
          onCellClick={handleCellClick}
          totalHoursForEmp={totalHoursForEmp}
        />
      ) : (
        <DayView
          employees={storeEmployees}
          day={weekDates[activeDay]}
          dayIndex={activeDay}
          schedule={schedule}
          shiftTypes={shiftTypes}
          onCellClick={handleCellClick}
        />
      )}

      {/* Shift edit modal */}
      {editingCell && (() => {
        const emp = employees.find(e => e.id === editingCell.empId);
        const shift = schedule[`${editingCell.empId}_${editingCell.dayIndex}`];
        const day = weekDates[editingCell.dayIndex];
        return (
          <ShiftModal
            emp={emp}
            dayIndex={editingCell.dayIndex}
            day={day}
            shift={shift}
            onSave={handleSaveShift}
            onDelete={handleDeleteShift}
            onClose={() => setEditingCell(null)}
            shiftTypes={shiftTypes}
            allowWeekend={allowWeekend}
          />
        );
      })()}

      {/* Weekend/holiday confirmation */}
      {showHolidayConfirm && (
        <div className="modal-overlay" onClick={() => setShowHolidayConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: 8 }}>Jour non travaillé</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Ce jour est un dimanche ou férié. Voulez-vous quand même planifier ?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowHolidayConfirm(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => {
                setAllowWeekend(true);
                setEditingCell(showHolidayConfirm);
                setShowHolidayConfirm(null);
              }}>Confirmer quand même</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekView({ employees, displayDays, weekDates, schedule, shiftTypes, onCellClick, totalHoursForEmp }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', minWidth: 700 }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-dim)', fontSize: 12, fontWeight: 500, width: 130 }}>
              Employé
            </th>
            {displayDays.map((wd, i) => (
              <th key={i} style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontWeight: 500 }}>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>{wd.day.slice(0, 3)}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                  {wd.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </th>
            ))}
            <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, fontWeight: 500 }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => {
            const totalH = totalHoursForEmp(emp.id);
            const contractH = emp.contractHours || 35;
            const diff = parseFloat(totalH) - contractH;
            return (
              <tr key={emp.id}>
                <td style={{ padding: '4px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: emp.color || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                      {emp.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'capitalize' }}>{emp.role}</div>
                    </div>
                  </div>
                </td>
                {displayDays.map((_, i) => {
                  const realIdx = weekDates.indexOf(displayDays[i]);
                  return (
                    <td key={i} style={{ padding: '4px 6px' }}>
                      <ShiftCell
                        shift={schedule[`${emp.id}_${realIdx}`]}
                        onClick={() => onCellClick(emp.id, realIdx)}
                        shiftTypes={shiftTypes}
                      />
                    </td>
                  );
                })}
                <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
                    color: diff > 0 ? '#FCA5A5' : diff < 0 ? 'var(--text-dim)' : 'var(--primary)',
                  }}>{totalH}h</div>
                  <div style={{ fontSize: 10, color: diff >= 0 ? '#FCA5A5' : '#6EE7B7' }}>
                    {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
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

function DayView({ employees, day, dayIndex, schedule, shiftTypes, onCellClick }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{
        background: 'rgba(0,184,212,0.1)', border: '1px solid rgba(0,184,212,0.2)',
        borderRadius: 12, padding: '12px 20px', marginBottom: 8,
      }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>
          {day.day} {day.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
      </div>
      {employees.map(emp => {
        const shift = schedule[`${emp.id}_${dayIndex}`];
        const style = shift ? getShiftStyle2(shiftTypes, shift.type) : null;
        return (
          <div key={emp.id}
            onClick={() => onCellClick(emp.id, dayIndex)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
              background: shift ? style.background : 'rgba(255,255,255,0.03)',
              border: `1px solid ${shift ? style.color + '40' : 'var(--border)'}`,
              borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: emp.color || 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: 'white', fontSize: 16,
            }}>{emp.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{emp.name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{emp.role} · {emp.contractHours}h/sem</div>
            </div>
            {shift ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: style.color, fontSize: 14 }}>
                  {shiftTypes.find(s => s.id === shift.type)?.label}
                </div>
                {shift.startTime && (
                  <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                    {shift.startTime} – {shift.endTime} · {shift.hours}h
                  </div>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--text-dim)', fontSize: 22 }}>+</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getShiftStyle2(shiftTypes, typeId) {
  const st = shiftTypes.find(s => s.id === typeId);
  if (!st) return { background: 'rgba(99,102,241,0.15)', color: '#818CF8' };
  return { background: st.bgColor, color: st.color };
}
