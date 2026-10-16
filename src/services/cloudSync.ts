import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { ensureSignedIn, getFirebase, isCloudConfigured } from './firebase';
import { diffCollection, generateRestaurantKey, snapshotOf, sortForKey, type Snapshot } from './syncDiff';

// Firestore layout:
//   restaurants/{key}                    – restaurant meta (name, createdAt)
//   restaurants/{key}/{collectionKey}/{id} – one document per entity (orders, products, …)
//   restaurants/{key}/meta/settings      – restaurant settings
//   restaurants/{key}/images/{imageId}   – uploaded images (data URLs)
// The key is a 160-bit random secret: knowing it is what grants access (see firestore.rules).

export const COLLECTION_KEYS = [
  'users', 'branches', 'products', 'tables', 'orders', 'shifts',
  'expenses', 'customers', 'movements', 'auditLogs', 'notifications',
] as const;
const DOC_KEYS = ['settings'] as const;
export type SyncKey = (typeof COLLECTION_KEYS)[number] | (typeof DOC_KEYS)[number];

export const isSyncKey = (key: string): key is SyncKey =>
  (COLLECTION_KEYS as readonly string[]).includes(key) || (DOC_KEYS as readonly string[]).includes(key);

const CLOUD_KEY_STORAGE = 'foodplace_cloud_key';
const DEVICE_ID_STORAGE = 'foodplace_device_id';
const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch

export type CloudStatus = 'off' | 'connecting' | 'online' | 'offline' | 'error';

type ApplyRemote = (key: SyncKey, value: unknown) => void;

let restaurantKey: string | null = localStorage.getItem(CLOUD_KEY_STORAGE);
let status: CloudStatus = 'off';
let lastError = '';
const snapshots = new Map<string, Snapshot>();
const unsubscribers: Unsubscribe[] = [];
const statusListeners = new Set<() => void>();

const setStatus = (next: CloudStatus, error = '') => {
  status = next;
  lastError = error;
  statusListeners.forEach(l => l());
};

export const getCloudState = () => ({ configured: isCloudConfigured(), key: restaurantKey, status, error: lastError });

export const onCloudStateChange = (listener: () => void) => {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
};

export const isCloudActive = () => Boolean(restaurantKey) && isCloudConfigured();

/** Short random id per device, used to keep ids unique when several devices create records. */
export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_STORAGE);
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(3)), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
    localStorage.setItem(DEVICE_ID_STORAGE, id);
  }
  return id;
}

const restaurantRef = (key: string) => doc(getFirebase().db, 'restaurants', key);
const collectionRef = (key: string, name: string) => collection(getFirebase().db, 'restaurants', key, name);

// ---------- Writing ----------

async function commitInBatches(ops: Array<(batch: ReturnType<typeof writeBatch>) => void>) {
  const { db } = getFirebase();
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_LIMIT).forEach(op => op(batch));
    await batch.commit();
  }
}

/**
 * Sends a local change to the cloud. Called synchronously from the store on every save;
 * Firestore applies it to its local cache immediately (so it shows up in our own
 * snapshot listeners) and delivers it to the server — or queues it while offline.
 */
export function pushChange(key: string, value: unknown) {
  if (!isCloudActive() || !isSyncKey(key) || !restaurantKey) return;
  const rKey = restaurantKey;
  try {
    if ((DOC_KEYS as readonly string[]).includes(key)) {
      setDoc(doc(getFirebase().db, 'restaurants', rKey, 'meta', key), { value }).catch(reportWriteError);
      return;
    }
    const items = Array.isArray(value) ? value : [];
    const previous = snapshots.get(key) ?? new Map();
    const { upserts, deletes } = diffCollection(previous, items);
    if (!upserts.length && !deletes.length) return;
    const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [
      ...upserts.map(item => (b: ReturnType<typeof writeBatch>) => b.set(doc(collectionRef(rKey, key), (item as { id: string }).id), item as object)),
      ...deletes.map(id => (b: ReturnType<typeof writeBatch>) => b.delete(doc(collectionRef(rKey, key), id))),
    ];
    // Remember what we sent so the next save only sends what changed after this one
    snapshots.set(key, snapshotOf(items));
    commitInBatches(ops).catch(reportWriteError);
  } catch (err) {
    reportWriteError(err);
  }
}

function reportWriteError(err: unknown) {
  console.error('Bulutga yozishda xato:', err);
  setStatus('error', err instanceof Error ? err.message : String(err));
}

/** Uploads an image so other devices can show it. */
export function pushImage(id: string, dataUrl: string) {
  if (!isCloudActive() || !restaurantKey) return;
  setDoc(doc(collectionRef(restaurantKey, 'images'), id), { dataUrl }).catch(reportWriteError);
}

export async function fetchImage(id: string): Promise<string | null> {
  if (!isCloudActive() || !restaurantKey) return null;
  await ensureSignedIn();
  const snap = await getDoc(doc(collectionRef(restaurantKey, 'images'), id));
  return (snap.data()?.dataUrl as string) || null;
}

// ---------- Reading (real time) ----------

/** Subscribes to every collection; remote changes are handed to the store as whole lists. */
export async function startSync(applyRemote: ApplyRemote) {
  if (!isCloudActive() || !restaurantKey) return;
  stopListeners();
  setStatus('connecting');
  const rKey = restaurantKey;
  try {
    await ensureSignedIn();
    const meta = await getDoc(restaurantRef(rKey));
    if (!meta.exists() && !meta.metadata.fromCache) {
      setStatus('error', 'Restoran bulutda topilmadi');
      return;
    }
  } catch (err) {
    // Offline at startup: listeners below still serve the local cache and catch up later
    console.warn('Bulut tekshiruvi kechiktirildi:', err);
  }

  for (const key of COLLECTION_KEYS) {
    unsubscribers.push(
      onSnapshot(
        collectionRef(rKey, key),
        { includeMetadataChanges: true },
        snap => {
          const items = snap.docs.map(d => d.data() as Record<string, unknown>);
          // Our own pending writes are already in the store; only replace the list when it differs
          snapshots.set(key, snapshotOf(items));
          applyRemote(key, sortForKey(key, items));
          setStatus(snap.metadata.fromCache ? 'offline' : 'online');
        },
        err => setStatus('error', err.message),
      ),
    );
  }
  for (const key of DOC_KEYS) {
    unsubscribers.push(
      onSnapshot(
        doc(getFirebase().db, 'restaurants', rKey, 'meta', key),
        snap => {
          const value = snap.data()?.value;
          if (value) applyRemote(key, value);
        },
        err => setStatus('error', err.message),
      ),
    );
  }
}

function stopListeners() {
  unsubscribers.splice(0).forEach(u => u());
}

// ---------- Connecting ----------

/** Creates a new restaurant in the cloud from this device's data and returns its key. */
export async function createCloudRestaurant(data: Record<string, unknown>, name: string): Promise<string> {
  await ensureSignedIn();
  const key = generateRestaurantKey();
  await setDoc(restaurantRef(key), { name, createdAt: serverTimestamp(), createdBy: deviceId() });
  const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
  for (const k of COLLECTION_KEYS) {
    const items = Array.isArray(data[k]) ? (data[k] as Array<{ id?: string }>) : [];
    items.filter(i => i?.id).forEach(item => ops.push(b => b.set(doc(collectionRef(key, k), item.id!), item)));
  }
  for (const k of DOC_KEYS) {
    if (data[k]) ops.push(b => b.set(doc(getFirebase().db, 'restaurants', key, 'meta', k), { value: data[k] }));
  }
  await commitInBatches(ops);
  for (const [id, dataUrl] of Object.entries((data.__images as Record<string, string>) || {})) {
    await setDoc(doc(collectionRef(key, 'images'), id), { dataUrl });
  }
  restaurantKey = key;
  localStorage.setItem(CLOUD_KEY_STORAGE, key);
  return key;
}

/**
 * Downloads a restaurant by its key. Returns the data keyed like local storage, or throws
 * an Uzbek message (translated by the caller) when the key is wrong.
 */
export async function downloadCloudRestaurant(key: string): Promise<Record<string, unknown>> {
  await ensureSignedIn();
  let meta;
  try {
    meta = await getDoc(restaurantRef(key));
  } catch {
    throw new Error('Bulutga ulanib bo‘lmadi. Internetni tekshiring');
  }
  if (!meta.exists()) throw new Error('Bu kalit bilan restoran topilmadi');
  const data: Record<string, unknown> = {};
  for (const k of COLLECTION_KEYS) {
    const snap = await getDocs(collectionRef(key, k));
    data[k] = sortForKey(k, snap.docs.map(d => d.data() as Record<string, unknown>));
  }
  for (const k of DOC_KEYS) {
    const snap = await getDoc(doc(getFirebase().db, 'restaurants', key, 'meta', k));
    if (snap.exists()) data[k] = snap.data().value;
  }
  return data;
}

export function rememberRestaurantKey(key: string) {
  restaurantKey = key;
  localStorage.setItem(CLOUD_KEY_STORAGE, key);
}

/** Disconnects this device only; the restaurant stays in the cloud for other devices. */
export function disconnectThisDevice() {
  stopListeners();
  snapshots.clear();
  restaurantKey = null;
  localStorage.removeItem(CLOUD_KEY_STORAGE);
  setStatus('off');
}
