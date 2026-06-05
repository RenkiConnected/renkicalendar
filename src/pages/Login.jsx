import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const result = login(password, username);
      if (!result.success) {
        setError('Identifiants incorrects');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Bg blobs */}
      <div style={{
        position: 'absolute', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,184,212,0.08) 0%, transparent 70%)',
        top: '-200px', left: '-200px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)',
        bottom: '-100px', right: '-100px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary), #0097B2)',
            marginBottom: 16, boxShadow: '0 0 30px rgba(0,184,212,0.4)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2"/>
              <path d="M3 9h18" stroke="white" strokeWidth="2"/>
              <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="7" y="13" width="3" height="3" rx="1" fill="white"/>
              <rect x="11" y="13" width="3" height="3" rx="1" fill="white"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Care <span className="gradient-text">Planning</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Générateur de plannings intelligent
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Nom d'utilisateur</label>
              <input
                className="input"
                type="text"
                placeholder="Votre nom..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Mot de passe</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                color: '#FCA5A5', fontSize: 13,
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>⏳</span> Connexion...
                </span>
              ) : 'Se connecter →'}
            </button>
          </form>

          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(0,184,212,0.08)', borderRadius: 10,
            border: '1px solid rgba(0,184,212,0.2)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--primary)' }}>Managers & Admin :</strong> mot de passe dashboard<br/>
              <strong style={{ color: 'var(--text)' }}>Vendeurs :</strong> entrez votre prénom uniquement
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-dim)' }}>
          Care Planning © 2026 — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
