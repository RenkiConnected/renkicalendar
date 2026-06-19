import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sendLeaveRequestEmail } from '../emailService';
import {
  listenStores, listenEmployees, listenShiftTypes, listenSchedule,
  listenLeaveRequests, listenSettings,
  saveStore, removeStore,
  saveEmployee, removeEmployee,
  saveShiftType, saveSchedule, saveSettings,
  saveLeaveRequest, removeLeaveRequest,
  fetchSchedule,
  saveOvertimeRecord, deleteOvertimeRecord, listenOvertime,
  saveConstraintRequest, listenConstraints, deleteConstraintRequest,
  savePwResetRequest, listenPwResets, deletePwResetRequest,
  savePrimeData, listenPrimes,
  savePrimeChangeRequest, listenPrimeRequests, deletePrimeChangeRequest,
  seedIfEmpty, forceResetAll, ALL_EMPLOYEES,
} from '../firebaseService';

const AppContext = createContext(null);
// Compute current ISO week number dynamically
function getISOWeek(date) {
  // Correct ISO 8601 week number (handles year boundaries)
  const d = new Date(date);
  d.setHours(0,0,0,0);
  // Thursday of the current week decides the year
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function getISOYear(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay()||7));
  return d.getFullYear();
}
const CURRENT_WEEK = getISOWeek(new Date());
const CURRENT_YEAR = getISOYear(new Date());
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

// Roles that require password
export const MANAGER_ROLES = ['manager','dirigeant','admin'];

function getWeekDates(wn, year=new Date().getFullYear()) {
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
  // Move to Thursday of this ISO week — Thursday determines the ISO year/week
  const dow = date.getDay() || 7; // 1=Mon..7=Sun
  date.setDate(date.getDate() + 4 - dow);
  const isoYear = date.getFullYear();
  const yearStart = new Date(isoYear, 0, 1);
  const wn = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return wn;
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(()=>sessionStorage.getItem('care_auth')==='true');
  const [authRole, setAuthRole] = useState(()=>sessionStorage.getItem('care_role')||null);
  const [currentUser, setCurrentUser] = useState(()=>sessionStorage.getItem('care_user')||null);
  const [currentEmpId, setCurrentEmpId] = useState(()=>sessionStorage.getItem('care_empid')||null);

  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState({});
  const [constraintRequests, setConstraintRequests] = useState([]); // key: empId_year_Mmonth
  const [pwResetRequests, setPwResetRequests] = useState([]);
  const [primes, setPrimes] = useState({});
  const [primeRequests, setPrimeRequests] = useState([]);
  const [appSettings, setAppSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState(CURRENT_WEEK);
  const [currentYear] = useState(CURRENT_YEAR);
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

  // Listen to constraint/exceptional requests
  useEffect(()=>{
    const unsub = listenConstraints(data => setConstraintRequests(data));
    const unsubPw = listenPwResets(data => setPwResetRequests(data));
    const unsubPr = listenPrimes(data => setPrimes(data));
    const unsubPcr = listenPrimeRequests(data => setPrimeRequests(data));
    return () => { unsub(); unsubPw(); unsubPr(); unsubPcr(); };
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
      const emp=employees.find(e=>e.name===selectedName&&MANAGER_ROLES.includes(e.role));
      if(!emp) return {success:false,error:'Utilisateur introuvable'};
      const expected = emp.password || 'Raphael2232';
      if(password!==expected) return {success:false,error:'Mot de passe incorrect'};
      _doLogin(emp);
      return {success:true,role:emp.role};
    } else {
      // Vendeur
      const emp=employees.find(e=>e.name===selectedName&&e.role==='vendeur');
      if(!emp) return {success:false,error:'Utilisateur introuvable'};
      // First connection: no password set yet → require creation
      if(!emp.password) return {success:false,needsPasswordSetup:true,empId:emp.id};
      if(password!==emp.password) return {success:false,error:'Mot de passe incorrect'};
      _doLogin(emp);
      return {success:true,role:'vendeur'};
    }
  };

  // Vendeur creates their password on first connection, then logs in
  const setupVendeurPassword = async (empId, newPassword) => {
    const emp = employees.find(e=>e.id===empId);
    if(!emp) return {success:false,error:'Introuvable'};
    const updated = {...emp, password:newPassword};
    await saveEmployee(updated);
    _doLogin(updated);
    return {success:true};
  };

  // Check if a vendeur (by name) still needs to create a password
  const vendeurNeedsPassword = (name) => {
    const emp = employees.find(e=>e.name===name&&e.role==='vendeur');
    return emp ? !emp.password : false;
  };

  // Change own password (manager/dirigeant/vendeur)
  const changeOwnPassword = async (empId, newPassword) => {
    const emp = employees.find(e=>e.id===empId);
    if(!emp) return {success:false,error:'Introuvable'};
    await saveEmployee({...emp, password:newPassword});
    return {success:true};
  };

  // Employee requests a password reset (from login screen, by name)
  const requestPasswordReset = async (empName) => {
    const emp = employees.find(e=>e.name===empName);
    if(!emp) return {success:false,error:'Utilisateur introuvable'};
    // Avoid duplicates
    const existing = pwResetRequests.find(r=>r.employeeId===emp.id);
    if(existing) return {success:true,already:true};
    await savePwResetRequest({
      employeeId: emp.id,
      employeeName: emp.name,
      storeId: emp.storeId,
      role: emp.role,
      createdAt: new Date().toISOString(),
    });
    return {success:true};
  };

  // Admin/manager resets a password: clears it so the user recreates one at next login
  const resetEmployeePassword = async (empId) => {
    const emp = employees.find(e=>e.id===empId);
    if(!emp) return {success:false};
    await saveEmployee({...emp, password:''});
    // Remove any pending reset request for this employee
    const req = pwResetRequests.find(r=>r.employeeId===empId);
    if(req) await deletePwResetRequest(req.id);
    return {success:true};
  };

  // Admin/manager sets a specific password for an employee
  const setEmployeePassword = async (empId, newPassword) => {
    const emp = employees.find(e=>e.id===empId);
    if(!emp) return {success:false};
    await saveEmployee({...emp, password:newPassword});
    const req = pwResetRequests.find(r=>r.employeeId===empId);
    if(req) await deletePwResetRequest(req.id);
    return {success:true};
  };

  const dismissPwResetRequest = async (reqId) => { await deletePwResetRequest(reqId); };

  // Vendeur submits a suggestion to modify their prime entries
  const submitPrimeChangeRequest = async ({ empId, empName, storeId, year, month, changes, note }) => {
    await savePrimeChangeRequest({ empId, empName, storeId, year, month, changes, note, status:'pending', createdAt:new Date().toISOString() });
    return { success:true };
  };
  // Manager approves: apply the suggested changes to the prime doc, then remove the request
  const approvePrimeChangeRequest = async (req) => {
    const key = `${req.storeId}_${req.year}_M${req.month}`;
    const cur = primes[key] || {};
    const vendeurs = { ...(cur.vendeurs || {}) };
    const v = { ...(vendeurs[req.empId] || {}) };
    Object.entries(req.changes || {}).forEach(([k, val]) => { v[k] = val; });
    vendeurs[req.empId] = v;
    await savePrimeData(key, { ...cur, storeId:req.storeId, year:req.year, month:req.month, vendeurs });
    await deletePrimeChangeRequest(req.id);
    return { success:true };
  };
  const rejectPrimeChangeRequest = async (reqId) => { await deletePrimeChangeRequest(reqId); };

  const _doLogin=(emp)=>{
    setIsAuthenticated(true);
    setAuthRole(emp.role);
    setCurrentUser(emp.name);
    setCurrentEmpId(emp.id);
    sessionStorage.setItem('care_auth','true');
    sessionStorage.setItem('care_role',emp.role);
    sessionStorage.setItem('care_user',emp.name);
    sessionStorage.setItem('care_empid',emp.id);
  };

  const logout=()=>{
    setIsAuthenticated(false); setAuthRole(null); setCurrentUser(null); setCurrentEmpId(null);
    sessionStorage.removeItem('care_auth'); sessionStorage.removeItem('care_role');
    sessionStorage.removeItem('care_user'); sessionStorage.removeItem('care_empid');
  };

  // ── AUTO-LOGOUT on inactivity (30 min) ───────────────────
  useEffect(()=>{
    if(!isAuthenticated) return;
    const TIMEOUT = 30*60*1000;
    let timer;
    const reset = ()=>{ clearTimeout(timer); timer = setTimeout(()=>{ logout(); }, TIMEOUT); };
    const events = ['mousedown','keydown','touchstart','scroll','mousemove'];
    events.forEach(ev=>window.addEventListener(ev, reset, { passive:true }));
    reset();
    return ()=>{ clearTimeout(timer); events.forEach(ev=>window.removeEventListener(ev, reset)); };
  },[isAuthenticated]);

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
    await saveLeaveRequest(n);
    // Send notification email
    try {
      const emp=employees.find(e=>e.id===req.employeeId||e.id===currentEmpId);
      const store=stores.find(s=>s.id===(emp?.storeId));

      // Parse dates properly (they are ISO strings like "2026-06-15T00:00:00.000Z")
      let dateStr = '—';
      if (req.dates && req.dates.length > 0) {
        const sorted = [...req.dates].sort();
        const fmt = d => {
          const dt = new Date(d);
          return dt.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'long', year:'numeric' });
        };
        if (sorted.length === 1) {
          dateStr = fmt(sorted[0]);
        } else {
          // Show range if consecutive, list if scattered
          dateStr = `${fmt(sorted[0])} → ${fmt(sorted[sorted.length-1])} (${sorted.length} jours)`;
        }
      }

      // Get ISO week numbers from weeks data
      let weekStr = '';
      if (req.weeks && req.weeks.length > 0) {
        const wks = [...new Set(req.weeks.map(w => w.week))].sort((a,b)=>a-b);
        weekStr = wks.length === 1 ? `Semaine ${wks[0]}` : `Semaines ${wks.join(', ')}`;
      }

      // Recipients: direction (always) + store email + managers who manage this store
      const directionEmails = (appSettings?.notificationEmails || '').split(',').map(s=>s.trim()).filter(Boolean);
      const allEmails = [...directionEmails];
      // Store's own notification email
      const storeEmail = (store?.notifyEmail || '').trim();
      if (storeEmail && !allEmails.includes(storeEmail)) allEmails.push(storeEmail);
      // Managers who are responsible for this store (managedStores includes it, or it's their main store)
      employees.forEach(m => {
        const isManager = ['manager','dirigeant','admin'].includes(m.role);
        if (!isManager || !m.email) return;
        const managesThisStore = (m.managedStores||[]).includes(emp?.storeId) || m.storeId === emp?.storeId;
        if (managesThisStore) {
          const em = m.email.trim();
          if (em && !allEmails.includes(em)) allEmails.push(em);
        }
      });
      const toEmails = allEmails.join(', ');

      await sendLeaveRequestEmail({
        employee: emp?.name || req.employeeName || '—',
        leaveType: req.leaveType || req.type || 'vacation',
        dates: dateStr,
        weeks: weekStr,
        storeName: store?.name || '—',
        toEmails,
      });
    }catch(e){console.error('[Email] Failed to send leave notification:', e?.text||e?.message||e);}
    return n;
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
          // ISO week number + ISO year (Thursday-based, handles year boundaries)
          const wn = getISOWeekNumber(d);
          const thu = new Date(d); thu.setHours(0,0,0,0);
          thu.setDate(thu.getDate() + 4 - (thu.getDay()||7));
          const yr2 = thu.getFullYear();
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


  // ── CONSTRAINT/EXCEPTIONAL HELPERS ───────────────────────
  const submitConstraintRequest = async (data) => {
    const emp = employees.find(e => e.id === currentEmpId);
    const id = await saveConstraintRequest({
      ...data,
      employeeId: currentEmpId,
      employeeName: emp?.name || '',
      storeId: emp?.storeId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return id;
  };
  const approveConstraintRequest = async (req) => {
    await saveConstraintRequest({ ...req, status: 'approved', resolvedAt: new Date().toISOString() });
  };
  const refuseConstraintRequest = async (req, reason='') => {
    await saveConstraintRequest({ ...req, status: 'refused', managerNote: reason, resolvedAt: new Date().toISOString() });
  };
  const removeConstraintRequest = async (id) => {
    await deleteConstraintRequest(id);
  };

  // ── OVERTIME HELPERS ──────────────────────────────────
  const getEmpOvertimeBalance = (empId) => {
    let total = 0;
    Object.values(overtimeRecords).forEach(r => {
      if (r.empId === empId && r.status !== 'paid') total += (r.extraHours || 0);
    });
    return parseFloat(total.toFixed(2));
  };

  const deleteOvertimeEntry = async (empId, year, month) => {
    await deleteOvertimeRecord(empId, year, month);
  };

  const updateOvertimeHours = async (empId, year, month, newHours) => {
    const key = `${empId}_${year}_M${month}`;
    const existing = overtimeRecords[key];
    if (!existing) return;
    await saveOvertimeRecord(empId, year, month, {
      ...existing,
      extraHours: parseFloat(newHours.toFixed(2)),
      updatedAt: new Date().toISOString(),
    });
  };

  const resolveOvertime = async (empId, week, year, action, extraH) => {
    const month = Math.ceil(week / 4.33);
    const key = `${empId}_${year}_M${month}`;
    const existing = overtimeRecords[key] || { extraHours:0, weeks:[], status:'pending' };
    const emp = employees.find(e => e.id === empId);
    // Replace any previous entry for the SAME week (avoid double-counting on re-save)
    const priorWeeks = (existing.weeks||[]).filter(w => w.week !== week);
    const newWeeks = [...priorWeeks, {week, extraH, action, resolvedAt: new Date().toISOString()}];
    // Recompute total from the week entries (paid/deduct contribute 0 to pending balance)
    const recomputed = newWeeks.reduce((t,w)=> t + (w.action==='deduct' ? 0 : (Number(w.extraH)||0)), 0);
    await saveOvertimeRecord(empId, year, month, {
      ...existing, empId, year, month,
      employeeName: emp?.name || empId,
      storeId: emp?.storeId,
      extraHours: parseFloat(recomputed.toFixed(2)),
      weeks: newWeeks,
      status: action==='pay'?'paid':'pending',
      lastAction: action,
    });
  };

  // ── PERMISSIONS ───────────────────────────────────────
  const currentEmp = employees.find(e=>e.id===currentEmpId);
  const isDirigeant = authRole==='dirigeant' || authRole==='admin';
  const canValidateLeave = isDirigeant;
  const getVisibleStoreIds = () => {
    if (isDirigeant) return stores.map(s=>s.id);
    if (authRole==='manager' && currentEmp) {
      const ids = new Set([...(currentEmp.managedStores||[])]);
      if (currentEmp.storeId) ids.add(currentEmp.storeId);
      return [...ids];
    }
    return stores.map(s=>s.id);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,authRole,currentUser,currentEmpId,currentEmp,login,logout,loading,
      changeOwnPassword,isDirigeant,canValidateLeave,getVisibleStoreIds,setupVendeurPassword,vendeurNeedsPassword,
      pwResetRequests,requestPasswordReset,resetEmployeePassword,setEmployeePassword,dismissPwResetRequest,
      primes,savePrimeData,primeRequests,submitPrimeChangeRequest,approvePrimeChangeRequest,rejectPrimeChangeRequest,
      stores,addStore,updateStore,deleteStore,
      employees,addEmployee,updateEmployee,deleteEmployee,
      getStoreEmployees:sid=>employees.filter(e=>e.storeId===sid),
      shiftTypes,updateShiftType,
      schedules,getSchedule,setShift,setBulkSchedule,
      leaveRequests,submitLeaveRequest,approveLeaveRequest,rejectLeaveRequest,cancelApprovedLeave,deleteLeaveRequest,
      appSettings,updateSettings,
      doResetEmployees,
      currentWeek,setCurrentWeek,currentYear,
      overtimeRecords,getEmpOvertimeBalance,resolveOvertime,deleteOvertimeEntry,updateOvertimeHours,
      constraintRequests,submitConstraintRequest,approveConstraintRequest,refuseConstraintRequest,removeConstraintRequest,
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
