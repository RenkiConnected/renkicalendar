import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { shiftTypes, updateShiftType } = useApp();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = (st) => {
    setEditing(st.id);
    setForm({ label: st.label, color: st.color, bgColor: st.bgColor });
  };

  const saveEdit = () => {
    if (!editing) return;
    updateShiftType(editing, form);
    setEditing(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 24 }}>⚙️ Paramètres</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Personnalisez les types de créneaux et couleurs</p>
      </div>

      {/* Shift Types */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
          🎨 Types de créneaux
        </h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {shiftTypes.map(st => (
            <div key={st.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)', borderRadius: 10,
              border: `1px solid ${editing === st.id ? 'var(--primary)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: st.bgColor, border: `2px solid ${st.color}`, flexShrink: 0 }} />

              {editing === st.id ? (
                <>
                  <input
                    className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                    style={{ maxWidth: 180, padding: '6px 10px' }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Couleur texte</div>
                      <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        style={{ width: 36, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>Couleur fond</div>
                      <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                        style={{ width: 36, height: 30, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={saveEdit}>✓</button>
                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => setEditing(null)}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{st.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{st.color} · fond {st.bgColor}</div>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 20, background: st.bgColor, color: st.color, fontSize: 12, fontWeight: 600 }}>
                    {st.label}
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => startEdit(st)}>
                    ✏ Modifier
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div style={{
        background: 'rgba(0,184,212,0.08)', border: '1px solid rgba(0,184,212,0.2)',
        borderRadius: 12, padding: '16px 20px',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--primary)' }}>ℹ Accès & Sécurité</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Mot de passe admin : <strong style={{ color: 'var(--text)' }}>Raphael2232</strong><br />
          Managers : connexion avec le mot de passe admin<br />
          Vendeurs : connexion avec leur prénom uniquement (accès consultation)
        </div>
      </div>
    </div>
  );
}
