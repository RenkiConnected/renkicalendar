import { db } from './firebase';
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  onSnapshot, writeBatch, getDoc, query, limit
} from 'firebase/firestore';

// ── STORES ──────────────────────────────────────────
export async function saveStore(store) { await setDoc(doc(db,'stores',store.id),store); }
export async function removeStore(id) { await deleteDoc(doc(db,'stores',id)); }

// ── EMPLOYEES ────────────────────────────────────────
export async function saveEmployee(emp) { await setDoc(doc(db,'employees',emp.id),emp); }
export async function removeEmployee(id) { await deleteDoc(doc(db,'employees',id)); }

// ── SHIFT TYPES ──────────────────────────────────────
export async function saveShiftType(st) { await setDoc(doc(db,'shiftTypes',st.id),st); }

// ── SCHEDULES ────────────────────────────────────────
export async function saveSchedule(storeId,week,year,data) {
  await setDoc(doc(db,'schedules',`${storeId}_${year}_W${week}`),data);
}

// ── SETTINGS ─────────────────────────────────────────
export async function saveSettings(data) { await setDoc(doc(db,'settings','app'),data); }
export function listenSettings(cb) {
  return onSnapshot(doc(db,'settings','app'),snap=>cb(snap.exists()?snap.data():{}));
}

// ── LISTENERS ────────────────────────────────────────
export function listenStores(cb) {
  return onSnapshot(collection(db,'stores'),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));
}
export function listenEmployees(cb) {
  return onSnapshot(collection(db,'employees'),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));
}
export function listenShiftTypes(cb) {
  return onSnapshot(collection(db,'shiftTypes'),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));
}
export function listenSchedule(storeId,week,year,cb) {
  return onSnapshot(doc(db,'schedules',`${storeId}_${year}_W${week}`),snap=>cb(snap.exists()?snap.data():{}));
}
export function listenLeaveRequests(cb) {
  return onSnapshot(collection(db,'leaveRequests'),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));
}
export async function saveLeaveRequest(req) { await setDoc(doc(db,'leaveRequests',req.id),req); }
export async function removeLeaveRequest(id) { await deleteDoc(doc(db,'leaveRequests',id)); }

// ── DONNÉES PAR DÉFAUT ────────────────────────────────
const STORES=[
  {id:'cogolin',           name:'Cogolin',           color:'#00B8D4'},
  {id:'saint-raphael',     name:'Saint Raphaël',     color:'#FF6B35'},
  {id:'coriolis-brignoles',name:'Coriolis Brignoles',color:'#7C3AED'},
  {id:'save-brignoles',    name:'Save Brignoles',    color:'#059669'},
  {id:'save-hyeres',       name:'Save Hyères',       color:'#DC2626'},
  {id:'care-vitrolles',    name:'Care Vitrolles',    color:'#D97706'},
  {id:'care-le-pontet',    name:'Care Le Pontet',    color:'#2563EB'},
];

const SHIFT_TYPES=[
  {id:'work',         label:'Travail',       color:'#2563EB',bgColor:'#DBEAFE'},
  {id:'communication',label:'Communication', color:'#EA580C',bgColor:'#FED7AA'},
  {id:'vacation',     label:'Vacances',      color:'#7C3AED',bgColor:'#EDE9FE'},
  {id:'holiday',      label:'Férié',         color:'#DC2626',bgColor:'#FEE2E2'},
  {id:'rest',         label:'Repos',         color:'#CA8A04',bgColor:'#FEF9C3'},
  {id:'meeting',      label:'Réunion',       color:'#16A34A',bgColor:'#DCFCE7'},
  {id:'school',       label:'École',         color:'#B45309',bgColor:'#FEF08A'},
];

export const ALL_EMPLOYEES=[
  // ── MANAGERS
  {id:'mgr_quentin',  name:'Quentin',   role:'manager',   storeId:'saint-raphael',     contractHours:39,color:'#8B5CF6'},
  {id:'mgr_florent',  name:'Florent',   role:'manager',   storeId:'cogolin',            contractHours:39,color:'#F59E0B'},
  {id:'mgr_sebastien',name:'Sebastien', role:'manager',   storeId:'coriolis-brignoles', contractHours:39,color:'#10B981'},
  {id:'mgr_michael',  name:'Michael',   role:'manager',   storeId:'save-brignoles',     contractHours:39,color:'#EF4444'},
  // ── DIRIGEANTS
  {id:'dir_david',    name:'David',     role:'dirigeant', storeId:'cogolin',             contractHours:39,color:'#0EA5E9'},
  {id:'dir_yannis',   name:'Yannis',    role:'dirigeant', storeId:'cogolin',             contractHours:39,color:'#6366F1'},
  // ── VENDEURS
  {id:'vnd_quentink', name:'Quentin K', role:'vendeur',   storeId:'cogolin',            contractHours:35,color:'#A78BFA'},
  {id:'vnd_johan',    name:'Johan',     role:'vendeur',   storeId:'cogolin',            contractHours:35,color:'#34D399'},
  {id:'vnd_yasmine',  name:'Yasmine',   role:'vendeur',   storeId:'cogolin',            contractHours:35,color:'#EC4899'},
  {id:'vnd_antho',    name:'Antho',     role:'vendeur',   storeId:'saint-raphael',      contractHours:35,color:'#F97316'},
  {id:'vnd_damien',   name:'Damien',    role:'vendeur',   storeId:'saint-raphael',      contractHours:35,color:'#14B8A6'},
  {id:'vnd_gillou',   name:'Gillou',    role:'vendeur',   storeId:'saint-raphael',      contractHours:35,color:'#84CC16'},
  {id:'vnd_leo',      name:'Leo',       role:'vendeur',   storeId:'coriolis-brignoles', contractHours:35,color:'#F43F5E'},
  {id:'vnd_anouar',   name:'Anouar',    role:'vendeur',   storeId:'coriolis-brignoles', contractHours:35,color:'#8B5CF6'},
  {id:'vnd_julia',    name:'Julia',     role:'vendeur',   storeId:'save-brignoles',     contractHours:35,color:'#D946EF'},
  {id:'vnd_romain',   name:'Romain',    role:'vendeur',   storeId:'save-brignoles',     contractHours:35,color:'#0284C7'},
  {id:'vnd_jeff',     name:'Jeff',      role:'vendeur',   storeId:'save-hyeres',        contractHours:35,color:'#CA8A04'},
  {id:'vnd_adrien',   name:'Adrien',    role:'vendeur',   storeId:'save-hyeres',        contractHours:35,color:'#16A34A'},
  {id:'vnd_sam',      name:'Sam',       role:'vendeur',   storeId:'care-vitrolles',     contractHours:35,color:'#DC2626'},
  {id:'vnd_cindy',    name:'Cindy',     role:'vendeur',   storeId:'care-vitrolles',     contractHours:35,color:'#BE185D'},
];

// ── FORCE RESET COMPLET ────────────────────────────────
// Supprime TOUS les anciens employés et recrée la liste correcte
export async function forceResetAll() {
  const batch = writeBatch(db);

  // 1. Supprimer tous les anciens employés
  const oldEmps = await getDocs(collection(db,'employees'));
  oldEmps.docs.forEach(d => batch.delete(doc(db,'employees',d.id)));

  // 2. Supprimer anciens stores
  const oldStores = await getDocs(collection(db,'stores'));
  oldStores.docs.forEach(d => batch.delete(doc(db,'stores',d.id)));

  // 3. Supprimer anciens shiftTypes
  const oldST = await getDocs(collection(db,'shiftTypes'));
  oldST.docs.forEach(d => batch.delete(doc(db,'shiftTypes',d.id)));

  await batch.commit();

  // 4. Recréer tout
  const batch2 = writeBatch(db);
  STORES.forEach(s=>batch2.set(doc(db,'stores',s.id),s));
  SHIFT_TYPES.forEach(st=>batch2.set(doc(db,'shiftTypes',st.id),st));
  ALL_EMPLOYEES.forEach(e=>batch2.set(doc(db,'employees',e.id),e));

  // 5. Marquer la version pour ne pas re-run
  batch2.set(doc(db,'settings','app'),{ version:'v6', migratedAt: new Date().toISOString() });

  await batch2.commit();
  console.log('✅ Migration V6 terminée');
}

// ── SEED (premier lancement uniquement) ───────────────
export async function seedIfEmpty() {
  // Vérifier si migration V6 déjà faite
  const settingsSnap = await getDoc(doc(db,'settings','app'));
  if(settingsSnap.exists() && settingsSnap.data().version === 'v6') {
    return; // déjà à jour
  }

  // Forcer la migration complète
  await forceResetAll();
}

// ── FETCH SCHEDULE (one-time read) ────────────────────
export async function fetchSchedule(storeId, week, year) {
  const key = `${storeId}_${year}_W${week}`;
  const snap = await getDoc(doc(db, 'schedules', key));
  return snap.exists() ? snap.data() : {};
}

// ── OVERTIME TRACKING ────────────────────────────────────
export async function saveOvertimeRecord(empId, year, month, data) {
  const key = `${empId}_${year}_M${month}`;
  await setDoc(doc(db, 'overtime', key), { ...data, empId, year, month, updatedAt: new Date().toISOString() });
}

export async function fetchOvertimeRecords(storeId, year) {
  const snap = await getDocs(collection(db, 'overtime'));
  const records = {};
  snap.forEach(d => {
    const data = d.data();
    if (data.year === year) records[d.id] = data;
  });
  return records;
}

export function listenOvertime(year, cb) {
  return onSnapshot(collection(db, 'overtime'), snap => {
    const records = {};
    snap.forEach(d => {
      const data = d.data();
      if (data.year === year) records[d.id] = data;
    });
    cb(records);
  });
}
