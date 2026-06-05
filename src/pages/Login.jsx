import React, { useState, useMemo } from 'react';
import { useApp, MANAGER_ROLES } from '../context/AppContext';

export default function Login() {
  const { login, employees, loading } = useApp();
  const [mode, setMode] = useState('manager'); // 'manager' | 'vendeur'
  const [selected, setSelected] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const managers = useMemo(() =>
    employees.filter(e => MANAGER_ROLES.includes(e.role))
      .sort((a,b) => a.name.localeCompare(b.name)),
    [employees]
  );
  const vendeurs = useMemo(() =>
    employees.filter(e => e.role === 'vendeur')
      .sort((a,b) => a.name.localeCompare(b.name)),
    [employees]
  );

  const list = mode === 'manager' ? managers : vendeurs;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { setError('Veuillez sélectionner un utilisateur'); return; }
    setSubmitting(true); setError('');
    setTimeout(() => {
      const r = login(selected, password, mode === 'manager');
      if (!r.success) setError(r.error || 'Identifiants incorrects');
      setSubmitting(false);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #EAF7F5 0%, #F4F7F9 50%, #EEF2FF 100%)',
      padding: '20px',
    }}>
      {/* Decorative bg blobs */}
      <div style={{ position:'fixed', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,201,177,.08) 0%, transparent 70%)', top:-150, right:-150, pointerEvents:'none' }}/>
      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%)', bottom:-100, left:-100, pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        {/* Logo + title */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <img src="care-logo.png" alt="Care"
            style={{ height:70, objectFit:'contain', marginBottom:18, display:'block', margin:'0 auto 18px' }}
            onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
          />
          <div style={{ display:'none' }}>
            <div style={{
              width:72, height:72, borderRadius:20, background:'var(--teal)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:34, margin:'0 auto 16px',
              boxShadow:'0 6px 24px rgba(0,201,177,.35)',
              animation:'float 3s ease-in-out infinite',
            }}>📅</div>
          </div>
          <h1 style={{ fontFamily:'var(--font-h)', fontSize:30, fontWeight:800, color:'var(--text)', letterSpacing:'-.02em' }}>
            Care <span className="grad">Planning</span>
          </h1>
          <p style={{ color:'var(--muted)', fontSize:15, marginTop:6 }}>Gestion des plannings · Tous magasins</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding:36, borderRadius:20 }}>
          {/* Mode toggle */}
          <div style={{ display:'flex', background:'var(--card2)', borderRadius:12, padding:4, marginBottom:28, border:'1px solid var(--border)' }}>
            {[
              { v:'manager', label:'👔 Manager / Dirigeant' },
              { v:'vendeur', label:'🛍️ Vendeur' },
            ].map(opt => (
              <button key={opt.v} onClick={() => { setMode(opt.v); setSelected(''); setPassword(''); setError(''); }} style={{
                flex:1, padding:'10px 8px', borderRadius:9, border:'none', cursor:'pointer',
                background: mode===opt.v ? '#fff' : 'transparent',
                color: mode===opt.v ? 'var(--text)' : 'var(--muted)',
                fontFamily:'var(--font-b)', fontSize:14, fontWeight: mode===opt.v ? 700 : 500,
                boxShadow: mode===opt.v ? 'var(--shadow)' : 'none',
                transition:'all .18s',
              }}>{opt.label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* User selector */}
            <div style={{ marginBottom:18 }}>
              <div className="lbl">
                {mode === 'manager' ? 'Sélectionner le manager' : 'Sélectionner le vendeur'}
              </div>
              <div style={{ position:'relative' }}>
                <select
                  className="inp"
                  value={selected}
                  onChange={e => { setSelected(e.target.value); setError(''); }}
                  style={{ fontSize:15, padding:'13px 16px', cursor:'pointer', appearance:'none' }}
                >
                  <option value="">— Choisissez votre nom —</option>
                  {list.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}
                      {emp.role === 'dirigeant' ? ' (Dirigeant)' : emp.role === 'manager' ? ' (Manager)' : ''}
                    </option>
                  ))}
                </select>
                {/* Custom arrow */}
                <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:12, color:'var(--muted)' }}>▼</div>
              </div>
            </div>

            {/* Password (managers only) */}
            {mode === 'manager' && (
              <div style={{ marginBottom:24 }}>
                <div className="lbl">Mot de passe</div>
                <div style={{ position:'relative' }}>
                  <input
                    className="inp"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    style={{ fontSize:15, padding:'13px 44px 13px 16px' }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--muted)',
                  }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            {/* Vendeur info */}
            {mode === 'vendeur' && selected && (
              <div style={{ marginBottom:20, background:'var(--teal-light)', border:'1.5px solid var(--teal-mid)', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>👋</span>
                <div>
                  <div style={{ fontWeight:700, color:'var(--teal-dark)', fontSize:15 }}>Bonjour {selected} !</div>
                  <div style={{ fontSize:13, color:'var(--muted)' }}>Accès direct à votre planning et vos congés</div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background:'#FFF0F2', border:'1.5px solid #FFCCD4', borderRadius:10, padding:'11px 14px', marginBottom:18, color:'#C8002B', fontSize:14, display:'flex', gap:8, alignItems:'center' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{
              width:'100%', justifyContent:'center',
              padding:'15px', fontSize:16, fontWeight:700, borderRadius:12,
            }} disabled={submitting || !selected || loading}>
              {submitting ? (
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                  Connexion...
                </span>
              ) : mode === 'vendeur' ? `Accéder au planning →` : `Se connecter →`}
            </button>
          </form>
        </div>

        {/* Info footer */}
        <div style={{ marginTop:20, textAlign:'center' }}>
          <p style={{ fontSize:12, color:'var(--dim)' }}>Care Planning © 2026</p>
        </div>
      </div>

      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
