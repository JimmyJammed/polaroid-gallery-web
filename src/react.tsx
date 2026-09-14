import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPolaroidGallery } from './index.ts';
import { selectItems, validate } from './model.ts';
import type { Gallery, GalleryOptions } from './types.ts';
export type PolaroidGalleryProps = GalleryOptions & { className?: string };
export const PolaroidGallery = forwardRef<Pick<Gallery, 'open' | 'close'>, PolaroidGalleryProps>(function PolaroidGallery(props, ref) {
  validate(props);
  const fallback = selectItems(props);
  const root = useRef<HTMLDivElement>(null), instance = useRef<Gallery | null>(null);
  const latest = useRef(props); latest.current = props;
  const [enhanced, setEnhanced] = useState(false);
  useImperativeHandle(ref, () => ({ open: id => instance.current?.open(id), close: () => instance.current?.close() }), []);
  useEffect(() => {
    instance.current = createPolaroidGallery(root.current!, latest.current); setEnhanced(true);
    return () => { instance.current?.destroy(); instance.current = null; };
  }, []);
  useEffect(() => { instance.current?.update(props); }, [props]);
  return createElement('div', { className: props.className },
    createElement('div', { ref: root }),
    createElement('div', { hidden: enhanced, 'aria-label': props.label ?? 'Photographs' },
      fallback.map(item => createElement('a', { href: item.originalSrc ?? item.fullSrc ?? item.src, key: item.id },
        createElement('img', { src: item.src, alt: item.alt, width: 160, loading: 'lazy' }), item.caption))));
});
