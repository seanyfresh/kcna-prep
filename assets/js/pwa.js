/* PWA glue: service-worker registration, update + offline UI, install prompt. */
window.PWA = (function () {
  let deferredPrompt = null;
  const listeners = [];

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }
  function canInstall() { return !!deferredPrompt; }
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach((f) => { try { f(); } catch (e) {} }); }

  function promptInstall() {
    if (!deferredPrompt) return Promise.resolve(false);
    const p = deferredPrompt;
    deferredPrompt = null;
    p.prompt();
    return p.userChoice.then((c) => { emit(); return c && c.outcome === 'accepted'; });
  }

  /* ---- tiny toast/banner ---- */
  function toast(html, actionText, onAction) {
    document.querySelectorAll('.pwa-toast').forEach((n) => n.remove());
    let bar = document.createElement('div');
    bar.id = 'pwa-toast';
    bar.className = 'pwa-toast';
    bar.setAttribute('role', 'status');
    bar.innerHTML = '<span>' + html + '</span>';
    if (actionText) {
      const btn = document.createElement('button');
      btn.className = 'btn sm primary';
      btn.textContent = actionText;
      btn.addEventListener('click', () => { onAction && onAction(); bar.remove(); });
      bar.appendChild(btn);
    }
    const close = document.createElement('button');
    close.className = 'pwa-toast-x';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '✕';
    close.addEventListener('click', () => bar.remove());
    bar.appendChild(close);
    document.body.appendChild(bar);
    return bar;
  }

  /* ---- offline indicator ---- */
  function setOffline(off) {
    document.documentElement.classList.toggle('is-offline', off);
    const el = document.getElementById('offline-pill');
    if (el) el.hidden = !off;
  }

  function init() {
    window.addEventListener('online', () => setOffline(false));
    window.addEventListener('offline', () => setOffline(true));
    setOffline(!navigator.onLine);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      emit();
    });
    window.addEventListener('appinstalled', () => { deferredPrompt = null; emit(); });

    if (!('serviceWorker' in navigator)) return;
    // Service workers need a secure context (https or localhost); skip file://.
    if (location.protocol === 'file:') return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              toast('A new version of KCNA Prep is ready.', 'Reload', () => {
                sw.postMessage('skipWaiting');
              });
            }
          });
        });
      }).catch(() => { /* offline-first is best-effort */ });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }

  init();
  return { init, isStandalone, canInstall, promptInstall, onChange };
})();
