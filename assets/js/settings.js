/* User settings: theme, motion, configurable exam date, and progress
   export/import/reset. Source of truth for preferences across the app. */
window.Settings = (function () {
  const KEY = 'settings';
  const DEFAULTS = { theme: 'auto', reducedMotion: 'auto', examDate: null, planStart: null };
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const listeners = [];

  function load() { return Object.assign({}, DEFAULTS, Store.get(KEY, {})); }
  function persist(s) { Store.set(KEY, s); }
  function get() { return load(); }
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach((f) => { try { f(); } catch (e) {} }); }

  function set(patch) {
    const s = Object.assign(load(), patch);
    persist(s);
    apply();
    emit();
    return s;
  }

  function effectiveTheme(s) {
    s = s || load();
    if (s.theme === 'light' || s.theme === 'dark') return s.theme;
    return mq.matches ? 'light' : 'dark';
  }

  function applyTheme() {
    const s = load();
    document.documentElement.setAttribute('data-theme', effectiveTheme(s));
    document.documentElement.classList.toggle('reduce-motion', s.reducedMotion === 'on');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effectiveTheme(s) === 'light' ? '#f4f6fb' : '#0d1117');
  }

  // Push configurable exam date / plan start into the content meta so the
  // countdown, plan, and readiness all honor it.
  function applyMeta() {
    const s = load();
    if (!window.KCNA || !KCNA.meta) return;
    if (s.examDate && /^\d{4}-\d{2}-\d{2}$/.test(s.examDate)) KCNA.meta.examDate = s.examDate;
    if (s.planStart && /^\d{4}-\d{2}-\d{2}$/.test(s.planStart)) KCNA.meta.planStart = s.planStart;
  }

  function examDate() { return (window.KCNA && KCNA.meta && KCNA.meta.examDate) || load().examDate; }
  function planStart() { return (window.KCNA && KCNA.meta && KCNA.meta.planStart) || load().planStart; }

  function apply() { applyTheme(); applyMeta(); }

  mq.addEventListener && mq.addEventListener('change', () => {
    if (load().theme === 'auto') { applyTheme(); emit(); }
  });

  /* ---------- progress export / import / reset ---------- */
  const PFX = 'kcna:';

  function snapshot() {
    const data = {};
    Object.keys(localStorage).forEach((k) => {
      if (k.indexOf(PFX) === 0) data[k.slice(PFX.length)] = localStorage.getItem(k);
    });
    return {
      app: 'kcna-prep',
      version: (window.KCNA && KCNA.meta && KCNA.meta.version) || '1.0.0',
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  function exportToFile() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'kcna-prep-progress-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Returns {ok:true, count} or {ok:false, error}. Validates shape + size.
  function importFromText(text) {
    if (!text || text.length > 2_000_000) return { ok: false, error: 'File is empty or too large.' };
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'Not valid JSON.' }; }
    if (!parsed || parsed.app !== 'kcna-prep' || typeof parsed.data !== 'object') {
      return { ok: false, error: 'This is not a KCNA Prep backup file.' };
    }
    let count = 0;
    Object.keys(parsed.data).forEach((k) => {
      const v = parsed.data[k];
      if (typeof k === 'string' && typeof v === 'string' && v.length <= 1_000_000) {
        try { JSON.parse(v); } catch (e) { return; } // each value must be JSON we wrote
        localStorage.setItem(PFX + k, v);
        count++;
      }
    });
    apply();
    emit();
    return { ok: true, count };
  }

  function resetProgress() {
    // Clear study progress but KEEP user settings (theme, exam date).
    const keep = Store.get(KEY, {});
    Store.reset();
    Store.set(KEY, keep);
    emit();
  }

  function resetAll() { Store.reset(); apply(); emit(); }

  return {
    get, set, onChange, apply, applyTheme, applyMeta, effectiveTheme,
    examDate, planStart, exportToFile, importFromText, resetProgress, resetAll,
  };
})();
