import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutItems, gridMetrics } from '../src/model.ts';
for (const width of [320, 568, 1280]) test(`grid stays aligned and bounded at ${width}px`, () => {
  const items = Array.from({length: 24}, (_, i) => ({id: String(i), src:'x', alt:'x'}));
  const metrics = gridMetrics(items.length, width);
  const poses = [...layoutItems(items, width, 600, {items, presentation:'grid'}).values()];
  poses.forEach((p,i) => {
    assert.equal(p.rotation,0);
    assert.ok(p.x-p.width/2 >= 0 && p.x+p.width/2 <= width+.01);
    assert.ok(p.y+p.width*.605 <= metrics.height+.01);
    if(i % metrics.columns) assert.equal(p.y, poses[i-1].y);
    if(i >= metrics.columns) assert.ok(p.y-poses[i-metrics.columns].y >= p.width*1.21);
  });
});
