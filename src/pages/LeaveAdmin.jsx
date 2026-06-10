import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const STATUS_MAP={
  pending:  {label:'En attente',bg:'#FFF7E0',color:'#B07D00',icon:'⏳',ring:'#F5D06A'},
  approved: {label:'Approuvé',  bg:'#E8FAF0',color:'#1A8A42',icon:'✅',ring:'var(--teal)'},
  rejected: {label:'Refusé',    bg:'#FFF0F2',color:'#C8002B',icon:'❌',ring:'#FFAAB6'},
};
const LEAVE_TYPES=[
  {id:'vacation',label:'Congés payés',icon:'🌴'},
  {id:'sick',    label:'Maladie',     icon:'🤒'},
  {id:'personal',label:'Motif perso', icon:'👤'},
  {id:'training',label:'Formation',   icon:'📚'},
];

function StatusBadge({status}){
  const s=STATUS_MAP[status]||STATUS_MAP.pending;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,background:s.bg,color:s.color,fontSize:12,fontWeight:700}}>{s.icon} {s.label}</span>;
}

export default function LeaveAdmin(){
  const{leaveRequests,approveLeaveRequest,rejectLeaveRequest,cancelApprovedLeave,deleteLeaveRequest,employees,stores,constraintRequests,approveConstraintRequest,refuseConstraintRequest,removeConstraintRequest,getVisibleStoreIds,canValidateLeave,isDirigeant}=useApp();

  // Only stores this user is allowed to see
  const visibleStoreIds = getVisibleStoreIds();
  const visibleStores = stores.filter(s=>visibleStoreIds.includes(s.id));
  const scopedLeaves = leaveRequests.filter(r=>visibleStoreIds.includes(r.storeId));
  const scopedConstraints = (constraintRequests||[]).filter(r=>visibleStoreIds.includes(r.storeId));
  const[filter,setFilter]=useState('all'); // all|pending|approved|rejected
  const[storeFilter,setStoreFilter]=useState('all');
  const[approving,setApproving]=useState(null);
  const[cancelling,setCancelling]=useState(null);
  const[rejecting,setRejecting]=useState(null);
  const[adminTab,setAdminTab]=useState('leaves');
  const[refuseNote,setRefuseNote]=useState('');
  const[refusingId,setRefusingId]=useState(null);

  const filtered=scopedLeaves
    .filter(r=>filter==='all'||r.status===filter)
    .filter(r=>storeFilter==='all'||r.storeId===storeFilter)
    .sort((a,b)=>{
      // pending first
      const order={pending:0,approved:1,rejected:2};
      if(order[a.status]!==order[b.status]) return order[a.status]-order[b.status];
      return new Date(b.createdAt)-new Date(a.createdAt);
    });

  const pending=scopedLeaves.filter(r=>r.status==='pending');
  const approved=scopedLeaves.filter(r=>r.status==='approved');
  const rejected=scopedLeaves.filter(r=>r.status==='rejected');

  const handleApprove=async(id)=>{
    setApproving(id);
    await approveLeaveRequest(id);
    setApproving(null);
  };
  const handleCancel=async(id)=>{
    setCancelling(id);
    await cancelApprovedLeave(id);
    setCancelling(null);
  };
  const handleReject=async(id)=>{
    setRejecting(id);
    await rejectLeaveRequest(id);
    setRejecting(null);
  };

  const LEAVE_TYPES_MAP=Object.fromEntries(LEAVE_TYPES.map(l=>[l.id,l]));

  return(
    <div className="anim-up" style={{width:'100%'}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <h1 className="page-title">🗂️ Congés & Demandes</h1>
        <p className="page-sub">Validez les demandes · Mise à jour automatique du planning</p>
      </div>

      <div style={{display:'flex',gap:4,background:'var(--card2)',borderRadius:12,padding:4,marginBottom:24,border:'1.5px solid var(--border)',width:'fit-content'}}>
        {[['leaves',`🌴 Congés (${scopedLeaves.filter(r=>r.status==='pending').length})`],['constraints',`⚡ Demandes (${scopedConstraints.filter(r=>r.status==='pending').length})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setAdminTab(id)} style={{padding:'10px 22px',borderRadius:9,border:'none',cursor:'pointer',fontFamily:'var(--font-b)',fontSize:14,fontWeight:adminTab===id?700:500,background:adminTab===id?'#fff':'transparent',color:adminTab===id?'var(--text)':'var(--muted)',boxShadow:adminTab===id?'var(--shadow)':'none',transition:'all .15s'}}>{label}</button>
        ))}
      </div>

      {adminTab==='leaves'&&(<>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28}}>
        {[
          {label:'En attente',val:pending.length,bg:'#FFF7E0',color:'#B07D00',icon:'⏳',ring:'#F5D06A'},
          {label:'Approuvées',val:approved.length,bg:'#E8FAF0',color:'#1A8A42',icon:'✅',ring:'var(--teal)'},
          {label:'Refusées',  val:rejected.length,bg:'#FFF0F2',color:'#C8002B',icon:'❌',ring:'#FFAAB6'},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:'20px 24px',borderTop:`4px solid ${s.ring}`,cursor:'pointer'}} onClick={()=>setFilter(s.label==='En attente'?'pending':s.label==='Approuvées'?'approved':'rejected')}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:30}}>{s.icon}</span>
              <div>
                <div style={{fontFamily:'var(--font-h)',fontWeight:800,fontSize:30,color:s.color,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:15,color:'var(--muted)',fontWeight:600,marginTop:4}}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,marginBottom:22,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',gap:3,background:'var(--card2)',borderRadius:10,padding:3,border:'1px solid var(--border)'}}>
          {[['all','Toutes'],['pending','En attente'],['approved','Approuvées'],['rejected','Refusées']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              padding:'8px 14px',borderRadius:8,border:'none',cursor:'pointer',
              background:filter===v?'#fff':'transparent',
              color:filter===v?'var(--text)':'var(--muted)',
              fontFamily:'var(--font-b)',fontSize:13,fontWeight:filter===v?700:500,
              boxShadow:filter===v?'var(--shadow)':'none',transition:'all .15s',
            }}>{l}{v==='pending'&&pending.length>0&&<span style={{marginLeft:6,background:'#C8002B',color:'#fff',borderRadius:10,padding:'1px 7px',fontSize:13}}>{pending.length}</span>}</button>
          ))}
        </div>
        <select className="inp" value={storeFilter} onChange={e=>setStoreFilter(e.target.value)} style={{maxWidth:180,fontSize:13,padding:'9px 12px'}}>
          <option value="all">Tous les magasins</option>
          {visibleStores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length===0?(
        <div style={{textAlign:'center',padding:'70px 20px',background:'#fff',border:'2px dashed var(--border)',borderRadius:16}}>
          <div style={{fontSize:52,marginBottom:14}}>🎉</div>
          <p style={{color:'var(--muted)',fontWeight:600,fontSize:16}}>Aucune demande {filter!=='all'?STATUS_MAP[filter]?.label.toLowerCase():''}</p>
        </div>
      ):(
        <div style={{display:'grid',gap:14}}>
          {filtered.map(req=>{
            const lt=LEAVE_TYPES_MAP[req.type]||LEAVE_TYPES[0];
            const emp=employees.find(e=>e.id===req.employeeId);
            const store=stores.find(s=>s.id===req.storeId);
            const total=req.dates?.length||req.weeks?.reduce((a,w)=>a+w.days.length,0)||0;
            const st=STATUS_MAP[req.status];
            const isApp=approving===req.id,isRej=rejecting===req.id;

            return(
              <div key={req.id} className="card" style={{
                padding:'20px 24px',
                borderLeft:`5px solid ${req.status==='pending'?'#F5D06A':st.ring}`,
                transition:'all .15s',
                background:req.status==='pending'?'#FFFEF5':'#fff',
              }}>
                <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                  {/* Employee avatar */}
                  <div style={{
                    width:48,height:48,borderRadius:'50%',flexShrink:0,
                    background:emp?.color||'var(--teal)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:20,fontWeight:800,color:'#fff',
                    boxShadow:'0 2px 8px rgba(0,0,0,.12)',
                  }}>{emp?.name?.[0]||'?'}</div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:6}}>
                      <span style={{fontWeight:800,fontSize:16}}>{emp?.name||req.employeeName}</span>
                      <StatusBadge status={req.status}/>
                      {store&&<span style={{background:store.color+'18',color:store.color,borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:700}}>{store.name}</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:8}}>
                      <span style={{fontSize:20}}>{lt.icon}</span>
                      <span style={{fontWeight:600,fontSize:15,color:'var(--text)'}}>{lt.label}</span>
                      <span style={{color:'var(--muted)',fontSize:15}}>·</span>
                      <span style={{fontWeight:700,color:'var(--teal-dark)',fontSize:15}}>{total} jour(s)</span>
                      <span style={{color:'var(--dim)',fontSize:15}}>· {new Date(req.createdAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
                    </div>
                    {req.reason&&(
                      <div style={{background:'var(--card2)',borderRadius:8,padding:'8px 12px',fontSize:15,color:'var(--muted)',marginBottom:8,fontStyle:'italic'}}>
                        💬 "{req.reason}"
                      </div>
                    )}
                    {/* Week breakdown */}
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {req.weeks?.map((w,i)=>{
                        const wd=getWD(w.week,w.year);
                        const dayNames=w.days.map(d=>wd[d]?wd[d].toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}):d);
                        return(
                          <div key={i} style={{background:req.status==='approved'?'#E8FAF0':req.status==='rejected'?'#FFF0F2':'#F8F9FA',border:`1px solid ${req.status==='approved'?'var(--teal-mid)':req.status==='rejected'?'#FFCCD4':'var(--border)'}`,borderRadius:8,padding:'6px 10px',fontSize:15}}>
                            <span style={{fontWeight:700,color:req.status==='approved'?'var(--teal-dark)':req.status==='rejected'?'#C8002B':'var(--text)'}}>S{w.week}</span>
                            <span style={{color:'var(--dim)',marginLeft:4}}>{dayNames.join(', ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {req.status==='pending'&&(
                    <div style={{display:'flex',gap:8,flexShrink:0,alignItems:'center'}}>
                      {canValidateLeave?(
                        <>
                        <button className="btn" onClick={()=>handleApprove(req.id)} disabled={isApp||isRej} style={{
                          background:isApp?'#C8E6C9':'#E8FAF0',color:'#1A8A42',
                          border:'2px solid #A5D6A7',
                          fontSize:14,fontWeight:700,padding:'10px 20px',borderRadius:10,
                          cursor:isApp?'wait':'pointer',transition:'all .15s',
                        }}>
                          {isApp?'⏳ ...':'✅ Approuver'}
                        </button>
                        <button className="btn" onClick={()=>handleReject(req.id)} disabled={isApp||isRej} style={{
                          background:isRej?'#FFCDD2':'#FFF0F2',color:'#C8002B',
                          border:'2px solid #FFAAB6',
                          fontSize:14,fontWeight:700,padding:'10px 20px',borderRadius:10,
                          cursor:isRej?'wait':'pointer',transition:'all .15s',
                        }}>
                          {isRej?'⏳ ...':'❌ Refuser'}
                        </button>
                        </>
                      ):(
                        <div style={{background:'#FFF7E0',border:'1.5px solid #F5D06A',borderRadius:10,padding:'10px 16px',fontSize:13,color:'#B07D00',fontWeight:600,maxWidth:220,textAlign:'center'}}>
                          🔒 Seuls les dirigeants (David, Yannis) peuvent valider les congés
                        </div>
                      )}
                    </div>
                  )}

                  {req.status==='approved'&&(
                    <div style={{display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
                      <div style={{background:'#E8FAF0',borderRadius:12,padding:'8px 14px',textAlign:'center',border:'1.5px solid var(--teal-mid)',display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:18}}>✅</span>
                        <span style={{fontSize:14,color:'#1A8A42',fontWeight:700}}>Planning<br/>mis à jour</span>
                      </div>
                      <button className="btn btn-danger btn-xs" onClick={()=>handleCancel(req.id)} disabled={cancelling===req.id}
                        style={{justifyContent:'center',fontSize:15}}>
                        {cancelling===req.id?'⏳':'🗑 Annuler'}
                      </button>
                    </div>
                  )}

                  {req.status==='rejected'&&(
                    <div style={{display:'flex',gap:8,flexShrink:0}}>
                      <button className="btn btn-ghost btn-xs" onClick={()=>handleApprove(req.id)} title="Approuver quand même" disabled={isApp}>
                        {isApp?'⏳':'↩️ Approuver'}
                      </button>
                      <button className="btn btn-ghost btn-xs" onClick={()=>deleteLeaveRequest(req.id)} style={{color:'var(--dim)'}}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>
      )}

      {adminTab==='constraints'&&(
        <div>
          {!(constraintRequests&&constraintRequests.length>0)?(
            <div style={{textAlign:'center',padding:60,color:'var(--muted)',fontSize:15,background:'var(--card2)',borderRadius:14,border:'1.5px dashed var(--border)'}}>
              Aucune demande en cours
            </div>
          ):(
            <div style={{display:'grid',gap:14}}>
              {[...scopedConstraints].sort((a,b)=>{const o={pending:0,approved:1,refused:2};return (o[a.status]||0)-(o[b.status]||0)||new Date(b.createdAt||0)-new Date(a.createdAt||0);}).map(r=>{
                const emp=employees.find(e=>e.id===r.employeeId);
                const store=emp?stores.find(s=>s.id===emp.storeId):null;
                const dateStr=r.date?new Date(r.date+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'—';
                return(
                  <div key={r.id} style={{background:r.status==='approved'?'#E8FAF0':r.status==='refused'?'#FFF0F2':'#fff',border:`1.5px solid ${r.status==='approved'?'var(--teal-mid)':r.status==='refused'?'#FFCCD4':'var(--border)'}`,borderRadius:14,padding:'18px 22px',boxShadow:'var(--shadow)'}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:42,height:42,borderRadius:'50%',background:emp?.color||'var(--teal)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:17,flexShrink:0}}>{(emp?.name||r.employeeName||'?')[0]}</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:16}}>{emp?.name||r.employeeName}</div>
                          <div style={{fontSize:13,color:'var(--muted)',marginTop:2}}>{store?.name||'—'} · {r.type==='constraint'?'⏰ Contrainte horaire':'🌟 Demande exceptionnelle'}</div>
                        </div>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20,background:r.status==='approved'?'var(--teal)':r.status==='refused'?'#C8002B':'#F59E0B',color:'#fff'}}>
                        {r.status==='approved'?'✅ Approuvé':r.status==='refused'?'❌ Refusé':'⏳ En attente'}
                      </span>
                    </div>
                    <div style={{padding:'12px 16px',background:'rgba(0,0,0,.03)',borderRadius:10,marginBottom:12}}>
                      <div style={{fontWeight:600,fontSize:15,marginBottom:8}}>📅 {dateStr}</div>
                      {(r.requestedStart||r.requestedEnd)&&(
                        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:6}}>
                          {r.requestedStart&&<div><div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',fontWeight:700}}>{r.type==='constraint'?'Arrivée souhaitée':'Début proposé'}</div><div style={{fontSize:26,fontWeight:800,fontVariantNumeric:'tabular-nums',color:'var(--text)'}}>{r.requestedStart}</div></div>}
                          {r.requestedStart&&r.requestedEnd&&<div style={{fontSize:22,color:'var(--muted)'}}>→</div>}
                          {r.requestedEnd&&<div><div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',fontWeight:700}}>{r.type==='constraint'?'Départ souhaité':'Fin proposée'}</div><div style={{fontSize:26,fontWeight:800,fontVariantNumeric:'tabular-nums',color:'var(--text)'}}>{r.requestedEnd}</div></div>}
                        </div>
                      )}
                      {r.note&&<div style={{fontSize:13,color:'var(--muted)',fontStyle:'italic'}}>💬 {r.note}</div>}
                      {r.managerNote&&<div style={{fontSize:13,color:'#C8002B',marginTop:4}}>Note : {r.managerNote}</div>}
                    </div>
                    {r.status==='pending'&&(
                      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                        <button className="btn btn-sm" style={{background:'#1A8A42',color:'#fff',border:'none'}} onClick={async()=>await approveConstraintRequest(r)}>✅ Approuver</button>
                        {refusingId===r.id?(
                          <div style={{display:'flex',gap:8,alignItems:'center',flex:1}}>
                            <input className="inp" style={{flex:1,fontSize:13,padding:'8px 12px'}} placeholder="Raison (optionnel)" value={refuseNote} onChange={e=>setRefuseNote(e.target.value)}/>
                            <button className="btn btn-danger btn-sm" onClick={async()=>{await refuseConstraintRequest(r,refuseNote);setRefusingId(null);setRefuseNote('');}}>Confirmer</button>
                            <button className="btn btn-ghost btn-sm" onClick={()=>{setRefusingId(null);setRefuseNote('');}}>Annuler</button>
                          </div>
                        ):(
                          <button className="btn btn-danger btn-sm" onClick={()=>setRefusingId(r.id)}>❌ Refuser</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={()=>removeConstraintRequest(r.id)}>🗑</button>
                      </div>
                    )}
                    {r.status!=='pending'&&<button className="btn btn-ghost btn-xs" style={{marginTop:8}} onClick={()=>removeConstraintRequest(r.id)}>🗑 Supprimer</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getWD(wn,year){
  // ISO week - matches AppContext.getWeekDates
  const jan4=new Date(year,0,4);
  const dow=jan4.getDay();
  const dtm=dow===0?-6:1-dow;
  const startW1=new Date(jan4);startW1.setDate(jan4.getDate()+dtm);
  const ws=new Date(startW1);ws.setDate(startW1.getDate()+(wn-1)*7);
  return Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d;});
}
