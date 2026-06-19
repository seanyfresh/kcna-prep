#!/usr/bin/env python3
"""Generate a self-contained Workflow script that translates the UI catalog
into 9 languages with deterministic placeholder/HTML validation, a fix pass,
and an adversarial QA review. The catalog is embedded so the workflow needs no
filesystem access."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, "tools", "i18n-catalog.json"), encoding="utf-8") as f:
    catalog = json.load(f)

LANGS = [
    {"code": "es", "name": "Spanish", "native": "Español", "rtl": False},
    {"code": "pt", "name": "Brazilian Portuguese", "native": "Português", "rtl": False},
    {"code": "fr", "name": "French", "native": "Français", "rtl": False},
    {"code": "de", "name": "German", "native": "Deutsch", "rtl": False},
    {"code": "it", "name": "Italian", "native": "Italiano", "rtl": False},
    {"code": "zh", "name": "Simplified Chinese", "native": "简体中文", "rtl": False},
    {"code": "ja", "name": "Japanese", "native": "日本語", "rtl": False},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "rtl": False},
    {"code": "ar", "name": "Arabic", "native": "العربية", "rtl": True},
]

header = (
    "export const meta = {\n"
    "  name: 'kcna-ui-translate',\n"
    "  description: 'Translate the KCNA Prep UI catalog into 9 languages with placeholder validation + QA',\n"
    "  phases: [\n"
    "    { title: 'Translate' },\n"
    "    { title: 'Fix formatting' },\n"
    "    { title: 'QA review' },\n"
    "  ],\n"
    "};\n\n"
    "const CATALOG = " + json.dumps(catalog, ensure_ascii=False) + ";\n"
    "const LANGS = " + json.dumps(LANGS, ensure_ascii=False) + ";\n"
    "const OUT_DIR = " + json.dumps(os.path.join(ROOT, "assets", "js", "i18n")) + ";\n\n"
)

body = r'''
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
'''

out = os.path.join(ROOT, "tools", "translate-workflow.js")
with open(out, "w", encoding="utf-8") as f:
    f.write(header + body)
print(f"wrote {out} ({len(catalog)} strings, {len(LANGS)} languages)")
