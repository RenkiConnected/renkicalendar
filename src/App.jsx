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

function AppContent() {
  const { isAuthenticated, authRole, stores, employees, schedules, shiftTypes, currentWeek, currentYear, getWeekDatesForCurrentWeek, selectedStore, loading, setCurrentPage: ctxSetPage } = useApp();
  const [currentPage, setCurrentPage] = useState(authRole==='vendeur'?'view':'dashboard');
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const logoInputRef = useRef(null);

  // Expose setCurrentPage to children via context workaround
  useApp.__setPage = setCurrentPage;

  // Load logo
  useEffect(()=>{
    fetch('care-logo.png').then(r=>r.blob()).then(blob=>{
      const reader=new FileReader();
      reader.onload=e=>setLogoDataUrl(e.target.result);
      reader.readAsDataURL(blob);
    }).catch(()=>{});
  },[]);

  useEffect(()=>{
    const handleExportPDF = (e)=>{
      const {storeId,week}=e.detail;
      const store=stores.find(s=>s.id===storeId); if(!store) return;
      const emps=employees.filter(e=>e.storeId===storeId);
      const wd=getWeekDatesForCurrentWeek(week);
      exportToPDF({store,employees:emps,schedules,weekDates:wd,shiftTypes,currentWeek:week,currentYear,logoDataUrl});
    };
    const handleExportNotion = (e)=>{
      const {storeId,week}=e.detail;
      const store=stores.find(s=>s.id===storeId); if(!store) return;
      const emps=employees.filter(e=>e.storeId===storeId);
      const wd=getWeekDatesForCurrentWeek(week);
      exportToNotion({store,employees:emps,schedules,weekDates:wd,shiftTypes,currentWeek:week,currentYear});
    };
    window.addEventListener('exportPDF',handleExportPDF);
    window.addEventListener('exportNotion',handleExportNotion);
    return ()=>{window.removeEventListener('exportPDF',handleExportPDF);window.removeEventListener('exportNotion',handleExportNotion);};
  },[stores,employees,schedules,shiftTypes,currentWeek,currentYear,logoDataUrl]);

  const handleLogoChange=(e)=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>setLogoDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  if(loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#F7FAFA,#E0FAF7)' }}>
      <img src="care-logo.png" alt="Care" style={{ height:60, objectFit:'contain', marginBottom:24 }} onError={e=>e.target.style.display='none'} />
      <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color:'var(--text)', marginBottom:8 }}>
        Care <span className="gradient-text">Planning</span>
      </div>
      <div style={{ color:'var(--text-dim)', fontSize:14, marginBottom:20 }}>Connexion à Firebase...</div>
      <div style={{ width:200, height:3, background:'var(--border-dark)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'var(--care-teal)', borderRadius:2, animation:'barLoad 1.5s ease infinite' }} />
      </div>
      <style>{`@keyframes barLoad{0%{width:0;margin-left:0}50%{width:60%;margin-left:20%}100%{width:0;margin-left:100%}}`}</style>
    </div>
  );

  if(!isAuthenticated) return <Login />;

  const renderPage=()=>{
    if(authRole==='vendeur') return <ViewPlanning />;
    switch(currentPage){
      case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'planning': return <PlanningEditor />;
      case 'employees': return <Employees />;
      case 'stores': return <Stores />;
      case 'settings': return <Settings />;
      case 'view': return <ViewPlanning />;
      default: return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <Nav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main style={{ flex:1, marginLeft:230, padding:'32px 36px', minHeight:'100vh', transition:'margin-left 0.22s', maxWidth:'calc(100vw - 230px)' }} id="main-content">
        {renderPage()}
      </main>

      {/* Logo chooser floating btn (admin only) */}
      {(authRole==='admin'||authRole==='manager') && (
        <div className="no-print" style={{ position:'fixed', bottom:80, right:24, zIndex:30 }}>
          <input ref={logoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoChange} />
          <button className="btn btn-secondary btn-sm" style={{ boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }} onClick={()=>logoInputRef.current.click()} title="Changer le logo PDF">
            🖼 Logo
          </button>
        </div>
      )}

      <style>{`
        @media (max-width:768px){
          main { margin-left:0 !important; max-width:100vw !important; padding:16px 14px 80px !important; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}
