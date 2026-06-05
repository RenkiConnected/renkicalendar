import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const CURRENT_WEEK = 23;

const DEFAULT_STORES = [
  { id: 'cogolin', name: 'Cogolin', color: '#00B8D4' },
  { id: 'saint-raphael', name: 'Saint Raphaël', color: '#FF6B35' },
  { id: 'coriolis-brignoles', name: 'Coriolis Brignoles', color: '#7C3AED' },
  { id: 'save-brignoles', name: 'Save Brignoles', color: '#059669' },
  { id: 'save-hyeres', name: 'Save Hyères', color: '#DC2626' },
  { id: 'care-vitrolles', name: 'Care Vitrolles', color: '#D97706' },
  { id: 'care-le-pontet', name: 'Care Le Pontet', color: '#2563EB' },
];

const DEFAULT_SHIFT_TYPES = [
  { id: 'work', label: 'Travail', color: '#2563EB', bgColor: '#DBEAFE' },
  { id: 'communication', label: 'Communication', color: '#EA580C', bgColor: '#FED7AA' },
  { id: 'vacation', label: 'Vacances', color: '#7C3AED', bgColor: '#EDE9FE' },
  { id: 'holiday', label: 'Férié', color: '#DC2626', bgColor: '#FEE2E2' },
  { id: 'rest', label: 'Repos', color: '#CA8A04', bgColor: '#FEF9C3' },
  { id: 'meeting', label: 'Réunion', color: '#16A34A', bgColor: '#DCFCE7' },
  { id: 'school', label: 'École', color: '#CA8A04', bgColor: '#FEF08A' },
];

const DEFAULT_EMPLOYEES = [
  { id: 'emp1', name: 'Yasmine', role: 'vendeur', storeId: 'cogolin', contractHours: 35, color: '#EC4899' },
  { id: 'emp2', name: 'Quentin', role: 'manager', storeId: 'cogolin', contractHours: 39, color: '#8B5CF6' },
  { id: 'emp3', name: 'Mika', role: 'vendeur', storeId: 'cogolin', contractHours: 28, color: '#06B6D4' },
  { id: 'emp4', name: 'Jeff', role: 'vendeur', storeId: 'saint-raphael', contractHours: 35, color: '#F59E0B' },
  { id: 'emp5', name: 'David', role: 'manager', storeId: 'saint-raphael', contractHours: 39, color: '#10B981' },
  { id: 'emp6', name: 'Yanis', role: 'vendeur', storeId: 'saint-raphael', contractHours: 28, color: '#F97316' },
];

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('care_auth') === 'true';
  });
  const [authRole, setAuthRole] = useState(() => {
    return localStorage.getItem('care_role') || null;
  });
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('care_stores');
    return saved ? JSON.parse(saved) : DEFAULT_STORES;
  });
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('care_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });
  const [shiftTypes, setShiftTypes] = useState(() => {
    const saved = localStorage.getItem('care_shift_types');
    return saved ? JSON.parse(saved) : DEFAULT_SHIFT_TYPES;
  });
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('care_schedules');
    return saved ? JSON.parse(saved) : {};
  });
  const [currentWeek, setCurrentWeek] = useState(CURRENT_WEEK);
  const [currentYear] = useState(2026);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    localStorage.setItem('care_stores', JSON.stringify(stores));
  }, [stores]);
  useEffect(() => {
    localStorage.setItem('care_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('care_shift_types', JSON.stringify(shiftTypes));
  }, [shiftTypes]);
  useEffect(() => {
    localStorage.setItem('care_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const login = (password, username) => {
    if (password === 'Raphael2232') {
      setIsAuthenticated(true);
      setAuthRole('admin');
      localStorage.setItem('care_auth', 'true');
      localStorage.setItem('care_role', 'admin');
      return { success: true, role: 'admin' };
    }
    // Check if employee
    const emp = employees.find(e => e.name.toLowerCase() === username.toLowerCase());
    if (emp) {
      setIsAuthenticated(true);
      setAuthRole(emp.role);
      localStorage.setItem('care_auth', 'true');
      localStorage.setItem('care_role', emp.role);
      return { success: true, role: emp.role };
    }
    return { success: false };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthRole(null);
    localStorage.removeItem('care_auth');
    localStorage.removeItem('care_role');
  };

  const getScheduleKey = (storeId, week, year) => `${storeId}_${year}_W${week}`;

  const getSchedule = (storeId, week, year) => {
    const key = getScheduleKey(storeId, week, year);
    return schedules[key] || {};
  };

  const setShift = (storeId, week, year, employeeId, dayIndex, shift) => {
    const key = getScheduleKey(storeId, week, year);
    setSchedules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [`${employeeId}_${dayIndex}`]: shift,
      }
    }));
  };

  const addEmployee = (employee) => {
    const newEmp = { ...employee, id: `emp_${Date.now()}` };
    setEmployees(prev => [...prev, newEmp]);
    return newEmp;
  };

  const updateEmployee = (id, updates) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addStore = (store) => {
    const newStore = { ...store, id: `store_${Date.now()}` };
    setStores(prev => [...prev, newStore]);
    return newStore;
  };

  const updateStore = (id, updates) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStore = (id) => {
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const updateShiftType = (id, updates) => {
    setShiftTypes(prev => prev.map(st => st.id === id ? { ...st, ...updates } : st));
  };

  const getWeekDatesForCurrentWeek = (week) => getWeekDates(week, currentYear);

  const getStoreEmployees = (storeId) => {
    return employees.filter(e => e.storeId === storeId);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, authRole, login, logout,
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
