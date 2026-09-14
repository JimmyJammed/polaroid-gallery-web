import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
let serial = 0;
export function attachScrollDeal(stage: HTMLElement, options: { count: number; headerOffset: number; asymmetric: boolean; render(n: number): void; paused(): boolean }): { destroy(): void; refresh(): void } {
  const timing = () => stage.clientWidth <= 640 ? { fill: .7, hold: .15 } : { fill: 1.15, hold: .5 };
  let last = -1, shown = 1, dead = false;
  const ideal = (p: number) => 1 + (options.count - 1) * p ** 2.7;
  const trigger = ScrollTrigger.create({
    id: `tactile-gallery-${++serial}`, trigger: stage, pin: true, pinSpacing: true, anticipatePin: 1,
    start: () => `top top+=${options.headerOffset}`,
    end: () => { const { fill, hold } = timing(); return `+=${stage.clientHeight * (fill + hold)}`; }, invalidateOnRefresh: true,
    onRefreshInit: () => { last = -1; },
    onUpdate(self) {
      if (options.paused()) return;
      const { fill, hold } = timing();
      const p = Math.min(1, self.progress * (fill + hold) / fill);
      if (last < 0 || !options.asymmetric) shown = ideal(p);
      else if (p >= last) { shown += ideal(p) - ideal(last); shown += Math.max(0, ideal(p) - shown) * Math.min(1, (p - last) * 6); }
      else shown += (options.count - 1) * (p - last) * 3.2;
      shown = Math.max(1, Math.min(options.count, shown)); last = p;
      options.render(Math.round(shown));
    },
    onLeave: () => { if (!options.paused()) options.render(options.count); },
    onLeaveBack: () => { if (!options.paused()) options.render(1); }
  });
  const refresh = () => { if (!dead) trigger.refresh(); };
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready.then(refresh);
  return { refresh, destroy() { dead = true; window.removeEventListener('load', refresh); trigger.kill(true); } };
}
