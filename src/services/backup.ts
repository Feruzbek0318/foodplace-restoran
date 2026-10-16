import localforage from 'localforage';
// Applies the shared localforage config (database/store names) used for uploaded images
import '../utils/storage';
import { disconnectThisDevice } from './cloudSync';

// Full backup of everything the app keeps in this browser: the store (localStorage keys
// with our prefix) and uploaded images (IndexedDB via localforage).
const PREFIX = 'foodplace_v1_';
const FORMAT = 'foodplace-backup';
const VERSION = 1;
// Session keys are device-specific and must not travel with a backup
const SKIP_KEYS = new Set(['currentUser', 'activeBranchId']);

export interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
  images: Record<string, string>;
}

export async function createBackup(): Promise<BackupFile> {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const fullKey = localStorage.key(i);
    if (!fullKey?.startsWith(PREFIX)) continue;
    const key = fullKey.slice(PREFIX.length);
    if (SKIP_KEYS.has(key)) continue;
    try {
      data[key] = JSON.parse(localStorage.getItem(fullKey) || 'null');
    } catch {
      // skip unreadable entries
    }
  }
  const images: Record<string, string> = {};
  await localforage.iterate<string, void>((value, key) => {
    if (typeof value === 'string') images[key] = value;
  });
  return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), data, images };
}

export async function downloadBackup(restaurantName = 'FoodPlace') {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const safeName = restaurantName.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'FoodPlace';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-zaxira-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Validates a backup file; returns an Uzbek error message (translated by the caller) or null. */
export function validateBackup(parsed: unknown): string | null {
  const b = parsed as Partial<BackupFile> | null;
  if (!b || b.format !== FORMAT || typeof b.data !== 'object' || !b.data) return 'Bu fayl FoodPlace zaxira nusxasi emas';
  if ((b.version || 0) > VERSION) return 'Zaxira nusxa dasturning yangiroq versiyasida yaratilgan';
  const users = (b.data as Record<string, unknown>).users;
  if (!Array.isArray(users) || users.length === 0) return 'Zaxira nusxada birorta ham xodim akkaunti yo‘q';
  return null;
}

/** Replaces the app data stored in this browser (not images). The caller reloads afterwards. */
export function replaceLocalData(data: Record<string, unknown>) {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
  sessionStorage.removeItem(PREFIX + 'currentUser');
  for (const [key, value] of Object.entries(data)) {
    if (!SKIP_KEYS.has(key)) localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }
}

/** Replaces all local data with the backup. The caller reloads the page afterwards. */
export async function restoreBackup(backup: BackupFile) {
  // A restored backup is a separate copy: stop syncing so the cloud does not overwrite it
  disconnectThisDevice();
  replaceLocalData(backup.data);
  await localforage.clear();
  for (const [key, value] of Object.entries(backup.images || {})) {
    await localforage.setItem(key, value);
  }
}

export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Fayl o‘qilmadi: JSON formati noto‘g‘ri');
  }
  const error = validateBackup(parsed);
  if (error) throw new Error(error);
  return parsed as BackupFile;
}
