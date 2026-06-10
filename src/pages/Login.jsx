import React, { useState, useMemo } from 'react';
import { useApp, MANAGER_ROLES } from '../context/AppContext';

export default function Login({ logoUrl, onBack }) {
  const { login, employees, loading, setupVendeurPassword, vendeurNeedsPassword } = useApp();
  const [mode, setMode] = useState('manager');
  const [selected, setSelected] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  // First-connection vendeur password creation
  const [setupMode, setSetupMode] = useState(false);
  const [setupEmpId, setSetupEmpId] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const managers = useMemo(() => employees.filter(e => MANAGER_ROLES.includes(e.role)).sort((a,b)=>a.name.localeCompare(b.name)), [employees]);
  const vendeurs  = useMemo(() => employees.filter(e => e.role==='vendeur').sort((a,b)=>a.name.localeCompare(b.name)), [employees]);
  const list = mode === 'manager' ? managers : vendeurs;

  // Does the selected vendeur still need to create a password?
  const selectedNeedsPw = mode==='vendeur' && selected && vendeurNeedsPassword && vendeurNeedsPassword(selected);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected) { setError('Veuillez sélectionner un utilisateur'); return; }
    setSubmitting(true); setError('');
    setTimeout(() => {
      const r = login(selected, password, mode === 'manager');
      if (r.needsPasswordSetup) {
        // First connection for this vendeur — switch to creation screen
        setSetupMode(true); setSetupEmpId(r.empId); setSubmitting(false);
        return;
      }
      if (!r.success) setError(r.error || 'Identifiants incorrects');
      setSubmitting(false);
    }, 400);
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (newPass.length < 4) { setError('Le mot de passe doit faire au moins 4 caractères'); return; }
    if (newPass !== confirmPass) { setError('Les deux mots de passe ne correspondent pas'); return; }
    setSubmitting(true); setError('');
    await setupVendeurPassword(setupEmpId, newPass);
    setSubmitting(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(145deg,#EAF7F5 0%,#F4F7F9 50%,#EEF2FF 100%)',
      padding: '20px',
    }}>
      {/* bg blobs */}
      <div style={{ position:'fixed',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,201,177,.07) 0%,transparent 70%)',top:-150,right:-100,pointerEvents:'none' }}/>
      <div style={{ position:'fixed',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 70%)',bottom:-100,left:-80,pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>
        {/* Logo + titre */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
            <img src={logoUrl||'care-logo.png'} alt="Care" style={{ height:72, objectFit:'contain' }}
              onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <div style={{ display:'none', justifyContent:'center' }}>
              <div style={{ width:72,height:72,borderRadius:18,background:'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,boxShadow:'0 6px 24px rgba(0,201,177,.38)' }}>📅</div>
            </div>
          </div>
          <h1 style={{ fontFamily:'var(--font-h)',fontSize:42,fontWeight:800,color:'var(--text)',letterSpacing:'-.02em',margin:0 }}>
            Care <span className="grad">Planning</span>
          </h1>
          <p style={{ color:'var(--muted)',fontSize:18,marginTop:10 }}>Gestion des plannings · Tous magasins</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding:'36px 40px', borderRadius:22 }}>
          {onBack && (
            <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:14, marginBottom:20, display:'flex', alignItems:'center', gap:6, fontFamily:'var(--font-b)' }}>
              ← Voir le planning public
            </button>
          )}
          {/* Toggle */}
          <div style={{ display:'flex',background:'var(--card2)',borderRadius:13,padding:4,marginBottom:28,border:'1.5px solid var(--border)' }}>
            {[{v:'manager',l:'👔 Manager / Dirigeant'},{v:'vendeur',l:'🛍️ Vendeur'}].map(opt=>(
              <button key={opt.v} onClick={()=>{ setMode(opt.v); setSelected(''); setPassword(''); setError(''); }} style={{
                flex:1,padding:'12px 8px',borderRadius:10,border:'none',cursor:'pointer',
                background:mode===opt.v?'#fff':'transparent',
                color:mode===opt.v?'var(--text)':'var(--muted)',
                fontFamily:'var(--font-b)',fontSize:14,fontWeight:mode===opt.v?700:500,
                boxShadow:mode===opt.v?'var(--shadow)':'none',transition:'all .18s',
              }}>{opt.l}</button>
            ))}
          </div>

          {setupMode ? (
            /* ── FIRST CONNECTION: create password ── */
            <form onSubmit={handleSetup}>
              <div style={{ marginBottom:20,background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:12,padding:'16px 18px' }}>
                <div style={{ fontWeight:800,color:'var(--teal-dark)',fontSize:18,marginBottom:4 }}>🔑 Première connexion</div>
                <div style={{ fontSize:15,color:'var(--muted)' }}>Bienvenue {selected} ! Créez votre mot de passe personnel pour sécuriser votre accès. Vous l'utiliserez à chaque connexion.</div>
              </div>
              <div style={{ marginBottom:16 }}>
                <div className="lbl">Nouveau mot de passe</div>
                <input className="inp" type={showPass?'text':'password'} placeholder="Au moins 4 caractères"
                  value={newPass} onChange={e=>{ setNewPass(e.target.value); setError(''); }}
                  style={{ fontSize:16,padding:'14px 16px' }} autoFocus/>
              </div>
              <div style={{ marginBottom:24 }}>
                <div className="lbl">Confirmer le mot de passe</div>
                <input className="inp" type={showPass?'text':'password'} placeholder="Retapez le mot de passe"
                  value={confirmPass} onChange={e=>{ setConfirmPass(e.target.value); setError(''); }}
                  style={{ fontSize:16,padding:'14px 16px' }}/>
              </div>
              {error&&(
                <div style={{ background:'#FFF0F2',border:'1.5px solid #FFCCD4',borderRadius:11,padding:'12px 16px',marginBottom:18,color:'#C8002B',fontSize:15,display:'flex',gap:9,alignItems:'center' }}>
                  <span>⚠️</span>{error}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width:'100%',justifyContent:'center',padding:'16px',fontSize:17,fontWeight:700,borderRadius:13 }}
                disabled={submitting}>
                {submitting?'⏳ Création...':'✓ Créer mon mot de passe & me connecter'}
              </button>
              <button type="button" onClick={()=>{ setSetupMode(false); setNewPass(''); setConfirmPass(''); setError(''); }}
                style={{ width:'100%',marginTop:10,background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:14,fontFamily:'var(--font-b)' }}>
                ← Retour
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <div className="lbl">{mode==='manager'?'Sélectionner le manager':'Sélectionner le vendeur'}</div>
              <div style={{ position:'relative' }}>
                <select className="inp" value={selected} onChange={e=>{ setSelected(e.target.value); setError(''); setPassword(''); }}
                  style={{ fontSize:16,padding:'14px 44px 14px 16px',cursor:'pointer',appearance:'none' }}>
                  <option value="">— Choisissez votre nom —</option>
                  {list.map(emp=>(
                    <option key={emp.id} value={emp.name}>
                      {emp.name}{emp.role==='dirigeant'?' · Dirigeant':emp.role==='manager'?' · Manager':''}{emp.role==='vendeur'&&!emp.password?' · (mot de passe à créer)':''}
                    </option>
                  ))}
                </select>
                <span style={{ position:'absolute',right:15,top:'50%',transform:'translateY(-50%)',fontSize:15,color:'var(--dim)',pointerEvents:'none' }}>▼</span>
              </div>
            </div>

            {mode==='manager'&&(
              <div style={{ marginBottom:24 }}>
                <div className="lbl">Mot de passe</div>
                <div style={{ position:'relative' }}>
                  <input className="inp" type={showPass?'text':'password'} placeholder="••••••••••"
                    value={password} onChange={e=>{ setPassword(e.target.value); setError(''); }}
                    style={{ fontSize:16,padding:'14px 48px 14px 16px' }} autoComplete="current-password"/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{
                    position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--dim)',lineHeight:1,
                  }}>{showPass?'🙈':'👁️'}</button>
                </div>
              </div>
            )}

            {mode==='vendeur'&&selected&&selectedNeedsPw&&(
              <div style={{ marginBottom:20,background:'#FFF7E0',border:'1.5px solid #F5D06A',borderRadius:12,padding:'14px 18px',display:'flex',alignItems:'center',gap:13 }}>
                <span style={{ fontSize:28 }}>🔑</span>
                <div>
                  <div style={{ fontWeight:700,color:'#B07D00',fontSize:16 }}>Première connexion</div>
                  <div style={{ fontSize:15,color:'var(--muted)',marginTop:2 }}>Vous n'avez pas encore de mot de passe. En cliquant ci-dessous, vous pourrez en créer un.</div>
                </div>
              </div>
            )}

            {mode==='vendeur'&&selected&&!selectedNeedsPw&&(
              <div style={{ marginBottom:24 }}>
                <div className="lbl">Mot de passe</div>
                <div style={{ position:'relative' }}>
                  <input className="inp" type={showPass?'text':'password'} placeholder="••••••••••"
                    value={password} onChange={e=>{ setPassword(e.target.value); setError(''); }}
                    style={{ fontSize:16,padding:'14px 48px 14px 16px' }} autoComplete="current-password"/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} style={{
                    position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--dim)',lineHeight:1,
                  }}>{showPass?'🙈':'👁️'}</button>
                </div>
              </div>
            )}

            {error&&(
              <div style={{ background:'#FFF0F2',border:'1.5px solid #FFCCD4',borderRadius:11,padding:'12px 16px',marginBottom:18,color:'#C8002B',fontSize:15,display:'flex',gap:9,alignItems:'center' }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width:'100%',justifyContent:'center',padding:'16px',fontSize:17,fontWeight:700,borderRadius:13 }}
              disabled={submitting||!selected||loading}>
              {submitting?(
                <span style={{ display:'flex',alignItems:'center',gap:9 }}>
                  <span style={{ width:19,height:19,border:'2px solid rgba(255,255,255,.4)',borderTopColor:'white',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>
                  Connexion...
                </span>
              ):mode==='vendeur'?(selectedNeedsPw?'Créer mon mot de passe →':'Accéder au planning →'):'Se connecter →'}
            </button>
          </form>
          )}
        </div>

        <p style={{ textAlign:'center',marginTop:22,fontSize:15,color:'var(--dim)' }}>Care Planning © 2026</p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
