import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  listenStores, listenEmployees, listenShiftTypes, listenSchedule,
  listenLeaveRequests, listenSettings,
  saveStore, removeStore,
  saveEmployee, removeEmployee,
  saveShiftType, saveSchedule, saveSettings,
  saveLeaveRequest, removeLeaveRequest,
  fetchSchedule,
  saveOvertimeRecord, listenOvertime,
  seedIfEmpty, forceResetAll, ALL_EMPLOYEES,
} from '../firebaseService';

const AppContext = createContext(null);
const CURRENT_WEEK = 23; // auto-computed ISO week
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

// Roles that require password
export const MANAGER_ROLES = ['manager','dirigeant','admin'];

function getWeekDates(wn, year=2026) {
  // Use ISO week: week 1 = week containing Jan 4, Monday = first day
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay(); // 0=Sun,1=Mon,...
  // Start of week 1 = Monday of the week containing Jan 4
  const daysToMonday = dow === 0 ? -6 : 1 - dow; // go back to Monday
  const startOfW1 = new Date(jan4);
  startOfW1.setDate(jan4.getDate() + daysToMonday);
  // Start of week wn
  const ws = new Date(startOfW1);
  ws.setDate(startOfW1.getDate() + (wn - 1) * 7);
  return DAYS.map((day, i) => {
    const d = new Date(ws);
    d.setDate(ws.getDate() + i);
    return { day, date: d };
  });
}

// Get ISO week number for a date (matches getWeekDates)
function getISOWeekNumber(d) {
  const date = new Date(d); date.setHours(0, 0, 0, 0);
  const dow = date.getDay();
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + daysToMonday);
  // Find start of week 1 for this year
  const year = monday.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const jan4dow = jan4.getDay();
  const jan4daysToMonday = jan4dow === 0 ? -6 : 1 - jan4dow;
  const startOfW1 = new Date(jan4);
  startOfW1.setDate(jan4.getDate() + jan4daysToMonday);
  const diff = monday - startOfW1;
  const wn = Math.round(diff / (7 * 86400000)) + 1;
  if (wn < 1) {
    // Previous year's last week
    return getISOWeekNumber(new Date(year - 1, 11, 28));
  }
  return wn;
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
  const [overtimeRecords, setOvertimeRecords] = useState({}); // key: empId_year_Mmonth
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

  // Listen to overtime records
  useEffect(()=>{
    const unsub = listenOvertime(currentYear, data => setOvertimeRecords(data));
    return () => unsub();
  },[currentYear]);

  // Listen to ALL stores for current week + selected store
  useEffect(()=>{
    // Always listen to all stores for current week (ensures mobile gets fresh data)
    const storesToListen = stores.length > 0 ? stores.map(s=>s.id) : (selectedStore ? [selectedStore] : []);
    const weeksToListen = [currentWeek, currentWeek-1, currentWeek+1].filter(w=>w>0&&w<=52);
    
    const newUnsubs = {};
    storesToListen.forEach(storeId=>{
      weeksToListen.forEach(wk=>{
        const key=`${storeId}_${currentYear}_W${wk}`;
        if(!listeners.current[key]){
          const unsub=listenSchedule(storeId,wk,currentYear,data=>{
            setSchedules(prev=>({...prev,[key]:data}));
          });
          listeners.current[key]=unsub;
          newUnsubs[key]=unsub;
        }
      });
    });
    // No cleanup here - we want persistent listeners
  },[stores,selectedStore,currentWeek,currentYear]);

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
          // Use getISOWeekNumber (same as app's getWeekDates)
          const wn = getISOWeekNumber(d);
          const yr2 = d.getFullYear();
          // Get week start using same ISO calculation as getWeekDates
          const jan4b = new Date(yr2, 0, 4);
          const dow2 = jan4b.getDay();
          const dtm = dow2 === 0 ? -6 : 1 - dow2;
          const startW1 = new Date(jan4b);
          startW1.setDate(jan4b.getDate() + dtm);
          const weekStart = new Date(startW1);
          weekStart.setDate(startW1.getDate() + (wn-1)*7);
          const di = Math.round((d - weekStart) / 86400000);
          if(di>=0 && di<=6) addToMap(wn, yr2, di);
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


  // ── OVERTIME HELPERS ──────────────────────────────────
  const getEmpOvertimeBalance = (empId) => {
    let total = 0;
    Object.values(overtimeRecords).forEach(r => {
      if (r.empId === empId && r.status !== 'paid') total += (r.extraHours || 0);
    });
    return parseFloat(total.toFixed(2));
  };

  const resolveOvertime = async (empId, week, year, action, extraH) => {
    const month = Math.ceil(week / 4.33);
    const key = `${empId}_${year}_M${month}`;
    const existing = overtimeRecords[key] || { extraHours:0, weeks:[], status:'pending' };
    const emp = employees.find(e => e.id === empId);
    await saveOvertimeRecord(empId, year, month, {
      ...existing, empId, year, month,
      employeeName: emp?.name || empId,
      storeId: emp?.storeId,
      extraHours: parseFloat(((existing.extraHours||0) + (action==='deduct'?0:extraH)).toFixed(2)),
      weeks: [...(existing.weeks||[]), {week, extraH, action, resolvedAt: new Date().toISOString()}],
      status: action==='pay'?'paid':'pending',
      lastAction: action,
    });
  };

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
      overtimeRecords,getEmpOvertimeBalance,resolveOvertime,
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
