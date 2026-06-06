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
    // 1. Mark approved in Firebase FIRST
    const approvedReq = {...req, status:'approved', reviewedAt:new Date().toISOString()};
    await saveLeaveRequest(approvedReq);

    const emp=employees.find(e=>e.id===req.employeeId); if(!emp) return;
    const storeId = req.storeId || emp.originalStoreId || emp.storeId;

    // 2. Build a map of week -> [dayIndexes] from ALL possible sources
    // Source A: req.weeks array (preferred)
    // Source B: req.dates ISO strings (fallback)
    const weekMap = {}; // key: "storeId_year_Wweek" -> dayIndexes[]

    const addToMap = (wn, yr, di) => {
      const k = schedKey(storeId, wn, yr);
      if(!weekMap[k]) weekMap[k] = {storeId, week:wn, year:yr, days:[]};
      const dayNum = typeof di === 'string' ? parseInt(di) : di;
      if(!isNaN(dayNum) && !weekMap[k].days.includes(dayNum)) weekMap[k].days.push(dayNum);
    };

    // Source A: weeks array
    if(req.weeks && Array.isArray(req.weeks) && req.weeks.length > 0){
      req.weeks.forEach(we => {
        if(!we || !we.week || !we.year) return;
        const days = Array.isArray(we.days) ? we.days : Object.values(we.days||{});
        days.forEach(di => addToMap(Number(we.week), Number(we.year), di));
      });
    }

    // Source B: dates ISO strings (always rebuild from dates as safety net)
    if(req.dates && Array.isArray(req.dates) && req.dates.length > 0){
      req.dates.forEach(isoStr => {
        try {
          const d = new Date(isoStr);
          if(isNaN(d.getTime())) return;
          const yr = d.getFullYear();
          // ISO week number
          const tmp = new Date(d); tmp.setHours(0,0,0,0);
          tmp.setDate(tmp.getDate() + 4 - (tmp.getDay()||7));
          const yearStart = new Date(tmp.getFullYear(),0,1);
          const wn = Math.ceil((((tmp-yearStart)/86400000)+1)/7);
          // Day index in week (Mon=0..Sun=6)
          const jan4 = new Date(yr,0,4);
          const ws = new Date(jan4);
          ws.setDate(jan4.getDate()-jan4.getDay()+1);
          const weekStart = new Date(ws);
          weekStart.setDate(ws.getDate()+(wn-1)*7);
          const di = Math.round((d-weekStart)/(86400000));
          if(di>=0 && di<=6) addToMap(wn, yr, di);
        } catch(err){ console.warn('Bad date:', isoStr, err); }
      });
    }

    // 3. Write vacation shifts for each week
    const entries = Object.entries(weekMap);
    if(entries.length === 0){
      console.error('NO DATES FOUND in leave request:', req.id, JSON.stringify(req));
      return;
    }

    for(const [key, {storeId: sid, week:wn, year:yr, days}] of entries){
      if(days.length === 0) continue;
      // Always read fresh from Firebase
      const fresh = await fetchSchedule(sid, wn, yr);
      const upd = {...fresh};
      days.forEach(di => {
        upd[`${emp.id}_${di}`] = {
          type:'vacation', startTime:null, endTime:null,
          breakH:0, hours:null, note:'Congé approuvé', depannage:false
        };
      });
      // Update local state
      setSchedules(prev => ({...prev, [key]: upd}));
      // Write to Firebase
      await saveSchedule(sid, wn, yr, upd);
      // Ensure listener is active for UI refresh
      if(!listeners.current[key]){
        const unsub = listenSchedule(sid, wn, yr, data => {
          setSchedules(prev => ({...prev, [key]: data}));
        });
        listeners.current[key] = unsub;
      }
      console.log(`✅ Vacances écrites: ${emp.name} S${wn}/${yr} jours:`, days);
    }
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
