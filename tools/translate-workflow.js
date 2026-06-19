export const meta = {
  name: 'kcna-ui-translate',
  description: 'Translate the KCNA Prep UI catalog into 9 languages with placeholder validation + QA',
  phases: [
    { title: 'Translate' },
    { title: 'Fix formatting' },
    { title: 'QA review' },
  ],
};

const CATALOG = ["({pct}% correct)", "20 questions across all domains.", "25 balanced questions to assess where you stand and seed your readiness score. Best taken first.", "25-question Diagnostic", "2–4 hrs/week", "3–5 hrs/week", "4–6 hrs/week", "60 questions, weighted exactly like the real KCNA, 90-minute timer. No feedback until the end — just like exam day.", "A clean summary for your manager — print it, download it to email, or copy a text version.", "A new version of KCNA Prep is ready.", "About", "An honest read on whether you are ready to pass the KCNA before the Oct 1 deadline.", "Another round", "Answer", "Answer mode", "Answered", "Appearance", "Application Delivery (16% — doubled in the new blueprint)", "Application Delivery + Observability", "Approaching ready", "Attack the biggest gap first.", "Attempt history", "Auto", "Auto follows your operating system.", "Autoscaling, CNCF, serverless, the 3 pillars.", "Autoscaling, serverless, CNCF governance, open standards, microservices.", "Back", "Back to Learn", "Back to decks", "Baseline assessment is in progress. A reliable readiness estimate will firm up after the diagnostic and a bit more practice.", "Baseline immediately", "Below pass", "Below pass mark", "Best mock score", "Best mock score: {score} across {n} mock exams", "Build the mental model before any quizzes.", "Building", "Building foundation", "Building toward readiness", "By domain", "CI/CD, GitOps, Helm, Kustomize.", "CNCF ecosystem & governance (the classic gap)", "Change level ›", "Change ›", "Changelog", "Changing these updates your countdown, study plan, and readiness.", "Check answer", "Check exam logistics: ID, system check, quiet room", "Check tasks off as you go — progress is saved on this device and feeds your dashboard.", "Choose how you want to be quizzed. Applies to every deck.", "Choose the language for the app interface. Study content stays in English to match the exam.", "Clears flashcard schedule, quiz stats, and plan checkboxes.", "Click the card to reveal the answer", "Clipboard not available — use Download instead.", "Close", "Close deadline warning", "Close remaining gaps", "Close the gaps the mock exposed.", "Close the gaps the mock exposed. Re-read notes for weak domains.", "Cloud Native Application Delivery (16%)", "Cloud Native Architecture", "Cloud Native Architecture (incl. Observability)", "Cluster architecture", "Company deadline", "Company deadline to pass the KCNA.", "Company deadline — pass the KCNA by {date} ({days} days left).", "Concise, exam-focused notes across all five KCNA domains. Ordered by exam weight.", "Confirm mastery and sit it early.", "Confirm, then sit it with buffer before Oct 1.", "Consolidate & confirm", "Container Orchestration — mesh, storage & security", "Container Orchestration — part 1", "Container Orchestration — part 2 (28%, high yield)", "Container Orchestration — runtime & networking", "Content", "Content loading…", "Contributors", "Copy failed — select the downloaded file instead.", "Copy summary", "Correct", "Correct (close enough)", "Correct answer", "Cost / validity", "Could not load session.", "Could not load session: {error}", "Could not save session.", "Could not save session: {error}", "Current readiness is {readiness}% with a predicted exam score of ~{predicted}% against a {pass}% pass mark — {margin}, with {days} days before the deadline.", "Current study streak", "Dark", "Dashboard", "Date", "Deadline & plan", "Deadline (pass by)", "Deadline date", "Deadline warning", "Delivery", "Developing", "Diagnose first, then target gaps. Hands-on folks often lose points on CNCF ecosystem/governance trivia and exact terminology — focus there, and practice questions lean harder for you.", "Diagnose-first · harder questions", "Diagnostic", "Diagnostic Assessment", "Difficulty", "Difficulty bumped to {label} 💪", "Difficulty level", "Difficulty: {label}", "Dismiss", "Display language", "Documentation by domain", "Domain", "Domain mastery", "Domain mastery (by exam weight)", "Domain mastery (by exam weight):", "Domain not found.", "Domain weights", "Download (.html)", "Drive every domain over the line.", "Duration", "Early progress", "Easy", "Exam at a glance", "Exam facts, a searchable glossary, and authoritative documentation for every domain.", "Exam ready", "Exam scheduled for (optional)", "Exam window — sit it before the Oct 1 deadline", "Exam {status}", "Exam: {status}", "Experience level", "Experienced", "Explanation", "Filter glossary terms", "Filter terms…", "Final Mock Exam — aim 85%+", "Final confidence pass, then take the exam with time to spare before Oct 1.", "Final flashcard pass across all decks", "Final flashcard review across all decks", "Final mock & exam", "Final review & exam", "Find your real gaps before studying anything.", "Finish & score ›", "First full mock exam", "First full mock exam + book your seat", "Flashcard sweep — clear all due cards", "Flashcards", "Flashcards (Easy mode): start the Fundamentals deck (~10 cards)", "Flashcards (Hard / type mode) for that domain", "Flashcards mastered", "Flashcards mastered: {mastered} / {total}  |  Study streak: {days} days", "Flashcards: Delivery + Architecture decks", "Flashcards: continue Fundamentals", "Flashcards: continue Fundamentals deck", "Flashcards: continue the Fundamentals deck", "Flashcards: finish the Fundamentals deck", "Flashcards: finish the Orchestration deck", "Flashcards: study the Architecture deck", "Flashcards: study the Fundamentals deck (10–15 cards)", "Flashcards: study the Orchestration deck", "Flip", "Format", "Full", "Full Mock Exam", "Full analysis", "Full mock exam", "Full study plan ›", "Fundamentals consolidation", "Fundamentals — architecture & scheduling", "Fundamentals — services, config & namespaces", "Further reading — official docs", "Generated by KCNA Prep — an independent study app. Progress reflects in-app practice and is self-reported; it is not affiliated with or endorsed by the CNCF, the Linux Foundation, or Nutanix.", "Generated {date}", "Getting started", "GitOps, Argo CD/Flux, Helm vs Kustomize.", "GitOps/CI-CD/Helm (now 16% — high yield) plus the 3 pillars & Prometheus (examined within Architecture).", "Glossary", "Glossary is being compiled. Check back after the next update.", "Great — you are caught up for this domain. Come back later or pick another deck.", "Great — you are caught up. Come back later or pick another deck.", "Hard", "Hard flashcard sweep across all domains", "Hidden", "High", "Hit your weakest domain", "How Pods talk and how config is injected.", "How well did you recall it?", "Immediate feedback after each question.", "Incorrect", "Incorrect — answer: {letter}", "Install", "Install KCNA Prep as an app for offline study and a home-screen icon.", "Install app", "Installed app", "Jump in", "KCNA Certification — Progress Report", "KCNA Progress Report", "Keep current", "Keep practicing across all domains and sit a {link}.", "Keyboard shortcuts", "Know how Pods talk to each other and how config is injected.", "Kubernetes experience", "Language", "Learn", "Level up?", "Light", "Light flashcard review — no cramming the day before", "Light review of remaining weak topics", "Load session…", "Loaded session ({count} items). Reloading…", "Lock in 80%+ on mocks and keep flashcards green.", "Lock in the 44% domain before moving on.", "Low", "Mastery", "Mastery by domain", "Mastery {pct}% · {answered} answered", "Material assessed", "Menu", "Mesh, storage, RBAC, and security.", "Mix of every domain. {mastered} mastered · {learning} learning · {fresh} new.", "Mixed Practice", "Mixed quick quiz", "Mock exam scores over time", "Mock exams taken", "Moderate", "More flashcards", "Motion", "Multiple choice", "Name every control-plane and node component and what it does.", "Name every control-plane and node component.", "New", "New to Kubernetes", "Next ›", "No answer", "No attempts yet. Take a quiz or mock to populate your history.", "No cards due right now", "No glossary terms match “{q}”.", "No questions available yet.", "No results for “{q}”.", "Not found.", "Not practiced yet", "Not quite", "Not started", "Not started yet", "Not yet assessed", "Note", "Note not found.", "Official resources", "Offline", "On pace", "On track to pass", "One final Mock Exam before your booked date", "Online, remotely proctored", "Open Readiness — note your two weakest domains", "Orchestration nuances (28%)", "Orientation + Kubernetes core objects", "Orientation — what containers & Kubernetes are", "Overall progress", "Overall readiness", "PASS", "Page", "Partially right", "Pass", "Pass likelihood", "Passing score", "Personalize KCNA Prep. Everything is stored only on this device.", "Pick the answer you think is correct", "Plan", "Plan start", "Pods & Deployments", "Practice", "Practice accuracy", "Practice by domain", "Practice questions", "Practice quiz that domain — aim 80%+", "Practice quiz: Application Delivery", "Practice quiz: Cloud Native Architecture", "Practice quiz: Container Orchestration", "Practice quiz: Container Orchestration (12 questions)", "Practice quiz: Container Orchestration — aim for 65%+", "Practice quiz: Fundamentals (starts easy for you)", "Practice quiz: Fundamentals — aim 55%+", "Practice quiz: Fundamentals — aim for 65%+", "Practice quiz: Kubernetes Fundamentals (15 questions)", "Practice quizzes: Application Delivery and Architecture", "Predicted exam score", "Predicted exam score <strong>~{score}%</strong> · pass mark {pass}%. Pass likelihood: <span class=\"{cls}\">{likelihood}</span>.", "Prepared by", "Prepared by {name}", "Print / Save as PDF", "Progress report", "Progress reset.", "Question", "Question {n} of {total}", "Questions answered", "Questions answered: {n}", "Quick practice", "Quiz by domain, run a diagnostic, or sit a full timed mock exam (60 questions, 90 minutes, pass at 75%).", "Quiz this domain", "Quiz this domain ›", "Re-quiz any domain under 80% (see Readiness)", "Re-quiz your two weakest domains (see Readiness)", "Re-read any Fundamentals notes that felt shaky", "Re-read notes for your weakest domain", "Re-read notes for your weakest domains", "Re-read notes for your weakest domains (see Readiness)", "Read Architecture: CNCF landscape, governance, graduation, open standards", "Read Learn → Application Delivery", "Read Learn → Application Delivery (CI/CD, GitOps, Helm/Kustomize) — weight doubled to 16%", "Read Learn → Architecture: Observability topics (logs/metrics/traces, Prometheus)", "Read Learn → Cloud Native Architecture (all topics)", "Read Learn → Container Orchestration: runtimes/CRI, networking/CNI, Ingress", "Read Learn → Fundamentals: containers, images, OCI (notes 1–2)", "Read Learn → Kubernetes Fundamentals: Containers/images, Pods, and Deployments", "Read Learn → Orchestration: runtimes/CRI, CNI, Ingress", "Read: CRI/CNI/CSI, RBAC, Pod Security Standards, scheduling", "Read: Control plane, Node components, the API, Scheduling, Storage basics", "Read: Pods, ReplicaSets, Deployments", "Read: Service mesh, CSI/storage, RBAC, the 4 Cs & Pod Security", "Read: Services & networking basics, ConfigMaps/Secrets, Namespaces/labels", "Read: Services, ConfigMaps/Secrets, Namespaces & labels", "Read: control plane, node components, the API, scheduling, storage", "Read: service mesh, CSI, RBAC, the 4 Cs & Pod Security", "Readiness", "Readiness analysis", "Readiness: {readiness}%  |  Predicted score: {predicted}  |  Pass likelihood: {likelihood}", "Reduce animations and transitions.", "Reduced", "Reference", "Reference & knowledge base", "Reinforce the fundamentals", "Reload", "Reload this page once generation finishes.", "Remember to schedule your exam in time — book it now.", "Remember to schedule your exam in time.", "Report downloaded.", "Reset all", "Reset all your progress? This cannot be undone.", "Reset progress", "Reset to defaults", "Reset your study progress? Settings (theme, dates) are kept. This cannot be undone.", "Result", "Review all incorrect answers and read the explanations", "Review all {total} questions", "Review any remaining weak topics", "Review every wrong answer and read the explanations", "Review only", "Run diagnostic", "Run diagnostic ›", "Run the 25-question Diagnostic to seed your readiness score", "Runtimes, networking, and routing.", "Save / load session", "Save dates", "Save or load session", "Save or load your session from the <strong>save icon</strong> in the top bar — handy when several people share this device. Progress is stored on this device until you save it to a file.", "Save session…", "Saved. Countdown and plan updated.", "Score", "Search", "Search  ⌘K", "Search (Ctrl or Cmd + K)", "Search notes, glossary, topics…", "Second Mock Exam — aim 70%+", "Second Mock Exam — aim 80%+", "See full analysis ›", "See the official exam page (includes free retake)", "See where you stand under real conditions.", "Service mesh basics, CSI/storage, RBAC, and the 4 Cs of security.", "Services, config & namespaces", "Session complete", "Session downloaded: {name}", "Session saved: {name}", "Settings", "Show", "Show or hide the dashboard deadline reminder.", "Sit a full timed Mock Exam to expose weak spots", "Sit a timed 60-question mock, review every wrong answer, and schedule the real exam.", "Skim Reference glossary + official links for exact terminology", "Skim the Reference glossary to meet the key terms", "Skip / reveal", "Skip to main content", "Some", "Some experience", "Spaced repetition — cards you find hard come back sooner. {due} due now of {total} total.", "Spelling and capitalization are forgiven — just get the idea across.", "Start from the basics", "Start from the ground up. Build a mental model first and lean on flashcards — you have buffer before Oct 1, so don't rush the fundamentals (44% of the exam).", "Start mixed quiz ›", "Start mock exam ›", "Start session ›", "Study activity", "Study all due", "Study content is being generated", "Study note", "Study notes", "Study plan", "Study plan: {done} / {total} tasks done", "Study track", "Study-plan tasks done", "Summary copied to clipboard.", "Tailored for · {label}", "Tailors your study plan, flashcard default, and practice question difficulty.", "Take a full timed Mock Exam (60 Q / 90 min)", "Take a second Mock Exam — aim for 75%+", "Take a third Mock Exam — aim for 80%+", "Take the 25-question Diagnostic", "Take the 25-question Diagnostic — no pressure, just a baseline", "Take the <strong>Diagnostic</strong> to assess where you stand. You have answered {n} questions so far.", "Take the {link} to establish your baseline.", "Target <b>pass by {date}</b>", "Target: pass by {date} ({days} days remaining)", "Targeted weak-area review", "The details hands-on folks still miss.", "The notes, flashcards and question bank are still being written.", "Theme", "This week — Week {n}", "Trivia/terminology that trips up practitioners.", "Type at least 2 characters. Press Esc to close.", "Type the answer", "Type your answer…", "Understand CRI/containerd, the CNI, Services, Ingress, NetworkPolicy.", "Understand the core run-a-workload objects.", "Understand what Kubernetes is and the Pod/Deployment model.", "Version", "Weak area: {name} at {pct}% — {reread} then {requiz}.", "Week {n}", "Weight", "What to do next", "Works offline after first load", "Yes, level up", "You are tracking well — keep mock scores above {pass}% and flashcards green through exam day.", "You have not practiced {name} ({weight}% of the exam) yet — {link}", "You know the basics. Reinforce fundamentals, then drill the heavier Orchestration (28%) and Delivery (16%) domains and sit mocks.", "You reviewed {n} cards. {due} still due · {mastered} mastered.", "You're on a roll!", "You've been scoring high on practice and flashcards. Want to step up to {label} — harder questions and type-the-answer flashcards?", "Your answer", "Your name", "Your progress", "Your readiness", "Your readiness score has been updated.", "days to pass by", "diagnostic", "done", "easy", "full mock exam", "hard", "medium", "mock", "n/a", "not started", "not yet scheduled", "open ›", "pass {pct}%", "prepared with KCNA Prep", "quiz ›", "re-quiz", "re-read notes", "read ›", "result", "scheduled for {date}", "source ↗", "start a quiz ›", "the right answer is highlighted above.", "this week", "{answered} answered · coverage {coverage}%", "{correct} / {total} correct · pass mark {pass}%", "{days} days remaining", "{days} days until the Oct 1 deadline.", "{days} days · pass by {date}", "{done} / {total} tasks", "{label} track:", "{notes} notes · {cards} cards · {questions} questions", "{n} cards", "{n} days", "{n} due", "{n} mastered", "{n} minutes", "{n} multiple-choice questions", "{n} points above the line", "{n} points below the line", "{page} loaded", "{pct}% of key terms matched", "{questions} questions · {flashcards} cards · {notes} notes", "{questions} questions · {flashcards} flashcards · {notes} notes", "{weight}% of exam", "{weight}% of the exam · {notes} notes", "{weight}% weight", "{weight}% · {questions} questions", "‹ Decks", "‹ Previous", "🎓 Sit the KCNA exam (must pass by Oct 1)", "🎓 Sit the KCNA exam (well before Oct 1)", "📅 Book your KCNA exam slot now — you must pass by Oct 1"];
const LANGS = [{"code": "es", "name": "Spanish", "native": "Español", "rtl": false}, {"code": "pt", "name": "Brazilian Portuguese", "native": "Português", "rtl": false}, {"code": "fr", "name": "French", "native": "Français", "rtl": false}, {"code": "de", "name": "German", "native": "Deutsch", "rtl": false}, {"code": "it", "name": "Italian", "native": "Italiano", "rtl": false}, {"code": "zh", "name": "Simplified Chinese", "native": "简体中文", "rtl": false}, {"code": "ja", "name": "Japanese", "native": "日本語", "rtl": false}, {"code": "hi", "name": "Hindi", "native": "हिन्दी", "rtl": false}, {"code": "ar", "name": "Arabic", "native": "العربية", "rtl": true}];
const OUT_DIR = "/Users/seanyfresh/dev/KCNA/assets/js/i18n";


const CHUNK = 70;
const chunks = [];
for (let i = 0; i < CATALOG.length; i += CHUNK) {
  chunks.push(CATALOG.slice(i, i + CHUNK).map((en, j) => ({ i: i + j, en })));
}

const KEEP =
  'CRITICAL formatting rules — follow exactly:\n' +
  '1. Keep every {placeholder} token (curly braces + name) VERBATIM, same names, same count. Never translate or rename them.\n' +
  '2. Keep every HTML tag VERBATIM with its attributes, e.g. <strong>, </strong>, <b>, <small>, <span class="x">, <a href="#/settings">. Translate only the words between/around tags.\n' +
  '3. Keep these in ENGLISH (do not translate or transliterate) — Kubernetes/CNCF proper nouns and API objects: Kubernetes, KCNA, CNCF, Pod, Pods, Deployment, ReplicaSet, StatefulSet, DaemonSet, Service, Ingress, ConfigMap, ConfigMaps, Secret, Secrets, Namespace, Namespaces, Node, Nodes, kubelet, kube-proxy, kube-scheduler, etcd, control plane, CRI, CNI, CSI, RBAC, Helm, Kustomize, Argo CD, Flux, GitOps, CI/CD, Prometheus, Grafana, OpenTelemetry, OCI, containerd, runc, Pod Security, NetworkPolicy, HPA, VPA. (You MAY translate ordinary words like notes, flashcards, questions, exam, mock, diagnostic, dashboard, settings, readiness.)\n' +
  '4. Keep punctuation/symbols verbatim: the chevrons "›" and "‹", the ellipsis "…", the middot "·", the em dash "—", and every emoji.\n' +
  '5. Preserve leading and trailing spaces.';

const TRANS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { items: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: { i: { type: 'integer' }, target: { type: 'string' } },
    required: ['i', 'target'],
  } } },
  required: ['items'],
};

function transPrompt(lang, items) {
  return 'You are a professional software localizer translating the user interface of "KCNA Prep", a study app for the Kubernetes and Cloud Native Associate exam, into ' +
    lang.name + ' (' + lang.native + ').\n\n' + KEEP +
    '\n\nTranslate each item\'s English text into natural, concise, professional ' + lang.name +
    ' as used in real software UIs (menus, buttons, headings, short help text). Use the language\'s established IT/computing terminology. Tone is friendly but professional.\n\n' +
    'Return { items: [{ i, target }] } with one entry for EVERY input id i. Input (JSON array of {i, en}):\n' +
    JSON.stringify(items);
}

phase('Translate');
const transJobs = [];
LANGS.forEach((lang) => chunks.forEach((chunk, ci) => transJobs.push({ lang, chunk, ci })));

const transResults = await parallel(transJobs.map((j) => () =>
  agent(transPrompt(j.lang, j.chunk), { label: 'tr:' + j.lang.code + '#' + j.ci, phase: 'Translate', schema: TRANS_SCHEMA })
    .then((r) => ({ code: j.lang.code, items: (r && r.items) || [] }))
));

const dicts = {};
LANGS.forEach((l) => { dicts[l.code] = {}; });
transResults.filter(Boolean).forEach((res) => {
  res.items.forEach((it) => {
    const en = CATALOG[it.i];
    if (en != null && typeof it.target === 'string' && it.target.length) dicts[res.code][en] = it.target;
  });
});

function placeholders(s) { return (String(s).match(/\{\w+\}/g) || []).slice().sort(); }
function tags(s) { return (String(s).match(/<[^>]+>/g) || []).map((x) => x.replace(/\s+/g, ' ')).sort(); }
function sameSet(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
function broken(en, tgt) {
  if (tgt == null) return true;
  return !sameSet(placeholders(en), placeholders(tgt)) || !sameSet(tags(en), tags(tgt));
}

const problems = {};
LANGS.forEach((l) => { problems[l.code] = CATALOG.filter((en) => broken(en, dicts[l.code][en])); });

phase('Fix formatting');
const fixJobs = LANGS.filter((l) => problems[l.code].length);
const fixResults = await parallel(fixJobs.map((l) => () => {
  const probItems = problems[l.code].map((en) => ({ i: CATALOG.indexOf(en), en }));
  const prompt = 'These ' + l.name + ' (' + l.native + ') UI translations are missing or broke a formatting rule. ' + KEEP +
    '\n\nRe-translate each into ' + l.name + ', ensuring the target contains EXACTLY the same {placeholders} and HTML tags as the English source. Return { items: [{ i, target }] }. Strings (JSON):\n' +
    JSON.stringify(probItems);
  return agent(prompt, { label: 'fix:' + l.code, phase: 'Fix formatting', schema: TRANS_SCHEMA })
    .then((r) => ({ code: l.code, items: (r && r.items) || [] }));
}));
fixResults.filter(Boolean).forEach((res) => {
  res.items.forEach((it) => {
    const en = CATALOG[it.i];
    if (en != null && typeof it.target === 'string' && it.target.length && !broken(en, it.target)) dicts[res.code][en] = it.target;
  });
});

phase('QA review');
const QA_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { corrections: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: { source: { type: 'string' }, target: { type: 'string' } },
    required: ['source', 'target'],
  } } },
  required: ['corrections'],
};
const qaResults = await parallel(LANGS.map((l) => () => {
  const pairs = CATALOG.map((en) => ({ source: en, current: dicts[l.code][en] || '' }));
  const prompt = 'You are a senior ' + l.name + ' (' + l.native + ') reviewer auditing the UI translations of a Kubernetes exam-prep app. ' + KEEP +
    '\n\nReview each {source, current} pair. Return corrections ONLY for entries that are mistranslated, unnatural, terminologically inconsistent, wrongly translate a Kubernetes/CNCF proper noun (must stay English), or break a placeholder/tag. Leave correct entries OUT. Each correction must keep the same {placeholders} and HTML tags as its source. Return { corrections: [{ source, target }] }. Pairs (JSON):\n' +
    JSON.stringify(pairs);
  return agent(prompt, { label: 'qa:' + l.code, phase: 'QA review', schema: QA_SCHEMA })
    .then((r) => ({ code: l.code, corrections: (r && r.corrections) || [] }));
}));
qaResults.filter(Boolean).forEach((res) => {
  res.corrections.forEach((c) => {
    if (c && typeof c.source === 'string' && typeof c.target === 'string' &&
        dicts[res.code][c.source] != null && !broken(c.source, c.target)) {
      dicts[res.code][c.source] = c.target;
    }
  });
});

const report = {};
LANGS.forEach((l) => {
  let missing = 0, fmt = 0;
  CATALOG.forEach((en) => {
    const t = dicts[l.code][en];
    if (t == null) { missing++; return; }
    if (broken(en, t)) fmt++;
  });
  report[l.code] = { translated: Object.keys(dicts[l.code]).length, missing, formatIssues: fmt };
});
log('Translated. ' + JSON.stringify(report));

// Write each language pack to disk via a writer agent (the data is too large to
// round-trip through the orchestrator's caller; the agent just echoes content
// into a Write call). Each file is verified independently afterwards.
phase('Write packs');
const writes = await parallel(LANGS.map((l) => () => {
  const content = '/* KCNA Prep UI — ' + l.native + ' (' + l.code + '). Auto-generated translation pack. */\n' +
    'I18n.register(' + JSON.stringify(l.code) + ', ' + JSON.stringify(dicts[l.code]) + ');\n';
  const path = OUT_DIR + '/' + l.code + '.js';
  const prompt = 'You are a precise file writer. Use the Write tool EXACTLY ONCE to create a file whose contents are EXACTLY the text between the markers below — copy it verbatim, character for character, with no edits, no reformatting, no re-indentation of the JSON, no truncation, and no extra commentary.\n\n' +
    'Absolute file path:\n' + path + '\n\n' +
    'File content (write everything between the markers, excluding the marker lines):\n' +
    '===BEGIN FILE===\n' + content + '===END FILE===\n\n' +
    'After writing, reply with only: OK ' + content.length;
  return agent(prompt, { label: 'write:' + l.code, phase: 'Write packs', agentType: 'claude' })
    .then((out) => ({ code: l.code, expectedChars: content.length, keys: Object.keys(dicts[l.code]).length, reply: String(out || '').slice(0, 120) }));
}));
log('Done. ' + JSON.stringify(report));

return { report, writes, total: CATALOG.length };
