# ADR-0001: Reserve a mock-only question holdout

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** Sean

## Context

The full mock exam exists to answer one question: *am I ready to sit the KCNA?* It only answers
that if the score estimates knowledge. An audit of the mock found it was estimating something
else.

Practice, the diagnostic, and the mock all drew from the same question bank, and the mock hands
back every question with its answer and explanation in the review screen at the end
(`assets/js/app.js:551`). Each mock consumed 60 of 253 questions — 24% of the bank — and taught
the user the answer to every one. Simulating repeated sittings showed the bank going from 24%
seen after one mock to 54% after three. By the third mock, the score was substantially a recall
test of material the app had already handed over, and `Progress.recordAnswers()` fed that inflated
result straight into the readiness model.

This is the same defect class as the option-length tell fixed alongside it: the number looked like
a measurement, moved like a measurement, and was not one. Both mattered because readiness drives a
real decision — whether to book a €250 exam.

Three shapes were considered.

**Prefer-unseen only**, with no reserved pool: track what practice has served and have the mock
favour the rest. Costs no practice material and degrades gracefully, but it is defeated exactly
when it matters most — a diligent user who has practised the whole bank has no unseen questions
left, and that user is the one about to book the exam.

**Hard holdout with no rotation**: reserve questions the mock alone may serve. Clean for the first
sitting, but a mock burns its own questions too, so the second sitting re-serves what the first
just taught. It relocates the contamination rather than removing it.

**Hard holdout plus rotation within it** — chosen. The reserved pool makes the first sittings
genuinely unseen; preferring never-served questions inside that pool extends how many sittings
stay clean.

Sizing forced a real trade-off. The mock is 60 questions against a 289-question bank, so a holdout
large enough for several clean sittings necessarily takes a large share from practice. The
deciding observation: **repetition in practice is harmless and arguably useful** — practice is
spaced repetition, and meeting a question a second time is how learning works — whereas repetition
in the mock is precisely what destroys the measurement. Practice pool size is therefore the cheaper
thing to spend.

## Decision

We split the question bank. Questions flagged `holdout: true` in `data/*.js` are reserved for the
full mock exam; practice and the diagnostic never serve them.

- **The boundary lives in the registry, not in callers.** `pool()` (`assets/js/data-registry.js:29`)
  is the single filter, exposed as `practiceQuestions(id)` / `mockQuestions(id)` and
  `allPractice()` / `allMock()` (`assets/js/data-registry.js:67-70`). Quiz selection **must** go
  through these. `allQuestions()` (`assets/js/data-registry.js:61`) still spans both sides and is
  for counting and search only — it carries a comment saying so, because a caller using it to
  serve a quiz would defeat the split silently, with no visible symptom.
- **The diagnostic draws from the practice side.** It is a placement test taken before study, not
  the readiness gate, and spending holdout on it would buy nothing.
- **The mock prefers questions never served before.** `pickUnseenFirst()`
  (`assets/js/exams.js:60`) takes unseen questions first and falls back to repeats only when the
  holdout is exhausted. Exposure is recorded per device in `localStorage` under `kcna:mockSeen`
  (`assets/js/storage.js:72`), written from `grade()` (`assets/js/exams.js:172`).
- **The top-up path stays on its own side of the split** (`assets/js/exams.js:103`). When a domain
  runs short, `weightedPick()` backfills from `allMock()` or `allPractice()` to match the mode.
  This was previously `allQuestions()` and is the one place holdout questions would have leaked
  into practice.
- **The split is stratified and deterministic.** It is chosen per domain across difficulty and
  spread over topics, with no RNG, so both pools keep the domain's difficulty mix and the split is
  reproducible from the data alone rather than being an accident of one run.
- **Roughly half of each domain is reserved**, sized so every domain affords at least two fully
  unseen sittings:

  | Domain | Practice | Holdout | Mock draws | Clean sittings |
  |---|---|---|---|---|
  | Kubernetes Fundamentals | 56 | 52 | 26 | 2 |
  | Container Orchestration | 22 | 34 | 17 | 2 |
  | Cloud Native Application Delivery | 30 | 30 | 10 | 3 |
  | Cloud Native Architecture | 37 | 28 | 7 | 4 |

- **The app says when the measurement has degraded.** A session reports how many of its questions
  were previously served (`assets/js/exams.js:143`) and the result screen states it plainly rather
  than presenting the score unqualified (`assets/js/app.js:565`).

Verified by simulation rather than inspection: 0 holdout questions served by practice or the
diagnostic across 210,000 served, 0 non-holdout served by the mock across 30,000, with the
blueprint allocation still exactly 26/17/10/7.

## Consequences

**Easier.** A mock score now means what it appears to mean for at least two sittings per domain,
so readiness rests on unseen material. When it stops being a clean read the app says so, which is
a more honest instrument than a number that silently drifts. The boundary is stated in one place,
so adding a caller is a decision rather than an accident.

**Harder.** Practice lost roughly half its questions — Container Orchestration most sharply, from
56 to 22 — and although repetition there is benign, that is a real reduction in variety for the
second-heaviest domain. Clean sittings are capped at two, set by orchestration; raising the cap
means writing more questions, and **we have decided not to** (2026-09-11) — two clean sittings
plus an explicit warning is honest enough, and authoring effort is better spent elsewhere. The
content model gains a field that is easy to get wrong: a new question with no `holdout` decision
silently lands in practice, and a domain whose holdout drifts too small quietly loses its clean
sittings with no failing test to catch it. Exposure is per-device `localStorage`, so clearing
site data or moving browsers resets the rotation and hands back a clean-looking mock that is not
one; it does travel with an exported `.seanyprep` session.

**Unchanged.** This fixes what the mock measures *against itself* — it does not calibrate the mock
to the real exam. There is still no item-response data from real candidates, so the mapping from a
mock percentage to a KCNA percentage remains an untested assumption, and no amount of pool
engineering will change that.
