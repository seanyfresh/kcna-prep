/* Personalized study plan — tuned for a BEGINNER studying LIGHT hours
   (<5 hrs/week) from 2026-06-17, ahead of the company deadline to pass by
   2026-10-01 (~11 weeks of prep, with buffer to schedule & sit the exam).
   High-yield ordering: weight-prioritized, fundamentals first, mocks last. */
window.StudyPlan = (function () {
  const ONE_DAY = 86400000;

  // Each week: focus + targeted tasks. Tasks carry stable ids for checkbox state.
  const TEMPLATE = [
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

  function parseDate(s) { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function fmt(d) { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }

  function build() {
    const start = parseDate(KCNA.meta.planStart);
    const exam = parseDate(KCNA.meta.examDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checked = Store.get('plan', {});

    const weeks = TEMPLATE.map((w, i) => {
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

    return { weeks, daysLeft, exam, start, totalTasks, doneTasks };
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

  return { build, toggle, countdown };
})();
