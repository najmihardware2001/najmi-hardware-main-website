import { useSyncExternalStore } from 'react';

const KEY = 'najmi-card-slideshow-paused';
const EVENT = 'najmi-card-slideshow-change';
function snapshot() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === null ? !matchMedia('(prefers-reduced-motion: reduce)').matches : saved !== 'true';
  } catch { return false; }
}
function subscribe(notify: () => void) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  window.addEventListener(EVENT, notify);
  window.addEventListener('storage', notify);
  media.addEventListener('change', notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener('storage', notify);
    media.removeEventListener('change', notify);
  };
}
export function useCardSlideshow() {
  const playing = useSyncExternalStore(subscribe, snapshot, () => false);
  const toggle = () => {
    try { localStorage.setItem(KEY, String(playing)); } catch { return; }
    window.dispatchEvent(new Event(EVENT));
  };
  return { playing, toggle };
}
