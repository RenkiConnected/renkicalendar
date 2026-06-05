import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  listenStores, listenEmployees, listenShiftTypes, listenSchedule,
  saveStore, removeStore,
  saveEmployee, removeEmployee,
  saveShiftType,
  saveSchedule,
  seedIfEmpty,
} from '../firebaseService';

const AppContext = createContext(null);
const CURRENT_WEEK = 23;
const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function getWeekDates(weekNumber, year=2026) {
  const jan4 = new Date(year, 0, 4);
  const s = new Date(jan4);
  s.setDate(jan4.getDate() - jan4.getDay() + 1);
  const ws = new Date(s);
  ws.setDate(s.getDate() + (weekNumber-1)*7);
  return DAYS.map((day,i)=>{ const d=new Date(ws); d.setDate(ws.getDate()+i); return {day,date:d}; });
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(()=>localStorage.getItem('care_auth')==='true');
  const [authRole, setAuthRole] = useState(()=>localStorage.getItem('care_role')||null);
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [schedules, setSchedules] = useState({});
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
    return()=>{ u1(); u2(); u3(); };
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

  const login=(password,username)=>{
    if(password==='Raphael2232'){
      setIsAuthenticated(true); setAuthRole('admin');
      localStorage.setItem('care_auth','true'); localStorage.setItem('care_role','admin');
      return {success:true,role:'admin'};
    }
    const emp=employees.find(e=>e.name.toLowerCase()===username.toLowerCase());
    if(emp){
      setIsAuthenticated(true); setAuthRole(emp.role);
      localStorage.setItem('care_auth','true'); localStorage.setItem('care_role',emp.role);
      return {success:true,role:emp.role};
    }
    return {success:false};
  };

  const logout=()=>{
    setIsAuthenticated(false); setAuthRole(null);
    localStorage.removeItem('care_auth'); localStorage.removeItem('care_role');
  };

  const schedKey=(storeId,week,year)=>`${storeId}_${year}_W${week}`;
  const getSchedule=(storeId,week,year)=>schedules[schedKey(storeId,week,year)]||{};

  // Single shift — update local + Firebase
  const setShift=async(storeId,week,year,employeeId,dayIndex,shift)=>{
    const key=schedKey(storeId,week,year);
    const current=schedules[key]||{};
    const cellKey=`${employeeId}_${dayIndex}`;
    const updated={...current};
    if(shift===null) delete updated[cellKey];
    else updated[cellKey]=shift;
    setSchedules(prev=>({...prev,[key]:updated}));
    await saveSchedule(storeId,week,year,updated);
  };

  // Bulk — write entire schedule at once (for auto-generate)
  const setBulkSchedule=async(storeId,week,year,bulkData)=>{
    const key=schedKey(storeId,week,year);
    setSchedules(prev=>({...prev,[key]:bulkData}));
    await saveSchedule(storeId,week,year,bulkData);
  };

  const addStore=async s=>{ const n={...s,id:`store_${Date.now()}`}; await saveStore(n); return n; };
  const updateStore=async(id,u)=>{ const s=stores.find(x=>x.id===id); if(s) await saveStore({...s,...u}); };
  const deleteStore=async id=>{ await removeStore(id); };

  const addEmployee=async e=>{ const n={...e,id:`emp_${Date.now()}`}; await saveEmployee(n); return n; };
  const updateEmployee=async(id,u)=>{ const e=employees.find(x=>x.id===id); if(e) await saveEmployee({...e,...u}); };
  const deleteEmployee=async id=>{ await removeEmployee(id); };

  const updateShiftType=async(id,u)=>{ const s=shiftTypes.find(x=>x.id===id); if(s) await saveShiftType({...s,...u}); };

  return (
    <AppContext.Provider value={{
      isAuthenticated,authRole,login,logout,loading,
      stores,addStore,updateStore,deleteStore,
      employees,addEmployee,updateEmployee,deleteEmployee,
      getStoreEmployees:storeId=>employees.filter(e=>e.storeId===storeId),
      shiftTypes,updateShiftType,
      schedules,getSchedule,setShift,setBulkSchedule,
      currentWeek,setCurrentWeek,currentYear,
      selectedStore,setSelectedStore,
      getWeekDatesForCurrentWeek:w=>getWeekDates(w,currentYear),
      DAYS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp=()=>{ const c=useContext(AppContext); if(!c) throw new Error('useApp outside provider'); return c; };
export { DAYS, getWeekDates };
