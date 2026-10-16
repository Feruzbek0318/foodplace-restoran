// Pure helpers for cloud sync: what changed in a list, and how to order lists coming back
// from the cloud. No Firebase imports, so they are unit-tested in syncDiff.test.ts.

export type Snapshot = Map<string, string>; // entity id → JSON of the last version known to be in the cloud

export interface CollectionDiff<T> {
  upserts: T[];
  deletes: string[];
}

const idOf = (item: unknown): string | null => {
  const id = (item as { id?: unknown })?.id;
  return typeof id === 'string' && id && !id.includes('/') ? id : null;
};

/**
 * Compares the local list with the last cloud snapshot.
 * Only entities the cloud already had can be deleted, so a device never removes
 * records it has not seen (e.g. ones added elsewhere while it was offline).
 */
export function diffCollection<T>(previous: Snapshot, next: T[]): CollectionDiff<T> {
  const upserts: T[] = [];
  const seen = new Set<string>();
  for (const item of next) {
    const id = idOf(item);
    if (!id) continue;
    seen.add(id);
    if (previous.get(id) !== JSON.stringify(item)) upserts.push(item);
  }
  const deletes = [...previous.keys()].filter(id => !seen.has(id));
  return { upserts, deletes };
}

export function snapshotOf<T>(items: T[]): Snapshot {
  const map: Snapshot = new Map();
  for (const item of items) {
    const id = idOf(item);
    if (id) map.set(id, JSON.stringify(item));
  }
  return map;
}

// Most ids carry their creation time ("ord-…", "prod-1792041243533", "aud-1792…-583")
const createdMs = (item: Record<string, unknown>): number => {
  const m = String(item.id ?? '').match(/\d{10,}/);
  return m ? Number(m[0]) : 0;
};

/** Lists are kept newest-first in the app, except tables (by number) and branches (in creation order). */
export function sortForKey<T extends Record<string, unknown>>(key: string, items: T[]): T[] {
  const list = [...items];
  if (key === 'tables') return list.sort((a, b) => Number(a.number || 0) - Number(b.number || 0));
  if (key === 'branches') return list.sort((a, b) => createdMs(a) - createdMs(b));
  if (key === 'orders') {
    return list.sort((a, b) => Number(b.orderNumber || 0) - Number(a.orderNumber || 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
  }
  return list.sort((a, b) => createdMs(b) - createdMs(a));
}

/** Restaurant keys are 32 base-32 characters (160 bits), shown in groups of four. */
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRestaurantKey(random: (n: number) => Uint8Array = n => crypto.getRandomValues(new Uint8Array(n))): string {
  return Array.from(random(32), b => KEY_ALPHABET[b % KEY_ALPHABET.length]).join('');
}

export const formatRestaurantKey = (key: string) => key.replace(/(.{4})(?=.)/g, '$1-');

/** Accepts the key with or without dashes/spaces and in any case; returns null if it is not a valid key. */
export function normalizeRestaurantKey(input: string): string | null {
  const key = input.toUpperCase().replace(/[\s-]/g, '');
  return key.length === 32 && [...key].every(ch => KEY_ALPHABET.includes(ch)) ? key : null;
}
