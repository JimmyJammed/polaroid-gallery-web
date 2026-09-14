import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PolaroidGallery } from '../../src/react.tsx';
import '../../src/styles.css';
hydrateRoot(document.getElementById('hydration-root')!, createElement(PolaroidGallery, { items: [{ id: 'ssr', src: '/images/scene-1.svg', alt: 'Server-rendered coast' }] }));
