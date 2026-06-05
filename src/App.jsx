import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlanningEditor from './pages/PlanningEditor';
import Employees from './pages/Employees';
import Stores from './pages/Stores';
import Settings from './pages/Settings';
import ViewPlanning from './pages/ViewPlanning';
import LeaveRequestPage from './pages/LeaveRequest';
import LeaveAdmin from './pages/LeaveAdmin';
import Nav from './components/Nav';
import { exportToPDF, exportToNotion } from './utils/pdfExport';

function AppContent(){
  const{isAuthenticated,authRole,stores,employees,schedules,shiftTypes,currentWeek,currentYear,getWeekDatesForCurrentWeek,selectedStore,loading,appSettings}=useApp();
  const[page,setPage]=useState('dashboard');

  useEffect(()=>{ if(authRole==='vendeur') setPage('view'); },[authRole]);

  // Logo from Firebase settings
  const logoUrl = appSettings.logoDataUrl || appSettings.logoUrl || 'care-logo.png';

  useEffect(()=>{
    const pdf=async e=>{
      const{storeId,week}=e.detail;
      const store=stores.find(s=>s.id===storeId); if(!store) return;
      let logoDataUrl=null;
      if(appSettings.logoDataUrl) logoDataUrl=appSettings.logoDataUrl;
      else if(appSettings.logoUrl){
        try{ const r=await fetch(appSettings.logoUrl); const b=await r.blob(); logoDataUrl=await new Promise(res=>{const rd=new FileReader();rd.onload=ev=>res(ev.target.result);rd.readAsDataURL(b);}); }catch{}
      } else {
        try{ const r=await fetch('care-logo.png'); const b=await r.blob(); logoDataUrl=await new Promise(res=>{const rd=new FileReader();rd.onload=ev=>res(ev.target.result);rd.readAsDataURL(b);}); }catch{}
      }
      try{ await exportToPDF({store,employees:employees.filter(e=>e.storeId===storeId),schedules,weekDates:getWeekDatesForCurrentWeek(week),shiftTypes,currentWeek:week,currentYear,logoDataUrl}); }
      catch(err){ alert('Erreur PDF : '+err.message); }
    };
    const notion=e=>{
      const{storeId,week}=e.detail;
      const store=stores.find(s=>s.id===storeId); if(!store) return;
      exportToNotion({store,employees:employees.filter(e=>e.storeId===storeId),schedules,weekDates:getWeekDatesForCurrentWeek(week),shiftTypes,currentWeek:week,currentYear});
    };
    window.addEventListener('exportPDF',pdf); window.addEventListener('exportNotion',notion);
    return()=>{ window.removeEventListener('exportPDF',pdf); window.removeEventListener('exportNotion',notion); };
  },[stores,employees,schedules,shiftTypes,currentWeek,currentYear,appSettings]);

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#F4F7F9,#E6FAF8)'}}>
      <img src={logoUrl} alt="" style={{height:64,objectFit:'contain',marginBottom:24}} onError={e=>e.target.style.display='none'}/>
      <div style={{fontFamily:'var(--font-h)',fontSize:26,fontWeight:800,color:'var(--text)',marginBottom:8}}>Care <span className="grad">Planning</span></div>
      <div style={{color:'var(--muted)',fontSize:15,marginBottom:24}}>Chargement...</div>
      <div style={{width:220,height:4,background:'var(--border)',borderRadius:4,overflow:'hidden',position:'relative'}}>
        <div style={{position:'absolute',height:'100%',width:'45%',background:'var(--teal)',borderRadius:4,animation:'sl 1.3s ease-in-out infinite'}}/>
      </div>
      <style>{`@keyframes sl{0%{left:-45%}100%{left:100%}}`}</style>
    </div>
  );

  if(!isAuthenticated) return <Login logoUrl={logoUrl}/>;

  const renderPage=()=>{
    if(authRole==='vendeur'){
      if(page==='myleaves') return <LeaveRequestPage/>;
      return <ViewPlanning/>;
    }
    switch(page){
      case 'dashboard':  return <Dashboard setPage={setPage}/>;
      case 'planning':   return <PlanningEditor/>;
      case 'leaves':     return <LeaveAdmin/>;
      case 'employees':  return <Employees/>;
      case 'stores':     return <Stores/>;
      case 'settings':   return <Settings/>;
      default:           return <Dashboard setPage={setPage}/>;
    }
  };

  return(
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)'}}>
      <Nav page={page} setPage={setPage} logoUrl={logoUrl}/>
      <div style={{marginLeft:'var(--sidebar)',flex:1,minHeight:'100vh',display:'flex',flexDirection:'column'}}>
        <main style={{flex:1,padding:'36px 40px',width:'100%',maxWidth:1600,margin:'0 auto',boxSizing:'border-box'}}>
          {renderPage()}
        </main>
      </div>
      <style>{`@media(max-width:860px){ div[style*="margin-left:var(--sidebar)"]{margin-left:0!important} main{padding:70px 16px 30px!important} }`}</style>
    </div>
  );
}

export default function App(){ return <AppProvider><AppContent/></AppProvider>; }
