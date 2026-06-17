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
      options: shuffled.map((o) => o.text),
      correctIndex: shuffled.findIndex((o) => o.correct),
    };
  }

  // weighted selection across domains to mirror exam blueprint
  function weightedPick(count) {
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
    alloc.forEach(({ d, n }) => {
      const pool = shuffle((d.questions || []).slice());
      pool.slice(0, Math.max(0, n)).forEach((q) => {
        if (!usedIds[q.id]) { usedIds[q.id] = 1; picked.push(Object.assign({}, q, { domainId: d.id, domainName: d.name })); }
      });
    });
    // Top up from a global pool of unused questions if a domain was short,
    // so the quiz always reaches the requested count when questions exist.
    if (picked.length < count) {
      const extra = shuffle(KCNA.allQuestions().filter((q) => !usedIds[q.id]));
      for (let i = 0; i < extra.length && picked.length < count; i++) {
        usedIds[extra[i].id] = 1;
        picked.push(extra[i]);
      }
    }
    return shuffle(picked);
  }

  function domainPick(domainId, count) {
    const d = KCNA.domain(domainId);
    if (!d) return [];
    const pool = shuffle((d.questions || []).map((q) => Object.assign({}, q, { domainId: d.id, domainName: d.name })));
    return pool.slice(0, count);
  }

  // build a session: {mode, title, questions:[prepped], minutes}
  function build(opts) {
    let raw = [];
    let title = '', minutes = 0, mode = opts.mode || 'practice';
    if (mode === 'mock') {
      raw = weightedPick(KCNA.meta.examQuestions);
      title = 'Full Mock Exam';
      minutes = KCNA.meta.examMinutes;
    } else if (mode === 'diagnostic') {
      raw = weightedPick(opts.count || 25);
      title = 'Diagnostic Assessment';
      minutes = 0;
    } else if (opts.domainId) {
      raw = domainPick(opts.domainId, opts.count || 15);
      title = (KCNA.domain(opts.domainId) || {}).name + ' — Practice';
      minutes = 0;
    } else {
      raw = weightedPick(opts.count || 20);
      title = 'Mixed Practice';
      minutes = 0;
    }
    return {
      mode, title, minutes,
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
