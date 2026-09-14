/** A bounded queue owns thumbnail requests and never overwrites a newer image. */
export function createImageLoader(concurrency = 4) {
  let dead = false, active = 0;
  const queue: Array<() => Promise<void>> = [];
  const cleanups = new Set<() => void>();
  const requested = new WeakMap<HTMLImageElement, string>();
  function pump() {
    while (!dead && active < concurrency && queue.length) {
      active++;
      void queue.shift()!().finally(() => { active--; pump(); });
    }
  }
  return {
    load(img: HTMLImageElement, src: string, state: HTMLElement) {
      if (requested.get(img) === src) return;
      requested.set(img, src); state.dataset.imageState = 'loading';
      queue.push(() => new Promise<void>(resolve => {
        if (dead || requested.get(img) !== src) { resolve(); return; }
        const done = (ok: boolean) => {
          cleanup();
          if (!dead && requested.get(img) === src) state.dataset.imageState = ok ? 'ready' : 'error';
          resolve();
        };
        const loaded = () => done(true), failed = () => done(false);
        const cleanup = () => { img.removeEventListener('load', loaded); img.removeEventListener('error', failed); cleanups.delete(cancel); };
        const cancel = () => { cleanup(); resolve(); };
        cleanups.add(cancel);
        img.addEventListener('load', loaded, { once: true }); img.addEventListener('error', failed, { once: true });
        img.src = src;
        if (img.complete) done(img.naturalWidth > 0);
      })); pump();
    },
    destroy() { dead = true; queue.length = 0; cleanups.forEach(fn => fn()); cleanups.clear(); }
  };
}
