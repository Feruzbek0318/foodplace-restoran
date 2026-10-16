import { describe, expect, it } from 'vitest';
import {
  diffCollection,
  formatRestaurantKey,
  generateRestaurantKey,
  normalizeRestaurantKey,
  snapshotOf,
  sortForKey,
} from './syncDiff';

describe('diffCollection', () => {
  const a = { id: 'a', qty: 1 };
  const b = { id: 'b', qty: 2 };

  it('sends everything on the first sync', () => {
    expect(diffCollection(new Map(), [a, b])).toEqual({ upserts: [a, b], deletes: [] });
  });

  it('sends nothing when nothing changed', () => {
    expect(diffCollection(snapshotOf([a, b]), [a, b])).toEqual({ upserts: [], deletes: [] });
  });

  it('sends only the changed record', () => {
    const changed = { id: 'b', qty: 3 };
    expect(diffCollection(snapshotOf([a, b]), [a, changed])).toEqual({ upserts: [changed], deletes: [] });
  });

  it('deletes records removed locally', () => {
    expect(diffCollection(snapshotOf([a, b]), [a])).toEqual({ upserts: [], deletes: ['b'] });
  });

  it('never deletes records this device has not seen', () => {
    // "c" was added on another device and is not in our snapshot yet
    expect(diffCollection(snapshotOf([a]), [a]).deletes).toEqual([]);
  });

  it('skips items without a usable id', () => {
    expect(diffCollection(new Map(), [{ qty: 1 }, { id: 'x/y' }, { id: '' }] as Array<{ id?: string }>)).toEqual({ upserts: [], deletes: [] });
  });
});

describe('sortForKey', () => {
  it('keeps orders newest first by order number', () => {
    const sorted = sortForKey('orders', [{ id: 'o1', orderNumber: 1 }, { id: 'o3', orderNumber: 3 }, { id: 'o2', orderNumber: 2 }]);
    expect(sorted.map(o => o.id)).toEqual(['o3', 'o2', 'o1']);
  });

  it('sorts tables by number', () => {
    expect(sortForKey('tables', [{ number: 3 }, { number: 1 }, { number: 2 }]).map(t => t.number)).toEqual([1, 2, 3]);
  });

  it('keeps branches in creation order and other lists newest first', () => {
    const items = [{ id: 'x-1700000000002' }, { id: 'x-1700000000001' }];
    expect(sortForKey('branches', items).map(i => i.id)).toEqual(['x-1700000000001', 'x-1700000000002']);
    expect(sortForKey('products', [...items].reverse()).map(i => i.id)).toEqual(['x-1700000000002', 'x-1700000000001']);
  });
});

describe('restaurant key', () => {
  it('is 32 characters from an unambiguous alphabet (no I, O, 0, 1)', () => {
    const key = generateRestaurantKey();
    expect(key).toMatch(/^[A-HJ-NP-Z2-9]{32}$/);
  });

  it('differs every time', () => {
    expect(generateRestaurantKey()).not.toBe(generateRestaurantKey());
  });

  it('is formatted in groups of four and accepted back with dashes, spaces or lowercase', () => {
    const key = generateRestaurantKey();
    const shown = formatRestaurantKey(key);
    expect(shown).toMatch(/^([A-Z2-9]{4}-){7}[A-Z2-9]{4}$/);
    expect(normalizeRestaurantKey(shown)).toBe(key);
    expect(normalizeRestaurantKey(` ${shown.toLowerCase().replace(/-/g, ' ')} `)).toBe(key);
  });

  it('rejects wrong length or characters', () => {
    expect(normalizeRestaurantKey('ABCD')).toBeNull();
    expect(normalizeRestaurantKey('O'.repeat(32))).toBeNull();
  });
});
