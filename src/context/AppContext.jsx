import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  listenStores, listenEmployees, listenShiftTypes, listenSchedule,
  listenLeaveRequests, listenSettings,
  saveStore, removeStore,
  saveEmployee, removeEmployee,
  saveShiftType, saveSchedule, saveSettings,
  saveLeaveRequest, removeLeaveRequest,
  fetchSchedule,
  seedIfEmpty, forceResetAll, ALL_EMPLOYEES,
} from '../firebaseService';

const AppContext = createContext(null);
const CURRENT_WEEK = 23;
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

// Roles that require password
export const MANAGER_ROLES = ['manager','dirigeant','admin'];

function getWeekDates(wn, year=2026) {
  const jan4=new Date(year,0,4); const s=new Date(jan4);
  s.setDate(jan4.getDate()-jan4.getDay()+1);
  const ws=new Date(s); ws.setDate(s.getDate()+(wn-1)*7);
  return DAYS.map((day,i)=>{ const d=new Date(ws); d.setDate(ws.getDate()+i); return {day,date:d}; });
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(()=>localStorage.getItem('care_auth')==='true');
  const [authRole, setAuthRole] = useState(()=>localStorage.getItem('care_role')||null);
  const [currentUser, setCurrentUser] = useState(()=>localStorage.getItem('care_user')||null);
  const [currentEmpId, setCurrentEmpId] = useState(()=>localStorage.getItem('care_empid')||null);

  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState(CURRENT_WEEK);
  const [currentYear] = useState(2026);
  const [selectedStore, setSelectedStore] = useState(null);
  const listeners = useRef({});

  useEffect(()=>{
    seedIfEmpty().then(()=>setLoading(false));
    const u1=listenStores(setStores);
    const u2=listenEmployees(setEmployees);
    const u3=listenShiftTypes(setShiftTypes);
    const u4=listenLeaveRequests(setLeaveRequests);
    const u5=listenSettings(setAppSettings);
    return()=>{ u1();u2();u3();u4();u5(); };
  },[]);

  useEffect(()=>{
    if(!selectedStore) return;
    const key=`${selectedStore}_${currentYear}_W${currentWeek}`;
    if(listeners.current[key]) return;
    const unsub=listenSchedule(selectedStore,currentWeek,currentYear,data=>{
      setSchedules(prev=>({...prev,[key]:data}));
    });
    listeners.current[key]=unsub;
    return()=>{ unsub(); delete listeners.current[key]; };
  },[selectedStore,currentWeek,currentYear]);

  // ── AUTH ─────────────────────────────────────────────
  const login=(selectedName, password, isManager)=>{
    if(isManager){
      // Manager/Dirigeant: need password
      if(password!=='Raphael2232') return {success:false,error:'Mot de passe incorrect'};
      const emp=employees.find(e=>e.name===selectedName&&MANAGER_ROLES.includes(e.role));
      if(!emp) return {success:false,error:'Utilisateur introuvable'};
      _doLogin(emp);
      return {success:true,role:emp.role};
    } else {
      // Vendeur: no password
      const emp=employees.find(e=>e.name===selectedName&&e.role==='vendeur');
      if(!emp) return {success:false,error:'Utilisateur introuvable'};
      _doLogin(emp);
      return {success:true,role:'vendeur'};
    }
  };

  const _doLogin=(emp)=>{
    setIsAuthenticated(true);
    setAuthRole(emp.role);
    setCurrentUser(emp.name);
    setCurrentEmpId(emp.id);
    localStorage.setItem('care_auth','true');
    localStorage.setItem('care_role',emp.role);
    localStorage.setItem('care_user',emp.name);
    localStorage.setItem('care_empid',emp.id);
  };

  const logout=()=>{
    setIsAuthenticated(false); setAuthRole(null); setCurrentUser(null); setCurrentEmpId(null);
    localStorage.removeItem('care_auth'); localStorage.removeItem('care_role');
    localStorage.removeItem('care_user'); localStorage.removeItem('care_empid');
  };

  // ── SCHEDULES ─────────────────────────────────────────
  const schedKey=(storeId,week,year)=>`${storeId}_${year}_W${week}`;
  const getSchedule=(storeId,week,year)=>schedules[schedKey(storeId,week,year)]||{};

  const setShift=async(storeId,week,year,empId,dayIdx,shift)=>{
    const key=schedKey(storeId,week,year);
    const cur=schedules[key]||{};
    const upd={...cur};
    if(shift===null) delete upd[`${empId}_${dayIdx}`];
    else upd[`${empId}_${dayIdx}`]=shift;
    setSchedules(prev=>({...prev,[key]:upd}));
    await saveSchedule(storeId,week,year,upd);
  };

  const setBulkSchedule=async(storeId,week,year,bulk)=>{
    const key=schedKey(storeId,week,year);
    setSchedules(prev=>({...prev,[key]:bulk}));
    await saveSchedule(storeId,week,year,bulk);
  };

  // ── LEAVE ─────────────────────────────────────────────
  const submitLeaveRequest=async(req)=>{
    const n={...req,id:`leave_${Date.now()}`,status:'pending',createdAt:new Date().toISOString()};
    await saveLeaveRequest(n); return n;
  };

  const approveLeaveRequest=async(reqId)=>{
    const req=leaveRequests.find(r=>r.id===reqId); if(!req) return;
    // Mark approved
    await saveLeaveRequest({...req,status:'approved',reviewedAt:new Date().toISOString()});
    const emp=employees.find(e=>e.id===req.employeeId); if(!emp) return;
    const storeId = req.storeId || emp.originalStoreId || emp.storeId;
    
    if(!req.weeks || req.weeks.length===0){
      console.error('No weeks in leave request', req);
      return;
    }
    
    for(const we of req.weeks){
      if(!we.week || !we.year || !we.days || we.days.length===0) continue;
      // Always fetch fresh from Firebase — never rely on cached state
      const fresh = await fetchSchedule(storeId, we.week, we.year);
      const upd = { ...fresh };
      we.days.forEach(di => {
        upd[`${emp.id}_${di}`] = {
          type:'vacation', startTime:null, endTime:null,
          breakH:0, hours:null, note:'Congé approuvé', depannage:false
        };
      });
      const key = schedKey(storeId, we.week, we.year);
      // Update local state immediately
      setSchedules(prev => ({ ...prev, [key]: upd }));
      // Write to Firebase
      await saveSchedule(storeId, we.week, we.year, upd);
      // Force listener for this store+week if not already listening
      if(!listeners.current[key]){
        const unsub = listenSchedule(storeId, we.week, we.year, data => {
          setSchedules(prev => ({ ...prev, [key]: data }));
        });
        listeners.current[key] = unsub;
      }
    }
    console.log('✅ Congé approuvé et planning mis à jour pour', emp.name);
  };

  const cancelApprovedLeave=async(reqId)=>{
    const req=leaveRequests.find(r=>r.id===reqId); if(!req) return;
    const emp=employees.find(e=>e.id===req.employeeId); if(!emp) return;
    for(const we of req.weeks){
      const fresh=await fetchSchedule(emp.storeId,we.week,we.year);
      const upd={...fresh};
      we.days.forEach(di=>{ delete upd[`${emp.id}_${di}`]; });
      const key=schedKey(emp.storeId,we.week,we.year);
      setSchedules(prev=>({...prev,[key]:upd}));
      await saveSchedule(emp.storeId,we.week,we.year,upd);
    }
    await removeLeaveRequest(reqId);
  };

  const rejectLeaveRequest=async(reqId)=>{
    const req=leaveRequests.find(r=>r.id===reqId); if(!req) return;
    await saveLeaveRequest({...req,status:'rejected',reviewedAt:new Date().toISOString()});
  };

  const deleteLeaveRequest=async(id)=>{ await removeLeaveRequest(id); };

  // ── STORES ────────────────────────────────────────────
  const addStore=async s=>{ const n={...s,id:`store_${Date.now()}`}; await saveStore(n); return n; };
  const updateStore=async(id,u)=>{ const s=stores.find(x=>x.id===id); if(s) await saveStore({...s,...u}); };
  const deleteStore=async id=>{ await removeStore(id); };

  // ── EMPLOYEES ─────────────────────────────────────────
  const addEmployee=async e=>{ const n={...e,id:`emp_${Date.now()}`}; await saveEmployee(n); return n; };
  const updateEmployee=async(id,u)=>{ const e=employees.find(x=>x.id===id); if(e) await saveEmployee({...e,...u}); };
  const deleteEmployee=async id=>{ await removeEmployee(id); };

  // ── SHIFT TYPES ───────────────────────────────────────
  const updateShiftType=async(id,u)=>{ const s=shiftTypes.find(x=>x.id===id); if(s) await saveShiftType({...s,...u}); };

  // ── SETTINGS ──────────────────────────────────────────
  const updateSettings=async(u)=>{ await saveSettings({...appSettings,...u}); };

  // ── RESET EMPLOYEES ───────────────────────────────────
  const doResetEmployees=async()=>{ await forceResetAll(); };

  return (
    <AppContext.Provider value={{
      isAuthenticated,authRole,currentUser,currentEmpId,login,logout,loading,
      stores,addStore,updateStore,deleteStore,
      employees,addEmployee,updateEmployee,deleteEmployee,
      getStoreEmployees:sid=>employees.filter(e=>e.storeId===sid),
      shiftTypes,updateShiftType,
      schedules,getSchedule,setShift,setBulkSchedule,
      leaveRequests,submitLeaveRequest,approveLeaveRequest,rejectLeaveRequest,cancelApprovedLeave,deleteLeaveRequest,
      appSettings,updateSettings,
      doResetEmployees,
      currentWeek,setCurrentWeek,currentYear,
      selectedStore,setSelectedStore,
      getWeekDatesForCurrentWeek:w=>getWeekDates(w,currentYear),
      DAYS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp=()=>{ const c=useContext(AppContext); if(!c) throw new Error('outside provider'); return c; };
export { DAYS, getWeekDates };
