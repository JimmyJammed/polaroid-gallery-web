import type { GalleryOptions, PhotoItem } from './types.ts';

export function hash(value: string, seed = 42): number {
  let n = seed >>> 0;
  for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  n ^= n >>> 16; n = Math.imul(n, 2246822507); n ^= n >>> 13;
  return (n >>> 0) / 4294967296;
}
export function validate(options: GalleryOptions): void {
  if (!Array.isArray(options.items)) throw new TypeError('items must be an array');
  const ids = new Set<string>();
  for (const item of options.items) {
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new TypeError('Each photograph needs a unique, nonempty id');
    if (typeof item.src !== 'string' || !item.src || typeof item.alt !== 'string') throw new TypeError('Each photograph needs src and alt');
    ids.add(item.id);
  }
  if (options.count !== undefined && options.count !== 'auto' && (!Number.isInteger(options.count) || options.count < 0)) throw new RangeError('count must be a nonnegative integer or auto');
  for (const key of ['autoMax', 'mobileAutoMax'] as const) {
    if (options[key] !== undefined && (!Number.isInteger(options[key]) || options[key]! < 0)) throw new RangeError(`${key} must be a nonnegative integer`);
  }
  for (const key of ['seed', 'headerOffset', 'primaryRotation', 'primaryScale'] as const) {
    if (options[key] !== undefined && !Number.isFinite(options[key])) throw new RangeError(`${key} must be finite`);
  }
  if (options.headerOffset !== undefined && options.headerOffset < 0) throw new RangeError('headerOffset must be nonnegative');
  if (options.primaryScale !== undefined && options.primaryScale <= 0) throw new RangeError('primaryScale must be positive');
  if (options.primaryPosition && Object.values(options.primaryPosition).some(n => !Number.isFinite(n) || n < 0 || n > 1)) throw new RangeError('primaryPosition must contain fractions from 0 to 1');
}
export function autoCount(width: number, height: number, options: GalleryOptions): number {
  const target = Math.min(200, Math.max(120, Math.min(width, height) * .2));
  const max = width <= 640 ? options.mobileAutoMax ?? 30 : options.autoMax ?? 100;
  return Math.min(max, Math.max(1, Math.round(2.25 * width * height / (target * target))));
}
export function selectItems(options: GalleryOptions, width = 1000, height = 650): PhotoItem[] {
  const n = Math.min(options.items.length, options.count === undefined ? options.items.length : options.count === 'auto' ? autoCount(width, height, options) : options.count);
  if (!n) return [];
  const primary = options.items.find(p => p.id === options.primaryId) ?? options.items[0];
  const rest = options.items.filter(p => p.id !== primary.id);
  if (options.selection === 'sample') rest.sort((a, b) => hash(a.id, options.seed) - hash(b.id, options.seed));
  return [primary, ...rest.slice(0, n - 1)];
}
export type Pose = { x: number; y: number; rotation: number; width: number; hoverX: number; hoverY: number };
/** Responsive row-major grid with fixed gutters and no overlapping prints. */
export function gridMetrics(count: number, width: number) {
  const gap = width <= 640 ? 16 : 28;
  const padding = gap;
  const columns = Math.max(1, Math.floor((width - padding * 2 + gap) / ((width <= 640 ? 128 : 180) + gap)));
  const card = Math.max(1, (width - padding * 2 - gap * (columns - 1)) / columns);
  const rows = Math.ceil(count / columns);
  return { columns, card, gap, padding, height: Math.max(320, padding * 2 + rows * card * 1.21 + Math.max(0, rows - 1) * gap) };
}
export function layoutItems(items: readonly PhotoItem[], width: number, height: number, options: GalleryOptions): Map<string, Pose> {
  const result = new Map<string, Pose>();
  const count = items.length;
  if (!count) return result;
  if (options.presentation === 'grid') {
    const { columns, card, gap, padding } = gridMetrics(count, width);
    items.forEach((item, i) => result.set(item.id, {
      x: padding + card / 2 + (i % columns) * (card + gap),
      y: padding + card * .605 + Math.floor(i / columns) * (card * 1.21 + gap),
      width: card, rotation: 0, hoverX: 0, hoverY: -4,
    }));
    return result;
  }
  const cols = Math.max(1, Math.round(Math.sqrt(count * width / height)));
  const rows = Math.ceil(count / cols);
  const card = Math.min(count <= 5 ? 210 : 300, Math.max(94, Math.max(width / cols, height / rows * .83) * (count <= 5 ? .65 : 1.5)));
  items.forEach((item, i) => {
    // ID-based positions do not change when unrelated cards are inserted or removed.
    const a = hash(item.id, options.seed), b = hash(item.id + ':y', options.seed);
    let x = card * .28 + a * Math.max(0, width - card * .56);
    let y = card * .65 + b * Math.max(0, height - card * 1.3);
    if (count <= 5 && i) {
      const angle = ((i - 1) / Math.max(1, count - 1)) * Math.PI * 2 - Math.PI / 2;
      x = width / 2 + Math.cos(angle) * width * .29;
      y = height / 2 + Math.sin(angle) * height * .28;
    }
    if (i === 0) { x = width * (options.primaryPosition?.x ?? .5); y = height * (options.primaryPosition?.y ?? .5); }
    const dx = width / 2 - x, dy = height / 2 - y, len = Math.hypot(dx, dy) || 1;
    result.set(item.id, { x, y, rotation: i ? (hash(item.id + ':r', options.seed) * 2 - 1) * (options.preset === 'editorial' ? 5 : 13) : options.primaryRotation ?? -2.5,
      width: Math.min(width * .82, card * (i ? 1 : options.primaryScale ?? 1.5)), hoverX: dx / len * Math.min(10, card * .055), hoverY: dy / len * Math.min(10, card * .055) });
  });
  return result;
}
