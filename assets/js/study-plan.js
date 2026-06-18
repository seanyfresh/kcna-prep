/* Personalized study plans from 2026-06-17, ahead of the company deadline to
   pass the KCNA by 2026-10-01. Three variants tailored to Kubernetes experience:
   NONE (new, ~12 wk, foundational), LIGHT (some, ~11 wk, the default), and
   HEAVY (experienced, ~7 wk, diagnose-first & gap-focused). The active plan is
   chosen by Settings.level(). Each variant uses its own task-id prefix so plan
   check-offs stay separate per level. */
window.StudyPlan = (function () {
  const ONE_DAY = 86400000;

  // ---- LIGHT: some experience (default). Each week: focus + targeted tasks. ----
  const LIGHT = [
    {
      focus: 'Orientation + Kubernetes core objects',
      goal: 'Understand what Kubernetes is and the Pod/Deployment model.',
      tasks: [
        ['w1t1', 'Read Learn → Kubernetes Fundamentals: Containers/images, Pods, and Deployments', '#/learn/fundamentals'],
        ['w1t2', 'Run the 25-question Diagnostic to seed your readiness score', '#/practice?diagnostic=1'],
        ['w1t3', 'Flashcards: study the Fundamentals deck (10–15 cards)', '#/cards?domain=fundamentals'],
      ],
    },
    {
      focus: 'Fundamentals — services, config & namespaces',
      goal: 'Know how Pods talk to each other and how config is injected.',
      tasks: [
        ['w2t1', 'Read: Services & networking basics, ConfigMaps/Secrets, Namespaces/labels', '#/learn/fundamentals'],
        ['w2t2', 'Flashcards: continue Fundamentals deck', '#/cards?domain=fundamentals'],
        ['w2t3', 'Practice quiz: Kubernetes Fundamentals (15 questions)', '#/practice?domain=fundamentals'],
      ],
    },
    {
      focus: 'Fundamentals — architecture & scheduling',
      goal: 'Name every control-plane and node component and what it does.',
      tasks: [
        ['w3t1', 'Read: Control plane, Node components, the API, Scheduling, Storage basics', '#/learn/fundamentals'],
        ['w3t2', 'Flashcards: finish the Fundamentals deck', '#/cards?domain=fundamentals'],
        ['w3t3', 'Practice quiz: Fundamentals — aim for 65%+', '#/practice?domain=fundamentals'],
      ],
    },
    {
      focus: 'Container Orchestration — runtime & networking',
      goal: 'Understand CRI/containerd, the CNI, Services, Ingress, NetworkPolicy.',
      tasks: [
        ['w4t1', 'Read Learn → Container Orchestration: runtimes/CRI, networking/CNI, Ingress', '#/learn/orchestration'],
        ['w4t2', 'Flashcards: study the Orchestration deck', '#/cards?domain=orchestration'],
        ['w4t3', 'Practice quiz: Container Orchestration (12 questions)', '#/practice?domain=orchestration'],
      ],
    },
    {
      focus: 'Container Orchestration — mesh, storage & security',
      goal: 'Service mesh basics, CSI/storage, RBAC, and the 4 Cs of security.',
      tasks: [
        ['w5t1', 'Read: Service mesh, CSI/storage, RBAC, the 4 Cs & Pod Security', '#/learn/orchestration'],
        ['w5t2', 'Flashcards: finish the Orchestration deck', '#/cards?domain=orchestration'],
        ['w5t3', 'Practice quiz: Container Orchestration — aim for 65%+', '#/practice?domain=orchestration'],
      ],
    },
    {
      focus: 'Cloud Native Architecture',
      goal: 'Autoscaling, serverless, CNCF governance, open standards, microservices.',
      tasks: [
        ['w6t1', 'Read Learn → Cloud Native Architecture (all topics)', '#/learn/architecture'],
        ['w6t2', 'Flashcards: study the Architecture deck', '#/cards?domain=architecture'],
        ['w6t3', 'Practice quiz: Cloud Native Architecture', '#/practice?domain=architecture'],
      ],
    },
    {
      focus: 'Application Delivery + Observability',
      goal: 'GitOps/CI-CD/Helm (now 16% — high yield) plus the 3 pillars & Prometheus (examined within Architecture).',
      tasks: [
        ['w7t1', 'Read Learn → Application Delivery (CI/CD, GitOps, Helm/Kustomize) — weight doubled to 16%', '#/learn/delivery'],
        ['w7t2', 'Read Learn → Architecture: Observability topics (logs/metrics/traces, Prometheus)', '#/learn/architecture'],
        ['w7t3', 'Flashcards: Delivery + Architecture decks', '#/cards'],
        ['w7t4', 'Practice quizzes: Application Delivery and Architecture', '#/practice'],
      ],
    },
    {
      focus: 'First full mock exam + book your seat',
      goal: 'Sit a timed 60-question mock, review every wrong answer, and schedule the real exam.',
      tasks: [
        ['w8t1', 'Take a full timed Mock Exam (60 Q / 90 min)', '#/practice?mock=1'],
        ['w8t2', 'Review all incorrect answers and read the explanations', '#/readiness'],
        ['w8t3', 'Re-quiz your two weakest domains (see Readiness)', '#/readiness'],
        ['w8t4', '📅 Book your KCNA exam slot now — you must pass by Oct 1', '#/readiness'],
      ],
    },
    {
      focus: 'Targeted weak-area review',
      goal: 'Close the gaps the mock exposed. Re-read notes for weak domains.',
      tasks: [
        ['w9t1', 'Re-read notes for your weakest domains', '#/learn'],
        ['w9t2', 'Flashcard sweep — clear all due cards', '#/cards'],
        ['w9t3', 'Take a second Mock Exam — aim for 75%+', '#/practice?mock=1'],
      ],
    },
    {
      focus: 'Consolidate & confirm',
      goal: 'Lock in 80%+ on mocks and keep flashcards green.',
      tasks: [
        ['w10t1', 'Take a third Mock Exam — aim for 80%+', '#/practice?mock=1'],
        ['w10t2', 'Review any remaining weak topics', '#/readiness'],
        ['w10t3', 'Final flashcard review across all decks', '#/cards'],
      ],
    },
    {
      focus: 'Exam window — sit it before the Oct 1 deadline',
      goal: 'Final confidence pass, then take the exam with time to spare before Oct 1.',
      tasks: [
        ['w11t1', 'One final Mock Exam before your booked date', '#/practice?mock=1'],
        ['w11t2', 'Light flashcard review — no cramming the day before', '#/cards'],
        ['w11t3', 'Check exam logistics: ID, system check, quiet room', '#/readiness'],
        ['w11t4', '🎓 Sit the KCNA exam (must pass by Oct 1)', '#/readiness'],
      ],
    },
  ];

  // ---- NONE: new to Kubernetes (~12 weeks, foundational, gentle pace). ----
  const NONE = [
    { focus: 'Orientation — what containers & Kubernetes are', goal: 'Build the mental model before any quizzes.', tasks: [
      ['n-w1t1', 'Read Learn → Fundamentals: containers, images, OCI (notes 1–2)', '#/learn/fundamentals'],
      ['n-w1t2', 'Skim the Reference glossary to meet the key terms', '#/reference'],
      ['n-w1t3', 'Flashcards (Easy mode): start the Fundamentals deck (~10 cards)', '#/cards?domain=fundamentals'],
    ] },
    { focus: 'Pods & Deployments', goal: 'Understand the core run-a-workload objects.', tasks: [
      ['n-w2t1', 'Read: Pods, ReplicaSets, Deployments', '#/learn/fundamentals'],
      ['n-w2t2', 'Flashcards: continue the Fundamentals deck', '#/cards?domain=fundamentals'],
    ] },
    { focus: 'Services, config & namespaces', goal: 'How Pods talk and how config is injected.', tasks: [
      ['n-w3t1', 'Read: Services, ConfigMaps/Secrets, Namespaces & labels', '#/learn/fundamentals'],
      ['n-w3t2', 'Flashcards: continue Fundamentals', '#/cards?domain=fundamentals'],
      ['n-w3t3', 'Take the 25-question Diagnostic — no pressure, just a baseline', '#/practice?diagnostic=1'],
    ] },
    { focus: 'Cluster architecture', goal: 'Name every control-plane and node component.', tasks: [
      ['n-w4t1', 'Read: control plane, node components, the API, scheduling, storage', '#/learn/fundamentals'],
      ['n-w4t2', 'Flashcards: finish the Fundamentals deck', '#/cards?domain=fundamentals'],
      ['n-w4t3', 'Practice quiz: Fundamentals (starts easy for you)', '#/practice?domain=fundamentals'],
    ] },
    { focus: 'Fundamentals consolidation', goal: 'Lock in the 44% domain before moving on.', tasks: [
      ['n-w5t1', 'Re-read any Fundamentals notes that felt shaky', '#/learn/fundamentals'],
      ['n-w5t2', 'Practice quiz: Fundamentals — aim 55%+', '#/practice?domain=fundamentals'],
    ] },
    { focus: 'Container Orchestration — part 1', goal: 'Runtimes, networking, and routing.', tasks: [
      ['n-w6t1', 'Read Learn → Orchestration: runtimes/CRI, CNI, Ingress', '#/learn/orchestration'],
      ['n-w6t2', 'Flashcards: study the Orchestration deck', '#/cards?domain=orchestration'],
    ] },
    { focus: 'Container Orchestration — part 2 (28%, high yield)', goal: 'Mesh, storage, RBAC, and security.', tasks: [
      ['n-w7t1', 'Read: service mesh, CSI, RBAC, the 4 Cs & Pod Security', '#/learn/orchestration'],
      ['n-w7t2', 'Practice quiz: Container Orchestration', '#/practice?domain=orchestration'],
    ] },
    { focus: 'Cloud Native Architecture (incl. Observability)', goal: 'Autoscaling, CNCF, serverless, the 3 pillars.', tasks: [
      ['n-w8t1', 'Read Learn → Cloud Native Architecture (all topics)', '#/learn/architecture'],
      ['n-w8t2', 'Flashcards: study the Architecture deck', '#/cards?domain=architecture'],
      ['n-w8t3', '📅 Book your KCNA exam slot now — you must pass by Oct 1', '#/readiness'],
    ] },
    { focus: 'Cloud Native Application Delivery (16%)', goal: 'CI/CD, GitOps, Helm, Kustomize.', tasks: [
      ['n-w9t1', 'Read Learn → Application Delivery', '#/learn/delivery'],
      ['n-w9t2', 'Practice quiz: Application Delivery', '#/practice?domain=delivery'],
    ] },
    { focus: 'First full mock exam', goal: 'See where you stand under real conditions.', tasks: [
      ['n-w10t1', 'Take a full timed Mock Exam (60 Q / 90 min)', '#/practice?mock=1'],
      ['n-w10t2', 'Review every wrong answer and read the explanations', '#/readiness'],
    ] },
    { focus: 'Targeted weak-area review', goal: 'Close the gaps the mock exposed.', tasks: [
      ['n-w11t1', 'Re-read notes for your weakest domains (see Readiness)', '#/readiness'],
      ['n-w11t2', 'Flashcard sweep — clear all due cards', '#/cards'],
      ['n-w11t3', 'Second Mock Exam — aim 70%+', '#/practice?mock=1'],
    ] },
    { focus: 'Final review & exam', goal: 'Confirm, then sit it with buffer before Oct 1.', tasks: [
      ['n-w12t1', 'Light review of remaining weak topics', '#/readiness'],
      ['n-w12t2', 'Final flashcard pass across all decks', '#/cards'],
      ['n-w12t3', '🎓 Sit the KCNA exam (must pass by Oct 1)', '#/readiness'],
    ] },
  ];

  // ---- HEAVY: experienced (~7 weeks, diagnose-first, gap-focused). ----
  const HEAVY = [
    { focus: 'Baseline immediately', goal: 'Find your real gaps before studying anything.', tasks: [
      ['h-w1t1', 'Take the 25-question Diagnostic', '#/practice?diagnostic=1'],
      ['h-w1t2', 'Sit a full timed Mock Exam to expose weak spots', '#/practice?mock=1'],
      ['h-w1t3', 'Open Readiness — note your two weakest domains', '#/readiness'],
    ] },
    { focus: 'Hit your weakest domain', goal: 'Attack the biggest gap first.', tasks: [
      ['h-w2t1', 'Re-read notes for your weakest domain', '#/learn'],
      ['h-w2t2', 'Flashcards (Hard / type mode) for that domain', '#/cards'],
      ['h-w2t3', 'Practice quiz that domain — aim 80%+', '#/practice'],
    ] },
    { focus: 'Orchestration nuances (28%)', goal: 'The details hands-on folks still miss.', tasks: [
      ['h-w3t1', 'Read: CRI/CNI/CSI, RBAC, Pod Security Standards, scheduling', '#/learn/orchestration'],
      ['h-w3t2', 'Practice quiz: Container Orchestration', '#/practice?domain=orchestration'],
      ['h-w3t3', '📅 Book your KCNA exam slot now — you must pass by Oct 1', '#/readiness'],
    ] },
    { focus: 'CNCF ecosystem & governance (the classic gap)', goal: 'Trivia/terminology that trips up practitioners.', tasks: [
      ['h-w4t1', 'Read Architecture: CNCF landscape, governance, graduation, open standards', '#/learn/architecture'],
      ['h-w4t2', 'Skim Reference glossary + official links for exact terminology', '#/reference'],
      ['h-w4t3', 'Practice quiz: Cloud Native Architecture', '#/practice?domain=architecture'],
    ] },
    { focus: 'Application Delivery (16% — doubled in the new blueprint)', goal: 'GitOps, Argo CD/Flux, Helm vs Kustomize.', tasks: [
      ['h-w5t1', 'Read Learn → Application Delivery', '#/learn/delivery'],
      ['h-w5t2', 'Practice quiz: Application Delivery', '#/practice?domain=delivery'],
      ['h-w5t3', 'Second Mock Exam — aim 80%+', '#/practice?mock=1'],
    ] },
    { focus: 'Close remaining gaps', goal: 'Drive every domain over the line.', tasks: [
      ['h-w6t1', 'Re-quiz any domain under 80% (see Readiness)', '#/readiness'],
      ['h-w6t2', 'Hard flashcard sweep across all domains', '#/cards'],
    ] },
    { focus: 'Final mock & exam', goal: 'Confirm mastery and sit it early.', tasks: [
      ['h-w7t1', 'Final Mock Exam — aim 85%+', '#/practice?mock=1'],
      ['h-w7t2', '🎓 Sit the KCNA exam (well before Oct 1)', '#/readiness'],
    ] },
  ];

  const TEMPLATES = { none: NONE, light: LIGHT, heavy: HEAVY };

  // Level-specific strategy shown in the UI.
  const APPROACH = {
    none: { label: 'New to Kubernetes', hours: '3–5 hrs/week',
      blurb: 'Start from the ground up. Build a mental model first and lean on flashcards — you have buffer before Oct 1, so don\'t rush the fundamentals (44% of the exam).' },
    light: { label: 'Some experience', hours: '4–6 hrs/week',
      blurb: 'You know the basics. Reinforce fundamentals, then drill the heavier Orchestration (28%) and Delivery (16%) domains and sit mocks.' },
    heavy: { label: 'Experienced', hours: '2–4 hrs/week (accelerated)',
      blurb: 'Diagnose first, then target gaps. Hands-on folks often lose points on CNCF ecosystem/governance trivia and exact terminology — focus there, and practice questions lean harder for you.' },
  };

  function activeLevel() { return (window.Settings && Settings.level) ? Settings.level() : 'light'; }
  function currentTemplate() { return TEMPLATES[activeLevel()] || LIGHT; }
  function approach() { const lvl = activeLevel(); return Object.assign({ level: lvl }, APPROACH[lvl] || APPROACH.light); }

  function parseDate(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function fmt(d) { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }

  function build() {
    const start = parseDate(KCNA.meta.planStart);
    const exam = parseDate(KCNA.meta.examDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checked = Store.get('plan', {});

    const weeks = currentTemplate().map((w, i) => {
      const ws = new Date(start.getTime() + i * 7 * ONE_DAY);
      let we = new Date(ws.getTime() + 6 * ONE_DAY);
      if (we > exam) we = exam;
      const tasks = w.tasks.map((t) => ({ id: t[0], text: t[1], link: t[2], done: !!checked[t[0]] }));
      const doneCount = tasks.filter((t) => t.done).length;
      return {
        index: i, num: i + 1, focus: w.focus, goal: w.goal,
        start: ws, end: we, range: fmt(ws) + ' – ' + fmt(we),
        tasks, doneCount, total: tasks.length,
        isCurrent: today >= ws && today <= we,
        isPast: today > we,
      };
    });

    // if today is before start, first week is "current"
    if (today < start && weeks.length) weeks[0].isCurrent = true;

    const daysLeft = Math.max(0, Math.ceil((exam - today) / ONE_DAY));
    const totalTasks = weeks.reduce((s, w) => s + w.total, 0);
    const doneTasks = weeks.reduce((s, w) => s + w.doneCount, 0);

    return { weeks, daysLeft, exam, start, totalTasks, doneTasks, approach: approach() };
  }

  function toggle(taskId, done) {
    const checked = Store.get('plan', {});
    if (done) checked[taskId] = true; else delete checked[taskId];
    Store.set('plan', checked);
    if (done && window.Progress && Progress.recordStudyDay) Progress.recordStudyDay();
  }

  function countdown() {
    const exam = parseDate(KCNA.meta.examDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.max(0, Math.ceil((exam - today) / ONE_DAY));
    return { days, exam, examLabel: exam.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) };
  }

  return { build, toggle, countdown, approach };
})();
