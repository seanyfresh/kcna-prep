#!/usr/bin/env python3
"""Extract the canonical English UI string catalog for translation.

Sources:
  1. tr('...') / tr("...") calls in app.js and pwa.js
  2. data-i18n / data-i18n-attr keys in index.html
  3. study-plan.js task texts + focus/goal/approach copy (data-source strings
     that pass through tr() at render time)
  4. A curated supplement for the remaining data-source label sets
     (readiness labels, exam titles, search types, difficulty/mode/segment
     options) which live as plain string literals, not tr() calls.

Writes tools/i18n-catalog.json — a sorted list of unique English strings.
"""
import json
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def unescape_js(s):
    # Our keys only ever contain escaped quotes (\' or \"); unescape those.
    return s.replace("\\'", "'").replace('\\"', '"')


def extract_tr_calls(text):
    out = []
    for m in re.finditer(r"\btr\(\s*'((?:\\.|[^'\\])*)'", text):
        out.append(unescape_js(m.group(1)))
    for m in re.finditer(r'\btr\(\s*"((?:\\.|[^"\\])*)"', text):
        out.append(unescape_js(m.group(1)))
    return out


def extract_data_i18n(html):
    out = []
    for m in re.finditer(r'data-i18n="([^"]*)"', html):
        out.append(m.group(1))
    for m in re.finditer(r'data-i18n-attr="([^"]*)"', html):
        for pair in m.group(1).split(";"):
            if ":" in pair:
                out.append(pair.split(":", 1)[1].strip())
    return out


def extract_study_plan(text):
    out = []
    # task arrays: ['id', 'text', '#/route'] -> capture the middle text
    for m in re.finditer(r"\[\s*'(?:[^'\\]|\\.)*'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'#/", text):
        out.append(unescape_js(m.group(1)))
    # focus / goal / blurb / label / hours: 'value'
    for m in re.finditer(r"(?:focus|goal|blurb|label|hours):\s*'((?:[^'\\]|\\.)*)'", text):
        out.append(unescape_js(m.group(1)))
    return out


# Curated data-source strings that flow through tr() at render but are plain
# literals in their source modules (not tr() calls).
SUPPLEMENT = [
    # readiness.js -- pass likelihood
    "Not yet assessed", "High", "Moderate", "Building", "Low",
    # readiness.js -- level
    "Not started", "Building foundation", "Developing", "Approaching ready", "Exam ready",
    # exams.js -- session titles
    "Full Mock Exam", "Diagnostic Assessment", "Mixed Practice", "Practice",
    # search.js -- result types
    "Domain", "Note", "Glossary",
    # difficulty tag values (q.difficulty) + h.mode + route fallback
    "easy", "medium", "hard", "mock", "diagnostic", "Page", "Study note",
    # app.js LEVEL_OPTS (difficulty menu)
    "New to Kubernetes", "Some experience", "Experienced",
    "Start from the basics", "Reinforce the fundamentals", "Diagnose-first · harder questions",
    # app.js MODES (flashcard answer modes)
    "Easy", "Multiple choice", "Hard", "Type the answer", "Flip", "Review only",
    # settings segmented-control option labels
    "Auto", "Dark", "Light", "Reduced", "Full", "New", "Some", "Show", "Hidden",
    # dashboard stat() labels (passed to a helper that calls tr() internally)
    "questions answered", "flashcards due", "best mock score",
    "plan tasks done", "day study streak",
    # Contributors page bios (passed through tr() at render, not tr() literals)
    "Creator & maintainer", "Built and maintains KCNA Prep.",
    "Security review", "Prompted the CSRF / SSRF / XSS audit that hardened the app.",
    "UX & product feedback",
    "Proposed the top-bar difficulty indicator and dropping the unused Offline pill.",
]


def main():
    strings = []
    strings += extract_tr_calls(read("assets/js/app.js"))
    strings += extract_tr_calls(read("assets/js/pwa.js"))
    strings += extract_data_i18n(read("index.html"))
    strings += extract_study_plan(read("assets/js/study-plan.js"))
    strings += SUPPLEMENT

    seen = {}
    for s in strings:
        if s and s not in seen:
            seen[s] = True
    catalog = sorted(seen.keys())

    out_path = os.path.join(ROOT, "tools", "i18n-catalog.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"{len(catalog)} unique strings -> tools/i18n-catalog.json")


if __name__ == "__main__":
    main()
