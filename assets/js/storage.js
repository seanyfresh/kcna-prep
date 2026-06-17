/* localStorage helpers + progress tracking shared across modules. */
window.Store = (function () {
  const PFX = 'kcna:';
  function get(k, def) {
    try { const v = localStorage.getItem(PFX + k); return v == null ? def : JSON.parse(v); }
    catch (e) { return def; }
  }
  function set(k, v) {
    try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {}
  }
  function reset() {
    Object.keys(localStorage).filter((k) => k.indexOf(PFX) === 0).forEach((k) => localStorage.removeItem(k));
  }
  return { get, set, reset };
})();

/* Per-domain performance stats that drive the readiness model. */
window.Progress = (function () {
  const KEY = 'domainStats';
  const RECENT = 30; // rolling window per domain

  function load() { return Store.get(KEY, {}); }
  function save(s) { Store.set(KEY, s); }

  function domainStat(s, id) {
    if (!s[id]) s[id] = { answered: 0, correct: 0, recent: [] };
    return s[id];
  }

  // record an array of {domainId, correct:boolean}
  function recordAnswers(answers) {
    const s = load();
    answers.forEach((a) => {
      const d = domainStat(s, a.domainId);
      d.answered += 1;
      if (a.correct) d.correct += 1;
      d.recent.push(a.correct ? 1 : 0);
      if (d.recent.length > RECENT) d.recent = d.recent.slice(-RECENT);
    });
    save(s);
  }

  function recordExam(entry) {
    const hist = Store.get('examHistory', []);
    hist.unshift(entry);
    Store.set('examHistory', hist.slice(0, 60));
  }

  function history() { return Store.get('examHistory', []); }
  function stats() { return load(); }

  /* ---------- study streak ---------- */
  const STREAK_KEY = 'streak';
  function dayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // Call whenever the user does any study action (answer, flashcard, plan task).
  function recordStudyDay() {
    const s = Store.get(STREAK_KEY, { last: null, current: 0, best: 0, days: 0 });
    const today = dayStr();
    if (s.last === today) return s;
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.current = (s.last === dayStr(y)) ? s.current + 1 : 1;
    s.best = Math.max(s.best || 0, s.current);
    s.days = (s.days || 0) + 1;
    s.last = today;
    Store.set(STREAK_KEY, s);
    return s;
  }
  function streak() {
    const s = Store.get(STREAK_KEY, { last: null, current: 0, best: 0, days: 0 });
    // A streak only "counts" if studied today or yesterday; else it's broken.
    if (s.last) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      if (s.last !== dayStr() && s.last !== dayStr(y)) s.current = 0;
    }
    return s;
  }

  return { recordAnswers, recordExam, history, stats, recordStudyDay, streak };
})();
