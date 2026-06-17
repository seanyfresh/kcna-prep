/* Runs render-blocking in <head> to set the theme before first paint (no FOUC).
   Kept tiny and dependency-free; the full Settings module takes over later. */
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('kcna:settings') || '{}');
    var pref = s.theme || 'auto';
    var eff = pref === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : pref;
    document.documentElement.setAttribute('data-theme', eff);
    if ((s.reducedMotion || 'auto') === 'on') {
      document.documentElement.classList.add('reduce-motion');
    }
  } catch (e) { /* default dark theme applies */ }
})();
