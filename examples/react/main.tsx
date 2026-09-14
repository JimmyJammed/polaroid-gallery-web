import { StrictMode, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { PolaroidGallery } from '../../src/react.tsx';
import '../../src/styles.css';
import '../../src/demo.css';
const photos = Array.from({ length: 6 }, (_, i) => ({ id: `scene-${i + 1}`, src: `/images/scene-${i + 1}.svg`, alt: `Landscape illustration ${i + 1}`, caption: `Memory ${i + 1}` }));
function App() {
  const [count, setCount] = useState(6), [mounted, setMounted] = useState(true);
  const ref = useRef<{ open(id?: string): void; close(): void }>(null);
  return <main><a href="/">← Configurator</a><h1>Made for React.</h1><label>Count<input type="number" min="0" max="6" value={count} onChange={e => setCount(Number(e.target.value))}/></label><button onClick={() => setMounted(!mounted)}>Toggle gallery</button><button onClick={() => ref.current?.open()}>Open first photo</button>{mounted && <PolaroidGallery ref={ref} items={photos} count={count} seed={10}/>}</main>;
}
createRoot(document.getElementById('app')!).render(<StrictMode><App/></StrictMode>);
