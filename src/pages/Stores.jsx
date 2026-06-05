import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function StoreModal({ store, onSave, onClose }) {
  const [form, setForm] = useState(store || { name: '', color: '#00B8D4' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>
            {store ? 'Modifier le magasin' : 'Nouveau magasin'}
          </h3>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="label">Nom du magasin</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Save Marseille" />
          </div>
          <div>
            <label className="label">Couleur identifiante</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width: 50, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
              <div style={{ padding: '8px 16px', borderRadius: 10, background: form.color + '20', border: `2px solid ${form.color}`, color: form.color, fontWeight: 700 }}>
                {form.name || 'Aperçu'}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => form.name && onSave(form)}>
            ✓ Enregistrer
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function Stores() {
  const { stores, addStore, updateStore, deleteStore, employees } = useApp();
  const [editing, setEditing] = useState(null);

  const handleSave = (form) => {
    if (editing === 'new') addStore(form);
    else updateStore(editing.id, form);
    setEditing(null);
  };

  const handleDelete = (id) => {
    const storeEmps = employees.filter(e => e.storeId === id);
    if (storeEmps.length > 0) {
      alert(`Ce magasin a ${storeEmps.length} employé(s). Réassignez-les d'abord.`);
      return;
    }
    if (window.confirm('Supprimer ce magasin ?')) deleteStore(id);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 24 }}>🏪 Magasins</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{stores.length} magasins configurés</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Nouveau magasin</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {stores.map(store => {
          const storeEmps = employees.filter(e => e.storeId === store.id);
          const managers = storeEmps.filter(e => e.role === 'manager' || e.role === 'admin');

          return (
            <div key={store.id} className="glass-card" style={{ padding: '20px 24px', borderTop: `3px solid ${store.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: store.color + '20', color: store.color,
                  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
                }}>
                  {store.name}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}
                    onClick={() => setEditing(store)}>✏</button>
                  <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}
                    onClick={() => handleDelete(store.id)}>🗑</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: store.color }}>
                    {storeEmps.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Employé(s)</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--primary)' }}>
                    {managers.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Manager(s)</div>
                </div>
              </div>

              {storeEmps.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {storeEmps.slice(0, 6).map(e => (
                    <div key={e.id} style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: e.color || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'white',
                      border: '2px solid var(--bg-card)',
                    }} title={e.name}>
                      {e.name[0]}
                    </div>
                  ))}
                  {storeEmps.length > 6 && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'var(--text-muted)',
                    }}>+{storeEmps.length - 6}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <StoreModal
          store={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
