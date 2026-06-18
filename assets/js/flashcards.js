/* Spaced-repetition flashcard engine (SM-2 lite). State stored per card id. */
window.Flashcards = (function () {
  const KEY = 'srs';
  const ONE_DAY = 86400000;
  const MASTERED_DAYS = 21;

  function load() { return Store.get(KEY, {}); }
  function save(s) { Store.set(KEY, s); }
  function now() { return Date.now(); }

  function cardState(s, id) {
    if (!s[id]) s[id] = { ease: 2.5, interval: 0, due: 0, reps: 0, lapses: 0 };
    return s[id];
  }

  // grade: 0 again, 1 hard, 2 good, 3 easy
  function review(id, grade) {
    const s = load();
    const c = cardState(s, id);
    if (grade === 0) {
      c.reps = 0; c.interval = 0; c.lapses += 1;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.due = now() + 60 * 1000; // ~1 min, comes back this session
    } else {
      c.reps += 1;
      if (grade === 1) { c.ease = Math.max(1.3, c.ease - 0.15); }
      else if (grade === 3) { c.ease = c.ease + 0.1; }
      if (c.reps === 1) c.interval = grade === 1 ? 1 : (grade === 3 ? 4 : 2);
      else if (c.reps === 2) c.interval = grade === 1 ? 3 : 6;
      else c.interval = Math.round(c.interval * c.ease * (grade === 1 ? 0.7 : (grade === 3 ? 1.3 : 1)));
      c.interval = Math.max(1, c.interval);
      c.due = now() + c.interval * ONE_DAY;
    }
    save(s);
    if (window.Progress) {
      if (Progress.recordStudyDay) Progress.recordStudyDay();
      if (Progress.recordCard) Progress.recordCard(grade >= 2); // good/easy = knew it
    }
    return c;
  }

  // A card is "new" only if it has never been studied (no reps and no lapses).
  // A lapsed mature card has reps reset to 0 but lapses>0 — it is NOT new.
  function isNew(st) { return !st || (st.reps === 0 && (st.lapses || 0) === 0); }

  // returns a study queue for a domain (or all): due cards first, then new
  function queue(domainId, limit) {
    const s = load();
    let cards = KCNA.allFlashcards();
    if (domainId) cards = cards.filter((c) => c.domainId === domainId);
    const t = now();
    const due = [];
    const fresh = [];
    cards.forEach((c) => {
      const st = s[c.id];
      if (isNew(st)) { if (!st || st.due <= t) fresh.push(c); else due.push(c); }
      else if (st.due <= t) due.push(c);
    });
    // shuffle within groups (stable-ish)
    shuffle(due); shuffle(fresh);
    const q = due.concat(fresh);
    return limit ? q.slice(0, limit) : q;
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function stats(domainId) {
    const s = load();
    let cards = KCNA.allFlashcards();
    if (domainId) cards = cards.filter((c) => c.domainId === domainId);
    const t = now();
    let mastered = 0, learning = 0, fresh = 0, due = 0;
    cards.forEach((c) => {
      const st = s[c.id];
      if (isNew(st)) { fresh++; if (!st || st.due <= t) due++; }
      else { if (st.interval >= MASTERED_DAYS) mastered++; else learning++; if (st.due <= t) due++; }
    });
    return { total: cards.length, mastered, learning, fresh, due };
  }

  /* ---------- answer checking ---------- */
  const STOP = {};
  ('a an the of to and or in on is are it for with that this as by be your you they them their its also into not no than then so such which who what when where why how can will would each other use used using via on off at from up out we our').split(' ').forEach((w) => { STOP[w] = 1; });

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFKD')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      const tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }
  function simRatio(a, b) {
    const max = Math.max(a.length, b.length);
    return max ? 1 - levenshtein(a, b) / max : 1;
  }
  function tokens(s) { return norm(s).split(' ').filter((t) => t.length >= 3 && !STOP[t]); }

  // Lenient typed-answer grading: forgives spelling, capitalization, punctuation,
  // word order, and partial phrasing. Returns {match, coverage, sim}.
  function fuzzyIn(tok, arr) {
    if (arr.indexOf(tok) >= 0) return true;
    for (let i = 0; i < arr.length; i++) { if (simRatio(arr[i], tok) >= 0.8) return true; }
    return false;
  }
  function checkTyped(userAns, correct) {
    const u = norm(userAns), c = norm(correct);
    if (!u) return { match: false, partial: false, coverage: 0, precision: 0, sim: 0, empty: true };
    const sim = simRatio(u, c);
    const ct = tokens(correct);   // key terms in the correct answer
    const ut = tokens(userAns);   // key terms the user typed
    const recallMatched = ct.filter((t) => fuzzyIn(t, ut)).length;   // answer terms covered
    const precMatched = ut.filter((t) => fuzzyIn(t, ct)).length;     // user terms that are relevant
    const coverage = ct.length ? recallMatched / ct.length : (sim >= 0.85 ? 1 : 0);
    const precision = ut.length ? precMatched / ut.length : 0;
    const ratio = Math.min(u.length, c.length) / Math.max(u.length, c.length, 1);
    const contained = (c.indexOf(u) >= 0 || u.indexOf(c) >= 0) && u.length >= 4 && ratio >= 0.6;
    // pass if: near-identical text, most answer terms covered, one contains the other,
    // or the user's words are the right key terms (forgives gist of long answers)
    const match = sim >= 0.82 || coverage >= 0.6 || contained || (precMatched >= 2 && precision >= 0.7);
    const partial = !match && (coverage >= 0.34 || (precMatched >= 1 && precision >= 0.5));
    return { match, partial, coverage: Math.round(coverage * 100), precision: Math.round(precision * 100), sim: Math.round(sim * 100) };
  }

  // Build a multiple-choice set for a card: correct back + 3 distractor backs.
  function mcOptions(card) {
    const all = KCNA.allFlashcards();
    const seen = {}; seen[norm(card.back)] = 1;
    const distract = [];
    const take = (list) => {
      for (let i = 0; i < list.length && distract.length < 3; i++) {
        const n = norm(list[i].back);
        if (!seen[n] && n.length > 1) { seen[n] = 1; distract.push(list[i].back); }
      }
    };
    take(shuffle(all.filter((c) => c.domainId === card.domainId && c.id !== card.id)));
    if (distract.length < 3) take(shuffle(all.filter((c) => c.id !== card.id)));
    const options = shuffle(distract.concat([card.back]));
    return { options, correctIndex: options.indexOf(card.back) };
  }

  return { review, queue, stats, checkTyped, mcOptions };
})();
