import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { shiftTypes, updateShiftType, appSettings, updateSettings, doResetEmployees, currentEmp, changeOwnPassword, authRole, isDirigeant } = useApp();
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const isManagerOrDirigeant = ['manager','dirigeant','admin'].includes(authRole);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [logoMode, setLogoMode] = useState('url'); // 'url' | 'upload'
  const [logoUrl, setLogoUrl] = useState(appSettings.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState(appSettings.logoDataUrl || appSettings.logoUrl || '');
  const [savingLogo, setSavingLogo] = useState(false);
  const [notifEmails, setNotifEmails] = useState(appSettings.notificationEmails || '');
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const fileRef = useRef();

  const startEdit = (st) => { setEditId(st.id); setForm({ label:st.label, color:st.color, bgColor:st.bgColor }); };
  const saveEdit = () => { if(editId) { updateShiftType(editId, form); setEditId(null); } };

  const handleFileUpload = (e) => {
    const f = e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ev => {
      setLogoPreview(ev.target.result);
      setLogoUrl('');
    };
    rd.readAsDataURL(f);
  };

  const handleSaveLogo = async () => {
    setSavingLogo(true);
    if (logoMode === 'url') {
      await updateSettings({ logoUrl, logoDataUrl: '' });
      setLogoPreview(logoUrl);
    } else {
      await updateSettings({ logoDataUrl: logoPreview, logoUrl: '' });
    }
    setSavingLogo(false);
    alert('✅ Logo sauvegardé !');
  };

  const handleReset = async () => {
    if (!window.confirm('Réinitialiser TOUS les employés avec la liste par défaut ?')) return;
    await doResetEmployees();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="anim-up" style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:32 }}>
        <h1 className="page-title">⚙️ Paramètres</h1>
        <p className="page-sub">Logo, codes couleurs, réinitialisation</p>
      </div>

      {/* ── LOGO ──────────────────────────────────────── */}
      <div className="card" style={{ padding:28, marginBottom:24 }}>
        <h2 className="section-title" style={{ marginBottom:20 }}>🖼 Logo du site & PDF</h2>

        {/* Preview */}
        {logoPreview && (
          <div style={{ marginBottom:20, padding:'16px 20px', background:'var(--navy)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:200 }}>
            <img src={logoPreview} alt="Logo preview" style={{ maxHeight:60, maxWidth:240, objectFit:'contain' }}
              onError={e=>{ e.target.style.display='none'; }}
            />
          </div>
        )}

        {/* Mode toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[['url','🔗 URL du logo'],['upload','📤 Téléverser une image']].map(([v,l])=>(
            <button key={v} onClick={()=>setLogoMode(v)} style={{
              padding:'9px 18px', borderRadius:9, cursor:'pointer',
              border:`2px solid ${logoMode===v?'var(--teal)':'var(--border)'}`,
              background:logoMode===v?'var(--teal-light)':'#fff',
              color:logoMode===v?'var(--teal-dark)':'var(--muted)',
              fontFamily:'var(--font-b)', fontSize:14, fontWeight:logoMode===v?700:500,
            }}>{l}</button>
          ))}
        </div>

        {logoMode === 'url' ? (
          <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <div className="lbl">URL de l'image (PNG, JPG, SVG...)</div>
              <input className="inp" type="url" placeholder="https://exemple.com/logo.png"
                value={logoUrl} onChange={e=>{ setLogoUrl(e.target.value); setLogoPreview(e.target.value); }}
                style={{ fontSize:14 }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSaveLogo} disabled={savingLogo} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
              {savingLogo ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        ) : (
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload}/>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <button className="btn btn-sec" onClick={()=>fileRef.current.click()}>
                📁 Choisir un fichier
              </button>
              {logoPreview && logoPreview.startsWith('data:') && (
                <button className="btn btn-primary" onClick={handleSaveLogo} disabled={savingLogo}>
                  {savingLogo ? '⏳...' : '💾 Sauvegarder'}
                </button>
              )}
            </div>
            <p style={{ fontSize:13, color:'var(--dim)', marginTop:8 }}>PNG ou JPG recommandé · Fond transparent idéal</p>
          </div>
        )}
      </div>

      {/* ── SHIFT TYPES ───────────────────────────────── */}
      <div className="card" style={{ padding:28, marginBottom:24 }}>
        <h2 className="section-title" style={{ marginBottom:20 }}>🎨 Codes couleurs des créneaux</h2>
        <div style={{ display:'grid', gap:10 }}>
          {shiftTypes.map(st => (
            <div key={st.id} style={{
              display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
              background: editId===st.id ? 'var(--teal-light)' : 'var(--card2)',
              borderRadius:12, border:`1.5px solid ${editId===st.id?'var(--teal)':'var(--border)'}`,
              transition:'all .15s',
            }}>
              {/* Color swatch */}
              <div style={{ width:42, height:42, borderRadius:10, background:st.bgColor, border:`2.5px solid ${st.color}`, flexShrink:0 }}/>

              {editId === st.id ? (
                <>
                  <input className="inp" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} style={{ maxWidth:200, padding:'8px 12px', fontSize:14 }}/>
                  <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                    <div>
                      <div className="lbl" style={{ marginBottom:4 }}>Couleur texte</div>
                      <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))}
                        style={{ width:44, height:36, border:'none', borderRadius:7, cursor:'pointer' }}/>
                    </div>
                    <div>
                      <div className="lbl" style={{ marginBottom:4 }}>Couleur fond</div>
                      <input type="color" value={form.bgColor} onChange={e=>setForm(f=>({...f,bgColor:e.target.value}))}
                        style={{ width:44, height:36, border:'none', borderRadius:7, cursor:'pointer' }}/>
                    </div>
                  </div>
                  <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>✓ OK</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setEditId(null)}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{st.label}</div>
                    <div style={{ fontSize:12, color:'var(--dim)', marginTop:2 }}>{st.color} · fond {st.bgColor}</div>
                  </div>
                  <span style={{ background:st.bgColor, color:st.color, borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:700, border:`1.5px solid ${st.color}40` }}>
                    {st.label}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={()=>startEdit(st)}>✏️ Modifier</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── ACCESS INFO ───────────────────────────────── */}
      <div className="card" style={{ padding:28, marginBottom:24 }}>
        <h2 className="section-title" style={{ marginBottom:18 }}>🔑 Accès & Sécurité</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'#EBF8FF', borderRadius:12, padding:'16px 18px', border:'1px solid #B3E0FF' }}>
            <div style={{ fontSize:18, marginBottom:8 }}>👔</div>
            <div style={{ fontWeight:700, color:'#1D6FD8', fontSize:15, marginBottom:6 }}>Managers & Dirigeants</div>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>
              Quentin, Florent, Sebastien, Michael<br/>David, Yannis<br/>
              <strong style={{ color:'var(--text)' }}>Mot de passe : Raphael2232</strong>
            </div>
          </div>
          <div style={{ background:'var(--teal-light)', borderRadius:12, padding:'16px 18px', border:'1px solid var(--teal-mid)' }}>
            <div style={{ fontSize:18, marginBottom:8 }}>🛍️</div>
            <div style={{ fontWeight:700, color:'var(--teal-dark)', fontSize:15, marginBottom:6 }}>Vendeurs</div>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>
              Accès direct sans mot de passe<br/>Consultation planning + demandes congés
            </div>
          </div>
        </div>
      </div>

      {/* ── RESET ─────────────────────────────────────── */}
      <div className="card" style={{ padding:28, border:'1.5px solid #FFCCD4' }}>
        <h2 className="section-title" style={{ marginBottom:8, color:'#C8002B' }}>⚠️ Zone dangereuse</h2>
        <p style={{ color:'var(--muted)', fontSize:14, marginBottom:16 }}>
          Réinitialise la liste des employés avec les données par défaut (n'efface pas les plannings).
        </p>
        {resetDone && (
          <div style={{ background:'#E8FAF0', border:'1.5px solid var(--teal-mid)', borderRadius:10, padding:'11px 14px', marginBottom:14, color:'#1A8A42', fontWeight:600, fontSize:14 }}>
            ✅ Employés réinitialisés !
          </div>
        )}
        <button className="btn btn-danger" onClick={handleReset}>
          🔄 Forcer la migration V6 (nouveaux utilisateurs)
        </button>
      </div>
      {/* NOTIFICATIONS */}
      <div className="card" style={{ padding:'28px', marginBottom:24 }}>
        <h2 className="section-title" style={{ marginBottom:6 }}>📧 Emails de la Direction</h2>
        <p style={{ color:'var(--muted)', fontSize:15, marginBottom:20 }}>
          La direction reçoit TOUJOURS un email quand un employé pose un congé. (L'email du magasin concerné est ajouté automatiquement.)
        </p>
        <div style={{ marginBottom:16 }}>
          <label className="lbl">Adresses de la direction (séparées par des virgules)</label>
          <input
            className="inp"
            style={{ fontSize:16 }}
            value={notifEmails}
            onChange={e => setNotifEmails(e.target.value)}
            placeholder="manager@gmail.com, direction@exemple.com"
          />
          <div style={{ fontSize:13, color:'var(--dim)', marginTop:6 }}>
            💡 Vous pouvez mettre autant d'adresses que vous voulez.
          </div>
        </div>
        {notifSaved && (
          <div style={{ background:'#E8FAF0', border:'1.5px solid var(--teal-mid)', borderRadius:10, padding:'10px 16px', marginBottom:14, color:'#1A8A42', fontWeight:600, fontSize:14 }}>
            ✅ Emails de notification sauvegardés !
          </div>
        )}
        <button
          className="btn btn-primary"
          style={{ gap:8 }}
          disabled={savingNotif}
          onClick={async () => {
            setSavingNotif(true);
            await updateSettings({ notificationEmails: notifEmails.trim() });
            setSavingNotif(false); setNotifSaved(true);
            setTimeout(() => setNotifSaved(false), 3000);
          }}
        >
          {savingNotif ? '⏳ Sauvegarde...' : '💾 Sauvegarder les emails'}
        </button>
      </div>

      {isManagerOrDirigeant && currentEmp && (
        <div className="card" style={{ padding:'28px', marginBottom:24 }}>
          <h2 className="section-title" style={{ marginBottom:6 }}>🔑 Mon mot de passe</h2>
          <p style={{ color:'var(--muted)', fontSize:15, marginBottom:20 }}>
            Changez votre mot de passe personnel ({currentEmp.name}). Votre session devient indépendante des autres managers.
          </p>
          <div className="store-form-grid" style={{ marginBottom:16 }}>
            <div>
              <label className="lbl">Nouveau mot de passe</label>
              <input className="inp" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="••••••••"/>
            </div>
            <div>
              <label className="lbl">Confirmer le mot de passe</label>
              <input className="inp" type="password" value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} placeholder="••••••••"/>
            </div>
          </div>
          {pwMsg && (
            <div style={{ background:pwMsg.startsWith('✅')?'#E8FAF0':'#FFF0F2', border:`1.5px solid ${pwMsg.startsWith('✅')?'var(--teal-mid)':'#FFAAB6'}`, borderRadius:10, padding:'10px 16px', marginBottom:14, color:pwMsg.startsWith('✅')?'#1A8A42':'#C8002B', fontWeight:600, fontSize:14 }}>
              {pwMsg}
            </div>
          )}
          <button className="btn btn-primary" disabled={pwSaving}
            onClick={async()=>{
              if(pwNew.length<4){ setPwMsg('❌ Le mot de passe doit faire au moins 4 caractères'); return; }
              if(pwNew!==pwConfirm){ setPwMsg('❌ Les deux mots de passe ne correspondent pas'); return; }
              setPwSaving(true);
              await changeOwnPassword(currentEmp.id, pwNew);
              setPwSaving(false); setPwNew(''); setPwConfirm('');
              setPwMsg('✅ Mot de passe modifié ! Utilisez-le à votre prochaine connexion.');
              setTimeout(()=>setPwMsg(''),5000);
            }}>
            {pwSaving?'⏳ ...':'🔑 Changer mon mot de passe'}
          </button>
        </div>
      )}

    </div>
  );
}

// Export migration function for use in Settings
export { forceResetAll } from '../firebaseService';
