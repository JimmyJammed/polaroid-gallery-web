export type PhotoItem = {
  id: string; src: string; alt: string; fullSrc?: string; originalSrc?: string;
  caption?: string; width?: number; height?: number; objectPosition?: string;
};
export type GalleryPhase = 'idle' | 'extracting' | 'opening' | 'open' | 'switching' | 'closing';
export type SelectionEvent = { id: string; index: number; total: number };
export type GalleryOptions = {
  items: readonly PhotoItem[];
  count?: number | 'auto'; primaryId?: string; primaryInteractive?: boolean;
  primaryScale?: number; primaryRotation?: number;
  primaryPosition?: { x: number; y: number };
  seed?: number; selection?: 'ordered' | 'sample';
  presentation?: 'scatter' | 'scroll-deal' | 'grid'; preset?: 'portfolio' | 'scrapbook' | 'editorial';
  motion?: 'auto' | 'reduced'; autoMax?: number; mobileAutoMax?: number;
  headerOffset?: number; label?: string; browseLabel?: string; emptyLabel?: string;
  onOpen?: (event: SelectionEvent) => void; onChange?: (event: SelectionEvent) => void; onClose?: () => void;
};
export type Gallery = {
  update(options: Partial<GalleryOptions>): void;
  open(id?: string): void; close(): void; destroy(): void;
  getState(): { phase: GalleryPhase; activeId: string | null; selectedIds: string[]; revealedCount: number; motion: 'enhanced' | 'reduced' };
};
