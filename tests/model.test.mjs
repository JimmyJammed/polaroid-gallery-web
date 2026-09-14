import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectItems, layoutItems, validate } from '../src/model.ts';
const items = Array.from({ length: 250 }, (_, i) => ({ id: `p${i}`, src: `/p${i}.jpg`, alt: `Photo ${i}` }));
test('exact count, empty, primary, and clamping', () => {
  for (const count of [0, 1, 2, 5, 12, 50, 100, 250, 300]) {
    const chosen = selectItems({ items, count, primaryId: 'p200' });
    assert.equal(chosen.length, Math.min(count, 250));
    assert.equal(new Set(chosen.map(p => p.id)).size, chosen.length);
    if (count) assert.equal(chosen[0].id, 'p200');
  }
});
test('auto caps phones and desktop; missing primary falls back', () => {
  assert.ok(selectItems({ items, count: 'auto' }, 390, 844).length <= 30);
  assert.ok(selectItems({ items, count: 'auto' }, 2000, 1400).length <= 100);
  assert.equal(selectItems({ items, primaryId: 'missing' })[0].id, 'p0');
});
test('sampling reproducible and input unchanged', () => {
  const opts = { items, count: 12, selection: 'sample', seed: 12 };
  assert.deepEqual(selectItems(opts), selectItems(opts));
  assert.notDeepEqual(selectItems(opts), selectItems({ ...opts, seed: 13 }));
  assert.equal(items[1].id, 'p1');
});
test('invalid updates rejected before mutation', () => {
  for (const count of [-1, 1.2, NaN, Infinity]) assert.throws(() => validate({ items, count }));
  assert.throws(() => validate({ items: [items[0], items[0]] }));
  assert.throws(() => validate({ items, primaryScale: 0 }));
  assert.throws(() => validate({ items, primaryPosition: { x: 2, y: 0 } }));
});
test('stable layout has finite geometry and bounded hover for stress counts', () => {
  for (const n of [0, 1, 2, 5, 12, 50, 100, 250]) {
    const selected = items.slice(0, n), poses = layoutItems(selected, 320, 568, { items: selected });
    assert.deepEqual(poses, layoutItems(selected, 320, 568, { items: selected }));
    for (const p of poses.values()) { assert.ok(Object.values(p).every(Number.isFinite)); assert.ok(Math.hypot(p.hoverX, p.hoverY) <= 10.001); }
  }
});
