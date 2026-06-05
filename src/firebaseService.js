import { db } from './firebase';
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  onSnapshot, writeBatch, getDoc
} from 'firebase/firestore';

// ── STORES ──────────────────────────────────────────
export async function fetchStores() {
  const snap = await getDocs(collection(db, 'stores'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveStore(store) {
  await setDoc(doc(db, 'stores', store.id), store);
}
export async function removeStore(id) {
  await deleteDoc(doc(db, 'stores', id));
}

// ── EMPLOYEES ────────────────────────────────────────
export async function fetchEmployees() {
  const snap = await getDocs(collection(db, 'employees'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveEmployee(emp) {
  await setDoc(doc(db, 'employees', emp.id), emp);
}
export async function removeEmployee(id) {
  await deleteDoc(doc(db, 'employees', id));
}

// ── SHIFT TYPES ──────────────────────────────────────
export async function fetchShiftTypes() {
  const snap = await getDocs(collection(db, 'shiftTypes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveShiftType(st) {
  await setDoc(doc(db, 'shiftTypes', st.id), st);
}

// ── SCHEDULES ────────────────────────────────────────
export async function fetchSchedule(storeId, week, year) {
  const key = `${storeId}_${year}_W${week}`;
  const ref = doc(db, 'schedules', key);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : {};
}
export async function saveSchedule(storeId, week, year, scheduleData) {
  const key = `${storeId}_${year}_W${week}`;
  await setDoc(doc(db, 'schedules', key), scheduleData);
}

// ── REALTIME LISTENERS ───────────────────────────────
export function listenStores(cb) {
  return onSnapshot(collection(db, 'stores'), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenEmployees(cb) {
  return onSnapshot(collection(db, 'employees'), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenShiftTypes(cb) {
  return onSnapshot(collection(db, 'shiftTypes'), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function listenSchedule(storeId, week, year, cb) {
  const key = `${storeId}_${year}_W${week}`;
  return onSnapshot(doc(db, 'schedules', key), snap => {
    cb(snap.exists() ? snap.data() : {});
  });
}

// ── SEED DEFAULT DATA (first launch) ─────────────────
export async function seedIfEmpty() {
  const snap = await getDocs(collection(db, 'stores'));
  if (!snap.empty) return; // déjà initialisé

  const batch = writeBatch(db);

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

  DEFAULT_STORES.forEach(s => batch.set(doc(db, 'stores', s.id), s));
  DEFAULT_SHIFT_TYPES.forEach(st => batch.set(doc(db, 'shiftTypes', st.id), st));
  DEFAULT_EMPLOYEES.forEach(e => batch.set(doc(db, 'employees', e.id), e));

  await batch.commit();
  console.log('✅ Firebase initialisé avec les données par défaut');
}
