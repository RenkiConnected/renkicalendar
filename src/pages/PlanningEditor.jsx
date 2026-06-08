import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const BREAKS=[{v:0,l:'Pas de pause'},{v:.5,l:'30 min'},{v:1,l:'1h'},{v:1.5,l:'1h30'},{v:2,l:'2h'}];
const DAY_NAMES=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function calcH(s,e,b){
  try{
    const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);
    const d=(eh*60+em)-(sh*60+sm); // duration in minutes
    if(d<=0) return 0;
    const worked=d-Math.round((b||0)*60); // subtract break (in minutes) to stay exact
    return Math.max(0, parseFloat((worked/60).toFixed(2)));
  }catch{return 0;}
}

// Round minutes to nearest 15min slot (clean times: :00, :15, :30, :45)
function roundTo15(mins) {
  return Math.round(mins / 15) * 15;
}

// Format mins to HH:MM
function minsToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function addMinutes(time,mins){
  const[h,m]=time.split(':').map(Number);
  const total=h*60+m+mins;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function getMeta(types,id){ return types.find(t=>t.id===id)||{label:id,color:'#6366F1',bgColor:'#EEF2FF'}; }
// Format decimal hours to human "7h20" / "7h" / "7h30" format (clearer than 7.33h)
function fmtH(decimalHours){
  if(decimalHours==null||isNaN(decimalHours)) return '0h';
  const totalMin=Math.round(decimalHours*60);
  const h=Math.floor(totalMin/60);
  const m=totalMin%60;
  return m===0 ? `${h}h` : `${h}h${String(m).padStart(2,'0')}`;
}

// SINGLE SOURCE OF TRUTH for a shift's hours.
// ALWAYS recomputes from start/end times minus break, NEVER trusts stored 'hours'.
// This guarantees displayed hours always match displayed times, even for old data.
function shiftHours(sh){
  if(!sh) return 0;
  let total=0;
  if(sh.startTime && sh.endTime){
    total += calcH(sh.startTime, sh.endTime, sh.breakH||0);
  }
  if(sh.split && sh.split.startTime && sh.split.endTime){
    total += calcH(sh.split.startTime, sh.split.endTime, sh.split.breakH||0);
  }
  return parseFloat(total.toFixed(2));
}
// Hours for just the main part (not split) - for per-part display
function mainHours(sh){
  if(!sh||!sh.startTime||!sh.endTime) return 0;
  return calcH(sh.startTime, sh.endTime, sh.breakH||0);
}
function splitHours(sh){
  if(!sh||!sh.split||!sh.split.startTime||!sh.split.endTime) return 0;
  return calcH(sh.split.startTime, sh.split.endTime, sh.split.breakH||0);
}
/* ── SHIFT DETAIL POPUP — desktop + mobile, animated ─────── */
function ShiftDetailPopup({emp,day,shift,onClose,types,onEdit}){
  if(!shift) return null;
  const st=getMeta(types,shift.type);
  const st2=shift.split?getMeta(types,shift.split.type):null;
  const isMob=window.innerWidth<=860;

  // Desktop: centered card with fadeUp. Mobile: bottom sheet with slideUp
  const overlayStyle=isMob?{
    position:'fixed',inset:0,background:'rgba(27,42,59,.55)',
    backdropFilter:'blur(8px)',zIndex:400,
    display:'flex',alignItems:'flex-end',justifyContent:'center',
  }:{
    position:'fixed',inset:0,background:'rgba(27,42,59,.45)',
    backdropFilter:'blur(8px)',zIndex:400,
    display:'flex',alignItems:'center',justifyContent:'center',
    padding:'20px',
  };

  const cardStyle=isMob?{
    background:'#fff',borderRadius:'24px 24px 0 0',
    width:'100%',maxWidth:520,
    padding:'8px 22px 40px',
    maxHeight:'90vh',overflowY:'auto',
    boxShadow:'0 -12px 60px rgba(0,0,0,.25)',
    animation:'slideUp .28s cubic-bezier(.32,0,.67,0) forwards',
  }:{
    background:'#fff',borderRadius:22,
    width:'100%',maxWidth:520,
    padding:'30px 36px',
    maxHeight:'calc(100vh - 40px)',overflowY:'auto',
    boxShadow:'0 24px 80px rgba(0,0,0,.22)',
    animation:'popIn .25s cubic-bezier(.34,1.56,.64,1) forwards',
  };

  return(
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={e=>e.stopPropagation()}>
        {/* Handle (mobile only) */}
        {isMob&&<div style={{width:38,height:4,background:'#E2EBF0',borderRadius:2,margin:'12px auto 20px'}}/>}

        {/* Header: day info */}
        <div style={{
          background:`linear-gradient(135deg,${st.bgColor},${st.bgColor}cc)`,
          borderRadius:14,padding:'14px 16px',marginBottom:16,
          border:`1.5px solid ${st.color}30`,
          display:'flex',alignItems:'center',justifyContent:'space-between',
        }}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:st.color,textTransform:'capitalize',letterSpacing:'.04em'}}>
              {day.day}
            </div>
            <div style={{fontSize:20,fontWeight:800,color:'var(--text)',marginTop:2}}>
              {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
            </div>
          </div>
          <button onClick={onClose} style={{background:'rgba(0,0,0,.06)',border:'none',borderRadius:50,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'var(--muted)'}}>✕</button>
        </div>

        {/* Employee */}
        <div style={{display:'flex',alignItems:'center',gap:13,marginBottom:18,padding:'12px 14px',background:'var(--card2)',borderRadius:12,border:'1px solid var(--border)'}}>
          <div style={{width:46,height:46,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:19,flexShrink:0,boxShadow:`0 4px 12px ${emp.color||'var(--teal)'}55`}}>
            {emp.name[0]}
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:17,color:'var(--text)'}}>{emp.name}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2,textTransform:'capitalize'}}>{emp.role} · {emp.contractHours}h/sem</div>
          </div>
        </div>

        {/* Main shift block */}
        <div style={{background:st.bgColor,border:`2px solid ${st.color}40`,borderRadius:16,padding:'18px 20px',marginBottom:st2?10:18}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:st.color}}/>
              <span style={{fontWeight:800,fontSize:19,color:st.color}}>{st.label}</span>
            </div>
            {(shift.hours||0)>0&&(
              <div style={{background:st.color,color:'#fff',borderRadius:20,padding:'5px 14px',fontWeight:800,fontSize:18}}>
                {fmtH(mainHours(shift))}
              </div>
            )}
          </div>
          {shift.startTime?(
            <div style={{display:'flex',alignItems:'center',gap:0,background:'rgba(255,255,255,.6)',borderRadius:10,padding:'10px 14px'}}>
              <div style={{textAlign:'center',flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Début</div>
                <div className="num" style={{fontSize:30,fontWeight:800,color:st.color}}>{shift.startTime}</div>
              </div>
              <div style={{fontSize:22,color:st.color,opacity:.4,padding:'0 8px'}}>→</div>
              <div style={{textAlign:'center',flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Fin</div>
                <div className="num" style={{fontSize:30,fontWeight:800,color:st.color}}>{shift.endTime}</div>
              </div>
              {(shift.breakH||0)>0&&(
                <div style={{textAlign:'center',flex:1,borderLeft:`1px solid ${st.color}25`,paddingLeft:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:st.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Pause</div>
                  <div style={{fontSize:20,fontWeight:800,color:st.color}}>{shift.breakH}h</div>
                </div>
              )}
            </div>
          ):(
            <div style={{textAlign:'center',padding:'6px 0',fontSize:15,color:st.color,fontWeight:600,opacity:.8}}>Journée complète</div>
          )}
          {shift.note&&<div style={{marginTop:10,fontSize:13,color:st.color,opacity:.75,fontStyle:'italic',display:'flex',gap:6,alignItems:'center'}}>
            <span>💬</span>{shift.note}
          </div>}
          {shift.depannage&&<div style={{marginTop:8,fontSize:12,background:'#FFF7E0',color:'#D05B00',borderRadius:7,padding:'4px 10px',display:'inline-block',fontWeight:700}}>⚡ Dépannage</div>}
        </div>

        {/* Split shift */}
        {st2&&shift.split&&(
          <div style={{background:st2.bgColor,border:`2px solid ${st2.color}40`,borderRadius:16,padding:'18px 20px',marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:st2.color}}/>
                <span style={{fontWeight:800,fontSize:19,color:st2.color}}>{st2.label}</span>
              </div>
              {(shift.split.hours||0)>0&&(
                <div style={{background:st2.color,color:'#fff',borderRadius:20,padding:'5px 14px',fontWeight:800,fontSize:18}}>
                  {shift.split.hours}h
                </div>
              )}
            </div>
            {shift.split.startTime&&(
              <div style={{display:'flex',alignItems:'center',gap:0,background:'rgba(255,255,255,.6)',borderRadius:10,padding:'10px 14px'}}>
                <div style={{textAlign:'center',flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:st2.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Début</div>
                  <div className="num" style={{fontSize:30,fontWeight:800,color:st2.color}}>{shift.split.startTime}</div>
                </div>
                <div style={{fontSize:22,color:st2.color,opacity:.4,padding:'0 8px'}}>→</div>
                <div style={{textAlign:'center',flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:st2.color,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em'}}>Fin</div>
                  <div className="num" style={{fontSize:30,fontWeight:800,color:st2.color}}>{shift.split.endTime}</div>
                </div>
              </div>
            )}
            {shift.split.note&&<div style={{marginTop:10,fontSize:13,color:st2.color,opacity:.75,fontStyle:'italic',display:'flex',gap:6,alignItems:'center'}}>
              <span>💬</span>{shift.split.note}
            </div>}
          </div>
        )}

        {/* Actions */}
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'14px',fontSize:16,borderRadius:12,fontWeight:700}}
            onClick={onEdit}>
            ✏️ Modifier
          </button>
          <button className="btn btn-ghost" style={{padding:'14px 20px',fontSize:16,borderRadius:12}} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes popIn {
          from { transform: scale(.88) translateY(12px); opacity:0; }
          to   { transform: scale(1)   translateY(0);    opacity:1; }
        }
      `}</style>
    </div>
  );
}



/* ── SHIFT MODAL WITH SPLIT-DAY ────────────────────────────── */
function ShiftModal({emp,dayIdx,day,shift,onSave,onDelete,onClose,types}){
  const[splitMode,setSplitMode]=useState(!!(shift?.split));
  // Main/AM slot
  const[type,setType]=useState(shift?.type||'work');
  const[s,setS]=useState(shift?.startTime||'09:00');
  const[e,setE]=useState(shift?.endTime||'13:30');
  const[brk,setBrk]=useState(shift?.breakH!=null?shift.breakH:1);
  const[note,setNote]=useState(shift?.note||'');
  const[dep,setDep]=useState(shift?.depannage||false);
  // PM slot (split)
  const[type2,setType2]=useState(shift?.split?.type||'meeting');
  const[s2,setS2]=useState(shift?.split?.startTime||'14:00');
  const[e2,setE2]=useState(shift?.split?.endTime||'19:00');
  const[brk2,setBrk2]=useState(shift?.split?.breakH!=null?shift.split.breakH:0);
  const[note2,setNote2]=useState(shift?.split?.note||'');

  const needsT=['work','communication','meeting','school'].includes(type);
  const needsT2=['work','communication','meeting','school'].includes(type2);
  const h1=needsT?calcH(s,e,brk):0;
  const h2=needsT2?calcH(s2,e2,brk2):0;
  const totalH=parseFloat((h1+h2).toFixed(2));

  const handleSave=()=>{
    const data={
      type,
      startTime:needsT?s:null,
      endTime:needsT?e:null,
      breakH:needsT?brk:0,
      hours:needsT?parseFloat(h1.toFixed(2)):null,
      note,
      depannage:dep,
      split:splitMode?{
        type:type2,
        startTime:needsT2?s2:null,
        endTime:needsT2?e2:null,
        breakH:needsT2?brk2:0,
        hours:needsT2?parseFloat(h2.toFixed(2)):null,
        note:note2,
      }:null,
    };
    onSave(data);
  };

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:780}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22,paddingBottom:18,borderBottom:'1.5px solid var(--border)'}}>
          <div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:23}}>✏️ Modifier le créneau</h3>
            <p style={{color:'var(--muted)',fontSize:15,marginTop:5}}><b style={{color:'var(--text)'}}>{emp.name}</b> · {day.day} {day.date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        {/* Split toggle */}
        <div style={{display:'flex',background:'var(--card2)',borderRadius:10,padding:3,marginBottom:18,border:'1px solid var(--border)'}}>
          <button onClick={()=>setSplitMode(false)} style={{
            flex:1,padding:'9px',borderRadius:8,border:'none',cursor:'pointer',
            background:!splitMode?'white':'transparent',
            color:!splitMode?'var(--text)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:13,fontWeight:!splitMode?700:500,
            boxShadow:!splitMode?'var(--shadow)':'none',transition:'all .15s',
          }}>🕐 Journée simple</button>
          <button onClick={()=>setSplitMode(true)} style={{
            flex:1,padding:'9px',borderRadius:8,border:'none',cursor:'pointer',
            background:splitMode?'white':'transparent',
            color:splitMode?'var(--text)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:13,fontWeight:splitMode?700:500,
            boxShadow:splitMode?'var(--shadow)':'none',transition:'all .15s',
          }}>✂️ Journée coupée (matin/après-midi)</button>
        </div>

        {/* SLOT 1 */}
        <div style={{background:splitMode?'#EBF8FF':'transparent',borderRadius:splitMode?12:0,padding:splitMode?'14px':0,border:splitMode?'1px solid #B3E0FF':'none',marginBottom:splitMode?12:0}}>
          {splitMode&&<div className="lbl" style={{color:'#1D6FD8',marginBottom:10}}>🌅 Matin</div>}
          <div style={{marginBottom:12}}>
            <div className="lbl">{splitMode?'Type matin':'Type'}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {types.map(st=>(
                <button key={st.id} onClick={()=>setType(st.id)} style={{
                  padding:'7px 13px',borderRadius:30,cursor:'pointer',
                  border:`2px solid ${type===st.id?st.color:st.color+'40'}`,
                  background:type===st.id?st.bgColor:'#fff',
                  color:st.color,fontWeight:type===st.id?700:500,fontSize:12,fontFamily:'var(--font-b)',
                }}>{st.label}</button>
              ))}
            </div>
          </div>
          {needsT&&<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
              <div><div className="lbl">Début</div><input className="inp" type="time" value={s} onChange={ev=>setS(ev.target.value)}/></div>
              <div><div className="lbl">Fin</div><input className="inp" type="time" value={e} onChange={ev=>setE(ev.target.value)}/></div>
              <div>
                <div className="lbl">Pause</div>
                <select className="inp" value={brk} onChange={ev=>setBrk(parseFloat(ev.target.value))}>
                  {BREAKS.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}
                </select>
              </div>
            </div>
            {h1>0&&<div style={{background:'var(--teal-light)',borderRadius:10,padding:'12px 16px',marginBottom:12,fontSize:16,color:'var(--teal-dark)',fontWeight:700,border:'1.5px solid var(--teal-mid)'}}>⏱ {fmtH(h1)}</div>}
          </>}
          <div style={{marginBottom:4}}><div className="lbl">Note</div><input className="inp" type="text" placeholder="Remarque..." value={note} onChange={ev=>setNote(ev.target.value)}/></div>
        </div>

        {/* SLOT 2 (split mode) */}
        {splitMode&&(
          <div style={{background:'#FFF3E0',borderRadius:12,padding:'14px',border:'1px solid #FFCC80',marginBottom:14}}>
            <div className="lbl" style={{color:'#D05B00',marginBottom:10}}>🌆 Après-midi</div>
            <div style={{marginBottom:10}}>
              <div className="lbl">Type après-midi</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {types.map(st=>(
                  <button key={st.id} onClick={()=>setType2(st.id)} style={{
                    padding:'7px 13px',borderRadius:30,cursor:'pointer',
                    border:`2px solid ${type2===st.id?st.color:st.color+'40'}`,
                    background:type2===st.id?st.bgColor:'#fff',
                    color:st.color,fontWeight:type2===st.id?700:500,fontSize:12,fontFamily:'var(--font-b)',
                  }}>{st.label}</button>
                ))}
              </div>
            </div>
            {needsT2&&<>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:8}}>
                <div><div className="lbl">Début</div><input className="inp" type="time" value={s2} onChange={ev=>setS2(ev.target.value)}/></div>
                <div><div className="lbl">Fin</div><input className="inp" type="time" value={e2} onChange={ev=>setE2(ev.target.value)}/></div>
                <div>
                  <div className="lbl">Pause</div>
                  <select className="inp" value={brk2} onChange={ev=>setBrk2(parseFloat(ev.target.value))}>
                    {BREAKS.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}
                  </select>
                </div>
              </div>
              {h2>0&&<div style={{background:'rgba(208,91,0,.08)',borderRadius:8,padding:'7px 12px',marginBottom:8,fontSize:13,color:'#D05B00',fontWeight:600}}>⏱ {fmtH(h2)}</div>}
            </>}
            <div><div className="lbl">Note</div><input className="inp" type="text" placeholder="Remarque..." value={note2} onChange={ev=>setNote2(ev.target.value)}/></div>
          </div>
        )}

        {/* Total */}
        {splitMode&&totalH>0&&(
          <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',gap:10,alignItems:'center'}}>
            <span>⏱</span>
            <span style={{color:'var(--teal-dark)',fontWeight:700,fontSize:15}}>Total journée : {totalH}h</span>
          </div>
        )}

        {!splitMode&&(
          <label style={{display:'flex',alignItems:'center',gap:10,marginTop:12,marginBottom:18,cursor:'pointer',fontSize:14,color:'var(--muted)'}}>
            <input type="checkbox" checked={dep} onChange={ev=>setDep(ev.target.checked)} style={{accentColor:'var(--teal)',width:16,height:16}}/>
            Dépannage (autre magasin)
          </label>
        )}

        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:'13px'}} onClick={handleSave}>
            ✓ Enregistrer
          </button>
          {shift&&<button className="btn btn-danger" onClick={onDelete}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

/* ── AUTO-GENERATE MODAL ──────────────────────────────────── */
function AutoModal({store,emps,weekDates,currentWeek,currentYear,leaveRequests,onGenerate,onClose}){
  const[openStart,setOpenStart]=useState(store.openTime||'09:00');
  const[openEnd,setOpenEnd]=useState(store.closeTime||'19:30');
  const hasLunch=!!(store.lunchBreak&&store.lunchStart&&store.lunchEnd);
  const[brk,setBrk]=useState(1);

  const openH=parseFloat(calcH(openStart,openEnd,brk).toFixed(2)); // full day span
  
  // Show approved leaves for this week for each emp
  const getEmpLeaves=(empId)=>{
    const leaves=[];
    leaveRequests.filter(r=>r.employeeId===empId&&r.status==='approved').forEach(req=>{
      req.weeks?.forEach(we=>{
        if(we.week===currentWeek&&we.year===currentYear){
          we.days.forEach(di=>leaves.push(di));
        }
      });
    });
    return leaves;
  };

  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:740}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
          <div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:22}}>⚡ Génération automatique</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}>{store.name} · S{currentWeek}</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        {/* Info */}
        <div style={{background:'var(--teal-light)',border:'1.5px solid var(--teal-mid)',borderRadius:12,padding:'16px 18px',marginBottom:22,fontSize:14,color:'var(--teal-dark)',lineHeight:1.8}}>
          ✅ Les <strong>congés approuvés</strong> sont intégrés automatiquement<br/>
          ✅ Les heures hebdomadaires de <strong>chaque contrat</strong> sont respectées<br/>
          ✅ Les employés alternent <strong>ouverture / fermeture</strong>
        </div>

        {/* Horaires magasin */}
        <div style={{marginBottom:16}}>
          <div className="lbl">Horaires d'ouverture du magasin</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div className="lbl" style={{fontSize:10}}>Ouverture</div>
              <input className="inp" type="time" value={openStart} onChange={e=>setOpenStart(e.target.value)}/>
            </div>
            <div>
              <div className="lbl" style={{fontSize:10}}>Fermeture</div>
              <input className="inp" type="time" value={openEnd} onChange={e=>setOpenEnd(e.target.value)}/>
            </div>
          </div>
          {openH>0&&<div style={{marginTop:10,fontSize:15,color:'var(--teal-dark)',fontWeight:700,padding:'10px 14px',background:'white',borderRadius:9,border:'1px solid var(--teal-mid)'}}>📏 Amplitude : {openH}h ({openStart} → {openEnd})</div>}
        </div>

        {/* Pause */}
        <div style={{marginBottom:20}}>
          <div className="lbl">Pause déjeuner</div>
          <div style={{display:'flex',gap:8}}>
            {BREAKS.map(b=>(
              <button key={b.v} onClick={()=>setBrk(b.v)} style={{
                flex:1,padding:'13px 8px',borderRadius:10,cursor:'pointer',
                border:`2px solid ${brk===b.v?'var(--teal)':'var(--border)'}`,
                background:brk===b.v?'var(--teal-light)':'#fff',
                color:brk===b.v?'var(--teal-dark)':'var(--muted)',
                fontWeight:brk===b.v?700:500,fontSize:15,fontFamily:'var(--font-b)',
              }}>{b.l}</button>
            ))}
          </div>
        </div>

        {/* Aperçu congés */}
        <div style={{background:'var(--card2)',borderRadius:12,padding:'16px 18px',marginBottom:22,border:'1.5px solid var(--border)'}}>
          <div style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:15,color:'var(--text)',marginBottom:12}}>👥 Aperçu congés approuvés cette semaine</div>
          {emps.map(emp=>{
            const leaves=getEmpLeaves(emp.id);
            // Count work days = not Sunday AND not leave day
            const workDaysCount=weekDates.filter((wd,di)=>{
              const dow=wd.date.getDay();
              return dow!==0&&!leaves.includes(di);
            }).length;
            // Daily hours = contract hours spread over 5 work days (standard)
            // but if has leaves this week, daily hours stay the same (contract is weekly)
            const dailyH=parseFloat((emp.contractHours/5).toFixed(2));
            const expectedWeekH=parseFloat((workDaysCount*dailyH).toFixed(2));
            return(
              <div key={emp.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,padding:'8px 10px',background:'white',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0}}>{emp.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{emp.name}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:1}}>
                    Contrat <strong>{emp.contractHours}h</strong>/sem · {workDaysCount} jours · {dailyH}h/j → <strong style={{color:'var(--teal-dark)'}}>{expectedWeekH}h prévues</strong>
                  </div>
                </div>
                {leaves.length>0?(
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    {leaves.map(di=>(
                      <span key={di} style={{background:'#EDE9FE',color:'#7C3AED',borderRadius:7,padding:'4px 10px',fontSize:12,fontWeight:700}}>
                        🌴 {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][di]}
                      </span>
                    ))}
                  </div>
                ):(
                  <span style={{fontSize:12,color:'var(--dim)'}}>Aucun congé</span>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'14px',fontSize:15,borderRadius:12}}
          onClick={()=>onGenerate({openStart,openEnd,brk})} disabled={openH<=0} style={{fontSize:16,padding:'16px',borderRadius:13}}>
          ⚡ Générer le planning
        </button>
      </div>
    </div>
  );
}

/* ── BORROW MODAL ─────────────────────────────────────────── */
function BorrowModal({store,allEmployees,allStores,currentEmps,onBorrow,onClose}){
  const[selected,setSelected]=useState('');
  const available=allEmployees.filter(e=>!currentEmps.find(c=>c.id===e.id));
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:700}} onClick={ev=>ev.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:20}}>👥 Ajouter un employé</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginTop:3}}>Pour ce planning · <strong>{store.name}</strong></p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div style={{background:'#FFF7E0',border:'1.5px solid #F5D06A',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'#B07D00'}}>
          ⚡ Employé ajouté temporairement · Son magasin d'origine reste inchangé
        </div>
        <div style={{display:'grid',gap:7,maxHeight:320,overflowY:'auto',marginBottom:16}}>
          {available.map(emp=>{
            const homeStore=allStores.find(s=>s.id===(emp.originalStoreId||emp.storeId));
            return(
              <button key={emp.id} onClick={()=>setSelected(emp.id)} style={{
                display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:11,cursor:'pointer',
                border:`2px solid ${selected===emp.id?store.color:'var(--border)'}`,
                background:selected===emp.id?store.color+'12':'#fff',
                fontFamily:'var(--font-b)',textAlign:'left',transition:'all .15s',
              }}>
                <div style={{width:36,height:36,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',flexShrink:0}}>{emp.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{emp.name}</div>
                  <div style={{fontSize:12,color:'var(--dim)',marginTop:1}}>{homeStore?.name} · {emp.contractHours}h/sem</div>
                </div>
                {homeStore&&<div style={{width:8,height:8,borderRadius:'50%',background:homeStore.color,flexShrink:0}}/>}
              </button>
            );
          })}
        </div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'13px',fontSize:15,borderRadius:12,opacity:!selected?.6:1}}
          onClick={()=>selected&&onBorrow(selected)} disabled={!selected}>
          ✓ Ajouter au planning
        </button>
      </div>
    </div>
  );
}

/* ── WEEK NAV ─────────────────────────────────────────────── */
function WeekNav({cw,setCw}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCw(w=>Math.max(1,w-1))}>‹</button>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:10,padding:'9px 18px',textAlign:'center',minWidth:88}}>
        <span style={{fontFamily:'var(--font-h)',fontWeight:800,color:'var(--teal-dark)',fontSize:18}}>S{cw}</span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={()=>setCw(w=>Math.min(52,w+1))}>›</button>
    </div>
  );
}

/* ── MAIN ─────────────────────────────────────────────────── */
export default function PlanningEditor(){
  const{stores,employees,shiftTypes,getSchedule,setShift,setBulkSchedule,currentWeek,setCurrentWeek,currentYear,selectedStore,setSelectedStore,getWeekDatesForCurrentWeek,leaveRequests,overtimeRecords,getEmpOvertimeBalance,resolveOvertime,deleteOvertimeEntry,updateOvertimeHours,authRole,schedules}=useApp();
  const[activeStore,setAS]=useState(selectedStore||stores[0]?.id||'');
  const[viewMode,setViewMode]=useState('week');
  const[activeDay,setActiveDay]=useState(0);
  const[editCell,setEditCell]=useState(null);
  const[showWknd,setShowWknd]=useState(false);
  const[showAuto,setShowAuto]=useState(false);
  const[showBorrow,setShowBorrow]=useState(false);
  const[confirmWknd,setConfirmWknd]=useState(null);
  const[generating,setGenerating]=useState(false);
  const[borrowedEmps,setBorrowedEmps]=useState([]);
  const[detailPopup,setDetailPopup]=useState(null); // {empId, dayIdx}
  const[overtimeModal,setOvertimeModal]=useState(null); // {empId}
  const[clipboard,setClipboard]=useState(null); // copied shift data

  // Drag state — use refs for performance during drag
  const dragSrcRef=useRef(null);
  const[dragOver,setDragOver]=useState(null);

  const store=stores.find(s=>s.id===activeStore);
  const storeEmps=employees.filter(e=>e.storeId===activeStore);
  const manualExtra=borrowedEmps.map(id=>employees.find(e=>e.id===id)).filter(Boolean);

  // AUTO-detect visitors: employees from OTHER stores who have a real shift in THIS store this week
  const autoVisitors = React.useMemo(()=>{
    const ownSched=getSchedule(activeStore,currentWeek,currentYear);
    const visitorIds=new Set();
    employees.forEach(e=>{
      if(e.storeId===activeStore) return; // already a home employee
      // does this foreign employee have any shift in the active store this week?
      for(let di=0;di<7;di++){
        const sh=ownSched[`${e.id}_${di}`];
        if(sh && (sh.type==='work'||sh.type==='communication'||sh.type==='meeting')){
          visitorIds.add(e.id); break;
        }
      }
    });
    return employees.filter(e=>visitorIds.has(e.id));
  },[employees,activeStore,currentWeek,currentYear,schedules]);

  const extraEmps=[...manualExtra,...autoVisitors.filter(v=>!manualExtra.find(m=>m.id===v.id))];
  const allDisplayEmps=[...storeEmps,...extraEmps.filter(e=>!storeEmps.find(s=>s.id===e.id))];

  // ── LEAVE ALERTS for current week ────────────────────────────
  const weekLeaveAlerts = React.useMemo(()=>{
    const alerts=[];
    allDisplayEmps.forEach(emp=>{
      leaveRequests.filter(r=>r.employeeId===emp.id).forEach(req=>{
        const hasThisWeek=req.weeks?.some(w=>w.week===currentWeek&&w.year===currentYear);
        if(!hasThisWeek) return;
        const days=req.weeks?.find(w=>w.week===currentWeek&&w.year===currentYear)?.days||[];
        alerts.push({emp, req, days});
      });
    });
    return alerts;
  },[allDisplayEmps,leaveRequests,currentWeek,currentYear]);
  const weekDates=getWeekDatesForCurrentWeek(currentWeek);
  const ownSchedule=getSchedule(activeStore,currentWeek,currentYear);

  // Build merged schedule: own shifts + "déplacement" shifts found in OTHER stores
  // for employees whose home store is the active store.
  const {schedule, awayShifts} = React.useMemo(()=>{
    const merged = {...ownSchedule};
    const away = {}; // key empId_dayIdx -> {storeId, storeName, shift}
    // For each employee of THIS store, look in all other stores' schedules this week
    storeEmps.forEach(emp=>{
      stores.forEach(st=>{
        if(st.id===activeStore) return;
        const otherSched=schedules[`${st.id}_${currentYear}_W${currentWeek}`]||{};
        weekDates.forEach((_,di)=>{
          const key=`${emp.id}_${di}`;
          const sh=otherSched[key];
          if(sh && (sh.type==='work'||sh.type==='communication'||sh.type==='meeting')){
            // This employee is working in another store this day = déplacement
            // Only show if their OWN store doesn't already have a shift that day
            if(!merged[key] || merged[key].type==='rest' || !merged[key].startTime){
              merged[key]={...sh, _away:true, _awayStoreId:st.id, _awayStoreName:st.name, _awayColor:st.color};
              away[key]={storeId:st.id, storeName:st.name, color:st.color, shift:sh};
            }
          }
        });
      });
    });
    return {schedule: merged, awayShifts: away};
  },[ownSchedule, schedules, storeEmps, stores, activeStore, currentWeek, currentYear, weekDates]);
  const displayDays=showWknd?weekDates:weekDates.slice(0,6);

  const setStore=id=>{ setAS(id); setSelectedStore(id); setBorrowedEmps([]); };
  const totalH=empId=>{
    let t=0;
    const workTypes=['work','communication','meeting','school'];
    weekDates.forEach((_,i)=>{
      const s=schedule[`${empId}_${i}`];
      if(!s) return;
      // Recompute hours from actual times (never trust stored 'hours')
      if(workTypes.includes(s.type)) t+=mainHours(s);
      if(s.split && workTypes.includes(s.split.type)) t+=splitHours(s);
    });
    return parseFloat(t.toFixed(2));
  };

  const handleCell=(empId,dayIdx,forceEdit=false)=>{
    const dow=weekDates[dayIdx].date.getDay();
    if(!showWknd&&dow===0){ setConfirmWknd({empId,dayIdx}); return; }
    // Manager planning: ALWAYS go straight to edit modal (shift or empty)
    setEditCell({empId,dayIdx});
  };

  // ── COPY / PASTE shifts ──
  const handleCopyShift=(sh)=>{
    // Store a clean copy (strip away-markers)
    const clean={type:sh.type,startTime:sh.startTime,endTime:sh.endTime,breakH:sh.breakH||0,hours:sh.hours,note:sh.note||'',depannage:sh.depannage||false};
    if(sh.split) clean.split={...sh.split};
    setClipboard(clean);
  };
  const handlePasteShift=(empId,dayIdx)=>{
    if(!clipboard) return;
    const dow=weekDates[dayIdx].date.getDay();
    if(!showWknd&&dow===0){ setConfirmWknd({empId,dayIdx}); return; }
    setShift(activeStore,currentWeek,currentYear,empId,dayIdx,{...clipboard});
  };

  // Where to save a shift: if it's an "away" (déplacement) shift, save to the OTHER store
  const resolveSaveTarget=(empId,dayIdx)=>{
    const sh=schedule[`${empId}_${dayIdx}`];
    if(sh && sh._away && sh._awayStoreId){
      return {storeId:sh._awayStoreId, isAway:true};
    }
    return {storeId:activeStore, isAway:false};
  };

  const handleSave=data=>{ if(!editCell) return; const tgt=resolveSaveTarget(editCell.empId,editCell.dayIdx); setShift(tgt.storeId,currentWeek,currentYear,editCell.empId,editCell.dayIdx,data); setEditCell(null); };
  const handleDelete=()=>{ if(!editCell) return; const tgt=resolveSaveTarget(editCell.empId,editCell.dayIdx); setShift(tgt.storeId,currentWeek,currentYear,editCell.empId,editCell.dayIdx,null); setEditCell(null); };

  /* ── AUTO GENERATE — SMART ALGORITHM ───────────────────────── */
  const handleAutoGen=async({openStart,openEnd,brk})=>{
    const storeHasLunch = !!(store.lunchBreak && store.lunchStart && store.lunchEnd);
    setGenerating(true); setShowAuto(false);

    // ── Helpers ──
    const toMins = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
    const getEmpLeaveDays=(empId)=>{
      const days=new Set();
      leaveRequests.filter(r=>r.employeeId===empId&&r.status==='approved').forEach(req=>{
        req.weeks?.forEach(we=>{ if(we.week===currentWeek&&we.year===currentYear){ we.days.forEach(di=>days.add(di)); } });
      });
      return days;
    };

    const storeOpenMins = toMins(openStart);
    const storeCloseMins = toMins(openEnd);
    const breakMins = Math.round((brk||0)*60);
    const bulk = {};
    const empHours = {};
    storeEmps.forEach(e=>{ empHours[e.id]=0; });

    // ── PRE-ASSIGN REST DAYS (1 per employee, spread so no same-day clashes) ──
    // Working days = Mon(0)..Sat(5), not Sunday(6)
    const workingDays = [0,1,2,3,4,5]; // indices in weekDates (Mon-Sat)
    const empRestDay = {}; // empId -> dayIdx
    const dayRestCount = {}; // dayIdx -> how many resting that day
    workingDays.forEach(d=>{ dayRestCount[d]=0; });

    storeEmps.forEach((emp, i) => {
      const leaveDays = getEmpLeaveDays(emp.id);
      // Candidate days: working days where employee isn't on leave
      const candidates = workingDays.filter(d => !leaveDays.has(d));
      if (candidates.length === 0) return; // all days are leave, skip
      // Pick the day with the fewest rests so far (spread evenly)
      const restDay = candidates.reduce((best, d) =>
        (dayRestCount[d] < dayRestCount[best]) ? d : best, candidates[0]);
      empRestDay[emp.id] = restDay;
      dayRestCount[restDay] = (dayRestCount[restDay]||0) + 1;
    });

    // For each working day, build coverage with guaranteed opener + closer
    weekDates.forEach((wd, di) => {
      const dow = wd.date.getDay();
      const isSunday = dow === 0;

      // Who is available today (not on leave, not Sunday, not on their rest day)
      const available = storeEmps.filter(e => !isSunday && !getEmpLeaveDays(e.id).has(di) && empRestDay[e.id] !== di);

      // Mark Sunday rest + leaves + assigned rest days first
      storeEmps.forEach(emp => {
        const key = `${emp.id}_${di}`;
        if (isSunday) {
          bulk[key] = {type:'rest',startTime:null,endTime:null,breakH:0,hours:null,note:'',depannage:false};
        } else if (getEmpLeaveDays(emp.id).has(di)) {
          bulk[key] = {type:'vacation',startTime:null,endTime:null,breakH:0,hours:null,note:'Congé approuvé',depannage:false};
        } else if (empRestDay[emp.id] === di) {
          bulk[key] = {type:'rest',startTime:null,endTime:null,breakH:0,hours:null,note:'Repos hebdomadaire',depannage:false};
        }
      });

      if (isSunday || available.length === 0) return;

      // Sort available by who has worked the LEAST so far (fair rotation)
      const sorted = [...available].sort((a,b)=> (empHours[a.id]||0) - (empHours[b.id]||0));

      const n = sorted.length;
      const totalAmplitude = storeCloseMins - storeOpenMins; // e.g. 600 min for 09:30-19:30

      // Each person's target shift length from their contract (per work day)
      const shiftLen = emp => {
        const dailyH = (emp.contractHours||35)/5;
        return roundTo15(Math.round(dailyH*60) + breakMins); // includes break
      };

      if (n === 1) {
        // Only one person: they cover the whole day (open to close)
        const emp = sorted[0];
        const key = `${emp.id}_${di}`;
        const h = calcH(openStart, openEnd, brk);
        bulk[key] = {type:'work',startTime:openStart,endTime:openEnd,breakH:brk,hours:h,note:'Journée complète',depannage:false};
        empHours[emp.id] += h;
      } else {
        // Multiple people: GUARANTEE 1 opener (starts at open) + 1 closer (ends at close)
        // Distribute the rest with staggered mid-day starts to avoid everyone together
        sorted.forEach((emp, idx) => {
          const key = `${emp.id}_${di}`;
          const len = shiftLen(emp); // mins including break
          let sMins, eMins, note;

          if (idx === 0) {
            // OPENER: starts exactly at store open
            sMins = storeOpenMins;
            eMins = roundTo15(storeOpenMins + len);
            if (eMins > storeCloseMins) eMins = storeCloseMins;
            note = 'Ouverture';
          } else if (idx === n - 1) {
            // CLOSER: ends exactly at store close
            eMins = storeCloseMins;
            sMins = roundTo15(storeCloseMins - len);
            if (sMins < storeOpenMins) sMins = storeOpenMins;
            note = 'Fermeture';
          } else {
            // MIDDLE: spread evenly across the inner part of the day so coverage
            // is continuous (no big gaps, nobody bunched at open/close).
            const midSlots = n - 2;          // number of middle people
            const slotIdx = idx;             // 1-based position among all
            const span = totalAmplitude - len;
            // Fraction places middle people between opener and closer, evenly spaced
            const frac = slotIdx / (n - 1);  // e.g. 3 people: middle=0.5; 4 people: 0.33,0.66
            const offset = roundTo15(span * frac);
            sMins = roundTo15(storeOpenMins + offset);
            eMins = roundTo15(sMins + len);
            if (eMins > storeCloseMins) { eMins = storeCloseMins; sMins = roundTo15(eMins - len); }
            if (sMins < storeOpenMins) sMins = storeOpenMins;
            note = 'Journée';
          }

          const sStart = minsToTime(sMins);
          const sEnd = minsToTime(eMins);

          if (storeHasLunch) {
            // Store closes for lunch: split into morning + afternoon
            const lunchS = store.lunchStart, lunchE = store.lunchEnd;
            const lunchSMins = toMins(lunchS), lunchEMins = toMins(lunchE);
            // Morning part (if shift overlaps morning) + afternoon part
            const amStart = Math.max(sMins, storeOpenMins);
            const amEnd = Math.min(eMins, lunchSMins);
            const pmStart = Math.max(sMins, lunchEMins);
            const pmEnd = Math.min(eMins, storeCloseMins);
            const amH = amEnd>amStart ? calcH(minsToTime(amStart),minsToTime(amEnd),0) : 0;
            const pmH = pmEnd>pmStart ? calcH(minsToTime(pmStart),minsToTime(pmEnd),0) : 0;
            bulk[key] = {
              type:'work', startTime:minsToTime(amStart), endTime:minsToTime(amEnd),
              breakH:0, hours:amH, note, depannage:false,
              split: pmH>0 ? {type:'work',startTime:minsToTime(pmStart),endTime:minsToTime(pmEnd),hours:pmH,note:'Après-midi'} : null,
            };
            empHours[emp.id] += amH + pmH;
          } else {
            const h = calcH(sStart, sEnd, brk);
            bulk[key] = {type:'work',startTime:sStart,endTime:sEnd,breakH:brk,hours:h,note,depannage:false};
            empHours[emp.id] += h;
          }
        });
      }
    });

    await setBulkSchedule(activeStore,currentWeek,currentYear,bulk);
    setGenerating(false);
  };

  /* ── DRAG & DROP — ATOMIC SWAP ───────────────────────────── */
  const handleDragStart=useCallback((empId,dayIdx,e)=>{
    const sh=schedule[`${empId}_${dayIdx}`];
    if(!sh){ e.preventDefault(); return; }
    dragSrcRef.current={empId,dayIdx};
    e.dataTransfer.effectAllowed='move';
    // Store shift data in dataTransfer as backup
    e.dataTransfer.setData('text/plain',JSON.stringify({empId,dayIdx}));
  },[schedule]);

  const handleDragOver=useCallback((empId,dayIdx,e)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect='move';
    setDragOver({empId,dayIdx});
  },[]);

  const handleDrop=useCallback((empId,dayIdx,e)=>{
    e.preventDefault();
    e.stopPropagation();
    const src=dragSrcRef.current;
    if(!src) return;

    // Same cell: nothing to do
    if(src.empId===empId&&src.dayIdx===dayIdx){
      dragSrcRef.current=null; setDragOver(null); return;
    }

    const srcKey=`${src.empId}_${src.dayIdx}`;
    const dstKey=`${empId}_${dayIdx}`;
    const srcShift=schedule[srcKey];
    const dstShift=schedule[dstKey];

    if(!srcShift){ dragSrcRef.current=null; setDragOver(null); return; }

    // Build atomic update — both changes in one object
    const key=`${activeStore}_${currentYear}_W${currentWeek}`;
    // We need to read the current full schedule and apply both changes at once
    // Get current schedule from AppContext state
    const currentFull={...schedule};

    if(dstShift){
      // SWAP: src goes to dst, dst goes to src
      currentFull[dstKey]={...srcShift};
      currentFull[srcKey]={...dstShift};
    } else {
      // MOVE: src goes to dst, src becomes empty
      currentFull[dstKey]={...srcShift};
      delete currentFull[srcKey];
    }

    // Write both changes atomically
    setBulkSchedule(activeStore,currentWeek,currentYear,currentFull);
    dragSrcRef.current=null; setDragOver(null);
  },[schedule,activeStore,currentWeek,currentYear,setBulkSchedule]);

  const handleDragEnd=useCallback(()=>{
    dragSrcRef.current=null; setDragOver(null);
  },[]);

  const handleBorrow=id=>{ setBorrowedEmps(prev=>[...prev,id]); setShowBorrow(false); };

  return(
    <div className="anim-up" style={{width:'100%'}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 className="page-title" style={{fontSize:34}}>📅 Plannings</h1>
          <p className="page-sub" style={{fontSize:17}}>{store?.name||'—'} · <strong style={{color:'var(--teal-dark)'}}>S{currentWeek}</strong> · {allDisplayEmps.length} employé(s)</p>
        </div>
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <WeekNav cw={currentWeek} setCw={setCurrentWeek}/>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowWknd(!showWknd)}>{showWknd?'Masquer dim.':'Voir dim.'}</button>
          {store&&storeEmps.length>0&&(
            <button className="btn btn-sec btn-sm" disabled={generating} onClick={()=>setShowAuto(true)}>
              {generating?'⏳ Génération...':'⚡ Auto-générer'}
            </button>
          )}
          <button className="btn btn-sec btn-sm" onClick={()=>setShowBorrow(true)}>👥 Ajouter</button>
          <button className="btn btn-primary btn-sm" onClick={()=>window.dispatchEvent(new CustomEvent('exportPDF',{detail:{storeId:activeStore,week:currentWeek}}))}>📄 PDF</button>
          <button className="btn btn-ghost btn-sm" title="Copier le planning en image pour Notion" onClick={()=>window.dispatchEvent(new CustomEvent('exportNotion',{detail:{storeId:activeStore,week:currentWeek}}))}>🖼️ Notion</button>
        </div>
      </div>

      {/* STORE TABS */}
      <div style={{display:'flex',gap:8,marginBottom:20,overflowX:'auto',paddingBottom:4}}>
        {stores.map(s=>(
          <button key={s.id} onClick={()=>setStore(s.id)} style={{
            padding:'9px 18px',borderRadius:30,cursor:'pointer',flexShrink:0,
            border:`2px solid ${activeStore===s.id?s.color:s.color+'40'}`,
            background:activeStore===s.id?s.color:'#fff',
            color:activeStore===s.id?'#fff':s.color,
            fontFamily:'var(--font-b)',fontSize:14,fontWeight:activeStore===s.id?700:500,
            transition:'all .22s cubic-bezier(.22,1,.36,1)',boxShadow:activeStore===s.id?`0 6px 18px ${s.color}55`:'none',transform:activeStore===s.id?'translateY(-2px)':'translateY(0)',
          }}>{s.name}</button>
        ))}
      </div>

      {/* VIEW TOGGLE + borrowed employees */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <div style={{background:'var(--card2)',borderRadius:10,padding:3,border:'1px solid var(--border)',display:'inline-flex'}}>
          {[['week','Semaine'],['day','Journée'],['month','Mois']].map(([m,label])=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{
              padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',
              background:viewMode===m?'var(--teal)':'transparent',
              color:viewMode===m?'#fff':'var(--muted)',
              fontFamily:'var(--font-b)',fontSize:14,fontWeight:viewMode===m?700:500,
            }}>{label}</button>
          ))}
        </div>
        {viewMode==='day'&&weekDates.map((wd,i)=>(
          <button key={i} onClick={()=>setActiveDay(i)} style={{
            padding:'7px 13px',borderRadius:9,cursor:'pointer',
            border:`2px solid ${activeDay===i?'var(--teal)':'var(--border)'}`,
            background:activeDay===i?'var(--teal-light)':'#fff',
            color:activeDay===i?'var(--teal-dark)':'var(--muted)',
            fontFamily:'var(--font-b)',fontSize:13,fontWeight:activeDay===i?700:500,
          }}>{wd.day.slice(0,3)} {wd.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</button>
        ))}
        {extraEmps.length>0&&(
          <div style={{display:'flex',gap:5,marginLeft:'auto',flexWrap:'wrap'}}>
            {extraEmps.map(e=>(
              <span key={e.id} style={{display:'flex',alignItems:'center',gap:5,background:'#FFF7E0',border:'1.5px solid #F5D06A',borderRadius:20,padding:'4px 10px',fontSize:12,color:'#B07D00',fontWeight:600}}>
                ⚡{e.name}
                <button onClick={()=>setBorrowedEmps(prev=>prev.filter(id=>id!==e.id))} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#B07D00',lineHeight:1}}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div style={{display:'flex',gap:7,marginBottom:18,flexWrap:'wrap'}}>
        {shiftTypes.map(st=>(
          <span key={st.id} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',background:st.bgColor,borderRadius:20,border:`1.5px solid ${st.color}35`,fontSize:12,color:st.color,fontWeight:700}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:st.color,display:'inline-block'}}/>
            {st.label}
          </span>
        ))}
        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',background:'var(--card2)',borderRadius:20,border:'1.5px solid var(--border)',fontSize:12,color:'var(--muted)'}}>
          ↔ Glisser pour déplacer / échanger
        </span>
        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',background:'var(--card2)',borderRadius:20,border:'1.5px solid var(--border)',fontSize:12,color:'var(--muted)'}}>
          📋 Copier · 📌 Coller
        </span>
        {clipboard&&(
          <span style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 12px',background:'var(--teal-light)',borderRadius:20,border:'1.5px solid var(--teal-mid)',fontSize:12,color:'var(--teal-dark)',fontWeight:700}}>
            📋 Copié : {clipboard.startTime?`${clipboard.startTime}–${clipboard.endTime}`:getMeta(shiftTypes,clipboard.type).label}
            <button onClick={()=>setClipboard(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--teal-dark)',fontSize:14,padding:0,lineHeight:1}}>✕</button>
          </span>
        )}
      </div>

      {/* ── LEAVE ALERTS BANNER ───────────────────────────────── */}
      {weekLeaveAlerts.length>0&&(
        <div style={{marginBottom:18}}>
          {weekLeaveAlerts.map(({emp,req,days},i)=>{
            const isApproved=req.status==='approved';
            const isPending=req.status==='pending';
            const dayNames=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
            const LEAVE_LABELS={vacation:'Congés payés',sick:'Maladie',personal:'Motif perso',training:'Formation'};
            return(
              <div key={i} style={{
                display:'flex',alignItems:'flex-start',gap:14,
                padding:'15px 20px',borderRadius:13,marginBottom:10,
                background:isApproved?'#E8FAF0':isPending?'#FFF7E0':'#FFF0F2',
                border:`1.5px solid ${isApproved?'var(--teal-mid)':isPending?'#F5D06A':'#FFAAB6'}`,
              }}>
                <div style={{width:36,height:36,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:15,flexShrink:0}}>
                  {emp.name[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                    <span style={{fontWeight:800,fontSize:16}}>{emp.name}</span>
                    <span style={{
                      background:isApproved?'#E8FAF0':isPending?'#FFF7E0':'#FFF0F2',
                      color:isApproved?'#1A8A42':isPending?'#B07D00':'#C8002B',
                      border:`1.5px solid ${isApproved?'var(--teal)':isPending?'#F5D06A':'#FFAAB6'}`,
                      borderRadius:20,padding:'4px 12px',fontSize:13,fontWeight:700,
                    }}>
                      {isApproved?'✅ Congé approuvé':isPending?'⏳ En attente de validation':'❌ Refusé'}
                    </span>
                    <span style={{fontSize:13,color:'var(--muted)'}}>
                      {LEAVE_LABELS[req.type]||req.type}
                    </span>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {days.map(di=>(
                      <span key={di} style={{
                        background:'white',borderRadius:6,padding:'2px 8px',fontSize:12,fontWeight:600,
                        color:isApproved?'var(--teal-dark)':isPending?'#B07D00':'#C8002B',
                        border:`1px solid ${isApproved?'var(--teal-mid)':isPending?'#F5D06A':'#FFAAB6'}`,
                      }}>
                        {dayNames[di]||`Jour ${di}`}
                      </span>
                    ))}
                  </div>
                  {isPending&&(
                    <div style={{fontSize:12,color:'#B07D00',marginTop:4,fontStyle:'italic'}}>
                      ⚠️ Non validé — non intégré dans la génération automatique
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {generating&&(
        <div style={{textAlign:'center',padding:'32px',background:'var(--teal-light)',borderRadius:14,marginBottom:16,border:'2px solid var(--teal-mid)'}}>
          <div style={{fontSize:28,marginBottom:8,animation:'spin 1s linear infinite',display:'inline-block'}}>⚡</div>
          <p style={{color:'var(--teal-dark)',fontWeight:700,fontSize:15}}>Génération en cours...</p>
        </div>
      )}
      {!generating&&allDisplayEmps.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',border:'2px dashed var(--border)',borderRadius:14}}>
          <div style={{fontSize:48,marginBottom:12}}>👥</div>
          <p style={{color:'var(--muted)',fontWeight:600,fontSize:15}}>Aucun employé dans ce magasin</p>
        </div>
      )}
      {!generating&&allDisplayEmps.length>0&&(
        viewMode==='month'
          ?<MonthManagerView
              emps={allDisplayEmps} storeId={activeStore} currentWeek={currentWeek}
              currentYear={currentYear} getSchedule={getSchedule} types={shiftTypes}
              onCell={handleCell} stores={stores} totalH={totalH}
              getWeekDates={getWeekDatesForCurrentWeek}
              overtimeRecords={overtimeRecords} onOvertimeClick={(empId)=>setOvertimeModal({empId})}
          />
          : viewMode==='week'
            ?<WeekView
              emps={allDisplayEmps} days={displayDays} allDays={weekDates}
              sched={schedule} types={shiftTypes} onCell={handleCell} totalH={totalH}
              onDragStart={handleDragStart} onDragOver={handleDragOver}
              onDrop={handleDrop} onDragEnd={handleDragEnd}
              dragOver={dragOver} extraEmpIds={extraEmps.map(e=>e.id)} allStores={stores} activeStoreId={activeStore}
              overtimeRecords={overtimeRecords} onOvertimeClick={(empId)=>setOvertimeModal({empId})}
              clipboard={clipboard} onCopyShift={handleCopyShift} onPasteShift={handlePasteShift}
            />
            :<DayView
              emps={allDisplayEmps} day={weekDates[activeDay]} dayIdx={activeDay}
              sched={schedule} types={shiftTypes} onCell={handleCell}
              onDragStart={handleDragStart} onDragOver={handleDragOver}
              onDrop={handleDrop} onDragEnd={handleDragEnd}
              dragOver={dragOver}
            />
      )}

      {/* MODALS */}
      {editCell&&(()=>{
        const emp=employees.find(e=>e.id===editCell.empId);
        const sh=schedule[`${editCell.empId}_${editCell.dayIdx}`];
        return <ShiftModal emp={emp} dayIdx={editCell.dayIdx} day={weekDates[editCell.dayIdx]} shift={sh} onSave={handleSave} onDelete={handleDelete} onClose={()=>setEditCell(null)} types={shiftTypes}/>;
      })()}
      {confirmWknd&&(
        <div className="overlay" onClick={()=>setConfirmWknd(null)}>
          <div className="modal" style={{maxWidth:480,textAlign:'center'}} onClick={ev=>ev.stopPropagation()}>
            <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:19,marginBottom:9}}>Jour non travaillé</h3>
            <p style={{color:'var(--muted)',fontSize:14,marginBottom:20}}>Ce jour est un dimanche. Planifier quand même ?</p>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setConfirmWknd(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>{ setShowWknd(true); setEditCell(confirmWknd); setConfirmWknd(null); }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
      {detailPopup&&(()=>{
        const emp=employees.find(e=>e.id===detailPopup.empId);
        const sh=schedule[`${detailPopup.empId}_${detailPopup.dayIdx}`];
        const day=weekDates[detailPopup.dayIdx];
        return <ShiftDetailPopup
          emp={emp} day={day} shift={sh}
          onClose={()=>setDetailPopup(null)}
          types={shiftTypes}
          onEdit={()=>{ setDetailPopup(null); setEditCell(detailPopup); }}
        />;
      })()}
      {overtimeModal&&(()=>{
        const emp=employees.find(e=>e.id===overtimeModal.empId);
        if(!emp) return null;
        return <OvertimeModal
          emp={emp} schedule={schedule} weekDates={weekDates}
          currentWeek={currentWeek} currentYear={currentYear}
          overtimeRecords={overtimeRecords} resolveOvertime={resolveOvertime}
          deleteOvertimeEntry={deleteOvertimeEntry} updateOvertimeHours={updateOvertimeHours}
          onClose={()=>setOvertimeModal(null)}
          isManager={['manager','dirigeant','admin'].includes(authRole)}
        />;
      })()}
      {showAuto&&store&&<AutoModal store={store} emps={storeEmps} weekDates={weekDates} currentWeek={currentWeek} currentYear={currentYear} leaveRequests={leaveRequests} onGenerate={handleAutoGen} onClose={()=>setShowAuto(false)}/>}
      {showBorrow&&store&&<BorrowModal store={store} allEmployees={employees} allStores={stores} currentEmps={allDisplayEmps} onBorrow={handleBorrow} onClose={()=>setShowBorrow(false)}/>}
    </div>
  );
}

/* ── OVERTIME MODAL ──────────────────────────────────────── */
function OvertimeModal({emp,schedule,weekDates,currentWeek,currentYear,overtimeRecords,resolveOvertime,deleteOvertimeEntry,updateOvertimeHours,onClose,isManager}){
  const workTypes=['work','communication','meeting','school'];
  const MONTHS=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const workedH=weekDates.reduce((t,_,di)=>{
    const sh=schedule[`${emp.id}_${di}`];
    if(!sh) return t;
    let h=0;
    if(workTypes.includes(sh.type)) h+=mainHours(sh);
    if(sh.split&&workTypes.includes(sh.split.type)) h+=splitHours(sh);
    return t+h;
  },0);
  const contractH=emp.contractHours||35;
  const thisWeekExtra=parseFloat(Math.max(0,workedH-contractH).toFixed(2));
  const empRecords=Object.values(overtimeRecords).filter(r=>r.empId===emp.id).sort((a,b)=>b.year-a.year||b.month-a.month);
  const pendingTotal=empRecords.filter(r=>r.status!=='paid').reduce((t,r)=>t+(r.extraHours||0),0);
  const[action,setAction]=useState('accumulate');
  const[saving,setSaving]=useState(false);
  const[payMonth,setPayMonth]=useState(null);
  const[editRecord,setEditRecord]=useState(null); // {month, year, editH}
  const[deleteConfirm,setDeleteConfirm]=useState(null); // record to delete
  const handleResolve=async()=>{
    if(thisWeekExtra<=0) return;
    setSaving(true);
    await resolveOvertime(emp.id,currentWeek,currentYear,action,thisWeekExtra);
    setSaving(false); onClose();
  };
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:820}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:26}}>
          <div style={{width:58,height:58,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:25,flexShrink:0}}>
            {emp.name[0]}
          </div>
          <div style={{flex:1}}>
            <h3 style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:26}}>{emp.name}</h3>
            <p style={{color:'var(--muted)',fontSize:16,marginTop:3}}>Heures supplémentaires · Contrat {contractH}h/sem</p>
          </div>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:24}}>
          {[
            {l:'Travaillé',v:fmtH(workedH),s:`S${currentWeek}`,bg:'var(--teal-light)',b:'var(--teal-mid)',c:'var(--teal-dark)'},
            {l:'Supp. sem.',v:`${thisWeekExtra>0?'+':''}${fmtH(thisWeekExtra)}`,s:'vs contrat',bg:thisWeekExtra>0?'#E8FAF0':'var(--card2)',b:thisWeekExtra>0?'var(--teal-mid)':'var(--border)',c:thisWeekExtra>0?'#1A8A42':'var(--dim)'},
            {l:'Solde total',v:`+${fmtH(pendingTotal)}`,s:'à régulariser',bg:pendingTotal>0?'#FFF7E0':'var(--card2)',b:pendingTotal>0?'#F5D06A':'var(--border)',c:pendingTotal>0?'#B07D00':'var(--dim)'},
          ].map((s,i)=>(
            <div key={i} style={{background:s.bg,border:`2px solid ${s.b}`,borderRadius:14,padding:'16px 12px',textAlign:'center'}}>
              <div style={{fontSize:12,fontWeight:700,color:s.c,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:6}}>{s.l}</div>
              <div className="num" style={{fontFamily:'var(--font-b)',fontWeight:800,fontSize:30,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{s.s}</div>
            </div>
          ))}
        </div>
        {empRecords.length>0&&(
          <div style={{marginBottom:18}}>
            <div style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:19,marginBottom:14}}>📊 Historique des heures supp.</div>
            {empRecords.map((r,i)=>{
              const isEditing=editRecord?.month===r.month&&editRecord?.year===r.year;
              return(
                <div key={i} style={{background:r.status==='paid'?'#E8FAF0':'#FFF7E0',border:`1.5px solid ${r.status==='paid'?'var(--teal-mid)':'#F5D06A'}`,borderRadius:13,marginBottom:9,overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 18px'}}>
                    <span style={{fontSize:26,flexShrink:0}}>{r.status==='paid'?'✅':'⏳'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:17}}>{MONTHS[r.month-1]} {r.year}</div>
                      <div style={{fontSize:14,color:'var(--muted)',marginTop:2}}>{r.weeks?.length||0} sem. · {r.status==='paid'?'✅ Validé en heures supp':'⏳ En attente'}</div>
                    </div>
                    <div className="num" style={{fontFamily:'var(--font-b)',fontWeight:800,fontSize:24,color:r.status==='paid'?'#1A8A42':'#B07D00',marginRight:6}}>+{fmtH(r.extraHours||0)}</div>
                    {isManager&&(
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        {r.status!=='paid'&&(r.extraHours||0)>0&&(
                          <button className="btn btn-sm" onClick={()=>setPayMonth(r)}
                            style={{background:'#1A8A42',color:'#fff',border:'none',fontSize:13,fontWeight:700,borderRadius:8}}>
                            ✓ Valider
                          </button>
                        )}
                        {r.status!=='paid'&&(
                          <button className="btn btn-sm" onClick={()=>setEditRecord(isEditing?null:{...r,editH:r.extraHours})}
                            style={{background:'#EBF8FF',color:'#1D6FD8',border:'1px solid #B3E0FF',fontSize:13,fontWeight:700,borderRadius:8}}>
                            ✏️
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={()=>setDeleteConfirm(r)}
                          style={{fontSize:13,fontWeight:700,borderRadius:8}}>
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Inline edit panel */}
                  {isEditing&&(
                    <div style={{padding:'12px 16px 14px',background:'rgba(255,255,255,.7)',borderTop:'1px solid rgba(0,0,0,.06)'}}>
                      <div className="lbl" style={{marginBottom:8}}>Modifier les heures</div>
                      <div style={{display:'flex',gap:10,alignItems:'center'}}>
                        <input type="number" step="0.5" min="0" max="100"
                          value={editRecord.editH}
                          onChange={e=>setEditRecord(prev=>({...prev,editH:parseFloat(e.target.value)||0}))}
                          className="inp" style={{maxWidth:120,fontSize:18,fontWeight:700,textAlign:'center'}}
                        />
                        <span style={{fontSize:16,color:'var(--muted)'}}>heures</span>
                        <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}}
                          onClick={async()=>{
                            setSaving(true);
                            await updateOvertimeHours(emp.id,r.year,r.month,editRecord.editH);
                            setEditRecord(null);
                            setSaving(false);
                          }} disabled={saving}>
                          {saving?'⏳':'✓ Sauvegarder'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditRecord(null)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {payMonth&&(
          <div style={{background:'#E8FAF0',borderRadius:13,padding:'16px 18px',border:'2px solid var(--teal-mid)',marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:16,color:'#1A8A42',marginBottom:12}}>
              ✅ Valider {fmtH(payMonth.extraHours||0)} supp pour {MONTHS[payMonth.month-1]} {payMonth.year} ?
            </div>
            <div style={{fontSize:14,color:'var(--muted)',marginBottom:12}}>Ces heures seront marquées comme payées et ne s'accumuleront plus.</div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-sm" style={{background:'#1A8A42',color:'#fff',border:'none',fontSize:14,padding:'10px 18px'}}
                onClick={async()=>{
                  setSaving(true);
                  // Mark as paid: update status to 'paid' in the record
                  const key=`${emp.id}_${payMonth.year}_M${payMonth.month}`;
                  const rec=overtimeRecords[key];
                  if(rec){
                    // Use resolveOvertime with pay action (it will mark as paid)
                    await resolveOvertime(emp.id,currentWeek,currentYear,'pay',0);
                  }
                  setSaving(false); setPayMonth(null); onClose();
                }}>
                {saving?'⏳ ...':'✓ Confirmer le paiement'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{fontSize:14}} onClick={()=>setPayMonth(null)}>Annuler</button>
            </div>
          </div>
        )}

        {deleteConfirm&&(
          <div style={{background:'#FFF0F2',borderRadius:13,padding:'16px 18px',border:'2px solid #FFCCD4',marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:16,color:'#C8002B',marginBottom:8}}>
              🗑 Supprimer {fmtH(deleteConfirm.extraHours||0)} de {MONTHS[deleteConfirm.month-1]} {deleteConfirm.year} ?
            </div>
            <div style={{fontSize:14,color:'var(--muted)',marginBottom:12}}>Cette action est irréversible. Les heures supplémentaires seront supprimées définitivement.</div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-danger btn-sm" style={{fontSize:14,padding:'10px 18px'}}
                onClick={async()=>{
                  setSaving(true);
                  await deleteOvertimeEntry(emp.id,deleteConfirm.year,deleteConfirm.month);
                  setSaving(false); setDeleteConfirm(null);
                }}>
                {saving?'⏳ ...':'🗑 Supprimer définitivement'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{fontSize:14}} onClick={()=>setDeleteConfirm(null)}>Annuler</button>
            </div>
          </div>
        )}
        {isManager&&thisWeekExtra>0&&!payMonth&&(
          <div style={{background:'var(--card2)',borderRadius:16,padding:'20px',border:'1.5px solid var(--border)'}}>
            <div style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:18,marginBottom:14}}>⚡ Action pour S{currentWeek} (+{thisWeekExtra}h)</div>
            {[
              {v:'accumulate',icon:'📅',l:"Conserver jusqu'à fin de mois",s:'Accumulation mensuelle'},
              {v:'deduct',icon:'🔄',l:'Déduire (repos compensation)',s:'Cette semaine'},
              {v:'pay',icon:'💰',l:'Valider en heures supp',s:'Paiement immédiat'},
            ].map(opt=>(
              <button key={opt.v} onClick={()=>setAction(opt.v)} style={{
                display:'flex',alignItems:'center',gap:14,padding:'15px 17px',borderRadius:12,cursor:'pointer',textAlign:'left',width:'100%',marginBottom:9,
                border:`2px solid ${action===opt.v?'var(--teal)':'var(--border)'}`,
                background:action===opt.v?'var(--teal-light)':'#fff',fontFamily:'var(--font-b)',transition:'all .15s',
              }}>
                <span style={{fontSize:24,flexShrink:0}}>{opt.icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:action===opt.v?'var(--teal-dark)':'var(--text)'}}>{opt.l}</div>
                  <div style={{fontSize:14,color:'var(--muted)',marginTop:1}}>{opt.s}</div>
                </div>
              </button>
            ))}
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'16px',fontSize:17,borderRadius:12,marginTop:6}}
              onClick={handleResolve} disabled={saving}>{saving?'⏳ ...':'✓ Confirmer'}</button>
          </div>
        )}
        {!isManager&&<div style={{background:'var(--card2)',borderRadius:12,padding:'13px',border:'1px solid var(--border)',textAlign:'center',color:'var(--muted)',fontSize:14,marginTop:10}}>👔 Contactez votre manager</div>}
      </div>
    </div>
  );
}

/* ── OVERTIME TOTAL CELL ─────────────────────────────────── */
function OvertimeTotalCell({t,diff,emp,overtimeRecords,onOvertimeClick}){
  // Calcul solde heures supp
  const allEmpRec = Object.values(overtimeRecords||{}).filter(r=>r.empId===emp.id);
  const pendingSaved = allEmpRec.filter(r=>r.status!=='paid').reduce((s,r)=>s+(r.extraHours||0),0);
  const pendingPaid  = allEmpRec.filter(r=>r.status==='paid').reduce((s,r)=>s+(r.extraHours||0),0);
  const thisWeekExtra = parseFloat(Math.max(0,diff).toFixed(2));
  const totalSaved    = parseFloat((pendingSaved).toFixed(2));

  return(
    <td style={{padding:'6px 6px',textAlign:'center',minWidth:110}}>
      <button onClick={()=>onOvertimeClick(emp.id)} style={{
        background:'none',border:'none',cursor:'pointer',
        display:'flex',flexDirection:'column',alignItems:'center',gap:4,
        padding:'6px 4px',borderRadius:12,width:'100%',
        transition:'all .18s cubic-bezier(.22,1,.36,1)',
      }}
        onMouseEnter={e=>{e.currentTarget.style.background='var(--card2)';e.currentTarget.style.transform='scale(1.04)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.transform='scale(1)';}}
        title="Cliquer pour gérer les heures supp"
      >
        {/* Heures totales */}
        <div style={{
          fontFamily:'var(--font-b)',fontWeight:800,fontSize:20,lineHeight:1,fontVariantNumeric:'tabular-nums lining-nums',letterSpacing:0,
          color:diff>0.5?'#C8002B':diff<-0.5?'var(--muted)':'var(--teal-dark)',
        }}>{fmtH(t)}</div>

        {/* Diff semaine */}
        <div style={{
          fontSize:13,fontWeight:800,lineHeight:1,
          color:Math.abs(diff)<0.02?'var(--teal-dark)':diff>0?'#C8002B':'#1A8A42',
        }}>{diff>0?'+':diff<0?'-':''}{fmtH(Math.abs(diff))}</div>

        {/* Badge solde accumulé */}
        {totalSaved>0&&(
          <div style={{
            background:'linear-gradient(135deg,#F59E0B,#F97316)',
            color:'#fff',borderRadius:7,padding:'3px 7px',
            fontSize:10,fontWeight:800,lineHeight:1.2,
            display:'flex',alignItems:'center',gap:2,
            boxShadow:'0 2px 8px rgba(249,115,22,.4)',
          }}>
            📅 +{fmtH(totalSaved)}
          </div>
        )}

        {/* Cette semaine en extra */}
        {thisWeekExtra>0&&(
          <div style={{
            background:'linear-gradient(135deg,#C8002B,#E53935)',
            color:'#fff',borderRadius:7,padding:'3px 7px',
            fontSize:10,fontWeight:800,lineHeight:1.2,
            display:'flex',alignItems:'center',gap:2,
            boxShadow:'0 2px 8px rgba(200,0,43,.35)',
          }}>
            ⚡ +{fmtH(thisWeekExtra)}
          </div>
        )}
      </button>
    </td>
  );
}

/* ── MONTH VIEW (MANAGER) ────────────────────────────────── */
function MonthManagerView({emps,storeId,currentWeek,currentYear,getSchedule,types,onCell,stores,totalH,getWeekDates,overtimeRecords,onOvertimeClick}){
  const getMeta=id=>types.find(t=>t.id===id)||{label:id,color:'#6366F1',bgColor:'#EEF2FF'};
  const WORK=['work','communication','meeting','school'];
  const DAY_S=['L','M','M','J','V','S','D'];

  // Get weeks of current month
  const refDate = getWeekDates(currentWeek)[0].date;
  const month = refDate.getMonth();
  const year = refDate.getFullYear();
  const months=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  const weeks = [];
  for(let wk=currentWeek-2;wk<=currentWeek+5;wk++){
    if(wk<1||wk>53) continue;
    const wd=getWeekDates(wk);
    if(wd.some(d=>d.date.getMonth()===month&&d.date.getFullYear()===year)){
      weeks.push({wk,wd});
    }
  }

  const getShift=(empId,di,wk)=>{
    const sched=getSchedule(storeId,wk,currentYear);
    let sh=sched[`${empId}_${di}`];
    // check déplacement
    if(!sh?.startTime){
      stores.forEach(st=>{
        if(st.id===storeId) return;
        const o=getSchedule(st.id,wk,currentYear);
        const s=o[`${empId}_${di}`];
        if(s&&WORK.includes(s.type)) sh={...s,_away:true,_awayStoreName:st.name,_awayColor:st.color};
      });
    }
    return sh;
  };

  const monthTotal=(empId)=>{
    let t=0;
    weeks.forEach(({wk,wd})=>{
      wd.forEach((_,di)=>{
        const sh=getShift(empId,di,wk);
        if(sh&&WORK.includes(sh.type)){
          if(sh.startTime&&sh.endTime){const d=(()=>{try{const[sh2,sm]=sh.startTime.split(':').map(Number),[eh,em]=sh.endTime.split(':').map(Number);const d=(eh*60+em)-(sh2*60+sm);return Math.max(0,parseFloat(((d-Math.round((sh.breakH||0)*60))/60).toFixed(2)));}catch{return 0;}})(); t+=d; }
          if(sh.split?.startTime&&sh.split?.endTime){const d=(()=>{try{const[sh2,sm]=sh.split.startTime.split(':').map(Number),[eh,em]=sh.split.endTime.split(':').map(Number);const d=(eh*60+em)-(sh2*60+sm);return Math.max(0,parseFloat(((d-Math.round((sh.split.breakH||0)*60))/60).toFixed(2)));}catch{return 0;}})(); t+=d; }
        }
      });
    });
    return parseFloat(t.toFixed(2));
  };

  function fH(d){if(!d||isNaN(d))return'0h';const t=Math.round(d*60),h=Math.floor(t/60),m=t%60;return m===0?`${h}h`:`${h}h${String(m).padStart(2,'0')}`;}

  return(
    <div style={{overflowX:'auto'}}>
      <div style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:18,marginBottom:14,textTransform:'capitalize',color:'var(--text)'}}>
        {months[month]} {year}
      </div>
      {emps.map(emp=>{
        const mt=monthTotal(emp.id);
        const isVisitor=emp.storeId!==storeId;
        const homeStore=isVisitor?stores.find(s=>s.id===emp.storeId):null;
        return(
          <div key={emp.id} style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--border)',marginBottom:12,overflow:'hidden',boxShadow:'var(--shadow)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'11px 18px',borderBottom:'1px solid #F0F5F7',background:'var(--card2)'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:16,flexShrink:0}}>{emp.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,display:'flex',alignItems:'center',gap:6}}>
                  {emp.name}
                  {isVisitor&&homeStore&&<span style={{fontSize:9,fontWeight:700,color:homeStore.color,background:`${homeStore.color}1A`,border:`1px solid ${homeStore.color}55`,borderRadius:5,padding:'1px 5px'}}>✈ {homeStore.name}</span>}
                </div>
                <div style={{fontSize:12,color:'var(--muted)',textTransform:'capitalize'}}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:800,fontSize:16,color:'var(--teal-dark)',fontVariantNumeric:'tabular-nums'}}>{fH(mt)}</div>
                <div style={{fontSize:11,color:'var(--dim)'}}>ce mois</div>
              </div>
              <button onClick={()=>onOvertimeClick(emp.id)} title="Heures supp" style={{background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'4px 8px',cursor:'pointer',fontSize:12,color:'var(--muted)'}}>⚡</button>
            </div>
            {/* Weeks */}
            {weeks.map(({wk,wd})=>(
              <div key={wk} style={{display:'grid',gridTemplateColumns:'52px repeat(7,1fr) 60px',borderBottom:'1px solid #F0F5F7'}}>
                <div style={{padding:'6px 8px',background:'#F8FAFB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRight:'1px solid #F0F5F7'}}>
                  <div style={{fontWeight:700,fontSize:12,color:'var(--muted)'}}>S{wk}</div>
                </div>
                {wd.map((day,di)=>{
                  const sh=getShift(emp.id,di,wk);
                  const st=sh?getMeta(sh.type):{};
                  const isSun=day.date.getDay()===0;
                  return(
                    <div key={di} onClick={()=>sh?.startTime&&onCell(emp.id,di)} style={{padding:'3px 2px',background:isSun?'#FFF8F8':'',cursor:sh?.startTime?'pointer':'default'}}>
                      <div style={{fontSize:9,fontWeight:600,color:isSun?'#C8002B':'var(--dim)',textAlign:'center',marginBottom:1}}>{DAY_S[di]} {day.date.getDate()}</div>
                      <div style={{
                        borderRadius:6,padding:'4px 3px',minHeight:36,
                        background:sh?sh._away?`${sh._awayColor||st.color}12`:st.bgColor:'#F8FAFB',
                        border:`1px solid ${sh?sh._away?sh._awayColor||st.color:st.color+'35':'#E8EDF0'}`,
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:0,
                      }}>
                        {sh?(
                          <>
                            <span style={{fontSize:9,fontWeight:700,color:sh._away?sh._awayColor||st.color:st.color,textAlign:'center',lineHeight:1.2}}>{sh._away?'✈':st.label?.slice(0,4)}</span>
                            {sh.startTime&&<span style={{fontSize:8,color:sh._away?sh._awayColor||st.color:st.color,opacity:.85}}>{sh.startTime}</span>}
                          </>
                        ):<span style={{color:'#DDE3E8',fontSize:10}}>—</span>}
                      </div>
                    </div>
                  );
                })}
                <div style={{padding:'6px 4px',background:'#F8FAFB',borderLeft:'1px solid #F0F5F7',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {(()=>{
                    let wt=0;
                    wd.forEach((_,di)=>{const sh=getShift(emp.id,di,wk);if(sh&&WORK.includes(sh.type)){if(sh.startTime&&sh.endTime){try{const[sh2,sm]=sh.startTime.split(':').map(Number),[eh,em]=sh.endTime.split(':').map(Number);const d=(eh*60+em)-(sh2*60+sm);wt+=Math.max(0,(d-Math.round((sh.breakH||0)*60))/60);}catch{}}if(sh.split?.startTime&&sh.split?.endTime){try{const[sh2,sm]=sh.split.startTime.split(':').map(Number),[eh,em]=sh.split.endTime.split(':').map(Number);const d=(eh*60+em)-(sh2*60+sm);wt+=Math.max(0,(d-Math.round((sh.split.breakH||0)*60))/60);}catch{}}}});
                    return <span style={{fontSize:11,fontWeight:700,color:'var(--teal-dark)',fontVariantNumeric:'tabular-nums'}}>{fH(parseFloat(wt.toFixed(2)))}</span>;
                  })()}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ── WEEK VIEW ────────────────────────────────────────────── */
function WeekView({emps,days,allDays,sched,types,onCell,totalH,onDragStart,onDragOver,onDrop,onDragEnd,dragOver,extraEmpIds,overtimeRecords,onOvertimeClick,clipboard,onCopyShift,onPasteShift,allStores,activeStoreId}){
  return(
    <div className="card" style={{overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:800}}>
          <thead>
            <tr style={{background:'var(--card2)',borderBottom:'2px solid var(--border)'}}>
              <th style={{padding:'18px 24px',textAlign:'left',fontSize:14,color:'var(--muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',width:220}}>Employé</th>
              {days.map((wd,i)=>(
                <th key={i} style={{padding:'13px 8px',textAlign:'center',minWidth:100}}>
                  <div style={{fontWeight:800,fontSize:16,color:wd.date.getDay()===0?'#C8002B':'var(--text)'}}>{wd.day.slice(0,3)}</div>
                  <div style={{fontSize:13,color:'var(--dim)',marginTop:3}}>{wd.date.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                </th>
              ))}
              <th style={{padding:'13px 16px',textAlign:'center',fontSize:13,color:'var(--muted)',fontWeight:700,width:90}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {emps.map((emp,ei)=>{
              const t=totalH(emp.id),c=emp.contractHours||35,diff=t-c;
              const isBorrowed=extraEmpIds.includes(emp.id);
              return(
                <tr key={emp.id} style={{borderBottom:'1px solid var(--border)',background:isBorrowed?'#FFFDE7':ei%2===0?'#fff':'var(--card2)'}}>
                  <td style={{padding:'10px 20px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:42,height:42,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:800,color:'#fff',flexShrink:0}}>
                        {emp.name[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          {emp.name}
                          {isBorrowed&&(()=>{
                            const homeStore=allStores?.find(s=>s.id===emp.storeId);
                            return <span style={{fontSize:10,background:`${homeStore?.color||'#B07D00'}1A`,color:homeStore?.color||'#B07D00',border:`1px solid ${homeStore?.color||'#B07D00'}55`,borderRadius:6,padding:'2px 7px',fontWeight:700,whiteSpace:'nowrap'}}>
                              ✈ vient de {homeStore?.name||'autre magasin'}
                            </span>;
                          })()}
                        </div>
                        <div style={{fontSize:13,color:'var(--muted)',marginTop:2,textTransform:'capitalize'}}>{emp.role} · {c}h</div>
                      </div>
                    </div>
                  </td>
                  {days.map((wd,di)=>{
                    const ri=allDays.indexOf(wd);
                    const sh=sched[`${emp.id}_${ri}`];
                    const st=sh?getMeta(types,sh.type):null;
                    const isDragOver=dragOver?.empId===emp.id&&dragOver?.dayIdx===ri;
                    return(
                      <td key={di} style={{padding:'5px 5px'}}
                        onDragOver={e=>onDragOver(emp.id,ri,e)}
                        onDrop={e=>onDrop(emp.id,ri,e)}
                      >
                        {sh?(
                          <div
                            draggable={!sh._away}
                            onDragStart={e=>!sh._away&&onDragStart(emp.id,ri,e)}
                            onDragEnd={onDragEnd}
                            onClick={()=>onCell(emp.id,ri)}
                            style={{
                              background:isDragOver?'var(--teal-light)':(sh._away?`${sh._awayColor||st.color}14`:st.bgColor),
                              border:sh._away?`2px dashed ${sh._awayColor||st.color}`:`1.5px solid ${isDragOver?'var(--teal)':st.color+'50'}`,
                              borderRadius:12,padding:'10px 7px',minHeight:72,
                              cursor:'pointer',transition:'all .12s',
                              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,
                              userSelect:'none',position:'relative',
                            }}
                            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)';e.currentTarget.style.boxShadow=`0 4px 16px ${st.color}40`;e.currentTarget.style.zIndex='2';}}
                            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.zIndex='1';}}
                          >
                            {/* Copy button (top-right) */}
                            {!sh._away&&onCopyShift&&(
                              <button onClick={e=>{e.stopPropagation();onCopyShift(sh);}}
                                title="Copier cet horaire"
                                style={{position:'absolute',top:3,right:3,width:20,height:20,borderRadius:5,border:'none',background:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:10,lineHeight:1,padding:0,opacity:.6,transition:'opacity .15s'}}
                                onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                                onMouseLeave={e=>e.currentTarget.style.opacity='.6'}
                              >📋</button>
                            )}
                            {sh._away&&(
                              <span style={{position:'absolute',top:2,left:4,fontSize:8,fontWeight:800,color:sh._awayColor||st.color,background:'rgba(255,255,255,.85)',borderRadius:4,padding:'1px 4px'}}>
                                ✈ {sh._awayStoreName?.slice(0,10)}
                              </span>
                            )}
                            <span style={{fontSize:13,fontWeight:700,color:isDragOver?'var(--teal-dark)':st.color,marginTop:sh._away?8:0}}>{sh._away?'Déplacement':st.label}</span>
                            {sh.startTime&&<span style={{fontSize:12,color:st.color,opacity:.9,fontWeight:600}}>{sh.startTime}–{sh.endTime}</span>}
                            {mainHours(sh)>0&&<span style={{fontSize:12,color:st.color,opacity:.75,fontWeight:600}}>{fmtH(mainHours(sh))}</span>}
                            {sh.split&&(()=>{const st2=getMeta(types,sh.split.type);return(<>
                              <div style={{width:'80%',height:1,background:st.color,opacity:.3,margin:'2px 0'}}/>
                              <span style={{fontSize:10,fontWeight:700,color:st2.color}}>{st2.label}</span>
                              {sh.split.startTime&&<span style={{fontSize:9,color:st2.color,opacity:.8}}>{sh.split.startTime}–{sh.split.endTime}</span>}
                              {splitHours(sh)>0&&<span style={{fontSize:9,color:st2.color,opacity:.7}}>{fmtH(splitHours(sh))}</span>}
                            </>);})()}
                          </div>
                        ):(
                          <div
                            onDragOver={e=>onDragOver(emp.id,ri,e)}
                            onDrop={e=>onDrop(emp.id,ri,e)}
                            onClick={()=>onCell(emp.id,ri)}
                            style={{
                              minHeight:68,borderRadius:12,position:'relative',
                              border:`2px dashed ${isDragOver?'var(--teal)':'var(--border)'}`,
                              background:isDragOver?'var(--teal-light)':'transparent',
                              display:'flex',alignItems:'center',justifyContent:'center',
                              cursor:'pointer',transition:'all .12s',
                              color:isDragOver?'var(--teal-dark)':'var(--dim)',fontSize:22,
                            }}
                            onMouseEnter={e=>{if(!isDragOver){e.currentTarget.style.background='var(--teal-light)';e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal-dark)';}}}
                            onMouseLeave={e=>{if(!isDragOver){e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--dim)';}}}
                          >
                            +
                            {clipboard&&onPasteShift&&(
                              <button onClick={e=>{e.stopPropagation();onPasteShift(emp.id,ri);}}
                                title="Coller l'horaire copié"
                                style={{position:'absolute',bottom:3,right:3,width:22,height:22,borderRadius:6,border:'none',background:'var(--teal)',color:'#fff',cursor:'pointer',fontSize:11,lineHeight:1,padding:0,boxShadow:'0 2px 6px rgba(0,201,177,.4)'}}
                              >📌</button>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <OvertimeTotalCell t={t} diff={diff} emp={emp} overtimeRecords={overtimeRecords} onOvertimeClick={onOvertimeClick}/>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── DAY VIEW ─────────────────────────────────────────────── */
function DayView({emps,day,dayIdx,sched,types,onCell,onDragStart,onDragOver,onDrop,onDragEnd,dragOver}){
  return(
    <div>
      <div style={{background:'var(--teal-light)',border:'2px solid var(--teal-mid)',borderRadius:13,padding:'14px 20px',marginBottom:14}}>
        <h3 style={{fontFamily:'var(--font-h)',fontWeight:700,fontSize:19,color:'var(--teal-dark)',textTransform:'capitalize'}}>
          {day.day} — {day.date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </h3>
      </div>
      <div style={{display:'grid',gap:9}}>
        {emps.map(emp=>{
          const sh=sched[`${emp.id}_${dayIdx}`];
          const st=sh?getMeta(types,sh.type):null;
          const isDragOver=dragOver?.empId===emp.id&&dragOver?.dayIdx===dayIdx;
          return(
            <div key={emp.id}
              draggable={!!sh}
              onDragStart={e=>sh&&onDragStart(emp.id,dayIdx,e)}
              onDragEnd={onDragEnd}
              onDragOver={e=>onDragOver(emp.id,dayIdx,e)}
              onDrop={e=>onDrop(emp.id,dayIdx,e)}
              onClick={()=>onCell(emp.id,dayIdx)}
              className="card"
              style={{
                display:'flex',alignItems:'center',gap:16,padding:'15px 22px',
                cursor:'pointer',transition:'all .15s',
                background:isDragOver?'var(--teal-light)':sh?st.bgColor:'#fff',
                borderLeft:isDragOver?'5px solid var(--teal)':sh?`5px solid ${st.color}`:'5px solid var(--border)',
              }}
              onMouseEnter={e=>{if(sh){e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.boxShadow=`0 4px 20px ${st.color}35`;}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.boxShadow='none';}}
            >
              <div style={{width:42,height:42,borderRadius:'50%',background:emp.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17,flexShrink:0}}>{emp.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{emp.name}</div>
                <div style={{color:'var(--dim)',fontSize:13}}>{emp.role} · {emp.contractHours}h/sem</div>
              </div>
              {sh?(
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700,color:st.color,fontSize:15}}>{st.label}</div>
                  {sh.startTime&&<div style={{color:'var(--muted)',fontSize:13}}>{sh.startTime}–{sh.endTime} · {sh.hours}h</div>}
                  {sh.note&&<div style={{fontSize:11,color:'var(--dim)',fontStyle:'italic'}}>{sh.note}</div>}
                </div>
              ):<span style={{color:'var(--dim)',fontSize:24}}>+</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
