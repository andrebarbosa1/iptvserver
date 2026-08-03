import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Customer,
  Trial,
  Plan,
  Subscription,
  Playlist,
  SystemLog,
  SystemSettings
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_TRIALS,
  INITIAL_PLANS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_PLAYLISTS,
  INITIAL_LOGS,
  DEFAULT_SETTINGS
} from '../data/initialData';

// Firestore collection names
const COLLECTIONS = {
  CUSTOMERS: 'customers',
  TRIALS: 'trials',
  PLANS: 'plans',
  SUBSCRIPTIONS: 'subscriptions',
  PLAYLISTS: 'playlists',
  LOGS: 'logs',
  SETTINGS: 'settings'
};

// Helper to remove undefined fields recursively for Firestore compatibility
function sanitizeDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeDataForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Seed initial data if database is empty
export async function seedFirestoreIfEmpty() {
  try {
    const settingsSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'global'));
    if (settingsSnap.exists()) {
      console.log('Firestore already initialized (settings document exists). Skipping seeding.');
      return;
    }

    const custSnap = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    if (!custSnap.empty) {
      console.log('Firestore already contains data.');
      return;
    }

    console.log('Seeding initial data into Firestore...');
    const batch = writeBatch(db);

    INITIAL_CUSTOMERS.forEach(cust => {
      batch.set(doc(db, COLLECTIONS.CUSTOMERS, cust.id), sanitizeDataForFirestore(cust));
    });

    INITIAL_TRIALS.forEach(trial => {
      batch.set(doc(db, COLLECTIONS.TRIALS, trial.id), sanitizeDataForFirestore(trial));
    });

    INITIAL_PLANS.forEach(plan => {
      batch.set(doc(db, COLLECTIONS.PLANS, plan.id), sanitizeDataForFirestore(plan));
    });

    INITIAL_SUBSCRIPTIONS.forEach(sub => {
      batch.set(doc(db, COLLECTIONS.SUBSCRIPTIONS, sub.id), sanitizeDataForFirestore(sub));
    });

    INITIAL_PLAYLISTS.forEach(pl => {
      batch.set(doc(db, COLLECTIONS.PLAYLISTS, pl.id), sanitizeDataForFirestore(pl));
    });

    INITIAL_LOGS.forEach(log => {
      batch.set(doc(db, COLLECTIONS.LOGS, log.id), sanitizeDataForFirestore(log));
    });

    batch.set(doc(db, COLLECTIONS.SETTINGS, 'global'), sanitizeDataForFirestore({
      ...DEFAULT_SETTINGS,
      isInitialized: true
    }));

    await batch.commit();
    console.log('Firestore successfully seeded!');
  } catch (err) {
    console.error('Error seeding Firestore:', err);
  }
}

// Real-time Subscriptions
export function subscribeCustomers(callback: (data: Customer[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.CUSTOMERS),
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      callback(items);
    },
    err => console.error('Error listening to customers:', err)
  );
}

export function subscribeTrials(callback: (data: Trial[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.TRIALS),
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trial));
      callback(items);
    },
    err => console.error('Error listening to trials:', err)
  );
}

export function subscribePlans(callback: (data: Plan[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.PLANS),
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
      callback(items);
    },
    err => console.error('Error listening to plans:', err)
  );
}

export function subscribeSubscriptions(callback: (data: Subscription[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.SUBSCRIPTIONS),
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
      callback(items);
    },
    err => console.error('Error listening to subscriptions:', err)
  );
}

export function subscribePlaylists(callback: (data: Playlist[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.PLAYLISTS),
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
      callback(items);
    },
    err => console.error('Error listening to playlists:', err)
  );
}

export function subscribeLogs(callback: (data: SystemLog[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.LOGS),
    snapshot => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog));
      // Sort newest first
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      callback(items);
    },
    err => console.error('Error listening to logs:', err)
  );
}

export function subscribeSettings(callback: (data: SystemSettings) => void) {
  return onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'global'),
    snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SystemSettings);
      }
    },
    err => console.error('Error listening to settings:', err)
  );
}

// CRUD Actions
export async function saveCustomer(customer: Customer) {
  await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), sanitizeDataForFirestore(customer), { merge: true });
}

export async function updateCustomer(id: string, updated: Partial<Customer>) {
  await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, id), sanitizeDataForFirestore(updated));
}

export async function deleteCustomer(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, id));
}

export async function saveTrial(trial: Trial) {
  await setDoc(doc(db, COLLECTIONS.TRIALS, trial.id), sanitizeDataForFirestore(trial), { merge: true });
}

export async function updateTrial(id: string, updated: Partial<Trial>) {
  await updateDoc(doc(db, COLLECTIONS.TRIALS, id), sanitizeDataForFirestore(updated));
}

export async function savePlan(plan: Plan) {
  await setDoc(doc(db, COLLECTIONS.PLANS, plan.id), sanitizeDataForFirestore(plan), { merge: true });
}

export async function updatePlan(id: string, updated: Partial<Plan>) {
  await updateDoc(doc(db, COLLECTIONS.PLANS, id), sanitizeDataForFirestore(updated));
}

export async function saveSubscription(sub: Subscription) {
  await setDoc(doc(db, COLLECTIONS.SUBSCRIPTIONS, sub.id), sanitizeDataForFirestore(sub), { merge: true });
}

export async function savePlaylist(playlist: Playlist) {
  await setDoc(doc(db, COLLECTIONS.PLAYLISTS, playlist.id), sanitizeDataForFirestore(playlist), { merge: true });
}

export async function updatePlaylist(id: string, updated: Partial<Playlist>) {
  await updateDoc(doc(db, COLLECTIONS.PLAYLISTS, id), sanitizeDataForFirestore(updated));
}

export async function deletePlaylist(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.PLAYLISTS, id));
}

export async function addSystemLog(log: SystemLog) {
  await setDoc(doc(db, COLLECTIONS.LOGS, log.id), sanitizeDataForFirestore(log));
}

export async function updateSettings(settings: Partial<SystemSettings>) {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'global'), sanitizeDataForFirestore(settings), { merge: true });
}

export async function clearAllCustomerData(includePlaylists = false) {
  try {
    const custSnap = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    const trialSnap = await getDocs(collection(db, COLLECTIONS.TRIALS));
    const subSnap = await getDocs(collection(db, COLLECTIONS.SUBSCRIPTIONS));
    const logSnap = await getDocs(collection(db, COLLECTIONS.LOGS));

    const batch = writeBatch(db);

    custSnap.docs.forEach(d => batch.delete(d.ref));
    trialSnap.docs.forEach(d => batch.delete(d.ref));
    subSnap.docs.forEach(d => batch.delete(d.ref));
    logSnap.docs.forEach(d => batch.delete(d.ref));

    if (includePlaylists) {
      const plSnap = await getDocs(collection(db, COLLECTIONS.PLAYLISTS));
      plSnap.docs.forEach(d => batch.delete(d.ref));
    }

    await batch.commit();
    console.log('All customer data successfully wiped from Firestore.');
  } catch (err) {
    console.error('Error clearing customer data from Firestore:', err);
  }
}

export async function deleteAllPlaylists() {
  try {
    const plSnap = await getDocs(collection(db, COLLECTIONS.PLAYLISTS));
    const batch = writeBatch(db);
    plSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log('All playlists wiped from Firestore.');
  } catch (err) {
    console.error('Error wiping playlists from Firestore:', err);
  }
}
