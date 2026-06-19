#!/usr/bin/env python3
"""Generate a small Workflow script that translates only the delta (new) UI
strings into 9 languages with a QA pass, and RETURNS the translations (small
enough to round-trip; merged into the packs afterwards with Python)."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
delta = json.load(open(os.path.join(ROOT, "tools", "i18n-delta.json"), encoding="utf-8"))

LANGS = [
    {"code": "es", "name": "Spanish", "native": "Español"},
    {"code": "pt", "name": "Brazilian Portuguese", "native": "Português"},
    {"code": "fr", "name": "French", "native": "Français"},
    {"code": "de", "name": "German", "native": "Deutsch"},
    {"code": "it", "name": "Italian", "native": "Italiano"},
    {"code": "zh", "name": "Simplified Chinese", "native": "简体中文"},
    {"code": "ja", "name": "Japanese", "native": "日本語"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी"},
    {"code": "ar", "name": "Arabic", "native": "العربية"},
]

header = (
    "export const meta = {\n"
    "  name: 'kcna-ui-translate-delta',\n"
    "  description: 'Translate new UI strings into 9 languages with QA',\n"
    "  phases: [ { title: 'Translate' }, { title: 'QA review' } ],\n"
    "};\n\n"
    "const DELTA = " + json.dumps(delta, ensure_ascii=False) + ";\n"
    "const LANGS = " + json.dumps(LANGS, ensure_ascii=False) + ";\n\n"
)

body = r'''
const KEEP =
  'Rules: 1) Keep every {placeholder} token VERBATIM (same names, same count). ' +
  '2) Keep every HTML tag VERBATIM (e.g. <a href="...">, <strong>). Translate only words. ' +
  '3) Keep these ENGLISH: Kubernetes, KCNA, CNCF, the Linux Foundation, Nutanix, GitHub, README, Changelog, CSRF, SSRF, XSS, Pod, Deployment, Ingress, Offline. ' +
  '4) Keep symbols/emoji verbatim (↗, —, ·, …). 5) Preserve leading/trailing spaces.';

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { items: { type: 'array', items: {
    type: 'object', additionalProperties: false,
    properties: { i: { type: 'integer' }, target: { type: 'string' } },
    required: ['i', 'target'],
  } } },
  required: ['items'],
};

const items = DELTA.map((en, i) => ({ i, en }));

phase('Translate');
const tr = await parallel(LANGS.map((l) => () =>
  agent('You are a professional software localizer for "KCNA Prep" (a Kubernetes exam study app). Translate each English UI string into natural, concise ' +
        l.name + ' (' + l.native + '). ' + KEEP +
        '\n\nReturn { items: [{ i, target }] } for every input id. Input (JSON):\n' + JSON.stringify(items),
        { label: 'tr:' + l.code, phase: 'Translate', schema: SCHEMA })
    .then((r) => ({ code: l.code, items: (r && r.items) || [] }))
));

const dicts = {};
LANGS.forEach((l) => { dicts[l.code] = {}; });
tr.filter(Boolean).forEach((res) => res.items.forEach((it) => {
  const en = DELTA[it.i];
  if (en != null && typeof it.target === 'string' && it.target.length) dicts[res.code][en] = it.target;
}));

function ph(s) { return (String(s).match(/\{\w+\}/g) || []).sort(); }
function tg(s) { return (String(s).match(/<[^>]+>/g) || []).map((x) => x.replace(/\s+/g, ' ')).sort(); }
function same(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }

phase('QA review');
const QA = { type: 'object', additionalProperties: false, properties: { corrections: { type: 'array', items: {
  type: 'object', additionalProperties: false, properties: { source: { type: 'string' }, target: { type: 'string' } }, required: ['source', 'target'],
} } }, required: ['corrections'] };
const qa = await parallel(LANGS.map((l) => () => {
  const pairs = DELTA.map((en) => ({ source: en, current: dicts[l.code][en] || '' }));
  return agent('Senior ' + l.name + ' (' + l.native + ') reviewer. ' + KEEP +
    '\n\nReview each {source, current} UI pair; return corrections ONLY for wrong/unnatural ones (keep placeholders+tags). Return { corrections: [{ source, target }] }. Pairs:\n' + JSON.stringify(pairs),
    { label: 'qa:' + l.code, phase: 'QA review', schema: QA })
    .then((r) => ({ code: l.code, corrections: (r && r.corrections) || [] }));
}));
qa.filter(Boolean).forEach((res) => res.corrections.forEach((c) => {
  if (c && dicts[res.code][c.source] != null && same(ph(c.source), ph(c.target)) && same(tg(c.source), tg(c.target))) {
    dicts[res.code][c.source] = c.target;
  }
}));

return { dicts };
'''

out = os.path.join(ROOT, "tools", "translate-delta-workflow.js")
open(out, "w", encoding="utf-8").write(header + body)
print(f"wrote {out} ({len(delta)} strings x {len(LANGS)} languages)")
