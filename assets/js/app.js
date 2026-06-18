/* KCNA Prep — router + views. */
(function () {
  const appEl = document.getElementById('app');
  let session = null;   // active quiz session
  let sIdx = 0;         // quiz question index
  let sAnswers = [];    // quiz answers
  let sTimer = null;    // mock timer interval
  let sEndsAt = 0;
  let deck = null;      // active flashcard session
  let dIdx = 0;
  let dPhase = 'answer'; // 'answer' | 'review'
  let dSel = null;       // selected MC option index
  let dTyped = '';       // typed answer (hard mode)
  let dVerdict = null;   // typed-answer grading result
  function resetCardState() { dPhase = 'answer'; dSel = null; dTyped = ''; dVerdict = null; }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Only allow in-app hash routes and http(s)/mailto links in an href; anything
  // else (javascript:, data:, …) collapses to '#'. Defense-in-depth for any link
  // that might ever come from user/imported data rather than a static template.
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    return /^(#\/|https?:\/\/|mailto:)/i.test(u) ? u : '#';
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(sel, ev, fn) { $all(sel).forEach((e) => e.addEventListener(ev, fn)); }
  function go(hash) { window.location.hash = hash; }

  function parseRoute() {
    let h = window.location.hash.replace(/^#/, '') || '/dashboard';
    const qi = h.indexOf('?');
    let params = {};
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach((kv) => {
        const p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
      h = h.slice(0, qi);
    }
    const parts = h.split('/').filter(Boolean);
    return { path: '/' + parts.join('/'), parts, params };
  }

  function letter(i) { return String.fromCharCode(65 + i); }

  function gauge(pct, big) {
    const r = 60, c = 2 * Math.PI * r;
    const off = c * (1 - pct / 100);
    const col = pct >= 75 ? '#92dd23' : pct >= 55 ? '#ff9178' : pct >= 1 ? '#e14e35' : '#3a3a40';
    const size = big ? 150 : 110;
    return '<div class="gauge" role="img" aria-label="Readiness ' + pct + ' percent" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg viewBox="0 0 150 150" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' +
      '<circle class="gauge-track" cx="75" cy="75" r="' + r + '" fill="none" stroke-width="13"/>' +
      '<circle cx="75" cy="75" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="13" stroke-linecap="round" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 75 75)"/></svg>' +
      '<div class="val"><div><span class="num">' + pct + '</span><div class="lbl">readiness</div></div></div></div>';
  }

  function bar(pct, cls) {
    return '<div class="bar ' + (cls || '') + '" role="progressbar" aria-valuenow="' + Math.round(pct) +
      '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + Math.max(2, pct) + '%"></span></div>';
  }

  function notReady() {
    return '<div class="empty-state"><div class="big">⏳</div>' +
      '<h2>Study content is being generated</h2>' +
      '<p class="muted">The notes, flashcards and question bank are still being written.<br>' +
      'Reload this page once generation finishes.</p>' +
      '<button class="btn primary mt" data-act="reload">Reload</button></div>';
  }

  function render(html) { appEl.innerHTML = html; window.scrollTo(0, 0); }
  function announce(msg) { const s = document.getElementById('route-status'); if (s) s.textContent = msg; }

  function setNav(route) {
    $all('.mainnav a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-route') === route);
    });
    $('#mainnav').classList.remove('open');
    const tb = $('#nav-toggle'); if (tb) tb.setAttribute('aria-expanded', 'false');
  }

  function updateChrome() {
    const cd = StudyPlan.countdown();
    const short = cd.exam.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    $('#brand-countdown').textContent = cd.days + ' days · pass by ' + short;
    if (KCNA.ready()) {
      const c = KCNA.counts();
      $('#foot-stats').textContent = c.questions + ' questions · ' + c.flashcards + ' flashcards · ' + c.notes + ' notes';
    }
    // Show the active difficulty in the top bar so users always know their level.
    const lvl = (window.Settings && Settings.level) ? Settings.level() : 'light';
    const opt = LEVEL_OPTS.find((o) => o[0] === lvl);
    const ll = $('#level-label');
    if (ll && opt) ll.textContent = opt[1];
    const lb = $('#level-btn');
    if (lb && opt) {
      lb.title = 'Difficulty: ' + opt[1] + ' — click to change';
      lb.setAttribute('aria-label', 'Difficulty: ' + opt[1] + ' — change');
    }
  }

  /* ================= DASHBOARD ================= */
  // Deadline reminder — dismissible with the ✕ (persists; re-show in Settings).
  function schedulingBanner() {
    if (Settings.get().deadlineDismissed) return '';
    const cd = StudyPlan.countdown();
    const short = cd.exam.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const urgent = cd.days <= 30;
    return '<div class="banner schedule-banner' + (urgent ? ' banner-bad' : '') + '" role="alert">' +
      '<div><strong>' + (urgent ? '🚨' : '⚠️') + ' Company deadline — pass the KCNA by ' + esc(short) + ' (' + cd.days + ' days left).</strong> ' +
      'Remember to schedule your exam in time' + (urgent ? ' — book it now' : '') + '.</div>' +
      '<button class="banner-x" id="dismiss-deadline" aria-label="Close deadline warning" title="Close">✕</button>' +
      '</div>';
  }

  function viewDashboard() {
    const cd = StudyPlan.countdown();
    const r = Readiness.compute();
    const plan = StudyPlan.build();
    const cur = plan.weeks.find((w) => w.isCurrent) || plan.weeks[0];
    const fc = KCNA.ready() ? Flashcards.stats(null) : { due: 0, total: 0, mastered: 0 };
    const hist = Progress.history();
    const bestMock = hist.filter((h) => h.mode === 'mock').reduce((m, h) => Math.max(m, h.pct), 0);
    const st = Progress.streak();

    const domainRows = r.perDomain.map((d) => {
      const cls = d.answered < 3 ? '' : Readiness.colorClass(d.masteryPct);
      return '<div class="domain-row"><div class="meta"><span class="name">' + esc(d.name) + '</span>' +
        '<span class="pill">' + d.weight + '%</span></div>' +
        '<div class="domain-score">' + (d.answered ? d.masteryPct + '%' : '—') + '</div>' +
        bar(d.answered ? d.masteryPct : 0, cls) + '</div>';
    }).join('');

    render(
      schedulingBanner() +
      '<div class="hero">' +
        '<div class="card pad-lg readiness-card">' +
          '<div class="eyebrow">Your readiness</div>' +
          '<div class="gauge-wrap">' + gauge(r.readiness, true) +
            '<div><div class="row"><span class="pill ' + r.levelClass + '">' + r.level + '</span></div>' +
            '<p class="muted mt" style="margin:8px 0 0">' +
              (r.totalAnswered < 20
                ? 'Take the <strong>Diagnostic</strong> to assess where you stand. You have answered ' + r.totalAnswered + ' questions so far.'
                : 'Predicted exam score <strong>~' + r.predictedScore + '%</strong> · pass mark ' + r.passPct + '%. Pass likelihood: <span class="' + r.likelihoodClass + '">' + r.likelihood + '</span>.') +
            '</p>' +
            '<div class="btn-row mt"><a class="btn primary sm" href="#/readiness">Full analysis</a>' +
            '<a class="btn sm" href="#/practice?diagnostic=1">Run diagnostic</a></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="card countdown-card">' +
          '<div class="eyebrow">Company deadline</div>' +
          '<div class="countdown-num">' + cd.days + '</div>' +
          '<div class="sub">days to pass by</div>' +
          '<div class="countdown-date">' + cd.examLabel + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="stat-row">' +
        stat(r.totalAnswered, 'questions answered') +
        stat(fc.due, 'flashcards due') +
        stat(bestMock ? bestMock + '%' : '—', 'best mock score') +
        stat(plan.doneTasks + '/' + plan.totalTasks, 'plan tasks done') +
        stat((st.current ? '🔥 ' : '') + st.current, 'day study streak') +
      '</div>' +

      '<div class="grid cols-2">' +
        '<div class="card"><h2>Domain mastery</h2>' + (KCNA.ready() ? domainRows : '<p class="muted">Content loading…</p>') + '</div>' +
        '<div class="card"><div class="spread"><h2 style="margin:0">This week — Week ' + cur.num + '</h2><span class="pill accent">' + cur.range + '</span></div>' +
          '<p class="muted" style="margin:8px 0 12px">' + esc(cur.focus) + '</p>' +
          '<div>' + cur.tasks.map((t) =>
            '<div class="task ' + (t.done ? 'done' : '') + '"><input type="checkbox" data-task="' + t.id + '" ' + (t.done ? 'checked' : '') + '>' +
            '<label>' + esc(t.text) + ' <a href="' + esc(safeUrl(t.link)) + '">open ›</a></label></div>').join('') +
          '</div>' +
          '<a class="btn sm mt" href="#/plan">Full study plan ›</a>' +
        '</div>' +
      '</div>' +

      '<div class="card mt-lg"><div class="spread"><h2 style="margin:0">Jump in</h2></div>' +
        '<div class="btn-row mt">' +
          '<a class="btn primary" href="#/learn">📚 Study notes</a>' +
          '<a class="btn" href="#/cards">🃏 Flashcards' + (fc.due ? ' (' + fc.due + ' due)' : '') + '</a>' +
          '<a class="btn" href="#/practice?mock=1">📝 Full mock exam</a>' +
          '<a class="btn" href="#/practice">⚡ Quick practice</a>' +
          '<a class="btn" href="#/report">📄 Progress report</a>' +
        '</div></div>'
    );
    bindPlanChecks();
    const dx = $('#dismiss-deadline');
    if (dx) dx.addEventListener('click', function () { Settings.set({ deadlineDismissed: true }); viewDashboard(); });
  }
  function stat(n, l) { return '<div class="stat"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>'; }

  /* ================= LEARN ================= */
  function viewLearn() {
    if (!KCNA.ready()) return render(notReady());
    const stats = Progress.stats();
    const cards = KCNA.all().map((d) => {
      const st = stats[d.id] || { answered: 0, correct: 0 };
      const acc = st.answered ? Math.round((st.correct / st.answered) * 100) : 0;
      return '<a class="card domain-card" href="#/learn/' + d.id + '">' +
        '<div class="spread"><strong>' + esc(d.name) + '</strong><span class="pill accent">' + d.weight + '% of exam</span></div>' +
        '<p class="muted" style="margin:8px 0 12px">' + (d.notes || []).length + ' notes · ' + (d.flashcards || []).length + ' cards · ' + (d.questions || []).length + ' questions</p>' +
        (st.answered ? bar(acc, Readiness.colorClass(acc)) + '<div class="wt mt">Mastery ' + acc + '% · ' + st.answered + ' answered</div>' : '<div class="wt">Not started yet</div>') +
        '</a>';
    }).join('');
    render('<div class="page-head"><h1>Learn</h1><p>Concise, exam-focused notes across all five KCNA domains. Ordered by exam weight.</p></div>' +
      '<div class="grid cols-2">' + cards + '</div>');
  }

  function viewLearnDomain(id) {
    if (!KCNA.ready()) return render(notReady());
    const d = KCNA.domain(id);
    if (!d) return render('<div class="empty-state">Domain not found. <a href="#/learn">Back to Learn</a></div>');
    const notes = (d.notes || []).map((n, i) =>
      '<li><a href="#/note/' + d.id + '/' + i + '"><span><span class="note-num">' + (i + 1) + '</span>' + esc(n.title) + '</span><span class="faint">read ›</span></a></li>').join('');
    const refs = KCNA.references ? KCNA.references(d.id) : [];
    const refsHtml = refs.length ? '<div class="card mt-lg"><h2>📖 Further reading — official docs</h2>' +
      '<ul class="ref-list">' + refs.map((r) =>
        '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) +
        ' <span class="ext">↗</span></a><div class="faint">' + esc(r.note || '') + '</div></li>').join('') +
      '</ul></div>' : '';
    render('<div class="crumbs"><a href="#/learn">Learn</a> › ' + esc(d.name) + '</div>' +
      '<div class="page-head"><div class="spread"><div><h1>' + esc(d.name) + '</h1><p>' + d.weight + '% of the exam · ' + (d.notes || []).length + ' notes</p></div></div></div>' +
      '<div class="btn-row" style="margin-bottom:18px">' +
        '<a class="btn primary" href="#/practice?domain=' + d.id + '">📝 Quiz this domain</a>' +
        '<a class="btn" href="#/cards?domain=' + d.id + '">🃏 Flashcards</a></div>' +
      '<div class="card"><ul class="note-list">' + notes + '</ul></div>' + refsHtml);
  }

  function viewNote(id, idx) {
    if (!KCNA.ready()) return render(notReady());
    const d = KCNA.domain(id);
    if (!d) return render('<div class="empty-state">Not found. <a href="#/learn">Back</a></div>');
    idx = parseInt(idx, 10) || 0;
    const n = (d.notes || [])[idx];
    if (!n) return render('<div class="empty-state">Note not found. <a href="#/learn/' + id + '">Back</a></div>');
    const prev = idx > 0 ? '<a class="btn sm" href="#/note/' + id + '/' + (idx - 1) + '">‹ Previous</a>' : '<span></span>';
    const next = idx < d.notes.length - 1 ? '<a class="btn sm primary" href="#/note/' + id + '/' + (idx + 1) + '">Next ›</a>' : '<a class="btn sm primary" href="#/practice?domain=' + id + '">Quiz this domain ›</a>';
    render('<div class="crumbs"><a href="#/learn">Learn</a> › <a href="#/learn/' + id + '">' + esc(d.name) + '</a> › ' + esc(n.title) + '</div>' +
      '<div class="card pad-lg"><div class="row" style="gap:8px;margin-bottom:6px"><span class="pill accent">' + esc(n.topic) + '</span></div>' +
      '<h1 style="margin:4px 0 16px;font-size:24px">' + esc(n.title) + '</h1>' +
      '<div class="note-body">' + n.html + '</div></div>' +
      '<div class="quiz-nav">' + prev + next + '</div>');
  }

  /* ================= FLASHCARDS ================= */
  const MODES = {
    easy: { label: 'Easy', sub: 'Multiple choice', pill: 'good' },
    hard: { label: 'Hard', sub: 'Type the answer', pill: 'bad' },
    flip: { label: 'Flip', sub: 'Review only', pill: '' },
  };
  function fcMode() {
    const m = Store.get('fcMode', null);
    if (m && MODES[m]) return m; // respect an explicit choice
    // default by experience: experienced users type answers, others get MC.
    const lvl = (window.Settings && Settings.level) ? Settings.level() : 'light';
    return lvl === 'heavy' ? 'hard' : 'easy';
  }

  function viewCards(params) {
    if (!KCNA.ready()) return render(notReady());
    if (params.domain || params.start) { startDeck(params.domain || null); return; }
    const all = Flashcards.stats(null);
    const mode = fcMode();
    const modeBtns = Object.keys(MODES).map((k) =>
      '<button data-fcmode="' + k + '" class="' + (k === mode ? 'active' : '') + '">' + MODES[k].label +
      '<span style="display:block;font-weight:400;font-size:11px;color:var(--text-faint)">' + MODES[k].sub + '</span></button>').join('');
    const perDomain = KCNA.all().map((d) => {
      const s = Flashcards.stats(d.id);
      return '<div class="choice" data-deck="' + d.id + '"><div class="ct">' + esc(d.name) + '</div>' +
        '<div class="cd">' + s.total + ' cards · <span class="' + (s.due ? 'tag-medium' : 'muted') + '">' + s.due + ' due</span> · ' + s.mastered + ' mastered</div></div>';
    }).join('');
    render('<div class="page-head"><h1>Flashcards</h1><p>Spaced repetition — cards you find hard come back sooner. ' + all.due + ' due now of ' + all.total + ' total.</p></div>' +
      '<div class="card" style="margin-bottom:18px"><div class="spread wrap"><div><h2 style="margin:0 0 4px">Answer mode</h2>' +
        '<p class="muted" style="margin:0;font-size:13px">Choose how you want to be quizzed. Applies to every deck.</p></div>' +
        '<div class="fc-mode" id="fcmode">' + modeBtns + '</div></div></div>' +
      '<div class="card"><div class="spread"><h2 style="margin:0">Study all due</h2><span class="pill ' + (all.due ? 'warn' : 'good') + '">' + all.due + ' due</span></div>' +
        '<p class="muted" style="margin:8px 0 0">Mix of every domain. ' + all.mastered + ' mastered · ' + all.learning + ' learning · ' + all.fresh + ' new.</p>' +
        '<button class="btn primary mt" data-deck="all">Start session ›</button></div>' +
      '<h2 style="margin:24px 0 12px">By domain</h2><div class="choice-grid">' + perDomain + '</div>');
    on('[data-fcmode]', 'click', function () { Store.set('fcMode', this.getAttribute('data-fcmode')); viewCards({}); });
    on('[data-deck]', 'click', function () { const dk = this.getAttribute('data-deck'); startDeck(dk === 'all' ? null : dk); });
  }

  function startDeck(domainId) {
    deck = { domainId, mode: fcMode(), cards: Flashcards.queue(domainId, 25) };
    dIdx = 0; resetCardState();
    if (!deck.cards.length) {
      render('<div class="empty-state"><div class="big">✅</div><h2>No cards due right now</h2>' +
        '<p class="muted">Great — you are caught up' + (domainId ? ' for this domain' : '') + '. Come back later or pick another deck.</p>' +
        '<a class="btn primary mt" href="#/cards">Back to decks</a></div>');
      return;
    }
    renderCard();
  }

  function deckHeader() {
    const total = deck.cards.length;
    const m = MODES[deck.mode] || MODES.flip;
    return '<div class="quiz-top"><div class="row" style="gap:8px"><a class="btn sm ghost" href="#/cards">‹ Decks</a>' +
      '<span class="pill ' + m.pill + '">' + m.label + ' · ' + m.sub + '</span></div>' +
      '<div class="qprogress">' + bar(Math.round(dIdx / total * 100)) + '</div>' +
      '<div class="pill">' + (dIdx + 1) + ' / ' + total + '</div></div>';
  }
  function ratingRow(suggest) {
    const tag = (g, txt) => '<button class="btn' + (g === 2 ? ' good' : '') + (g === suggest ? ' suggested' : '') + '" data-grade="' + g + '">' + txt + '</button>';
    return '<div class="rate-hint">How well did you recall it?</div><div class="rate-row">' +
      tag(0, 'Again<small>&lt; 1 min</small>') + tag(1, 'Hard<small>soon</small>') +
      tag(2, 'Good<small>days</small>') + tag(3, 'Easy<small>longer</small>') + '</div>';
  }
  function qPanel(c) {
    return '<div class="fc-q"><span class="label">Question</span><span class="topic">' + esc(c.domainName) + '</span><div class="q">' + esc(c.front) + '</div></div>';
  }
  function bindRating() {
    on('[data-grade]', 'click', function () {
      Flashcards.review(deck.cards[dIdx].id, parseInt(this.getAttribute('data-grade'), 10));
      dIdx++; resetCardState();
      if (dIdx >= deck.cards.length) finishDeck(); else renderCard();
    });
  }

  function renderCard() {
    const c = deck.cards[dIdx];
    if (deck.mode === 'easy') return renderCardMC(c);
    if (deck.mode === 'hard') return renderCardType(c);
    return renderCardFlip(c);
  }

  function renderCardFlip(c) {
    const flipped = dPhase === 'review';
    render(deckHeader() +
      '<div class="flashcard' + (flipped ? ' flipped' : '') + '" id="fcard">' +
        '<div class="flashcard-inner">' +
          '<div class="flash-face flash-front"><span class="label">Question</span><span class="topic">' + esc(c.domainName) + '</span><div class="q">' + esc(c.front) + '</div></div>' +
          '<div class="flash-face flash-back"><span class="label">Answer</span><span class="topic">' + esc(c.topic || '') + '</span><div class="a">' + esc(c.back) + '</div></div>' +
        '</div></div>' +
      (flipped ? ratingRow(-1) : '<div class="flash-hint">Click the card to reveal the answer</div>'));
    $('#fcard').addEventListener('click', function () { if (dPhase === 'answer') { dPhase = 'review'; renderCard(); } });
    if (flipped) bindRating();
  }

  function renderCardMC(c) {
    if (!c._mc) c._mc = Flashcards.mcOptions(c);
    const correct = c._mc.correctIndex;
    const answered = dPhase === 'review';
    const opts = c._mc.options.map((o, i) => {
      let cls = 'option';
      if (answered) { if (i === correct) cls += ' correct'; else if (i === dSel) cls += ' incorrect'; }
      return '<div class="' + cls + '" data-opt="' + i + '"><span class="key">' + letter(i) + '</span><div>' + esc(o) + '</div></div>';
    }).join('');
    let tail = '';
    if (answered) {
      const right = dSel === correct;
      tail = '<div class="verdict ' + (right ? 'good' : 'bad') + '"><span class="vh">' + (right ? '✓ Correct' : '✗ Incorrect') + '</span>' +
        (right ? '' : ' — the right answer is highlighted above.') + '</div>' + ratingRow(right ? 2 : 0);
    } else {
      tail = '<div class="flash-hint">Pick the answer you think is correct</div>';
    }
    render(deckHeader() + qPanel(c) + '<div class="options" id="opts">' + opts + '</div>' + tail);
    if (!answered) on('[data-opt]', 'click', function () { dSel = parseInt(this.getAttribute('data-opt'), 10); dPhase = 'review'; renderCard(); });
    else bindRating();
  }

  function renderCardType(c) {
    const answered = dPhase === 'review';
    let body;
    if (!answered) {
      body = '<input class="fc-input" id="fcinput" placeholder="Type your answer…" aria-label="Your answer" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(dTyped) + '">' +
        '<div class="btn-row mt"><button class="btn primary" id="fccheck">Check answer</button>' +
        '<button class="btn ghost" id="fcreveal">Skip / reveal</button></div>' +
        '<div class="flash-hint">Spelling and capitalization are forgiven — just get the idea across.</div>';
    } else {
      const v = dVerdict || { match: false };
      const cls = v.match ? 'good' : (v.partial ? 'warn' : 'bad');
      const head = v.empty ? '✗ No answer' : (v.match ? '✓ Correct (close enough)' : (v.partial ? '◐ Partially right' : '✗ Not quite'));
      const suggest = v.match ? 2 : (v.partial ? 1 : 0);
      body = '<div class="verdict ' + cls + '"><span class="vh">' + head + '</span>' +
        (v.empty ? '' : ' <span class="faint" style="font-size:12px">· ' + v.coverage + '% of key terms matched</span>') + '</div>' +
        (dTyped ? '<div class="ans-reveal"><div class="lbl">Your answer</div><div class="val">' + esc(dTyped) + '</div></div>' : '') +
        '<div class="ans-reveal"><div class="lbl">Correct answer</div><div class="val correct-ans">' + esc(c.back) + '</div></div>' +
        ratingRow(suggest);
    }
    render(deckHeader() + qPanel(c) + body);
    if (!answered) {
      const input = $('#fcinput');
      const submit = function () { dTyped = input.value.trim(); dVerdict = Flashcards.checkTyped(dTyped, c.back); dPhase = 'review'; renderCard(); };
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      $('#fccheck').addEventListener('click', submit);
      $('#fcreveal').addEventListener('click', function () { dTyped = input.value.trim(); dVerdict = Flashcards.checkTyped(dTyped, c.back); dPhase = 'review'; renderCard(); });
      input.focus();
    } else bindRating();
  }

  function finishDeck() {
    const s = Flashcards.stats(deck.domainId);
    render('<div class="empty-state"><div class="big">🎉</div><h2>Session complete</h2>' +
      '<p class="muted">You reviewed ' + deck.cards.length + ' cards. ' + s.due + ' still due · ' + s.mastered + ' mastered.</p>' +
      '<div class="btn-row center mt" style="justify-content:center">' +
      '<a class="btn primary" href="#/cards">More flashcards</a>' +
      '<a class="btn" href="#/practice">Practice questions</a></div></div>');
    maybeSuggestLevelUp();
  }

  /* ================= PRACTICE / EXAMS ================= */
  function viewPractice(params) {
    if (!KCNA.ready()) return render(notReady());
    if (params.mock) return startSession({ mode: 'mock' });
    if (params.diagnostic) return startSession({ mode: 'diagnostic', count: 25 });
    if (params.domain) return startSession({ mode: 'practice', domainId: params.domain, count: parseInt(params.count, 10) || 15 });

    const domainChoices = KCNA.all().map((d) =>
      '<div class="choice" data-mode="practice" data-domain="' + d.id + '"><div class="ct">' + esc(d.name) + '</div>' +
      '<div class="cd">' + d.weight + '% · ' + (d.questions || []).length + ' questions</div></div>').join('');
    render('<div class="page-head"><h1>Practice</h1><p>Quiz by domain, run a diagnostic, or sit a full timed mock exam (60 questions, 90 minutes, pass at 75%).</p></div>' +
      '<div class="grid cols-2">' +
        '<div class="card"><h2>📝 Full Mock Exam</h2><p class="muted">60 questions, weighted exactly like the real KCNA, 90-minute timer. No feedback until the end — just like exam day.</p>' +
          '<button class="btn primary mt" data-mode="mock">Start mock exam ›</button></div>' +
        '<div class="card"><h2>🎯 Diagnostic</h2><p class="muted">25 balanced questions to assess where you stand and seed your readiness score. Best taken first.</p>' +
          '<button class="btn primary mt" data-mode="diagnostic">Run diagnostic ›</button></div>' +
      '</div>' +
      '<h2 style="margin:24px 0 12px">Practice by domain</h2>' +
      '<p class="muted" style="margin:-6px 0 14px">Immediate feedback after each question.</p>' +
      '<div class="choice-grid">' + domainChoices + '</div>' +
      '<div class="card mt-lg"><div class="spread"><h2 style="margin:0">⚡ Mixed quick quiz</h2></div>' +
        '<p class="muted" style="margin:8px 0 0">20 questions across all domains.</p>' +
        '<button class="btn mt" data-mode="practice" data-mixed="1">Start mixed quiz ›</button></div>');
    on('[data-mode]', 'click', function () {
      const mode = this.getAttribute('data-mode');
      const domain = this.getAttribute('data-domain');
      const mixed = this.getAttribute('data-mixed');
      if (mode === 'mock') startSession({ mode: 'mock' });
      else if (mode === 'diagnostic') startSession({ mode: 'diagnostic', count: 25 });
      else if (domain) startSession({ mode: 'practice', domainId: domain, count: 15 });
      else if (mixed) startSession({ mode: 'practice', count: 20 });
    });
  }

  function startSession(opts) {
    session = Exams.build(opts);
    sIdx = 0; sAnswers = new Array(session.questions.length).fill(null);
    if (sTimer) { clearInterval(sTimer); sTimer = null; }
    if (session.minutes > 0) {
      sEndsAt = Date.now() + session.minutes * 60000;
      sTimer = setInterval(tickTimer, 1000);
    }
    if (!session.questions.length) {
      render('<div class="empty-state">No questions available yet. <a href="#/practice">Back</a></div>');
      return;
    }
    renderQuestion();
  }

  function renderQuestion() {
    const q = session.questions[sIdx];
    const total = session.questions.length;
    const answered = sAnswers[sIdx];
    const showFeedback = session.mode === 'practice' && answered != null;
    const timerHtml = session.minutes > 0
      ? '<div class="timer" id="timer">' + fmtTime(Math.max(0, sEndsAt - Date.now())) + '</div>' : '';

    const opts = q.options.map((o, i) => {
      let cls = 'option';
      if (showFeedback) {
        if (i === q.correctIndex) cls += ' correct';
        else if (i === answered) cls += ' incorrect';
      } else if (i === answered) cls += ' selected';
      return '<div class="' + cls + '" data-opt="' + i + '"><span class="key">' + letter(i) + '</span><div>' + esc(o) + '</div></div>';
    }).join('');

    const diffTag = q.difficulty ? '<span class="pill tag-' + q.difficulty + '">' + q.difficulty + '</span>' : '';

    render('<div class="quiz-top">' +
        '<div class="row"><span class="pill accent">' + esc(session.title) + '</span><span class="pill">' + esc(q.domainName) + '</span>' + diffTag + '</div>' +
        timerHtml +
      '</div>' +
      '<div class="qprogress" style="margin-bottom:16px">' + bar(Math.round(sIdx / total * 100)) + '<div class="faint mt" style="font-size:12.5px">Question ' + (sIdx + 1) + ' of ' + total + '</div></div>' +
      '<div class="card pad-lg"><div class="qtext">' + esc(q.question) + '</div>' +
        '<div class="options" id="opts">' + opts + '</div>' +
        (showFeedback ? '<div class="explain"><div class="lbl">' + (answered === q.correctIndex ? '✓ Correct' : '✗ Incorrect — answer: ' + letter(q.correctIndex)) + '</div><div class="mt" style="margin-top:6px">' + esc(q.explanation) + '</div></div>' : '') +
      '</div>' +
      '<div class="quiz-nav">' +
        (sIdx > 0 ? '<button class="btn" id="prev">‹ Previous</button>' : '<span></span>') +
        (sIdx < total - 1
          ? '<button class="btn primary" id="next">Next ›</button>'
          : '<button class="btn good" id="finish">Finish &amp; score ›</button>') +
      '</div>');

    on('[data-opt]', 'click', function () {
      const i = parseInt(this.getAttribute('data-opt'), 10);
      if (session.mode === 'practice' && sAnswers[sIdx] != null) return; // lock after answer in practice
      sAnswers[sIdx] = i;
      if (session.mode === 'practice') renderQuestion(); // show feedback
      else { $all('#opts .option').forEach((o) => o.classList.remove('selected')); this.classList.add('selected'); }
    });
    const prev = $('#prev'); if (prev) prev.addEventListener('click', () => { sIdx--; renderQuestion(); });
    const next = $('#next'); if (next) next.addEventListener('click', () => { sIdx++; renderQuestion(); });
    const fin = $('#finish'); if (fin) fin.addEventListener('click', finishSession);
  }

  function tickTimer() {
    const left = sEndsAt - Date.now();
    const t = $('#timer');
    if (t) { t.textContent = fmtTime(Math.max(0, left)); if (left < 5 * 60000) t.classList.add('danger'); }
    if (left <= 0) { clearInterval(sTimer); sTimer = null; finishSession(); }
  }
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000); const m = Math.floor(s / 60);
    return (m < 10 ? '0' : '') + m + ':' + ((s % 60) < 10 ? '0' : '') + (s % 60);
  }

  function finishSession() {
    if (sTimer) { clearInterval(sTimer); sTimer = null; }
    const res = Exams.grade(session, sAnswers);
    const pillClass = res.passed ? 'good' : 'bad';
    const perDomain = Object.keys(res.perDomain).map((id) => {
      const p = res.perDomain[id]; const pct = Math.round(p.correct / p.total * 100);
      return '<div class="domain-row"><div class="meta"><span class="name">' + esc(p.name) + '</span></div>' +
        '<div class="domain-score">' + p.correct + '/' + p.total + '</div>' + bar(pct, Readiness.colorClass(pct)) + '</div>';
    }).join('');

    const review = res.detail.map((d, i) => {
      const q = d.q;
      const opts = q.options.map((o, oi) => {
        let cls = 'option';
        if (oi === q.correctIndex) cls += ' correct';
        else if (oi === d.sel && !d.isRight) cls += ' incorrect';
        return '<div class="' + cls + '"><span class="key">' + letter(oi) + '</span><div>' + esc(o) + '</div></div>';
      }).join('');
      return '<div class="review-q"><div class="qh"><span class="pill ' + (d.isRight ? 'good' : 'bad') + '">' + (d.isRight ? '✓' : '✗') + '</span>' +
        '<div><div class="faint" style="font-size:12px">' + esc(q.domainName) + ' · ' + esc(q.topic || '') + '</div>' +
        '<strong>' + (i + 1) + '. ' + esc(q.question) + '</strong></div></div>' +
        '<div class="options mt">' + opts + '</div>' +
        '<div class="explain"><div class="lbl">Explanation</div><div style="margin-top:6px">' + esc(q.explanation) + '</div></div></div>';
    }).join('');

    render('<div class="card pad-lg center">' +
        '<div class="eyebrow">' + esc(session.title) + ' — result</div>' +
        '<div class="scorebig ' + (res.passed ? 'tag-easy' : 'tag-hard') + '">' + res.pct + '%</div>' +
        '<div class="row" style="justify-content:center;gap:10px;margin-top:8px"><span class="pill ' + pillClass + '">' + (res.passed ? 'PASS' : 'Below pass mark') + '</span>' +
        '<span class="muted">' + res.correct + ' / ' + res.total + ' correct · pass mark ' + KCNA.meta.passPct + '%</span></div>' +
        (session.mode === 'mock' || session.mode === 'diagnostic'
          ? '<p class="muted mt">Your readiness score has been updated. <a href="#/readiness">See full analysis ›</a></p>' : '') +
      '</div>' +
      '<div class="card mt-lg"><h2>By domain</h2>' + perDomain + '</div>' +
      '<div class="btn-row mt-lg"><a class="btn primary" href="#/practice">Another round</a>' +
        '<a class="btn" href="#/readiness">Readiness</a><a class="btn" href="#/dashboard">Dashboard</a></div>' +
      '<h2 style="margin:26px 0 12px">Review all ' + res.total + ' questions</h2>' + review);
    maybeSuggestLevelUp();
  }

  /* ================= READINESS ================= */
  function viewReadiness() {
    const r = Readiness.compute();
    const hist = Progress.history();

    const domainRows = r.perDomain.map((d) => {
      const cls = d.answered < 3 ? '' : Readiness.colorClass(d.masteryPct);
      return '<div class="domain-row"><div class="meta"><span class="name">' + esc(d.name) + '</span><span class="pill">' + d.weight + '% weight</span></div>' +
        '<div class="domain-score">' + (d.answered ? d.masteryPct + '%' : '—') + '</div>' +
        bar(d.answered ? d.masteryPct : 0, cls) +
        '<div class="faint" style="grid-column:1/-1;font-size:12px;margin-top:4px">' +
          (d.answered ? d.answered + ' answered · coverage ' + d.coverage + '%' : 'Not practiced yet') +
          ' · <a href="#/practice?domain=' + d.id + '">quiz ›</a></div></div>';
    }).join('');

    const recs = [];
    const ap = StudyPlan.approach();
    recs.push('<strong>' + esc(ap.label) + ' track:</strong> ' + esc(ap.blurb) + ' <a href="#/settings">Change ›</a>');
    if (r.totalAnswered < 20) recs.push('Take the <a href="#/practice?diagnostic=1">25-question Diagnostic</a> to establish your baseline.');
    r.unassessed.forEach((d) => recs.push('You have not practiced <strong>' + esc(d.name) + '</strong> (' + d.weight + '% of the exam) yet — <a href="#/practice?domain=' + d.id + '">start a quiz ›</a>'));
    r.weakest.filter((d) => d.masteryPct < 75).forEach((d) =>
      recs.push('Weak area: <strong>' + esc(d.name) + '</strong> at ' + d.masteryPct + '% — <a href="#/learn/' + d.id + '">re-read notes</a> then <a href="#/practice?domain=' + d.id + '">re-quiz</a>.'));
    if (r.readiness >= 78) recs.push('You are tracking well — keep mock scores above ' + r.passPct + '% and flashcards green through exam day.');
    if (!recs.length) recs.push('Keep practicing across all domains and sit a <a href="#/practice?mock=1">full mock exam</a>.');

    const histRows = hist.length ? hist.slice(0, 12).map((h) => {
      const dt = new Date(h.date);
      return '<div class="domain-row"><div class="meta"><span class="name">' + esc(h.title || h.mode) + '</span>' +
        '<span class="faint" style="font-size:12px">' + dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span></div>' +
        '<div class="domain-score"><span class="' + (h.pct >= KCNA.meta.passPct ? 'tag-easy' : 'tag-hard') + '">' + h.pct + '%</span></div></div>';
    }).join('') : '<p class="muted">No attempts yet. Take a quiz or mock to populate your history.</p>';

    render('<div class="page-head"><div class="spread wrap"><div><h1>Readiness analysis</h1><p>An honest read on whether you are ready to pass the KCNA before the Oct 1 deadline.</p></div>' +
      '<a class="btn" href="#/report">📄 Progress report</a></div></div>' +
      '<div class="hero">' +
        '<div class="card pad-lg"><div class="gauge-wrap">' + gauge(r.readiness, true) +
          '<div><span class="pill ' + r.levelClass + '">' + r.level + '</span>' +
          '<div class="mt-lg"><div class="spread"><span class="muted">Predicted exam score</span><strong>' + (r.totalAnswered < 20 ? '—' : '~' + r.predictedScore + '%') + '</strong></div>' +
          '<div class="spread mt"><span class="muted">Pass likelihood</span><span class="pill ' + r.likelihoodClass + '">' + r.likelihood + '</span></div>' +
          '<div class="spread mt"><span class="muted">Questions answered</span><strong>' + r.totalAnswered + '</strong></div>' +
          '<div class="spread mt"><span class="muted">Material assessed</span><strong>' + Math.round(r.assessedShare * 100) + '%</strong></div></div></div></div></div>' +
        '<div class="card"><h2>What to do next</h2><ul style="padding-left:18px;line-height:1.9;margin:0">' +
          recs.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>' +
      '</div>' +
      '<div class="card mt-lg"><h2>Mastery by domain</h2>' + (KCNA.ready() ? domainRows : '<p class="muted">Content loading…</p>') + '</div>' +
      '<div class="card mt-lg"><h2>Attempt history</h2>' + histRows + '</div>' +
      '<div class="card mt-lg"><div class="spread"><div><h2 style="margin:0">Reset progress</h2><p class="muted" style="margin:6px 0 0">Clears flashcard schedule, quiz stats, and plan checkboxes.</p></div>' +
        '<button class="btn" id="reset">Reset all</button></div></div>');

    const rb = $('#reset');
    if (rb) rb.addEventListener('click', function () {
      if (confirm('Reset all your progress? This cannot be undone.')) { Store.reset(); go('#/dashboard'); location.reload(); }
    });
  }

  /* ================= PLAN ================= */
  function viewPlan() {
    const plan = StudyPlan.build();
    const pct = plan.totalTasks ? Math.round(plan.doneTasks / plan.totalTasks * 100) : 0;
    const weeks = plan.weeks.map((w) => {
      const wpct = w.total ? Math.round(w.doneCount / w.total * 100) : 0;
      const done = w.doneCount === w.total && w.total > 0;
      return '<div class="week ' + (w.isCurrent ? 'current' : '') + ' ' + (done ? 'done' : '') + '">' +
        '<div class="wh"><div><span class="wk">Week ' + w.num + '</span> ' + (w.isCurrent ? '<span class="pill accent">this week</span>' : '') + (done ? ' <span class="pill good">done</span>' : '') +
          '<div class="muted" style="margin-top:2px">' + esc(w.focus) + '</div></div>' +
          '<div class="dates">' + w.range + ' · ' + w.doneCount + '/' + w.total + '</div></div>' +
        '<p class="faint" style="margin:0 0 10px;font-size:13px">🎯 ' + esc(w.goal) + '</p>' +
        w.tasks.map((t) => '<div class="task ' + (t.done ? 'done' : '') + '"><input type="checkbox" data-task="' + t.id + '" ' + (t.done ? 'checked' : '') + '>' +
          '<label>' + esc(t.text) + (t.link ? ' <a href="' + esc(safeUrl(t.link)) + '">open ›</a>' : '') + '</label></div>').join('') +
        '</div>';
    }).join('');

    const ap = plan.approach;
    render('<div class="page-head"><div class="spread"><div><h1>Study plan</h1><p>' + plan.daysLeft + ' days until the Oct 1 deadline.</p></div>' +
      '<span class="pill accent">' + plan.doneTasks + ' / ' + plan.totalTasks + ' tasks</span></div></div>' +
      '<div class="card approach-card" style="margin-bottom:18px"><div class="spread wrap"><div>' +
        '<div class="eyebrow">Tailored for · ' + esc(ap.label) + '</div>' +
        '<p class="muted" style="margin:2px 0 0;max-width:62ch">' + esc(ap.blurb) + '</p></div>' +
        '<div class="approach-meta"><span class="pill accent">' + esc(ap.hours) + '</span></div>' +
      '</div><div class="btn-row mt"><a class="btn sm ghost" href="#/settings">Change level ›</a></div></div>' +
      '<div class="card" style="margin-bottom:18px"><div class="spread"><strong>Overall progress</strong><span>' + pct + '%</span></div><div class="mt">' + bar(pct) + '</div>' +
      '<p class="muted mt" style="font-size:13px;margin-bottom:0">Check tasks off as you go — progress is saved on this device and feeds your dashboard.</p></div>' +
      weeks);
    bindPlanChecks();
  }

  function bindPlanChecks() {
    on('[data-task]', 'change', function () {
      StudyPlan.toggle(this.getAttribute('data-task'), this.checked);
      const route = parseRoute();
      if (route.path === '/plan') viewPlan();
      else if (route.path === '/dashboard') viewDashboard();
    });
  }

  /* ================= REFERENCE / KNOWLEDGE BASE ================= */
  // Stable, well-known official resources (used if data/references.js omits them).
  const OFFICIAL = [
    { title: 'KCNA exam & registration (Linux Foundation)', url: 'https://training.linuxfoundation.org/certification/kubernetes-cloud-native-associate-kcna/', note: 'Official exam page — book your seat here.' },
    { title: 'CNCF certification curriculum', url: 'https://github.com/cncf/curriculum', note: 'The authoritative domain/competency outline.' },
    { title: 'Candidate handbook', url: 'https://docs.linuxfoundation.org/tc-docs/certification/lf-handbook2', note: 'Exam-day rules, system requirements, retakes.' },
    { title: 'Kubernetes documentation', url: 'https://kubernetes.io/docs/home/', note: 'Primary source for everything Kubernetes.' },
    { title: 'CNCF Cloud Native Glossary', url: 'https://glossary.cncf.io/', note: 'Plain-language definitions of cloud native terms.' },
    { title: 'CNCF Landscape', url: 'https://landscape.cncf.io/', note: 'Map of the cloud native ecosystem and projects.' },
  ];

  function examFactsCard() {
    const m = KCNA.meta;
    const rows = [
      ['Format', m.examQuestions + ' multiple-choice questions'],
      ['Duration', m.examMinutes + ' minutes'],
      ['Passing score', m.passPct + '%'],
      ['Delivery', 'Online, remotely proctored'],
      ['Cost / validity', 'See the official exam page (includes free retake)'],
    ];
    return '<div class="card"><h2>📋 Exam at a glance</h2>' +
      '<div class="facts">' + rows.map((r) =>
        '<div class="fact"><span class="fk">' + esc(r[0]) + '</span><span class="fv">' + esc(r[1]) + '</span></div>').join('') +
      '</div>' +
      '<h3 style="margin-top:16px">Domain weights</h3>' +
      KCNA.all().map((d) => '<div class="domain-row"><div class="meta"><span class="name">' + esc(d.name) + '</span></div>' +
        '<div class="domain-score">' + d.weight + '%</div>' + bar(d.weight, '') + '</div>').join('') +
      '</div>';
  }

  function glossarySection(filter) {
    if (!KCNA.hasGlossary || !KCNA.hasGlossary()) {
      return '<p class="muted">Glossary is being compiled. Check back after the next update.</p>';
    }
    const q = (filter || '').trim().toLowerCase();
    const terms = KCNA.glossary().filter((t) => !q || t.term.toLowerCase().indexOf(q) >= 0 || t.definition.toLowerCase().indexOf(q) >= 0);
    if (!terms.length) return '<p class="muted">No glossary terms match “' + esc(filter) + '”.</p>';
    return '<div class="glossary" id="glossary-list">' + terms.map((t) => {
      const dn = (KCNA.domain(t.domain) || {}).name || '';
      return '<div class="gterm" id="term-' + esc(slug(t.term)) + '"><div class="spread"><strong>' + esc(t.term) + '</strong>' +
        (dn ? '<span class="pill">' + esc(dn) + '</span>' : '') + '</div>' +
        '<p class="muted" style="margin:6px 0 0">' + esc(t.definition) + '</p>' +
        (t.sourceUrl ? '<a class="faint gsrc" href="' + esc(t.sourceUrl) + '" target="_blank" rel="noopener noreferrer">source ↗</a>' : '') +
        '</div>';
    }).join('') + '</div>';
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function viewReference(params) {
    if (!KCNA.ready()) return render(notReady());
    const official = (KCNA.references && KCNA.references('official').length) ? KCNA.references('official') : OFFICIAL;
    const officialHtml = official.map((r) =>
      '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) + ' <span class="ext">↗</span></a>' +
      '<div class="faint">' + esc(r.note || '') + '</div></li>').join('');

    const perDomain = KCNA.all().map((d) => {
      const refs = KCNA.references ? KCNA.references(d.id) : [];
      if (!refs.length) return '';
      return '<div class="card"><div class="spread"><h3 style="margin:0">' + esc(d.name) + '</h3><span class="pill accent">' + d.weight + '%</span></div>' +
        '<ul class="ref-list mt">' + refs.map((r) =>
          '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.title) + ' <span class="ext">↗</span></a>' +
          (r.note ? '<div class="faint">' + esc(r.note) + '</div>' : '') + '</li>').join('') + '</ul></div>';
    }).join('');

    render('<div class="page-head"><h1>Reference &amp; knowledge base</h1><p>Exam facts, a searchable glossary, and authoritative documentation for every domain.</p></div>' +
      '<div class="grid cols-2">' + examFactsCard() +
        '<div class="card"><h2>🔗 Official resources</h2><ul class="ref-list">' + officialHtml + '</ul></div>' +
      '</div>' +
      '<div class="card mt-lg"><div class="spread wrap"><h2 style="margin:0">📚 Glossary</h2>' +
        '<input class="fc-input gloss-search" id="gloss-search" placeholder="Filter terms…" autocomplete="off" aria-label="Filter glossary terms" style="max-width:280px" value="' + esc(params.q || '') + '"></div>' +
        '<div id="gloss-wrap" class="mt">' + glossarySection(params.q || '') + '</div></div>' +
      (perDomain ? '<h2 style="margin:26px 0 14px">Documentation by domain</h2><div class="grid cols-2">' + perDomain + '</div>' : ''));

    const gs = $('#gloss-search');
    if (gs) {
      gs.addEventListener('input', function () { $('#gloss-wrap').innerHTML = glossarySection(this.value); });
      if (params.term) {
        const el = document.getElementById('term-' + slug(params.term));
        if (el) { el.classList.add('hl'); el.scrollIntoView({ block: 'center' }); }
      }
    }
  }

  /* ================= SETTINGS ================= */
  function seg(name, current, opts) {
    return '<div class="seg" data-seg="' + name + '">' + opts.map((o) =>
      '<button data-val="' + o[0] + '" class="' + (o[0] === current ? 'active' : '') + '">' + esc(o[1]) + '</button>').join('') + '</div>';
  }

  function viewSettings() {
    const s = Settings.get();
    const m = KCNA.meta;
    const canInstall = window.PWA && PWA.canInstall();
    render('<div class="page-head"><h1>Settings</h1><p>Personalize KCNA Prep. Everything is stored only on this device.</p></div>' +
      '<div class="card"><h2>Appearance</h2>' +
        '<div class="setting"><div><strong>Theme</strong><div class="faint">Auto follows your operating system.</div></div>' +
          seg('theme', s.theme, [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']]) + '</div>' +
        '<div class="setting"><div><strong>Motion</strong><div class="faint">Reduce animations and transitions.</div></div>' +
          seg('reducedMotion', s.reducedMotion, [['auto', 'Auto'], ['on', 'Reduced'], ['off', 'Full']]) + '</div>' +
      '</div>' +

      '<div class="card mt-lg"><h2>Kubernetes experience</h2>' +
        '<p class="muted" style="margin-top:0">Tailors your study plan, flashcard default, and practice question difficulty.</p>' +
        '<div class="setting"><strong>Experience level</strong>' +
          seg('level', Settings.level(), [['none', 'New'], ['light', 'Some'], ['heavy', 'Experienced']]) + '</div>' +
        '<p class="faint" style="margin:10px 0 0">' + esc(StudyPlan.approach().blurb) + '</p></div>' +

      '<div class="card mt-lg"><h2>Deadline &amp; plan</h2>' +
        '<p class="muted" style="margin-top:0">Changing these updates your countdown, study plan, and readiness.</p>' +
        '<div class="setting"><div><strong>Deadline (pass by)</strong><div class="faint">Company deadline to pass the KCNA.</div></div>' +
          '<input type="date" id="exam-date" aria-label="Deadline date" class="fc-input" style="max-width:200px" value="' + esc(m.examDate) + '"></div>' +
        '<div class="setting"><label for="plan-start"><strong>Plan start</strong></label>' +
          '<input type="date" id="plan-start" class="fc-input" style="max-width:200px" value="' + esc(m.planStart) + '"></div>' +
        '<div class="setting"><div><strong>Deadline warning</strong><div class="faint">Show or hide the dashboard deadline reminder.</div></div>' +
          seg('deadlineWarn', s.deadlineDismissed ? 'off' : 'on', [['on', 'Show'], ['off', 'Hidden']]) + '</div>' +
        '<div class="btn-row mt"><button class="btn primary" id="save-dates">Save dates</button>' +
          '<button class="btn ghost" id="reset-dates">Reset to defaults</button></div></div>' +

      '<div class="card mt-lg"><h2>Your progress</h2>' +
        '<p class="muted" style="margin-top:0">Save or load your session from the <strong>save icon</strong> in the top bar — handy when several people share this device. Progress is stored on this device until you save it to a file.</p>' +
        '<div class="btn-row"><button class="btn" id="reset-progress">Reset progress</button></div>' +
        '<div id="settings-msg" class="mt" aria-live="polite"></div></div>' +

      (canInstall ? '<div class="card mt-lg"><h2>Install</h2><p class="muted" style="margin-top:0">Install KCNA Prep as an app for offline study and a home-screen icon.</p>' +
        '<button class="btn primary" id="install">📲 Install app</button></div>' : '') +

      '<div class="card mt-lg"><h2>About</h2>' +
        '<div class="facts"><div class="fact"><span class="fk">Version</span><span class="fv">' + esc(m.version || '1.0.0') + '</span></div>' +
        '<div class="fact"><span class="fk">Content</span><span class="fv">' + (KCNA.counts().questions) + ' questions · ' + KCNA.counts().flashcards + ' cards · ' + KCNA.counts().notes + ' notes</span></div>' +
        '<div class="fact"><span class="fk">Offline</span><span class="fv">' + (window.PWA && PWA.isStandalone() ? 'Installed app' : 'Works offline after first load') + '</span></div></div>' +
        '<div class="btn-row mt"><a class="btn sm" href="#/reference">Reference</a>' +
        '<button class="btn sm ghost" id="show-shortcuts">⌨️ Keyboard shortcuts</button></div></div>');

    // appearance
    on('[data-seg="theme"] button', 'click', function () { Settings.set({ theme: this.getAttribute('data-val') }); viewSettings(); });
    on('[data-seg="reducedMotion"] button', 'click', function () { Settings.set({ reducedMotion: this.getAttribute('data-val') }); viewSettings(); });
    on('[data-seg="deadlineWarn"] button', 'click', function () { Settings.set({ deadlineDismissed: this.getAttribute('data-val') === 'off' }); viewSettings(); });
    on('[data-seg="level"] button', 'click', function () { Settings.set({ level: this.getAttribute('data-val') }); updateChrome(); viewSettings(); });

    // dates
    $('#save-dates').addEventListener('click', function () {
      const ed = $('#exam-date').value, ps = $('#plan-start').value;
      Settings.set({ examDate: ed || null, planStart: ps || null });
      settingsMsg('Saved. Countdown and plan updated.', 'good');
      updateChrome();
    });
    $('#reset-dates').addEventListener('click', function () {
      Settings.set({ examDate: null, planStart: null });
      location.reload();
    });

    // progress
    $('#reset-progress').addEventListener('click', function () {
      if (confirm('Reset your study progress? Settings (theme, dates) are kept. This cannot be undone.')) {
        Settings.resetProgress(); settingsMsg('Progress reset.', 'good'); setTimeout(() => location.reload(), 700);
      }
    });

    const inst = $('#install');
    if (inst) inst.addEventListener('click', function () { PWA.promptInstall().then(() => viewSettings()); });
    $('#show-shortcuts').addEventListener('click', showShortcutsHelp);
  }
  function settingsMsg(text, cls) { const el = $('#settings-msg'); if (el) el.innerHTML = '<span class="pill ' + (cls || '') + '">' + esc(text) + '</span>'; }

  /* ================= SEARCH OVERLAY ================= */
  let searchOpen = false;
  function openSearch() {
    if (searchOpen || !KCNA.ready()) return;
    searchOpen = true;
    const ov = document.createElement('div');
    ov.className = 'search-overlay'; ov.id = 'search-overlay';
    ov.innerHTML = '<div class="search-box" role="dialog" aria-label="Search">' +
      '<input class="search-input" id="search-input" placeholder="Search notes, glossary, topics…" autocomplete="off" aria-label="Search">' +
      '<div class="search-results" id="search-results"><p class="muted search-hint">Type at least 2 characters. Press Esc to close.</p></div></div>';
    document.body.appendChild(ov);
    const input = $('#search-input');
    const results = $('#search-results');
    let active = -1, items = [];
    function renderResults() {
      const list = Search.query(input.value, 12); items = list; active = list.length ? 0 : -1;
      if (!input.value.trim() || input.value.trim().length < 2) {
        results.innerHTML = '<p class="muted search-hint">Type at least 2 characters. Press Esc to close.</p>'; return;
      }
      if (!list.length) { results.innerHTML = '<p class="muted search-hint">No results for “' + esc(input.value) + '”.</p>'; return; }
      results.innerHTML = list.map((r, i) =>
        '<a class="search-result' + (i === 0 ? ' active' : '') + '" data-route="' + esc(r.route) + '" data-i="' + i + '">' +
        '<span class="sr-type">' + esc(r.type) + '</span><span class="sr-title">' + esc(r.title) + '</span>' +
        (r.snippet ? '<span class="sr-snip">' + esc(r.snippet) + '</span>' : '') + '</a>').join('');
      $all('.search-result', results).forEach((el) => el.addEventListener('click', function () { goResult(this.getAttribute('data-route')); }));
    }
    function setActive(n) {
      const els = $all('.search-result', results); if (!els.length) return;
      active = (n + els.length) % els.length;
      els.forEach((e, i) => e.classList.toggle('active', i === active));
      els[active].scrollIntoView({ block: 'nearest' });
    }
    function goResult(route) { closeSearch(); go(route); }
    input.addEventListener('input', renderResults);
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) goResult(items[active].route); }
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSearch(); });
    input.focus();
  }
  function closeSearch() { const ov = $('#search-overlay'); if (ov) ov.remove(); searchOpen = false; }

  /* ================= SESSION MENU (save / load) ================= */
  function appToast(msg) {
    document.querySelectorAll('.pwa-toast').forEach((n) => n.remove());
    const t = document.createElement('div');
    t.id = 'app-toast'; t.className = 'pwa-toast'; t.setAttribute('role', 'status');
    const span = document.createElement('span'); span.textContent = msg; t.appendChild(span);
    const x = document.createElement('button');
    x.className = 'pwa-toast-x'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '✕';
    x.addEventListener('click', () => t.remove());
    t.appendChild(x);
    document.body.appendChild(t);
    setTimeout(() => { if (document.getElementById('app-toast') === t) t.remove(); }, 5000);
  }

  function closeSessionMenu() {
    const m = document.getElementById('session-menu'); if (m) m.remove();
    const b = $('#session-btn'); if (b) b.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', outsideSessionClick);
    document.removeEventListener('keydown', sessionMenuKey);
  }
  function outsideSessionClick(e) {
    const m = document.getElementById('session-menu'); const b = $('#session-btn');
    if (m && !m.contains(e.target) && b && !b.contains(e.target)) closeSessionMenu();
  }
  function sessionMenuKey(e) {
    if (e.key === 'Escape') { closeSessionMenu(); const b = $('#session-btn'); if (b) b.focus(); }
  }
  function toggleSessionMenu() {
    if (document.getElementById('session-menu')) { closeSessionMenu(); return; }
    const btn = $('#session-btn');
    const menu = document.createElement('div');
    menu.id = 'session-menu'; menu.className = 'menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<button role="menuitem" data-sess="save">' +
        '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
        'Save session…</button>' +
      '<button role="menuitem" data-sess="load">' +
        '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
        'Load session…</button>';
    btn.parentNode.appendChild(menu);
    btn.setAttribute('aria-expanded', 'true');
    on('#session-menu [data-sess]', 'click', function () {
      const act = this.getAttribute('data-sess');
      closeSessionMenu();
      if (act === 'save') doSaveSession(); else doLoadSession();
    });
    setTimeout(() => document.addEventListener('click', outsideSessionClick), 0);
    document.addEventListener('keydown', sessionMenuKey);
    const first = menu.querySelector('button'); if (first) first.focus();
  }

  function doSaveSession() {
    Settings.saveSession().then(function (r) {
      if (!r || r.cancelled) return;
      if (r.ok) appToast((r.method === 'download' ? 'Session downloaded: ' : 'Session saved: ') + r.name);
      else appToast('Could not save session' + (r.error ? ': ' + r.error : '.'));
    });
  }
  function doLoadSession() {
    Settings.loadSession().then(function (r) {
      if (!r || r.cancelled) return;
      if (r.ok) { appToast('Loaded session (' + r.count + ' items). Reloading…'); setTimeout(() => location.reload(), 850); }
      else appToast('Could not load session' + (r.error ? ': ' + r.error : '.'));
    });
  }

  /* ================= DIFFICULTY MENU (experience level) ================= */
  const LEVEL_OPTS = [
    ['none', 'New to Kubernetes', 'Start from the basics'],
    ['light', 'Some experience', 'Reinforce the fundamentals'],
    ['heavy', 'Experienced', 'Diagnose-first · harder questions'],
  ];
  function closeLevelMenu() {
    const m = document.getElementById('level-menu'); if (m) m.remove();
    const b = $('#level-btn'); if (b) b.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', outsideLevelClick);
    document.removeEventListener('keydown', levelMenuKey);
  }
  function outsideLevelClick(e) {
    const m = document.getElementById('level-menu'); const b = $('#level-btn');
    if (m && !m.contains(e.target) && b && !b.contains(e.target)) closeLevelMenu();
  }
  function levelMenuKey(e) {
    if (e.key === 'Escape') { closeLevelMenu(); const b = $('#level-btn'); if (b) b.focus(); }
  }
  function toggleLevelMenu() {
    if (document.getElementById('level-menu')) { closeLevelMenu(); return; }
    const btn = $('#level-btn');
    const cur = Settings.level();
    const menu = document.createElement('div');
    menu.id = 'level-menu'; menu.className = 'menu menu-wide'; menu.setAttribute('role', 'menu');
    menu.innerHTML = '<div class="menu-head">Difficulty</div>' + LEVEL_OPTS.map(function (o) {
      const on = o[0] === cur;
      return '<button role="menuitemradio" aria-checked="' + (on ? 'true' : 'false') + '" data-setlevel="' + o[0] + '" class="' + (on ? 'cur' : '') + '">' +
        '<span class="menu-check" aria-hidden="true">' + (on ? '✓' : '') + '</span>' +
        '<span class="menu-main"><strong>' + o[1] + '</strong><span class="menu-sub">' + o[2] + '</span></span></button>';
    }).join('');
    btn.parentNode.appendChild(menu);
    btn.setAttribute('aria-expanded', 'true');
    on('#level-menu [data-setlevel]', 'click', function () {
      const v = this.getAttribute('data-setlevel');
      const label = this.querySelector('strong').textContent;
      closeLevelMenu();
      Settings.set({ level: v });
      updateChrome(); route();
      appToast('Difficulty: ' + label);
    });
    setTimeout(function () { document.addEventListener('click', outsideLevelClick); }, 0);
    document.addEventListener('keydown', levelMenuKey);
    const c = menu.querySelector('.cur') || menu.querySelector('button'); if (c) c.focus();
  }

  /* ---- Adaptive difficulty: offer to level up when performance is strong ---- */
  function maybeSuggestLevelUp() {
    if (!window.Settings) return;
    const lvl = Settings.level();
    if (lvl === 'heavy') return;                 // already at the top
    const asked = Store.get('levelUpAsked', {});
    if (asked[lvl]) return;                       // only offer once per level
    // practice/exam signal
    const stats = Progress.stats();
    let answered = 0, correct = 0;
    Object.keys(stats).forEach(function (k) { answered += stats[k].answered || 0; correct += stats[k].correct || 0; });
    const pAcc = answered ? correct / answered : 0;
    // flashcard signal
    const cs = (Progress.cardStats) ? Progress.cardStats() : { answered: 0, acc: 0 };
    const strongPractice = answered >= 20 && pAcc >= 0.85;
    const strongCards = cs.answered >= 15 && cs.acc >= 0.80;
    if (strongPractice && strongCards) showLevelUpPrompt(lvl);
  }
  function showLevelUpPrompt(curLevel) {
    if (document.getElementById('levelup-overlay')) return;
    const next = curLevel === 'none' ? 'light' : 'heavy';
    const nextLabel = next === 'heavy' ? 'Experienced' : 'Some experience';
    const asked = Store.get('levelUpAsked', {}); asked[curLevel] = true; Store.set('levelUpAsked', asked);
    const ov = document.createElement('div');
    ov.className = 'search-overlay'; ov.id = 'levelup-overlay';
    ov.innerHTML = '<div class="search-box onboard-box" role="dialog" aria-label="Level up?">' +
      '<h2 style="margin:2px 4px 6px">🚀 You\'re on a roll!</h2>' +
      '<p class="muted" style="margin:0 4px 16px">You\'ve been scoring high on practice and flashcards. Want to step up to <strong>' + esc(nextLabel) + '</strong> — harder questions and type-the-answer flashcards?</p>' +
      '<div class="btn-row" style="justify-content:flex-end">' +
        '<button class="btn ghost" data-lvlup="no">Keep current</button>' +
        '<button class="btn primary" data-lvlup="yes">Yes, level up</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    on('#levelup-overlay [data-lvlup]', 'click', function () {
      const yes = this.getAttribute('data-lvlup') === 'yes';
      ov.remove();
      if (yes) { Settings.set({ level: next }); updateChrome(); route(); appToast('Difficulty bumped to ' + nextLabel + ' 💪'); }
    });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    ov.tabIndex = -1; ov.focus();
  }

  /* ================= KEYBOARD SHORTCUTS ================= */
  function showShortcutsHelp() {
    const ov = document.createElement('div');
    ov.className = 'search-overlay'; ov.id = 'shortcuts-overlay';
    const rows = [
      ['⌘K / Ctrl K', 'Open search'],
      ['1 – 9', 'Select an answer (quiz & flashcards)'],
      ['Enter', 'Next question / reveal flashcard'],
      ['Space', 'Flip flashcard'],
      ['G then D', 'Go to Dashboard'],
      ['?', 'Show this help'],
      ['Esc', 'Close overlay'],
    ];
    ov.innerHTML = '<div class="search-box" role="dialog" aria-label="Keyboard shortcuts"><h2 style="margin:4px 4px 12px">Keyboard shortcuts</h2>' +
      '<div class="kbd-list">' + rows.map((r) => '<div class="kbd-row"><kbd>' + esc(r[0]) + '</kbd><span>' + esc(r[1]) + '</span></div>').join('') + '</div>' +
      '<div class="btn-row mt" style="justify-content:flex-end"><button class="btn sm" data-act="close-ov">Close</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || (e.target.getAttribute && e.target.getAttribute('data-act') === 'close-ov')) ov.remove(); });
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape') ov.remove(); });
    ov.tabIndex = -1; ov.focus();
  }

  let gPressed = false;
  function handleKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

    // Cmd/Ctrl+K — search (works even while typing elsewhere)
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); searchOpen ? closeSearch() : openSearch(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === '?') { e.preventDefault(); showShortcutsHelp(); return; }
    if (e.key === 'Escape') { closeSearch(); return; }

    // g d → dashboard
    if (e.key === 'g') { gPressed = true; setTimeout(() => { gPressed = false; }, 700); return; }
    if (gPressed) {
      gPressed = false;
      const map = { d: '#/dashboard', l: '#/learn', c: '#/cards', p: '#/practice', r: '#/readiness', s: '#/settings', k: '#/reference' };
      if (map[e.key]) { e.preventDefault(); go(map[e.key]); return; }
    }

    const route = parseRoute().parts[0];

    // Quiz answering
    if (route === 'practice' && session) {
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const opt = $all('#opts .option')[idx];
        if (opt) { e.preventDefault(); opt.click(); }
      } else if (e.key === 'Enter') {
        const b = $('#next') || $('#finish'); if (b) { e.preventDefault(); b.click(); }
      } else if (e.key === 'ArrowLeft') { const b = $('#prev'); if (b) b.click(); }
      return;
    }

    // Flashcards
    if (route === 'cards' && deck) {
      if (dPhase === 'answer') {
        if (deck.mode === 'flip' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); const c = $('#fcard'); if (c) c.click(); }
        else if (deck.mode === 'easy' && /^[1-9]$/.test(e.key)) { const opt = $all('#opts .option')[parseInt(e.key, 10) - 1]; if (opt) { e.preventDefault(); opt.click(); } }
      } else { // review phase → rating
        if (/^[1-4]$/.test(e.key)) { const b = $all('[data-grade]')[parseInt(e.key, 10) - 1]; if (b) { e.preventDefault(); b.click(); } }
      }
    }
  }

  /* ================= PROGRESS REPORT (for your manager) ================= */
  // Self-contained styles — injected on-page (CSP allows inline <style>) and
  // reused for the standalone HTML download so the file looks identical.
  const REPORT_CSS =
    ".rp-doc{background:#fff;color:#1a1a1a;max-width:840px;margin:0 auto;padding:40px 44px;border-radius:12px;box-shadow:0 12px 44px rgba(0,0,0,.28);font-family:'Montserrat',Arial,Helvetica,sans-serif;line-height:1.5}" +
    ".rp-doc *{box-sizing:border-box}" +
    ".rp-brand{display:flex;align-items:center;gap:13px;border-bottom:3px solid #7855fa;padding-bottom:16px;margin-bottom:18px}" +
    ".rp-mark{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#9278fb,#5615be);color:#fff;display:grid;place-items:center;font-weight:800;font-size:21px;flex:none}" +
    ".rp-title{font-size:21px;font-weight:800;margin:0;color:#131313}" +
    ".rp-sub{color:#6a6a6a;font-size:12.5px;margin:2px 0 0}" +
    ".rp-meta{display:flex;flex-wrap:wrap;gap:6px 26px;font-size:12.5px;color:#555;margin-bottom:20px}" +
    ".rp-meta b{color:#131313}" +
    ".rp-callout{background:#f3efff;border:1px solid #d9cdfb;border-left:4px solid #7855fa;border-radius:8px;padding:14px 16px;margin:0 0 22px;font-size:14.5px;color:#2a2150}" +
    ".rp-verdict{font-weight:800;display:block;margin-bottom:3px;color:#3a1e8a}" +
    ".rp-section{margin:22px 0}" +
    ".rp-section h2{font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:#7855fa;margin:0 0 12px}" +
    ".rp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}" +
    ".rp-stat{border:1px solid #e4e4ea;border-radius:9px;padding:12px 14px}" +
    ".rp-n{font-size:21px;font-weight:800;color:#131313}" +
    ".rp-l{font-size:11.5px;color:#6a6a6a;margin-top:2px}" +
    ".rp-table{width:100%;border-collapse:collapse;font-size:13.5px}" +
    ".rp-table th,.rp-table td{text-align:left;padding:8px 10px;border-bottom:1px solid #eee;vertical-align:middle}" +
    ".rp-table th{color:#6a6a6a;font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.4px}" +
    ".rp-table td.rp-num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}" +
    ".rp-bar{height:8px;background:#ededf2;border-radius:99px;overflow:hidden;width:120px;display:inline-block;vertical-align:middle;margin-right:8px}" +
    ".rp-bar>span{display:block;height:100%;background:linear-gradient(90deg,#7855fa,#1fdde9)}" +
    ".rp-bar.good>span{background:#2e9e5a}.rp-bar.warn>span{background:#c98a1a}.rp-bar.bad>span{background:#cc3f37}" +
    ".rp-pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:11.5px;font-weight:700}" +
    ".rp-pill.good{background:#e4f6ec;color:#1c7a45}.rp-pill.warn{background:#fbf0d8;color:#8a610a}.rp-pill.bad{background:#fbe3e0;color:#b5352d}.rp-pill.muted{background:#eee;color:#666}" +
    ".rp-foot{margin-top:26px;padding-top:14px;border-top:1px solid #eee;font-size:10.5px;color:#9a9a9a}";

  function pct1(n, d) { return d ? Math.round((n / d) * 100) : 0; }
  function rpBarCls(p) { return p >= 75 ? 'good' : p >= 55 ? 'warn' : 'bad'; }
  function rpBar(p) { return '<span class="rp-bar ' + rpBarCls(p) + '"><span style="width:' + Math.max(2, p) + '%"></span></span>'; }

  // Self-contained SVG line chart of mock scores over time (inline colors so it
  // works on-page, in the downloaded HTML, and in print).
  function rpMockChart(mocks) {
    if (!mocks.length) return '';
    const data = mocks.slice(0, 15).reverse(); // most-recent 15, oldest → newest
    const W = 720, H = 200, padL = 32, padR = 16, padT = 16, padB = 26;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const n = data.length;
    const x = (i) => padL + (n === 1 ? plotW / 2 : plotW * i / (n - 1));
    const y = (v) => padT + plotH * (1 - v / 100);
    let grid = '';
    [0, 25, 50, 75, 100].forEach((v) => {
      const gy = y(v).toFixed(1);
      grid += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="#eee" stroke-width="1"/>' +
        '<text x="' + (padL - 6) + '" y="' + (y(v) + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="#9a9a9a">' + v + '</text>';
    });
    const passY = y(75).toFixed(1);
    const passLine = '<line x1="' + padL + '" y1="' + passY + '" x2="' + (W - padR) + '" y2="' + passY + '" stroke="#2e9e5a" stroke-width="1.5" stroke-dasharray="5 4"/>' +
      '<text x="' + (W - padR) + '" y="' + (y(75) - 5).toFixed(1) + '" text-anchor="end" font-size="10" fill="#2e9e5a">pass 75%</text>';
    const pts = data.map((m, i) => x(i).toFixed(1) + ',' + y(m.pct).toFixed(1)).join(' ');
    const line = n >= 2 ? '<polyline points="' + pts + '" fill="none" stroke="#7855fa" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' : '';
    let dots = '';
    data.forEach((m, i) => {
      const cx = x(i).toFixed(1), cy = y(m.pct).toFixed(1);
      dots += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + (m.passed ? '#2e9e5a' : '#e14e35') + '"/>' +
        '<text x="' + cx + '" y="' + (y(m.pct) - 9).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#444">' + m.pct + '%</text>';
    });
    const dlabel = (i, anchor) => { const dt = new Date(data[i].date); return '<text x="' + x(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="' + anchor + '" font-size="10" fill="#9a9a9a">' + (dt.getMonth() + 1) + '/' + dt.getDate() + '</text>'; };
    let xlabels = dlabel(0, n === 1 ? 'middle' : 'start');
    if (n > 1) xlabels += dlabel(n - 1, 'end');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Mock exam scores over time" style="display:block;max-width:100%;margin:0 0 14px;font-family:inherit">' +
      grid + passLine + line + dots + xlabels + '</svg>';
  }

  function gatherReportData() {
    const r = Readiness.compute();
    const cd = StudyPlan.countdown();
    const plan = StudyPlan.build();
    const hist = Progress.history();
    const mocks = hist.filter((h) => h && h.mode === 'mock')
      .map((h) => Object.assign({}, h, { pct: Number(h.pct) || 0, passed: !!h.passed }));
    const bestMock = mocks.reduce((m, h) => Math.max(m, h.pct), 0);
    const stats = Progress.stats();
    let ans = 0, cor = 0;
    Object.keys(stats).forEach((k) => { ans += stats[k].answered || 0; cor += stats[k].correct || 0; });
    const fc = Flashcards.stats(null);
    const st = Progress.streak();
    const s = Settings.get();
    const today = new Date();
    return {
      r, cd, plan, mocks, bestMock,
      answered: ans, practiceAcc: pct1(cor, ans),
      fc, streak: st,
      name: (s.reportName || '').trim(),
      booked: s.examBookedDate || null,
      level: StudyPlan.approach().label,
      dateStr: today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      narrative: reportNarrative(r, cd.days),
    };
  }

  function reportNarrative(r, days) {
    if (r.totalAnswered < 20) {
      return { verdict: 'Getting started', text: 'Baseline assessment is in progress. A reliable readiness estimate will firm up after the diagnostic and a bit more practice.' };
    }
    const margin = r.predictedScore - r.passPct;
    const verdict = r.likelihood === 'High' ? 'On track to pass'
      : r.likelihood === 'Moderate' ? 'On pace'
      : r.likelihood === 'Building' ? 'Building toward readiness'
      : 'Early progress';
    const text = 'Current readiness is ' + r.readiness + '% with a predicted exam score of ~' + r.predictedScore +
      '% against a ' + r.passPct + '% pass mark — ' +
      (margin >= 0 ? margin + ' point' + (margin === 1 ? '' : 's') + ' above' : Math.abs(margin) + ' point' + (Math.abs(margin) === 1 ? '' : 's') + ' below') +
      ' the line, with ' + days + ' day' + (days === 1 ? '' : 's') + ' before the deadline.';
    return { verdict, text };
  }

  function buildReportDoc(d) {
    const stat = (n, l) => '<div class="rp-stat"><div class="rp-n">' + n + '</div><div class="rp-l">' + l + '</div></div>';
    const likeCls = d.r.likelihoodClass === 'good' ? 'good' : d.r.likelihoodClass === 'bad' ? 'bad' : d.r.likelihoodClass === 'warn' ? 'warn' : 'muted';
    const assessed = d.r.totalAnswered >= 20;

    const domainRows = d.r.perDomain.map((dm) => {
      const has = dm.answered > 0;
      return '<tr><td>' + esc(dm.name) + '</td><td class="rp-num">' + dm.weight + '%</td>' +
        '<td>' + (has ? rpBar(dm.masteryPct) + dm.masteryPct + '%' : '<span class="rp-pill muted">not started</span>') + '</td>' +
        '<td class="rp-num">' + dm.answered + '</td></tr>';
    }).join('');

    const mockRows = d.mocks.slice(0, 6).map((m) => {
      const dt = new Date(m.date);
      return '<tr><td>' + dt.toLocaleDateString() + '</td><td class="rp-num">' + m.pct + '%</td>' +
        '<td><span class="rp-pill ' + (m.passed ? 'good' : 'warn') + '">' + (m.passed ? 'Pass' : 'Below pass') + '</span></td></tr>';
    }).join('');

    return '<div class="rp-doc" id="rp-doc">' +
      '<div class="rp-brand"><div class="rp-mark">K</div><div><h1 class="rp-title">KCNA Certification — Progress Report</h1>' +
        '<p class="rp-sub">Kubernetes &amp; Cloud Native Associate · prepared with KCNA Prep</p></div></div>' +
      '<div class="rp-meta">' +
        '<span>Prepared by <b id="rp-prepared">' + (d.name ? esc(d.name) : '—') + '</b></span>' +
        '<span>Generated <b>' + esc(d.dateStr) + '</b></span>' +
        '<span>Target <b>pass by ' + esc(d.cd.examLabel) + '</b></span>' +
        '<span><b>' + d.cd.days + '</b> days remaining</span>' +
        '<span>Exam <b id="rp-booked-val">' + (d.booked ? 'scheduled for ' + esc(d.booked) : 'not yet scheduled') + '</b></span>' +
      '</div>' +
      '<div class="rp-callout"><span class="rp-verdict">' + esc(d.narrative.verdict) + '</span>' + esc(d.narrative.text) + '</div>' +

      '<div class="rp-section"><h2>Readiness</h2><div class="rp-grid">' +
        stat(d.r.readiness + '%', 'Overall readiness') +
        stat(assessed ? '~' + d.r.predictedScore + '%' : '—', 'Predicted exam score') +
        stat('<span class="rp-pill ' + likeCls + '">' + esc(d.r.likelihood) + '</span>', 'Pass likelihood') +
        stat(esc(d.level), 'Study track') +
      '</div></div>' +

      '<div class="rp-section"><h2>Study activity</h2><div class="rp-grid">' +
        stat(d.answered, 'Questions answered') +
        stat(d.answered ? d.practiceAcc + '%' : '—', 'Practice accuracy') +
        stat(d.bestMock ? d.bestMock + '%' : '—', 'Best mock score') +
        stat(d.mocks.length, 'Mock exams taken') +
        stat(d.fc.mastered + ' / ' + d.fc.total, 'Flashcards mastered') +
        stat(d.streak.current + (d.streak.current === 1 ? ' day' : ' days'), 'Current study streak') +
        stat(d.plan.doneTasks + ' / ' + d.plan.totalTasks, 'Study-plan tasks done') +
      '</div></div>' +

      '<div class="rp-section"><h2>Domain mastery (by exam weight)</h2><table class="rp-table">' +
        '<thead><tr><th>Domain</th><th class="rp-num">Weight</th><th>Mastery</th><th class="rp-num">Answered</th></tr></thead>' +
        '<tbody>' + domainRows + '</tbody></table></div>' +

      (d.mocks.length ? '<div class="rp-section"><h2>Mock exam scores over time</h2>' + rpMockChart(d.mocks) +
        '<table class="rp-table"><thead><tr><th>Date</th><th class="rp-num">Score</th><th>Result</th></tr></thead><tbody>' + mockRows + '</tbody></table></div>' : '') +

      '<div class="rp-foot">Generated by KCNA Prep — an independent study app. Progress reflects in-app practice and is self-reported; it is not affiliated with or endorsed by the CNCF, the Linux Foundation, or Nutanix.</div>' +
      '</div>';
  }

  function buildReportText(d) {
    const lines = [];
    lines.push('KCNA Certification — Progress Report' + (d.name ? ' — ' + d.name : ''));
    lines.push('Generated ' + d.dateStr);
    lines.push('Target: pass by ' + d.cd.examLabel + ' (' + d.cd.days + ' days remaining)');
    lines.push('Exam: ' + (d.booked ? 'scheduled for ' + d.booked : 'not yet scheduled'));
    lines.push('');
    lines.push(d.narrative.verdict + '. ' + d.narrative.text);
    lines.push('');
    lines.push('Readiness: ' + d.r.readiness + '%  |  Predicted score: ' + (d.r.totalAnswered >= 20 ? '~' + d.r.predictedScore + '%' : 'n/a') + '  |  Pass likelihood: ' + d.r.likelihood);
    lines.push('Questions answered: ' + d.answered + (d.answered ? ' (' + d.practiceAcc + '% correct)' : ''));
    lines.push('Best mock score: ' + (d.bestMock ? d.bestMock + '%' : 'n/a') + ' across ' + d.mocks.length + ' mock exam(s)');
    lines.push('Flashcards mastered: ' + d.fc.mastered + ' / ' + d.fc.total + '  |  Study streak: ' + d.streak.current + ' days');
    lines.push('Study plan: ' + d.plan.doneTasks + ' / ' + d.plan.totalTasks + ' tasks done');
    lines.push('');
    lines.push('Domain mastery (by exam weight):');
    d.r.perDomain.forEach((dm) => {
      lines.push('  - ' + dm.name + ' (' + dm.weight + '%): ' + (dm.answered ? dm.masteryPct + '%' : 'not started'));
    });
    return lines.join('\n');
  }

  function buildStandaloneHtml(d) {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src \'self\' data:; style-src \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri \'none\'; form-action \'none\'">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>KCNA Progress Report' + (d.name ? ' — ' + esc(d.name) : '') + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">' +
      '<style>body{margin:0;background:#eceef3;padding:24px}' + REPORT_CSS +
      '@media print{body{background:#fff;padding:0}.rp-doc{box-shadow:none;border-radius:0;max-width:none}}</style></head>' +
      '<body>' + buildReportDoc(d) + '</body></html>';
  }

  function reportFilename(name) {
    const who = (name || 'You').replace(/[^\w \-]/g, '').trim() || 'You';
    const stamp = new Date().toISOString().slice(0, 10);
    return 'KCNA Progress Report - ' + who + ' - ' + stamp + '.html';
  }
  function rpMsg(text) { const el = $('#rp-msg'); if (el) el.innerHTML = '<span class="pill good">' + esc(text) + '</span>'; }

  function refreshReportDoc() {
    const cur = document.getElementById('rp-doc');
    if (cur) cur.outerHTML = buildReportDoc(gatherReportData());
  }

  function viewReport() {
    if (!KCNA.ready()) return render(notReady());
    const d = gatherReportData();
    render('<div class="page-head no-print"><h1>Progress report</h1><p>A clean summary for your manager — print it, download it to email, or copy a text version.</p></div>' +
      '<style>' + REPORT_CSS + '</style>' +
      '<div class="card rp-controls no-print"><div class="rp-fields">' +
        '<label class="rp-field"><span>Prepared by</span><input id="rp-name" class="fc-input" placeholder="Your name" autocomplete="name" value="' + esc(d.name) + '"></label>' +
        '<label class="rp-field"><span>Exam scheduled for (optional)</span><input id="rp-booked" type="date" class="fc-input" value="' + esc(d.booked || '') + '"></label>' +
      '</div>' +
      '<div class="btn-row mt"><button class="btn primary" id="rp-print">🖨️ Print / Save as PDF</button>' +
        '<button class="btn" id="rp-download">⬇️ Download (.html)</button>' +
        '<button class="btn" id="rp-copy">📋 Copy summary</button></div>' +
      '<div id="rp-msg" class="mt" aria-live="polite"></div></div>' +
      buildReportDoc(d));

    let rpNameT;
    $('#rp-name').addEventListener('input', function () {
      const v = this.value;
      clearTimeout(rpNameT);
      rpNameT = setTimeout(function () { Settings.set({ reportName: v }); refreshReportDoc(); }, 250);
    });
    $('#rp-booked').addEventListener('change', function () { Settings.set({ examBookedDate: this.value || null }); refreshReportDoc(); });
    $('#rp-print').addEventListener('click', function () { window.print(); });
    $('#rp-download').addEventListener('click', function () {
      const data = gatherReportData();
      const blob = new Blob([buildStandaloneHtml(data)], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = reportFilename(data.name);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      rpMsg('Report downloaded.');
    });
    $('#rp-copy').addEventListener('click', function () {
      const text = buildReportText(gatherReportData());
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { rpMsg('Summary copied to clipboard.'); },
          function () { rpMsg('Copy failed — select the downloaded file instead.'); });
      } else { rpMsg('Clipboard not available — use Download instead.'); }
    });
  }

  /* ================= ROUTER ================= */
  /* ================= ABOUT / README / CONTRIBUTORS / CHANGELOG (in-app) ================= */
  const REPO_URL = 'https://github.com/seanyfresh/kcna-prep';

  function viewAbout() {
    const v = (window.KCNA && KCNA.meta && KCNA.meta.version) || '';
    render('<div class="page-head"><h1>About KCNA Prep</h1><p>A free, offline-capable study app for the Kubernetes &amp; Cloud Native Associate exam.</p></div>' +
      '<div class="card prose">' +
        '<p>KCNA Prep bundles exam-focused study notes, spaced-repetition flashcards, weighted practice and mock exams, an honest readiness model, a searchable knowledge base, and a deadline-aware study plan — all running entirely in your browser. Your progress is stored only on this device.</p>' +
        '<p>It is an independent, open-source project, and is not affiliated with or endorsed by the CNCF, the Linux Foundation, or Nutanix.</p>' +
      '</div>' +
      '<div class="card mt"><div class="btn-row">' +
        '<a class="btn" href="#/readme">📖 README</a>' +
        '<a class="btn" href="#/changelog">🗒️ Changelog</a>' +
        '<a class="btn" href="#/contributors">👥 Contributors</a>' +
        '<a class="btn ghost" href="' + REPO_URL + '" target="_blank" rel="noopener noreferrer">View source on GitHub ↗</a>' +
      '</div>' + (v ? '<p class="muted mt" style="font-size:13px;margin-bottom:0">Version ' + esc(v) + '</p>' : '') + '</div>');
  }

  const CONTRIBUTORS = [
    { name: 'Sean (seanyfresh)', role: 'Creator & maintainer', note: 'Built and maintains KCNA Prep.' },
    { name: 'Michael Gaspard', role: 'Security review', note: 'Prompted the CSRF / SSRF / XSS audit that hardened the app.' },
    { name: 'Ross Davies', role: 'UX & product feedback', note: 'Proposed the top-bar difficulty indicator and dropping the unused Offline pill.' },
  ];
  function viewContributors() {
    const cards = CONTRIBUTORS.map(function (c) {
      const initial = esc((c.name.trim().charAt(0) || '?').toUpperCase());
      return '<div class="contrib"><div class="contrib-avatar" aria-hidden="true">' + initial + '</div>' +
        '<div><div class="contrib-name">' + esc(c.name) + '</div>' +
        '<div class="contrib-role">' + esc(c.role) + '</div>' +
        '<div class="muted" style="font-size:13px">' + esc(c.note) + '</div></div></div>';
    }).join('');
    render('<div class="page-head"><h1>Contributors</h1><p>KCNA Prep is built in the open. Thanks to everyone who has helped make it better.</p></div>' +
      '<div class="card"><div class="contrib-grid">' + cards + '</div>' +
        '<p class="muted mt" style="font-size:13px;margin-bottom:0">See the full commit history on <a href="' + REPO_URL + '/graphs/contributors" target="_blank" rel="noopener noreferrer">GitHub ↗</a>.</p></div>');
  }

  /* ---- minimal, escape-first Markdown renderer for the bundled .md files ---- */
  function mdInline(raw) {
    const codes = [], Z = String.fromCharCode(0);
    let s = String(raw).replace(/`([^`]+)`/g, function (m, c) { codes.push(c); return Z + (codes.length - 1) + Z; });
    s = esc(s);
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');                       // drop images (badges are external / CSP-blocked)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (m, txt, url) {
      return '<a href="' + esc(safeUrl(url)) + '"' + (/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + txt + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
         .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
         .replace(/(^|[^\w*])_([^_\s][^_]*?)_(?=[^\w*]|$)/g, '$1<em>$2</em>');  // _emphasis_ (intraword-safe)
    s = s.replace(new RegExp(Z + '(\\d+)' + Z, 'g'), function (m, i) { return '<code>' + esc(codes[+i]) + '</code>'; });
    return s;
  }
  function mdToHtml(src) {
    const lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    const N = lines.length;
    const rawHtml = /^\s*<\/?(div|img|p|br|center|span|a|picture|source|table|tr|td|th|h[1-6])\b[^>]*>\s*$/i;
    const badgeOnly = /^\s*\[?!\[[^\]]*\]\([^)]*\)\]?(\([^)]*\))?\s*$/;
    const ulRe = /^\s*[-*]\s+(.*)$/, olRe = /^\s*\d+\.\s+(.*)$/;
    const blank = function (l) { return /^\s*$/.test(l); };
    // A line that begins a new block ends the current paragraph/list-item, so we
    // know where to stop gathering soft-wrapped (hard-wrapped) continuation lines.
    const startsBlock = function (l) {
      return blank(l) || /^\s*```/.test(l) || /^\s*#{1,6}\s+/.test(l) ||
        /^\s*([-*_])(\s*\1){2,}\s*$/.test(l) || /^\s*>\s?/.test(l) ||
        ulRe.test(l) || olRe.test(l) || /^\s*\|.*\|\s*$/.test(l) ||
        rawHtml.test(l) || badgeOnly.test(l);
    };
    let html = '', i = 0;
    while (i < N) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {                                     // fenced code block
        i++; const code = [];
        while (i < N && !/^\s*```/.test(lines[i])) { code.push(esc(lines[i])); i++; }
        i++; html += '<pre><code>' + code.join('\n') + '</code></pre>'; continue;
      }
      if (rawHtml.test(line) || badgeOnly.test(line) || blank(line)) { i++; continue; } // strip / skip
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < N && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[i + 1])) {
        const parseRow = function (l) { return l.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
        const head = parseRow(line); i += 2; let body = '';
        while (i < N && /^\s*\|.*\|\s*$/.test(lines[i])) {
          body += '<tr>' + parseRow(lines[i]).map(function (c) { return '<td>' + mdInline(c) + '</td>'; }).join('') + '</tr>'; i++;
        }
        html += '<div class="prose-table-wrap"><table class="prose-table"><thead><tr>' +
          head.map(function (c) { return '<th>' + mdInline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
        continue;
      }
      let m;
      if ((m = line.match(/^\s*(#{1,6})\s+(.*)$/))) { const lv = Math.min(m[1].length, 4); html += '<h' + lv + '>' + mdInline(m[2]) + '</h' + lv + '>'; i++; continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { html += '<hr>'; i++; continue; }
      if (/^\s*>\s?/.test(line)) {                                    // blockquote (gather lines)
        const q = [];
        while (i < N && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        html += '<blockquote>' + mdInline(q.join(' ')) + '</blockquote>'; continue;
      }
      if (ulRe.test(line) || olRe.test(line)) {                       // list (gather items + soft-wrapped continuations)
        const ordered = olRe.test(line), re = ordered ? olRe : ulRe;
        let items = '', ml;
        while (i < N && (ml = lines[i].match(re))) {
          let text = ml[1]; i++;
          while (i < N && !startsBlock(lines[i])) { text += ' ' + lines[i].trim(); i++; }
          items += '<li>' + mdInline(text) + '</li>';
        }
        html += '<' + (ordered ? 'ol' : 'ul') + '>' + items + '</' + (ordered ? 'ol' : 'ul') + '>'; continue;
      }
      const para = [line]; i++;                                       // paragraph (gather soft-wrapped lines)
      while (i < N && !startsBlock(lines[i])) { para.push(lines[i]); i++; }
      html += '<p>' + mdInline(para.join(' ')) + '</p>';
    }
    return html;
  }

  let mdReq = 0;
  function viewMarkdown(title, sub, file, ghUrl) {
    const token = ++mdReq;
    render('<div class="page-head"><h1>' + esc(title) + '</h1><p>' + esc(sub) + '</p></div>' +
      '<div class="card"><div id="md-body" class="prose"><p class="muted">Loading…</p></div>' +
      '<p class="muted mt" style="font-size:13px;margin-bottom:0">View the original on <a href="' + esc(ghUrl) + '" target="_blank" rel="noopener noreferrer">GitHub ↗</a>.</p></div>');
    fetch(file).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (text) { if (token !== mdReq) return; const el = document.getElementById('md-body'); if (el) el.innerHTML = mdToHtml(text); })
      .catch(function () { if (token !== mdReq) return; const el = document.getElementById('md-body'); if (el) el.innerHTML = '<p class="muted">This needs a connection to load. <a href="' + esc(ghUrl) + '" target="_blank" rel="noopener noreferrer">Open it on GitHub ↗</a>.</p>'; });
  }
  function viewReadme() { viewMarkdown('README', 'About this project, straight from the repository.', 'README.md', REPO_URL + '/blob/main/README.md'); }
  function viewChangelog() { viewMarkdown('Changelog', 'Every notable change, newest first.', 'CHANGELOG.md', REPO_URL + '/blob/main/CHANGELOG.md'); }

  const ROUTE_TITLES = {
    dashboard: 'Dashboard', learn: 'Learn', note: 'Study note', cards: 'Flashcards',
    practice: 'Practice', readiness: 'Readiness', plan: 'Study plan',
    reference: 'Reference & knowledge base', settings: 'Settings', report: 'Progress report',
    about: 'About', readme: 'README', contributors: 'Contributors', changelog: 'Changelog',
  };

  function route() {
    // Leaving a view: stop any running mock timer so it can't grade a stale session.
    if (sTimer) { clearInterval(sTimer); sTimer = null; }
    const r = parseRoute();
    updateChrome();
    const top = r.parts[0] || 'dashboard';
    if (top !== 'practice') session = null;
    if (top !== 'cards') deck = null;
    setNav(['learn', 'note'].indexOf(top) >= 0 ? 'learn' : top);
    switch (top) {
      case 'dashboard': viewDashboard(); break;
      case 'learn': r.parts[1] ? viewLearnDomain(r.parts[1]) : viewLearn(); break;
      case 'note': viewNote(r.parts[1], r.parts[2]); break;
      case 'cards': viewCards(r.params); break;
      case 'practice': viewPractice(r.params); break;
      case 'readiness': viewReadiness(); break;
      case 'plan': viewPlan(); break;
      case 'reference': viewReference(r.params); break;
      case 'settings': viewSettings(); break;
      case 'report': viewReport(); break;
      case 'about': viewAbout(); break;
      case 'readme': viewReadme(); break;
      case 'contributors': viewContributors(); break;
      case 'changelog': viewChangelog(); break;
      default: viewDashboard();
    }
    // Move focus to main and announce the route for assistive tech.
    try { appEl.focus({ preventScroll: true }); } catch (e) { appEl.focus(); }
    announce((ROUTE_TITLES[top] || 'Page') + ' loaded');
  }

  function toggleNav(open) {
    const nav = $('#mainnav'), btn = $('#nav-toggle');
    const isOpen = open == null ? !nav.classList.contains('open') : open;
    nav.classList.toggle('open', isOpen);
    if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  window.addEventListener('hashchange', route);
  $('#nav-toggle').addEventListener('click', () => toggleNav());
  $('#search-btn').addEventListener('click', openSearch);
  $('#session-btn').addEventListener('click', toggleSessionMenu);
  $('#level-btn').addEventListener('click', toggleLevelMenu);
  appEl.addEventListener('click', function (e) {
    const t = e.target.closest && e.target.closest('[data-act="reload"]');
    if (t) location.reload();
  });
  document.addEventListener('keydown', handleKey);
  if (window.Settings) Settings.apply();
  updateChrome();
  route();
})();
