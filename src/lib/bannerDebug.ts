export function probeMarketplaceBanner(root: HTMLElement | null) {
  if (!root) return () => {};
  if (typeof window === 'undefined') return () => {};
  const dbgRaw = (window as any).__ISKOMARKET_DEBUG__ || (window as any).ISKOMARKET_DEBUG;
  // Only run when explicitly enabled. Accept either `true` or an object with `{ probe: true }` so the
  // global debug object used elsewhere doesn't automatically enable probes by default.
  const dbg = dbgRaw === true || (dbgRaw && typeof dbgRaw === 'object' && !!dbgRaw.probe);
  if (!dbg) return () => {};
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return () => {};

  const timeouts: number[] = [];
  try {
    const cs = getComputedStyle(root);
    console.log('DEBUG: Marketplace banner computed styles', {
      backgroundImage: cs.backgroundImage,
      backgroundColor: cs.backgroundColor,
      color: cs.color,
      backgroundPosition: cs.backgroundPosition,
      backgroundRepeat: cs.backgroundRepeat,
    });
    const before = getComputedStyle(root, '::before');
    const after = getComputedStyle(root, '::after');
    console.log('DEBUG: ::before', { content: before.content, background: before.backgroundImage, display: before.display });
    console.log('DEBUG: ::after', { content: after.content, background: after.backgroundImage, display: after.display });

    let el: HTMLElement | null = root.parentElement as HTMLElement | null;
    while (el) {
      const s = getComputedStyle(el);
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') {
        console.log('DEBUG: parent with background', el, { backgroundColor: s.backgroundColor, backgroundImage: s.backgroundImage });
      }
      el = el.parentElement as HTMLElement | null;
    }

    // mark banner for quick visual inspection (removed after timeout)
    root.setAttribute('data-debug-banner-highlight', '1');

    // Probe topmost elements at several points over the banner to detect overlays
    try {
      const rect = root.getBoundingClientRect();
      const points = [
        { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) },
        { x: Math.round(rect.left + 20), y: Math.round(rect.top + 20) },
        { x: Math.round(rect.right - 20), y: Math.round(rect.top + 20) },
        { x: Math.round(rect.left + 20), y: Math.round(rect.bottom - 20) }
      ];

      points.forEach((p, i) => {
        const elems = (document.elementsFromPoint as any)(p.x, p.y) as Element[];
        console.log('DEBUG: elementsFromPoint', i, p, elems.map((e) => `${e.tagName}${e.id ? '#'+e.id : ''}${e.className ? '.'+String(e.className).replace(/\s+/g,'.') : ''}`));
        if (elems && elems.length) {
          const top = elems[0] as HTMLElement;
          if (top && top !== root) {
            console.log('DEBUG: topmost element covering banner at point', i, top, getComputedStyle(top).backgroundColor, getComputedStyle(top).backgroundImage);
            // mark the element for inspection but remove attribute later to avoid persistent mutation
            top.setAttribute('data-debug-topmost', '1');
            timeouts.push(window.setTimeout(() => { try { top.removeAttribute('data-debug-topmost'); } catch (e) {} }, 10000));
          }
        }
      });
    } catch (e) { console.warn('DEBUG: elementsFromPoint probe failed', e); }

    // remove the banner highlight after 10s and log that it was removed
    timeouts.push(window.setTimeout(() => {
      try { root.removeAttribute('data-debug-banner-highlight'); } catch (e) {}
      console.log('DEBUG: banner highlight removed');
    }, 10000));
  } catch (err) {
    console.warn('DEBUG: probeMarketplaceBanner failed', err);
  }

  return () => {
    // clear pending timeouts and remove any attributes we set
    timeouts.forEach((t) => clearTimeout(t));
    try { root.removeAttribute('data-debug-banner-highlight'); } catch (e) {}
    try {
      // remove any lingering data-debug-topmost attributes across document
      const marked = document.querySelectorAll('[data-debug-topmost]');
      marked.forEach((m) => { try { m.removeAttribute('data-debug-topmost'); } catch (e) {} });
    } catch (e) {}
  };
}
