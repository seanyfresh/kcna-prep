/* Quiz & exam engine: question selection, option shuffling, scoring. */
window.Exams = (function () {
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // prepare a question: shuffle options, track new correct index
  function prep(q) {
    const opts = q.options.map((text, i) => ({ text, correct: i === q.answerIndex }));
    const shuffled = shuffle(opts);
    return {
      id: q.id,
      domainId: q.domainId,
      domainName: q.domainName || (KCNA.domain(q.domainId) || {}).name,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      explanation: q.explanation,
      sourceUrl: q.sourceUrl,
      options: shuffled.map((o) => o.text),
      correctIndex: shuffled.findIndex((o) => o.correct),
    };
  }

  // Target difficulty mix by experience level (null = representative/random).
  function levelProps(level) {
    if (level === 'none') return { easy: 0.6, medium: 0.3, hard: 0.1 };
    if (level === 'heavy') return { easy: 0.1, medium: 0.35, hard: 0.55 };
    return null; // light: no bias
  }
  // Pick up to n questions from a pool. Unbiased → random. Biased → sample each
  // difficulty toward the level's target mix, backfilling shortfalls so every
  // difficulty can still appear and we always reach n when questions exist.
  function pickFromPool(pool, n, bias) {
    if (!bias) return shuffle(pool.slice()).slice(0, n);
    const lvl = (window.Settings && Settings.level) ? Settings.level() : 'light';
    const props = levelProps(lvl);
    if (!props) return shuffle(pool.slice()).slice(0, n);
    const buckets = { easy: [], medium: [], hard: [] };
    shuffle(pool.slice()).forEach((q) => { (buckets[q.difficulty] || buckets.medium).push(q); });
    const want = { easy: Math.round(n * props.easy), medium: Math.round(n * props.medium), hard: Math.round(n * props.hard) };
    const out = [];
    ['easy', 'medium', 'hard'].forEach((d) => { out.push.apply(out, buckets[d].splice(0, want[d])); });
    if (out.length < n) {
      const rest = shuffle([].concat(buckets.easy, buckets.medium, buckets.hard));
      out.push.apply(out, rest.slice(0, n - out.length));
    }
    return shuffle(out).slice(0, n);
  }

  // Mock selection prefers questions this device has never been served, so a second
  // sitting still measures knowledge rather than memory of the first. Once the holdout
  // is used up it falls back to repeats — build() reports how many, so the result can
  // say the score is no longer a clean read.
  function pickUnseenFirst(pool, n, seen) {
    const fresh = shuffle(pool.filter((q) => !seen[q.id]));
    const out = fresh.slice(0, n);
    if (out.length < n) {
      const repeats = shuffle(pool.filter((q) => seen[q.id]));
      out.push.apply(out, repeats.slice(0, n - out.length));
    }
    return out;
  }

  // weighted selection across domains to mirror exam blueprint
  function weightedPick(count, bias, mock) {
    const domains = KCNA.all();
    const totalW = KCNA.totalWeight() || 1;
    const picked = [];
    const usedIds = {};
    // allocate counts per domain by weight
    let allocated = 0;
    const alloc = domains.map((d) => {
      const n = Math.round(count * (d.weight / totalW));
      allocated += n; return { d, n };
    });
    // fix rounding to hit exact count
    let diff = count - allocated;
    let idx = 0;
    while (diff !== 0 && alloc.length) {
      alloc[idx % alloc.length].n += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1; idx++;
    }
    const seen = mock && window.Progress ? Progress.mockSeen() : {};
    alloc.forEach(({ d, n }) => {
      const source = mock ? KCNA.mockQuestions(d.id) : KCNA.practiceQuestions(d.id);
      const chosen = mock
        ? pickUnseenFirst(source, Math.max(0, n), seen)
        : pickFromPool(source, Math.max(0, n), bias);
      chosen.forEach((q) => {
        if (!usedIds[q.id]) { usedIds[q.id] = 1; picked.push(q); }
      });
    });
    // Top up from a global pool of unused questions if a domain was short, so the quiz
    // always reaches the requested count. Stays on the same side of the holdout split —
    // topping up from the whole bank would leak mock questions into practice.
    if (picked.length < count) {
      const extra = shuffle((mock ? KCNA.allMock() : KCNA.allPractice()).filter((q) => !usedIds[q.id]));
      for (let i = 0; i < extra.length && picked.length < count; i++) {
        usedIds[extra[i].id] = 1;
        picked.push(extra[i]);
      }
    }
    return shuffle(picked);
  }

  function domainPick(domainId, count, bias) {
    if (!KCNA.domain(domainId)) return [];
    return pickFromPool(KCNA.practiceQuestions(domainId), count, bias);
  }

  // build a session: {mode, title, questions:[prepped], minutes}
  function build(opts) {
    let raw = [];
    let title = '', minutes = 0, mode = opts.mode || 'practice';
    // Bias difficulty to the user's level ONLY for free practice — the diagnostic
    // and mock stay representative so readiness/scores remain honest.
    const bias = mode === 'practice';
    if (mode === 'mock') {
      raw = weightedPick(KCNA.meta.examQuestions, false, true);
      title = 'Full Mock Exam';
      minutes = KCNA.meta.examMinutes;
    } else if (mode === 'diagnostic') {
      raw = weightedPick(opts.count || 25, false, false);
      title = 'Diagnostic Assessment';
      minutes = 0;
    } else if (opts.domainId) {
      raw = domainPick(opts.domainId, opts.count || 15, bias);
      title = (KCNA.domain(opts.domainId) || {}).name + ' — Practice';
      minutes = 0;
    } else {
      raw = weightedPick(opts.count || 20, bias, false);
      title = 'Mixed Practice';
      minutes = 0;
    }
    // How much of a mock the user has already been shown — 0 means a clean read.
    const seen = mode === 'mock' && window.Progress ? Progress.mockSeen() : {};
    const reused = raw.filter((q) => seen[q.id]).length;
    return {
      mode, title, minutes, reused,
      questions: raw.map(prep),
      createdAt: Date.now(),
    };
  }

  // grade answers and persist. answers = array of selected index (or null) aligned to session.questions
  function grade(session, answers) {
    const perDomain = {};
    const detail = [];
    let correct = 0;
    session.questions.forEach((q, i) => {
      const sel = answers[i];
      const isRight = sel === q.correctIndex;
      if (isRight) correct++;
      if (!perDomain[q.domainId]) perDomain[q.domainId] = { name: q.domainName, total: 0, correct: 0 };
      perDomain[q.domainId].total++;
      if (isRight) perDomain[q.domainId].correct++;
      detail.push({ q, sel, isRight });
    });
    const total = session.questions.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const passed = pct >= KCNA.meta.passPct;

    // update rolling progress + history + streak
    // A mock hands back every answer at the end, so its questions are burnt for
    // measurement purposes — record them so the next mock can avoid them.
    if (session.mode === 'mock') Progress.recordMockSeen(session.questions.map((q) => q.id));
    Progress.recordAnswers(detail.map((d) => ({ domainId: d.q.domainId, correct: d.isRight })));
    Progress.recordStudyDay();
    Progress.recordExam({
      date: Date.now(), mode: session.mode, title: session.title,
      total, correct, pct, passed,
      perDomain: Object.keys(perDomain).map((id) => ({ id, name: perDomain[id].name, correct: perDomain[id].correct, total: perDomain[id].total })),
    });

    return { total, correct, pct, passed, perDomain, detail };
  }

  return { build, grade };
})();
