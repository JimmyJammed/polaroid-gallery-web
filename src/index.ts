import type { Gallery, GalleryOptions, GalleryPhase, PhotoItem } from './types.ts';
import { gridMetrics, layoutItems, selectItems, validate, type Pose } from './model.ts';
import { createImageLoader } from './images.ts';
export type { Gallery, GalleryOptions, GalleryPhase, PhotoItem, SelectionEvent } from './types.ts';
type Motion = typeof import('./motion.ts');
type Scroll = ReturnType<typeof import('./scroll.ts')['attachScrollDeal']>;
type Connection = EventTarget & { saveData?: boolean };
type Card = { item: PhotoItem; home: HTMLElement; card: HTMLElement; img: HTMLImageElement; pose?: Pose };
const instances = new WeakMap<HTMLElement, Gallery>();
let nextId = 0;
// Multiple galleries may open dialogs without releasing one another's scroll lock.
const locks = new Set<object>();
let savedOverflow = '', savedPadding = '';
function lock(token: object) {
  if (!locks.size) {
    savedOverflow = document.documentElement.style.overflow;
    savedPadding = document.documentElement.style.paddingRight;
    const gap = innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (gap) document.documentElement.style.paddingRight = `${gap}px`;
  }
  locks.add(token);
}
function unlock(token: object) {
  if (!locks.delete(token) || locks.size) return;
  document.documentElement.style.overflow = savedOverflow;
  document.documentElement.style.paddingRight = savedPadding;
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag); el.className = cls; if (text) el.textContent = text; return el;
}
function button(cls: string, text: string) { const el = element('button', cls, text); el.type = 'button'; return el; }

export function createPolaroidGallery(root: HTMLElement, initial: GalleryOptions): Gallery {
  validate(initial);
  if (instances.has(root)) throw new Error('This root already has a gallery; call update or destroy first');
  let options = { ...initial };
  let items: PhotoItem[] = [], cards = new Map<string, Card>(), order: string[] = [];
  let phase: GalleryPhase = 'idle', activeId: string | null = null, revealed = 0, roveId = '';
  let motion: Motion | undefined, scroll: Scroll | undefined;
  let timeline: ReturnType<Motion['gsap']['timeline']> | undefined;
  let dead = false, generation = 0, configuration = 0, forcedBrowse = false, near = false;
  let returnFocus: HTMLElement | null = null, original = false;
  let lastWidth = 0, lastHeight = 0, raf = 0;
  let renderedValue = -1, renderedFocus: Element | null = null, renderedActive: string | null = null, renderedNear = false;
  const abort = new AbortController(), token = {}, loader = createImageLoader();
  const mql = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  const reduced = () => options.motion === 'reduced' || mql.matches || connection?.saveData === true;
  const originalChildren = [...root.childNodes];
  const rootClass = root.getAttribute('class'), oldMotion = root.getAttribute('data-tpg-motion');
  const oldPreset = root.getAttribute('data-tpg-preset');
  const id = `tpg-${++nextId}`;
  const toolbar = element('div', 'tpg-toolbar');
  const browse = button('tpg-browse', options.browseLabel ?? 'Browse photos');
  const instructions = element('p', 'tpg-instructions', 'Choose a photo, or browse the collection. Use arrow keys to move between photographs.');
  instructions.id = `${id}-help`;
  const stage = element('div', 'tpg-stage');
  const pile = element('div', 'tpg-pile'); pile.setAttribute('role', 'group'); pile.setAttribute('aria-label', options.label ?? 'Photographs');
  pile.setAttribute('aria-describedby', instructions.id);
  const empty = element('p', 'tpg-empty', options.emptyLabel ?? 'No photographs yet.');
  const edge = element('div', 'tpg-edge'); edge.setAttribute('aria-hidden', 'true');
  const note = element('p', 'tpg-note', 'pick one up for a closer look'); note.setAttribute('aria-hidden', 'true');
  stage.append(pile, edge, note); toolbar.append(browse, instructions); root.replaceChildren(toolbar, stage, empty); root.classList.add('tpg');

  const dialog = element('dialog', 'tpg-dialog'); dialog.setAttribute('aria-label', 'Photo viewer');
  const scrim = element('div', 'tpg-scrim');
  const slot = element('div', 'tpg-slot');
  const controls = element('div', 'tpg-controls');
  const closeButton = button('tpg-control tpg-close', '×'); closeButton.setAttribute('aria-label', 'Close photo viewer');
  const prev = button('tpg-control tpg-prev', '←'); prev.setAttribute('aria-label', 'Previous photograph');
  const next = button('tpg-control tpg-next', '→'); next.setAttribute('aria-label', 'Next photograph');
  const fit = button('tpg-control tpg-fit', 'View original'); fit.setAttribute('aria-pressed', 'false');
  const status = element('p', 'tpg-status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true'); status.tabIndex = 0;
  controls.append(closeButton, prev, next, fit); dialog.append(scrim, slot, controls, status); document.body.append(dialog);

  function listen(target: EventTarget, event: string, fn: EventListener, opts: AddEventListenerOptions = {}) { target.addEventListener(event, fn, { ...opts, signal: abort.signal }); }
  function setPhase(value: GalleryPhase) { phase = value; root.dataset.tpgState = value; }
  function cancel() { generation++; timeline?.kill(); timeline = undefined; return generation; }
  function reset(card: Card) {
    motion?.gsap.killTweensOf(card.card);
    motion?.gsap.killTweensOf(card.card.firstElementChild);
    (card.card.firstElementChild as HTMLElement).style.removeProperty('transform');
    card.card.classList.remove('tpg-held', 'tpg-flight', 'tpg-original');
    card.card.style.removeProperty('transform');
    card.card.style.removeProperty('transform-origin');
    card.card.style.removeProperty('opacity');
    if (motion) motion.gsap.set(card.card, { clearProps: 'transform,translate,rotate,scale,width,height,position,top,left' });
    card.card.style.setProperty('--tpg-angle', `${card.pose?.rotation ?? 0}deg`);
    if (card.card instanceof HTMLButtonElement) { card.card.setAttribute('aria-label', `View photograph: ${card.item.alt}`); card.card.setAttribute('aria-haspopup', 'dialog'); }
    card.home.append(card.card);
    card.img.style.objectFit = '';
    // Keep the last decoded source; square framing is restored by the class.
    // A failed thumbnail must not replace a successfully loaded original.
  }
  function selected() { return items.filter(p => options.primaryInteractive !== false || p.id !== items[0]?.id); }
  function eventFor(id: string) { const list = selected(); return { id, index: list.findIndex(p => p.id === id), total: list.length }; }
  function announce() {
    const item = items.find(p => p.id === activeId);
    if (!item) return;
    const event = eventFor(item.id);
    status.textContent = `${item.caption || item.alt} — ${event.index + 1} of ${event.total}`;
    prev.hidden = next.hidden = event.total < 2;
    fit.hidden = !item.originalSrc; fit.textContent = original ? 'View framed' : 'View original'; fit.setAttribute('aria-pressed', String(original));
  }
  function refreshRoving() {
    const available = order.filter(id => cards.get(id)?.card instanceof HTMLButtonElement && cards.get(id)?.home.dataset.in === 'true');
    if (!available.includes(roveId)) roveId = available[0] ?? '';
    cards.forEach((record, id) => { if (record.card instanceof HTMLButtonElement) { const next = id === roveId ? 0 : -1; if (record.card.tabIndex !== next) record.card.tabIndex = next; } });
  }
  function render(n: number) {
    if (dead) return;
    const value = forcedBrowse || reduced() ? items.length : Math.max(items.length ? 1 : 0, Math.min(items.length, n));
    const focused = document.activeElement;
    // ScrollTrigger often produces the same rounded reveal count for many frames.
    // Skip the card walk and DOM writes unless visibility, focus or loading changed.
    if (value === renderedValue && focused === renderedFocus && activeId === renderedActive && near === renderedNear) return;
    renderedValue = value; renderedFocus = focused; renderedActive = activeId; renderedNear = near;
    order.forEach((id, i) => {
      const r = cards.get(id)!; const show = i < value || r.card === focused || id === activeId;
      if (r.home.dataset.in !== String(show)) {
        r.home.dataset.in = String(show);
        r.home.inert = !show;
        r.home.setAttribute('aria-hidden', String(!show));
      }
      if (near && (i < value + 6 || id === activeId)) loader.load(r.img, r.item.src, r.card);
    });
    revealed = value;
    stage.style.setProperty('--tpg-fill', String(items.length > 1 ? (value - 1) / (items.length - 1) : 0));
    note.hidden = options.presentation !== 'scroll-deal' || value < 3 || value > items.length * .65 || reduced();
    refreshRoving();
  }
  function layout() {
    renderedValue = -1; // Geometry/options changes must invalidate the render cache.
    const width = stage.clientWidth;
    stage.classList.toggle('tpg-stage-grid', options.presentation === 'grid');
    stage.style.height = options.presentation === 'grid' ? `${gridMetrics(items.length, width).height}px` : '';
    const height = stage.clientHeight;
    if (!width || !height) return;
    lastWidth = width; lastHeight = height;
    const poses = layoutItems(items, width, height, options);
    cards.forEach((r, id) => {
      r.pose = poses.get(id)!;
      r.home.style.left = `${r.pose.x}px`; r.home.style.top = `${r.pose.y}px`;
      r.home.style.width = `${r.pose.width}px`;
      r.card.style.setProperty('--tpg-angle', `${r.pose.rotation}deg`);
      r.card.style.setProperty('--tpg-hover-x', `${r.pose.hoverX}px`);
      r.card.style.setProperty('--tpg-hover-y', `${r.pose.hoverY}px`);
    });
    // Keep browsing/deal identity stable even when geometry changes.
    if (!order.length) order = items.map(p => p.id).sort((a, b) => {
      if (options.presentation === 'grid') return items.findIndex(p => p.id === a) - items.findIndex(p => p.id === b);
      if (a === items[0]?.id) return -1; if (b === items[0]?.id) return 1;
      const pa = poses.get(a)!, pb = poses.get(b)!;
      return Math.hypot(pa.x - width / 2, pa.y - height / 2) - Math.hypot(pb.x - width / 2, pb.y - height / 2);
    });
    order.forEach((id, i) => { cards.get(id)!.home.style.zIndex = String(i + 1); });
    render(revealed);
  }
  async function configureMotion() {
    const version = ++configuration;
    scroll?.destroy(); scroll = undefined;
    root.dataset.tpgMotion = reduced() ? 'reduced' : 'enhanced';
    stage.classList.toggle('tpg-stage-scroll', options.presentation === 'scroll-deal' && !reduced() && items.length > 1);
    stage.style.setProperty('--tpg-header', `${options.headerOffset ?? 0}px`);
    layout();
    if (reduced()) {
      if (phase === 'closing') { cancel(); finishClose(); }
      if (activeId) { cancel(); const r = cards.get(activeId)!; motion?.gsap.set([r.card, r.card.firstElementChild], { clearProps: 'transform,translate,rotate,scale' }); r.card.classList.remove('tpg-flight'); scrim.style.opacity = '1'; controls.style.opacity = '1'; setPhase('open'); announce(); }
      render(items.length); return;
    }
    render(options.presentation === 'scroll-deal' ? 1 : items.length);
    try {
      const engine = await import('./motion.ts');
      if (dead || version !== configuration || reduced()) return;
      motion = engine;
      if (options.presentation === 'scroll-deal' && items.length > 1) {
        const { attachScrollDeal } = await import('./scroll.ts');
        if (dead || version !== configuration || reduced()) return;
        scroll = attachScrollDeal(stage, { count: items.length, headerOffset: options.headerOffset ?? 0, asymmetric: options.preset === 'portfolio', render, paused: () => phase !== 'idle' || forcedBrowse });
      }
    } catch { if (!dead && version === configuration) { root.dataset.tpgMotion = 'reduced'; render(items.length); } }
  }
  function makeCard(item: PhotoItem, primary: boolean): Card {
    const home = element('div', 'tpg-position');
    const interactive = !primary || options.primaryInteractive !== false;
    const card = interactive ? button('tpg-card', '') : element('figure', 'tpg-card');
    card.dataset.photoId = item.id;
    if (interactive) { card.setAttribute('aria-label', `View photograph: ${item.alt}`); card.setAttribute('aria-haspopup', 'dialog'); card.tabIndex = -1; }
    const inner = element('span', 'tpg-paper');
    const img = element('img', 'tpg-image'); img.alt = interactive ? '' : item.alt; img.decoding = 'async';
    const caption = element('span', 'tpg-caption', item.caption ?? ''); caption.setAttribute('aria-hidden', 'true');
    const error = element('span', 'tpg-image-error', 'Image unavailable'); error.setAttribute('aria-hidden', 'true');
    img.style.objectPosition = item.objectPosition ?? '50% 50%';
    inner.append(img, caption, error); card.append(inner); home.append(card); pile.append(home);
    return { item, home, card, img };
  }
  function rebuild(nextOptions: GalleryOptions) {
    validate(nextOptions);
    const newItems = selectItems(nextOptions, stage.clientWidth || 1000, stage.clientHeight || 650);
    const oldActive = activeId;
    const wasOpen = Boolean(activeId);
    cancel();
    if (activeId) { const held = cards.get(activeId); if (held) reset(held); }
    options = { ...nextOptions };
    const missing = options.primaryId && !options.items.some(p => p.id === options.primaryId);
    if (missing && (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'development')) console.warn('Tactile Photo Gallery: primaryId was not found; using the first image.');
    const previous = cards;
    items = newItems; cards = new Map(); order = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i], existing = previous.get(item.id);
      const interactive = i > 0 || options.primaryInteractive !== false;
      if (existing && (existing.card instanceof HTMLButtonElement) === interactive) {
        previous.delete(item.id); existing.item = item; cards.set(item.id, existing);
        existing.card.setAttribute('aria-label', interactive ? `View photograph: ${item.alt}` : item.alt);
        existing.img.alt = interactive ? '' : item.alt;
        existing.img.style.objectPosition = item.objectPosition ?? '50% 50%';
        existing.card.querySelector('.tpg-caption')!.textContent = item.caption ?? '';
        pile.append(existing.home);
      } else cards.set(item.id, makeCard(item, i === 0));
    }
    previous.forEach(r => r.home.remove());
    root.dataset.tpgPreset = options.preset ?? 'scrapbook'; dialog.dataset.tpgPreset = root.dataset.tpgPreset;
    for (const name of ['--tpg-paper', '--tpg-caption-font']) dialog.style.setProperty(name, getComputedStyle(root).getPropertyValue(name));
    dialog.dir = getComputedStyle(root).direction;
    pile.setAttribute('aria-label', options.label ?? 'Photographs');
    browse.textContent = options.browseLabel ?? 'Browse photos'; browse.setAttribute('aria-disabled', String(selected().length === 0));
    empty.textContent = options.emptyLabel ?? 'No photographs yet.'; empty.hidden = Boolean(items.length); stage.hidden = !items.length;
    activeId = null; original = false; layout();
    if (wasOpen && oldActive && selected().some(p => p.id === oldActive)) {
      activeId = oldActive; const record = cards.get(oldActive)!;
      slot.append(record.card); record.card.classList.add('tpg-held'); record.card.setAttribute('aria-label', `Close photograph: ${record.item.alt}`); record.card.removeAttribute('aria-haspopup'); record.card.style.removeProperty('transform');
      setPhase('open'); announce(); closeButton.focus({ preventScroll: true });
    } else if (wasOpen) finishClose(true);
    void configureMotion();
  }
  function upgrade(record: Card, src?: string, requested = false) {
    if (!src || connection?.saveData && !requested || record.img.getAttribute('src') === src) return;
    const seq = generation, hi = new Image(); hi.src = src;
    void hi.decode().then(() => {
      if (!dead && generation === seq && activeId === record.item.id) { record.img.src = src; record.card.dataset.imageState = 'ready'; }
    }).catch(() => { /* Keep the decoded thumbnail. */ });
  }
  function finishClose(toBrowse = false) {
    if (activeId) { const record = cards.get(activeId); if (record) reset(record); }
    activeId = null; original = false; setPhase('idle');
    if (dialog.open) dialog.close(); unlock(token);
    scrim.style.removeProperty('opacity'); controls.style.removeProperty('opacity');
    render(revealed);
    const target = !toBrowse && returnFocus?.isConnected && !returnFocus.closest('[inert]') ? returnFocus : browse;
    target.focus({ preventScroll: true }); returnFocus = null;
    options.onClose?.();
  }
  function open(id?: string) {
    if (dead) return;
    const target = id ?? selected()[0]?.id;
    if (!target || !selected().some(p => p.id === target)) return;
    if (target === activeId && phase !== 'closing') return;
    const seq = cancel(), wasOpen = dialog.open;
    const r = cards.get(target)!;
    if (activeId && activeId !== target) reset(cards.get(activeId)!);
    if (!wasOpen) returnFocus = document.activeElement instanceof HTMLElement && root.contains(document.activeElement) ? document.activeElement : browse;
    near = true; forcedBrowse = true; render(items.length);
    const canAnimate = !!motion && !reduced() && r.card.getBoundingClientRect().width > 0;
    const state = canAnimate ? motion!.Flip.getState(r.card) : undefined;
    activeId = target; original = false; setPhase(wasOpen ? 'switching' : 'extracting');
    r.card.classList.add('tpg-flight'); slot.append(r.card); r.card.classList.add('tpg-held');
    r.card.setAttribute('aria-label', `Close photograph: ${r.item.alt}`); r.card.removeAttribute('aria-haspopup');
    r.card.style.removeProperty('transform'); r.card.style.removeProperty('transform-origin');
    if (!wasOpen) { lock(token); dialog.showModal(); }
    closeButton.focus({ preventScroll: true }); announce();
    const completed = () => {
      if (dead || seq !== generation) return;
      motion?.gsap.set(r.card, { clearProps: 'transform,translate,rotate,scale' });
      motion?.gsap.set(r.card.firstElementChild, { clearProps: 'transform' });
      r.card.classList.remove('tpg-flight'); setPhase('open'); announce(); timeline = undefined;
    };
    if (state && canAnimate) {
      timeline = motion!.gsap.timeline({ onComplete: completed });
      const flight = motion!.Flip.from(state, { duration: wasOpen ? .42 : .38, scale: true, ease: 'power3.out', absolute: false,
        onStart: () => { if (seq === generation) setPhase(wasOpen ? 'switching' : 'opening'); } });
      timeline.add(flight, wasOpen ? 0 : .14);
      if (!wasOpen) {
        timeline.fromTo(r.card.firstElementChild, { x: 0, y: 0 }, { x: (r.pose?.hoverX ?? 0) * 3, y: (r.pose?.hoverY ?? 0) * 3, duration: .14, ease: 'power2.out' }, 0);
        timeline.to(r.card.firstElementChild, { x: 0, y: 0, duration: .38, ease: 'power3.out' }, .14);
      }
      timeline.fromTo(scrim, { opacity: wasOpen ? Number(getComputedStyle(scrim).opacity) : 0 }, { opacity: 1, duration: wasOpen ? .26 : .52, ease: 'sine.inOut' }, 0);
      timeline.fromTo(controls, { opacity: wasOpen ? 1 : .45 }, { opacity: 1, duration: .12 }, wasOpen ? 0 : .4);
    } else completed();
    upgrade(r, r.item.fullSrc);
    if (!wasOpen) options.onOpen?.(eventFor(target)); else options.onChange?.(eventFor(target));
  }
  function close() {
    if (dead || !activeId || phase === 'closing') return;
    const seq = cancel(), record = cards.get(activeId)!;
    setPhase('closing');
    if (!motion || reduced() || !record.home.isConnected || !record.home.getBoundingClientRect().width) { finishClose(); return; }
    // Measure a layout-only stand-in while the real card stays in the top layer.
    // Flip.fit accounts for rotation and transform origins at both endpoints.
    const target = element('div', 'tpg-card');
    target.style.setProperty('--tpg-angle', `${record.pose?.rotation ?? 0}deg`);
    target.style.visibility = 'hidden'; record.home.append(target);
    const destination = motion.Flip.fit(record.card, target, { scale: true, getVars: true });
    target.remove();
    if (!destination) { finishClose(); return; }
    record.card.classList.add('tpg-flight');
    timeline = motion.gsap.timeline({ onComplete: () => { if (!dead && seq === generation) { timeline = undefined; finishClose(); } } });
    timeline.to(record.card, { ...destination, duration: .36, ease: 'power2.inOut' }, 0);
    timeline.to(record.card.firstElementChild, { x: 0, y: 0, duration: .2 }, 0);
    timeline.to(scrim, { opacity: 0, duration: .36, ease: 'sine.inOut' }, 0);
    timeline.to(controls, { opacity: .45, duration: .2 }, 0);
  }
  function turn(direction: number) {
    if (!activeId) return;
    const list = selected(); if (list.length < 2) return;
    const index = list.findIndex(p => p.id === activeId);
    open(list[(index + direction + list.length) % list.length].id);
  }
  function reconcileSize() {
    raf = 0;
    if (dead || Math.abs(stage.clientWidth - lastWidth) < 2 && Math.abs(stage.clientHeight - lastHeight) < 2) return;
    if (phase === 'closing') { cancel(); finishClose(); }
    else if (activeId) { cancel(); const r = cards.get(activeId)!; motion?.gsap.set([r.card, r.card.firstElementChild], { clearProps: 'transform,translate,rotate,scale' }); r.card.classList.remove('tpg-flight'); scrim.style.opacity = '1'; controls.style.opacity = '1'; setPhase('open'); }
    layout(); scroll?.refresh();
  }
  const resize = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(reconcileSize); }); resize.observe(stage);
  const intersection = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { near = true; render(revealed); }
  }, { rootMargin: '300px' }); intersection.observe(root);
  listen(browse, 'click', () => { forcedBrowse = true; render(items.length); open(); });
  listen(pile, 'click', e => { const card = (e.target as Element).closest<HTMLButtonElement>('button[data-photo-id]'); if (card) open(card.dataset.photoId); });
  listen(closeButton, 'click', close); listen(prev, 'click', () => turn(-1)); listen(next, 'click', () => turn(1));
  listen(dialog, 'cancel', e => { e.preventDefault(); close(); });
  listen(dialog, 'click', e => { if (e.target === slot || e.target === scrim || e.target === dialog || (e.target as Element).closest('.tpg-held')) close(); });
  listen(dialog, 'keydown', raw => {
    const e = raw as KeyboardEvent;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); turn((e.key === 'ArrowRight' ? 1 : -1) * (dialog.dir === 'rtl' ? -1 : 1)); }
    if (e.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([hidden]):not([disabled]), .tpg-status')].filter(el => el.tabIndex >= 0 && !el.closest('[hidden]'));
      // WebKit's platform keyboard preference can skip buttons entirely. Own
      // the dialog's cycle so all controls remain reachable on every platform.
      e.preventDefault();
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      focusable[(index + (e.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
    }
  });
  listen(pile, 'keydown', raw => {
    const e = raw as KeyboardEvent, list = selected();
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || !list.length) return;
    e.preventDefault(); forcedBrowse = true; render(items.length);
    const index = Math.max(0, list.findIndex(p => p.id === roveId));
    const delta = (e.key === 'ArrowRight' ? 1 : -1) * (getComputedStyle(root).direction === 'rtl' ? -1 : 1);
    roveId = list[e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : (index + delta + list.length) % list.length].id;
    refreshRoving(); cards.get(roveId)!.card.focus({ preventScroll: true });
  });
  listen(fit, 'click', () => {
    if (!activeId) return;
    const r = cards.get(activeId)!; if (!r.item.originalSrc) return;
    cancel(); setPhase('open'); original = !original; r.card.classList.toggle('tpg-original', original);
    motion?.gsap.set(r.card, { clearProps: 'transform,translate,rotate,scale' });
    upgrade(r, original ? r.item.originalSrc : r.item.fullSrc ?? r.item.src, true); announce();
  });
  let touch: { x: number; y: number } | undefined;
  listen(dialog, 'touchstart', raw => { const e = raw as TouchEvent; if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  listen(dialog, 'touchend', raw => {
    const e = raw as TouchEvent; if (!touch || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y; touch = undefined;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) turn((dx < 0 ? 1 : -1) * (dialog.dir === 'rtl' ? -1 : 1));
  }, { passive: true });
  listen(dialog, 'touchcancel', () => { touch = undefined; });
  const preference = () => { if (!dead) void configureMotion(); };
  listen(mql, 'change', preference); if (connection) listen(connection, 'change', preference);
  const api: Gallery = {
    update(patch) { if (dead) return; rebuild({ ...options, ...patch }); }, open, close,
    getState: () => ({ phase, activeId, selectedIds: items.map(p => p.id), revealedCount: revealed, motion: reduced() ? 'reduced' : 'enhanced' }),
    destroy() {
      if (dead) return; dead = true; cancel(); configuration++; scroll?.destroy(); abort.abort();
      resize.disconnect(); intersection.disconnect(); cancelAnimationFrame(raf); loader.destroy();
      if (dialog.open) dialog.close(); dialog.remove(); unlock(token);
      root.replaceChildren(...originalChildren);
      if (rootClass === null) root.removeAttribute('class'); else root.setAttribute('class', rootClass);
      if (oldMotion === null) root.removeAttribute('data-tpg-motion'); else root.setAttribute('data-tpg-motion', oldMotion);
      if (oldPreset === null) root.removeAttribute('data-tpg-preset'); else root.setAttribute('data-tpg-preset', oldPreset);
      delete root.dataset.tpgState; instances.delete(root);
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }
  };
  instances.set(root, api); rebuild(options); return api;
}
