import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function EmployeeModal({ employee, stores, onSave, onClose }) {
  const [form, setForm] = useState(employee || {
    name: '', role: 'vendeur', storeId: stores[0]?.id || '', contractHours: 35, color: '#00B8D4',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>
            {employee ? 'Modifier l\'employé' : 'Nouvel employé'}
          </h3>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="label">Prénom / Nom</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Marie Dupont" />
          </div>
          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="vendeur">Vendeur</option>
              <option value="manager">Manager</option>
              <option value="admin">Directeur / Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Magasin principal</label>
            <select className="input" value={form.storeId} onChange={e => set('storeId', e.target.value)}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Contrat (heures/semaine)</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[28, 35, 39].map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => set('contractHours', h)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: form.contractHours === h ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                    color: form.contractHours === h ? 'white' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {h}h
                </button>
              ))}
              <input
                className="input"
                type="number"
                min="1"
                max="48"
                value={form.contractHours}
                onChange={e => set('contractHours', parseInt(e.target.value))}
                style={{ width: 80, flex: 'none' }}
              />
            </div>
          </div>
          <div>
            <label className="label">Couleur d'identification</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none' }} />
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: form.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: 'white', fontSize: 16,
              }}>
                {form.name[0] || '?'}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{form.color}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onSave(form)}>
            ✓ Enregistrer
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const { employees, stores, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [editing, setEditing] = useState(null); // null | 'new' | employee
  const [filterStore, setFilterStore] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e => {
    if (filterStore !== 'all' && e.storeId !== filterStore) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = (form) => {
    if (editing === 'new') {
      addEmployee(form);
    } else {
      updateEmployee(editing.id, form);
    }
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cet employé ?')) {
      deleteEmployee(id);
    }
  };

  const roleColors = { admin: '#F59E0B', manager: 'var(--primary)', vendeur: '#A78BFA' };
  const roleLabels = { admin: 'Directeur', manager: 'Manager', vendeur: 'Vendeur' };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 24 }}>👥 Employés</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{employees.length} employés au total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Nouvel employé
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input" placeholder="🔍 Rechercher..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <select className="input" value={filterStore} onChange={e => setFilterStore(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="all">Tous les magasins</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Employee cards by store */}
      {stores.map(store => {
        const storeEmps = filtered.filter(e => e.storeId === store.id);
        if (storeEmps.length === 0 && filterStore !== 'all' && filterStore !== store.id) return null;

        return (
          <div key={store.id} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: store.color }} />
              <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{store.name}</h3>
              <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>— {storeEmps.length} employé(s)</span>
            </div>

            {storeEmps.length === 0 ? (
              <div style={{
                padding: '16px 20px', borderRadius: 10,
                border: '1px dashed var(--border)', color: 'var(--text-dim)', fontSize: 13,
              }}>
                Aucun employé{search ? ' correspondant' : ''}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {storeEmps.map(emp => (
                  <div key={emp.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: emp.color || 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, color: 'white', fontSize: 18, flexShrink: 0,
                    }}>{emp.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {emp.name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          background: (roleColors[emp.role] || 'var(--primary)') + '20',
                          color: roleColors[emp.role] || 'var(--primary)',
                          borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                        }}>
                          {roleLabels[emp.role] || emp.role}
                        </span>
                        <span style={{
                          background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                          borderRadius: 20, padding: '2px 8px', fontSize: 11,
                        }}>
                          {emp.contractHours}h/sem
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => setEditing(emp)}>✏</button>
                      <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => handleDelete(emp.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal */}
      {editing && (
        <EmployeeModal
          employee={editing === 'new' ? null : editing}
          stores={stores}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
