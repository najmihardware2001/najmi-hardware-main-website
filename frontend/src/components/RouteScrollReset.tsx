import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE = 'najmi-route-positions-v3';
type Position = { path: string; x: number; y: number; time: number };
function positions(): Record<string, Position> {
  try { return JSON.parse(sessionStorage.getItem(STORAGE) || '{}'); } catch { return {}; }
}

export default function RouteScrollReset() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const key = location.key, path = location.pathname + location.search;
    const saved = positions()[key];
    const target = navigationType === 'POP' && saved?.path === path ? saved : null;
    let restoring = !!target, frame = 0;
    const save = () => {
      if (restoring) return;
      const records = positions();
      records[key] = { path, x: window.scrollX, y: window.scrollY, time: Date.now() };
      const recent = Object.entries(records).sort((a,b) => b[1].time-a[1].time).slice(0,50);
      try { sessionStorage.setItem(STORAGE, JSON.stringify(Object.fromEntries(recent))); } catch { /* Storage may be unavailable. */ }
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(save); };
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => { restoring = false; clearInterval(timer); };
    if (target) {
      const started = Date.now();
      const restore = () => {
        const ready = location.pathname.startsWith('/shop')
          ? !!document.querySelector('[data-testid="shop-grid"]')
          : location.pathname.startsWith('/product/') ? !!document.querySelector('[data-testid="product-overview"]') : true;
        const maximum = Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
        if (ready && maximum >= target.y-2) {
          window.scrollTo({ top: target.y, left: target.x, behavior: 'instant' });
          stop();
        } else if (Date.now()-started > 10000) stop();
      };
      timer = setInterval(restore,100);
      restore();
    } else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const cancelRestore = () => { stop(); save(); };
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('pagehide',save);
    window.addEventListener('wheel',cancelRestore,{passive:true});
    window.addEventListener('touchstart',cancelRestore,{passive:true});
    return () => {
      cancelAnimationFrame(frame); save(); clearInterval(timer);
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('pagehide',save);
      window.removeEventListener('wheel',cancelRestore);
      window.removeEventListener('touchstart',cancelRestore);
    };
  }, [location.key,location.pathname,location.search,navigationType]);

  return null;
}
