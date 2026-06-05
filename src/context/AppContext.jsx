import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  listenStores, listenEmployees, listenShiftTypes, listenSchedule,
  saveStore, removeStore,
  saveEmployee, removeEmployee,
  saveShiftType,
  saveSchedule, fetchSchedule,
  seedIfEmpty,
} from '../firebaseService';

const AppContext = createContext(null);
const CURRENT_WEEK = 23;
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function getWeekDates(weekNumber, year = 2026) {
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - jan4.getDay() + 1);
  const weekStart = new Date(startOfWeek1);
  weekStart.setDate(startOfWeek1.getDate() + (weekNumber - 1) * 7);
  return DAYS.map((day, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { day, date: d };
  });
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('care_auth') === 'true');
  const [authRole, setAuthRole] = useState(() => localStorage.getItem('care_role') || null);

  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);

  const [currentWeek, setCurrentWeek] = useState(CURRENT_WEEK);
  const [currentYear] = useState(2026);
  const [selectedStore, setSelectedStore] = useState(null);

  const scheduleListeners = useRef({});

  // ── INIT FIREBASE ──────────────────────────────────
  useEffect(() => {
    seedIfEmpty().then(() => setLoading(false));

    const unsubStores = listenStores(setStores);
    const unsubEmps = listenEmployees(setEmployees);
    const unsubShifts = listenShiftTypes(setShiftTypes);

    return () => { unsubStores(); unsubEmps(); unsubShifts(); };
  }, []);

  // ── ÉCOUTER LE PLANNING EN TEMPS RÉEL ─────────────
  useEffect(() => {
    if (!selectedStore) return;
    const key = `${selectedStore}_${currentYear}_W${currentWeek}`;

    if (scheduleListeners.current[key]) return; // déjà écouté

    const unsub = listenSchedule(selectedStore, currentWeek, currentYear, (data) => {
      setSchedules(prev => ({ ...prev, [key]: data }));
    });
    scheduleListeners.current[key] = unsub;

    return () => {
      unsub();
      delete scheduleListeners.current[key];
    };
  }, [selectedStore, currentWeek, currentYear]);

  // ── AUTH ───────────────────────────────────────────
  const login = (password, username) => {
    if (password === 'Raphael2232') {
      setIsAuthenticated(true); setAuthRole('admin');
      localStorage.setItem('care_auth', 'true');
      localStorage.setItem('care_role', 'admin');
      return { success: true, role: 'admin' };
    }
    const emp = employees.find(e => e.name.toLowerCase() === username.toLowerCase());
    if (emp) {
      setIsAuthenticated(true); setAuthRole(emp.role);
      localStorage.setItem('care_auth', 'true');
      localStorage.setItem('care_role', emp.role);
      return { success: true, role: emp.role };
    }
    return { success: false };
  };

  const logout = () => {
    setIsAuthenticated(false); setAuthRole(null);
    localStorage.removeItem('care_auth');
    localStorage.removeItem('care_role');
  };

  // ── SCHEDULES ──────────────────────────────────────
  const getScheduleKey = (storeId, week, year) => `${storeId}_${year}_W${week}`;

  const getSchedule = (storeId, week, year) => {
    const key = getScheduleKey(storeId, week, year);
    return schedules[key] || {};
  };

  const setShift = async (storeId, week, year, employeeId, dayIndex, shift) => {
    const key = getScheduleKey(storeId, week, year);
    const current = schedules[key] || {};
    const cellKey = `${employeeId}_${dayIndex}`;
    let updated;
    if (shift === null) {
      updated = { ...current };
      delete updated[cellKey];
    } else {
      updated = { ...current, [cellKey]: shift };
    }
    setSchedules(prev => ({ ...prev, [key]: updated }));
    await saveSchedule(storeId, week, year, updated);
  };

  // ── STORES ─────────────────────────────────────────
  const addStore = async (store) => {
    const newStore = { ...store, id: `store_${Date.now()}` };
    await saveStore(newStore);
    return newStore;
  };
  const updateStore = async (id, updates) => {
    const store = stores.find(s => s.id === id);
    if (store) await saveStore({ ...store, ...updates });
  };
  const deleteStore = async (id) => { await removeStore(id); };

  // ── EMPLOYEES ──────────────────────────────────────
  const addEmployee = async (emp) => {
    const newEmp = { ...emp, id: `emp_${Date.now()}` };
    await saveEmployee(newEmp);
    return newEmp;
  };
  const updateEmployee = async (id, updates) => {
    const emp = employees.find(e => e.id === id);
    if (emp) await saveEmployee({ ...emp, ...updates });
  };
  const deleteEmployee = async (id) => { await removeEmployee(id); };

  // ── SHIFT TYPES ────────────────────────────────────
  const updateShiftType = async (id, updates) => {
    const st = shiftTypes.find(s => s.id === id);
    if (st) await saveShiftType({ ...st, ...updates });
  };

  const getStoreEmployees = (storeId) => employees.filter(e => e.storeId === storeId);
  const getWeekDatesForCurrentWeek = (week) => getWeekDates(week, currentYear);

  return (
    <AppContext.Provider value={{
      isAuthenticated, authRole, login, logout,
      loading,
      stores, addStore, updateStore, deleteStore,
      employees, addEmployee, updateEmployee, deleteEmployee, getStoreEmployees,
      shiftTypes, updateShiftType,
      schedules, getSchedule, setShift,
      currentWeek, setCurrentWeek,
      currentYear,
      selectedStore, setSelectedStore,
      getWeekDatesForCurrentWeek,
      DAYS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export { DAYS, getWeekDates };
