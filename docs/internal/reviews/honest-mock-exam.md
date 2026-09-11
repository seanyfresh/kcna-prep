# Review capture — honest mock exam

**Reviewed:** 2026-09-11T06:12Z · branch `feat/question-provenance` (stacked on
`fix/option-length-tell`) · diff vs `main` · local adversarial review at the merge gate.

Audit-driven work: the mock exam was scoring the wrong thing three separate ways. The
findings below are the review of the *fix*, not the original audit.

## Findings

**1 · recordMockSeen threw on a corrupt stored value — fixed before merge.**
`Progress.recordMockSeen()` is called from `Exams.grade()`. It read `kcna:mockSeen` and
called `.concat()` without checking the value was an array, so a hand-edited key or an
imported `.seanyprep` session carrying a non-array threw `TypeError` mid-grade and cost
the user the mock they had just finished. `mockSeen()` already guarded this; the writer
did not — inconsistent with the module's own stated convention ("a bad entry must never
crash a render"). Reproduced with `kcna:mockSeen = "{}"`, then fixed and re-tested.

**2 · `allQuestions()` became a footgun — documented.**
After the holdout split it has no callers, and any future caller using it for quiz
selection would silently serve mock-only questions in practice, defeating the split with
no visible symptom. Kept (legitimate for counting/search) with a comment stating the
constraint, and the rule restated in `AGENTS.md`.

## Axes

- **Security** — `srcLink()` interpolates `sourceUrl` into an `href`. `esc()` escapes HTML
  but would not stop a `javascript:` URL, so the question is whether the field is ever
  attacker-controlled. It is not: `sourceUrl` comes only from the repo's own data files;
  `.seanyprep` import copies `kcna:`-prefixed localStorage progress keys, never content.
  Same shape as the pre-existing glossary source link, so no new class of risk. Links carry
  `rel="noopener noreferrer"`.
- **Edge cases** — empty pools return `[]`; `mockSeen()` tolerates a non-array; finding 1
  closed the writer-side gap. Timer-expiry path into `finishSession()` still carries
  `session.reused`.
- **Logic** — verified by simulation rather than reading: 0 holdout questions served by
  practice/diagnostic across 210,000 served, 0 non-holdout served by the mock across
  30,000, blueprint allocation still exactly 26/17/10/7.
- **Regressions** — length ratio holds at 1.000x with 36 new questions added; difficulty
  mix unchanged; all 289 questions 4-option with in-range `answerIndex`, no duplicate or
  empty options.

## What writes this / what calls this

- `sourceUrl` would have been inert: `Exams.prep()` whitelists the fields it hands the UI
  and dropped it. Caught before merge; both render sites confirmed live in the browser.
- `holdout` is written by `data/*.js` and read only through the registry pool accessors.
  The top-up path in `weightedPick()` previously fell back to `KCNA.allQuestions()` — the
  one place holdout questions would have leaked into practice. Now takes the same side of
  the split.
- The reuse warning was confirmed by running three consecutive mocks in the real app, not
  by reading the template: clean, clean, then "43 of 60 … already been shown".

## Not covered

Content correctness was verified for the high-risk claims (component roles, Pod phases,
NodePort range, Secrets at rest, PSS levels, Helm 3 release storage, HPA utilisation,
apply pruning, NoSchedule, StatefulSet ordering) against the cited pages — no errors
found. That is a sample, not all 289 questions. No psychometric calibration exists: the
mapping from a mock score to a real exam score remains an untested assumption.
