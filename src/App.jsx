import React, { useState, useEffect } from 'react';
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
  const { isAuthenticated, authRole, stores, employees, schedules, shiftTypes, currentWeek, currentYear, getWeekDatesForCurrentWeek, selectedStore, loading } = useApp();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontSize: 48, marginBottom: 20, animation: 'float 2s ease-in-out infinite' }}>📅</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        Care <span className="gradient-text">Planning</span>
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Connexion à Firebase...</div>
      <div style={{ marginTop: 20, width: 200, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 2, animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--primary) 25%, #00E5FF 50%, var(--primary) 75%)' }} />
      </div>
    </div>
  );
  const [currentPage, setCurrentPage] = useState(
    authRole === 'vendeur' ? 'view' : 'dashboard'
  );

  useEffect(() => {
    // PDF export event listener
    const handleExport = (e) => {
      const { storeId, week } = e.detail;
      const store = stores.find(s => s.id === storeId);
      if (!store) return;
      const storeEmployees = employees.filter(emp => emp.storeId === storeId);
      const weekDates = getWeekDatesForCurrentWeek(week);
      exportToPDF({ store, employees: storeEmployees, schedules, weekDates, shiftTypes, currentWeek: week, currentYear });
    };

    const handleNotion = (e) => {
      const { storeId, week } = e.detail;
      const store = stores.find(s => s.id === storeId);
      if (!store) return;
      const storeEmployees = employees.filter(emp => emp.storeId === storeId);
      const weekDates = getWeekDatesForCurrentWeek(week);
      exportToNotion({ store, employees: storeEmployees, schedules, weekDates, shiftTypes, currentWeek: week, currentYear });
    };

    window.addEventListener('exportPDF', handleExport);
    window.addEventListener('exportNotion', handleNotion);
    return () => {
      window.removeEventListener('exportPDF', handleExport);
      window.removeEventListener('exportNotion', handleNotion);
    };
  }, [stores, employees, schedules, shiftTypes, currentWeek, currentYear]);

  if (!isAuthenticated) return <Login />;

  const renderPage = () => {
    if (authRole === 'vendeur') return <ViewPlanning />;
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'planning': return <PlanningEditor />;
      case 'employees': return <Employees />;
      case 'stores': return <Stores />;
      case 'settings': return <Settings />;
      case 'view': return <ViewPlanning />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Nav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main style={{
        flex: 1,
        marginLeft: 240,
        padding: '32px',
        minHeight: '100vh',
        transition: 'margin-left 0.25s',
      }}>
        {/* Export actions bar */}
        {(authRole === 'admin' || authRole === 'manager') && currentPage === 'planning' && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 30,
            display: 'flex', gap: 10,
          }}>
            <button
              className="btn btn-secondary"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
              onClick={() => {
                const storeId = selectedStore || stores[0]?.id;
                window.dispatchEvent(new CustomEvent('exportNotion', { detail: { storeId, week: currentWeek } }));
              }}
            >
              📋 Notion
            </button>
            <button
              className="btn btn-primary"
              style={{ boxShadow: '0 4px 20px rgba(0,184,212,0.4)' }}
              onClick={() => {
                const storeId = selectedStore || stores[0]?.id;
                window.dispatchEvent(new CustomEvent('exportPDF', { detail: { storeId, week: currentWeek } }));
              }}
            >
              📄 Exporter PDF
            </button>
          </div>
        )}

        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
