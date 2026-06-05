import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlanningEditor from './pages/PlanningEditor';
import Employees from './pages/Employees';
import Stores from './pages/Stores';
import Settings from './pages/Settings';
import ViewPlanning from './pages/ViewPlanning';
import Nav from './components/Nav';
import { exportToPDF, exportToNotion } from './utils/pdfExport';

function AppContent(){
  const { isAuthenticated, authRole, stores, employees, schedules, shiftTypes, currentWeek, currentYear, getWeekDatesForCurrentWeek, selectedStore, loading } = useApp();
  const [page,setPage]=useState(authRole==='vendeur'?'view':'dashboard');
  const [logoUrl,setLogoUrl]=useState(null);
  const logoRef=useRef();

  useEffect(()=>{
    fetch('care-logo.png').then(r=>r.blob()).then(b=>{
      const rd=new FileReader(); rd.onload=e=>setLogoUrl(e.target.result); rd.readAsDataURL(b);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    const pdf=e=>{
      const {storeId,week}=e.detail;
      const store=stores.find(s=>s.id===storeId); if(!store) return;
      exportToPDF({store,employees:employees.filter(e=>e.storeId===storeId),schedules,weekDates:getWeekDatesForCurrentWeek(week),shiftTypes,currentWeek:week,currentYear,logoDataUrl:logoUrl});
    };
    const notion=e=>{
      const {storeId,week}=e.detail;
      const store=stores.find(s=>s.id===storeId); if(!store) return;
      exportToNotion({store,employees:employees.filter(e=>e.storeId===storeId),schedules,weekDates:getWeekDatesForCurrentWeek(week),shiftTypes,currentWeek:week,currentYear});
    };
    window.addEventListener('exportPDF',pdf);
    window.addEventListener('exportNotion',notion);
    return()=>{window.removeEventListener('exportPDF',pdf);window.removeEventListener('exportNotion',notion);};
  },[stores,employees,schedules,shiftTypes,currentWeek,currentYear,logoUrl]);

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#F4F7F9,#E6FAF8)'}}>
      <img src="care-logo.png" alt="Care" style={{height:64,objectFit:'contain',marginBottom:24,animation:'float 2s ease-in-out infinite'}} onError={e=>e.target.style.display='none'}/>
      <div style={{fontFamily:'var(--font-h)',fontSize:24,fontWeight:800,color:'var(--text)',marginBottom:8}}>Care <span className="grad">Planning</span></div>
      <div style={{color:'var(--muted)',fontSize:15,marginBottom:22}}>Connexion à Firebase...</div>
      <div style={{width:220,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden',position:'relative'}}>
        <div style={{position:'absolute',height:'100%',background:'var(--teal)',borderRadius:2,animation:'barSlide 1.4s ease-in-out infinite',width:'40%'}}/>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes barSlide{0%{left:-40%;width:40%}100%{left:100%;width:40%}}`}</style>
    </div>
  );

  if(!isAuthenticated) return <Login/>;

  const renderPage=()=>{
    if(authRole==='vendeur') return <ViewPlanning/>;
    switch(page){
      case 'dashboard': return <Dashboard setPage={setPage}/>;
      case 'planning':  return <PlanningEditor/>;
      case 'employees': return <Employees/>;
      case 'stores':    return <Stores/>;
      case 'settings':  return <Settings/>;
      case 'view':      return <ViewPlanning/>;
      default:          return <Dashboard setPage={setPage}/>;
    }
  };

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)'}}>
      <Nav page={page} setPage={setPage}/>
      <main style={{
        flex:1, marginLeft:'var(--sidebar)',
        padding:'36px 40px',
        minHeight:'100vh',
        maxWidth:'calc(100vw - var(--sidebar))',
      }}>
        {renderPage()}
      </main>

      {/* Logo chooser */}
      {(authRole==='admin'||authRole==='manager')&&(
        <div className="no-print" style={{position:'fixed',bottom:24,right:24,zIndex:30,display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
          <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setLogoUrl(ev.target.result); r.readAsDataURL(f); }}/>
          <button className="btn btn-sec btn-sm" style={{boxShadow:'var(--shadow-md)'}} onClick={()=>logoRef.current.click()} title="Changer le logo PDF">
            🖼 Logo PDF
          </button>
        </div>
      )}

      <style>{`
        @media(max-width:860px){
          main { margin-left:0 !important; max-width:100vw !important; padding:72px 16px 24px !important; }
        }
      `}</style>
    </div>
  );
}

export default function App(){ return <AppProvider><AppContent/></AppProvider>; }
