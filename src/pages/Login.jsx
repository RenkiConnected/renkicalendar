import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    setTimeout(() => {
      const r = login(password, username);
      if (!r.success) setError('Identifiants incorrects. Réessayez.');
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #F7FAFA 0%, #E0FAF7 50%, #F7FAFA 100%)',
    }}>
      {/* Left panel - decoration */}
      <div style={{
        flex: 1, display: 'none',
        background: 'linear-gradient(160deg, var(--care-navy) 0%, var(--care-slate) 100%)',
        position: 'relative', overflow: 'hidden',
      }} className="login-left">
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48 }}>
          <img src="care-logo.png" alt="Care" style={{ width: 200, marginBottom: 40, filter: 'brightness(0) invert(1) sepia(1) hue-rotate(140deg) brightness(1.5)' }} onError={e => e.target.style.display='none'} />
          <h2 style={{ fontFamily:'var(--font-head)', color:'white', fontSize:32, fontWeight:800, textAlign:'center', marginBottom:16 }}>
            Gérez vos plannings<br/>en toute simplicité
          </h2>
          <p style={{ color:'rgba(255,255,255,0.6)', textAlign:'center', lineHeight:1.7, fontSize:16 }}>
            Planning temps réel · Export PDF · Multi-magasins<br/>Synchronisé sur tous vos appareils
          </p>
          {/* Decorative circles */}
          <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', border:'1px solid rgba(0,201,177,0.2)', bottom:-100, right:-100 }} />
          <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', border:'1px solid rgba(0,201,177,0.15)', bottom:-50, right:-50 }} />
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        flex: 1, display:'flex', alignItems:'center', justifyContent:'center',
        padding: '40px 20px',
      }}>
        <div style={{ width:'100%', maxWidth:420 }} className="fade-up">
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <img src="care-logo.png" alt="Care Planning"
              style={{ height:64, objectFit:'contain', marginBottom:16 }}
              onError={e => {
                e.target.style.display='none';
                e.target.nextSibling.style.display='flex';
              }}
            />
            <div style={{ display:'none', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 }}>
              <div style={{
                width:52, height:52, borderRadius:14,
                background:'var(--care-teal)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:24, boxShadow:'0 4px 16px rgba(0,201,177,0.4)',
                animation:'float 3s ease-in-out infinite',
              }}>📅</div>
            </div>
            <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>
              Care <span className="gradient-text">Planning</span>
            </h1>
            <p style={{ color:'var(--text-muted)', fontSize:14, marginTop:6 }}>
              Gestion des plannings · Tous magasins
            </p>
          </div>

          {/* Form card */}
          <div className="card" style={{ padding:32 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:18 }}>
                <label className="label">Prénom / Identifiant</label>
                <input className="input" type="text" placeholder="Votre prénom..." value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" />
              </div>
              <div style={{ marginBottom:24 }}>
                <label className="label">Mot de passe</label>
                <input className="input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ background:'#FFEEF0', border:'1px solid #FFCCD4', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#C8002B', fontSize:13, display:'flex', gap:8, alignItems:'center' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:15 }} disabled={loading}>
                {loading
                  ? <span style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                      Connexion...
                    </span>
                  : 'Se connecter →'
                }
              </button>
            </form>

            <div style={{ marginTop:20, background:'var(--care-teal-light)', borderRadius:10, padding:'12px 16px', border:'1px solid var(--care-teal-mid)' }}>
              <p style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.7 }}>
                <strong style={{ color:'var(--care-teal-dark)' }}>Managers & Admin</strong> — mot de passe dashboard<br/>
                <strong style={{ color:'var(--text)' }}>Vendeurs</strong> — entrez votre prénom uniquement
              </p>
            </div>
          </div>

          <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'var(--text-dim)' }}>
            Care Planning © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
