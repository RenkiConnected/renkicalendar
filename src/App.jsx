import React, { useState, useEffect } from 'react';
import { AppProvider, useApp, MANAGER_ROLES } from './context/AppContext';
import Login from './pages/Login';
import PublicPlanning from './pages/PublicPlanning';
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

function AppContent() {
  const { isAuthenticated, authRole, stores, employees, schedules, shiftTypes,
    currentWeek, currentYear, getWeekDatesForCurrentWeek, loading, appSettings } = useApp();

  const [page, setPage] = useState('dashboard');
  // Show public planning by default, login on demand
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => { if (authRole === 'vendeur') setPage('view'); }, [authRole]);

  const logoUrl = appSettings?.logoDataUrl || appSettings?.logoUrl || 'care-logo.png';

  useEffect(() => {
    const pdf = async (e) => {
      const { storeId, week } = e.detail;
      const store = stores.find(s => s.id === storeId); if (!store) return;
      let logoDataUrl = null;
      if (appSettings?.logoDataUrl) logoDataUrl = appSettings.logoDataUrl;
      else {
        try { const r=await fetch(appSettings?.logoUrl||'care-logo.png'); const b=await r.blob(); logoDataUrl=await new Promise(res=>{const rd=new FileReader();rd.onload=ev=>res(ev.target.result);rd.readAsDataURL(b);}); } catch {}
      }
      try { await exportToPDF({ store, employees: employees.filter(e=>e.storeId===storeId), schedules, weekDates: getWeekDatesForCurrentWeek(week), shiftTypes, currentWeek: week, currentYear, logoDataUrl }); }
      catch (err) { alert('Erreur PDF : ' + err.message); }
    };
    const notion = async (e) => {
      const { storeId, week } = e.detail;
      const store = stores.find(s=>s.id===storeId); if (!store) return;
      let logoDataUrl = null;
      if (appSettings?.logoDataUrl) logoDataUrl = appSettings.logoDataUrl;
      else {
        try { const r=await fetch(appSettings?.logoUrl||'care-logo.png'); const b=await r.blob(); logoDataUrl=await new Promise(res=>{const rd=new FileReader();rd.onload=ev=>res(ev.target.result);rd.readAsDataURL(b);}); } catch {}
      }
      try { await exportToNotion({ store, employees: employees.filter(e=>e.storeId===storeId), schedules, weekDates: getWeekDatesForCurrentWeek(week), shiftTypes, currentWeek: week, currentYear, logoDataUrl }); }
      catch (err) { alert('Erreur Notion : ' + err.message); }
    };
    window.addEventListener('exportPDF', pdf);
    window.addEventListener('exportNotion', notion);
    return () => { window.removeEventListener('exportPDF', pdf); window.removeEventListener('exportNotion', notion); };
  }, [stores, employees, schedules, shiftTypes, currentWeek, currentYear, appSettings]);

  // Loading screen
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(145deg,#EAF7F5,#F4F7F9)' }}>
      <img src={logoUrl} alt="" style={{ height:64, objectFit:'contain', marginBottom:24 }} onError={e=>e.target.style.display='none'}/>
      <div style={{ fontFamily:'var(--font-h)', fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:8 }}>
        Care <span className="grad">Planning</span>
      </div>
      <div style={{ color:'var(--muted)', fontSize:15, marginBottom:24 }}>Chargement...</div>
      <div style={{ width:220, height:4, background:'var(--border)', borderRadius:4, overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', height:'100%', width:'45%', background:'var(--teal)', borderRadius:4, animation:'sl 1.3s ease-in-out infinite' }}/>
      </div>
      <style>{`@keyframes sl{0%{left:-45%}100%{left:100%}}`}</style>
    </div>
  );

  // NOT logged in: show public planning + login overlay
  if (!isAuthenticated) {
    if (showLogin) return <Login logoUrl={logoUrl} onBack={() => setShowLogin(false)} />;
    return <PublicPlanning onLogin={() => setShowLogin(true)} />;
  }

  // LOGGED IN
  const renderPage = () => {
    if (authRole === 'vendeur') {
      if (page === 'myleaves') return <LeaveRequestPage />;
      return <ViewPlanning />;
    }
    switch (page) {
      case 'dashboard':  return <Dashboard setPage={setPage} />;
      case 'planning':   return <PlanningEditor />;
      case 'leaves':     return <LeaveAdmin />;
      case 'myleaves':   return <LeaveRequestPage />;
      case 'employees':  return <Employees />;
      case 'stores':     return <Stores />;
      case 'settings':   return <Settings />;
      default:           return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="app-shell">
      <Nav page={page} setPage={setPage} logoUrl={logoUrl} />
      <div className="main-area">
        <div className="main-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default function App() { return <AppProvider><AppContent /></AppProvider>; }
