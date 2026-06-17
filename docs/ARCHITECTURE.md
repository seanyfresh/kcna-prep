# Architecture

KCNA Prep is deliberately **boring technology**: vanilla HTML, CSS, and JavaScript
served as static files. No framework, no bundler, no `node_modules` at runtime.
That keeps it forkable, auditable, fast, and trivially hostable — and it will
still run unchanged years from now.

## Big picture

```
index.html ── loads, in order ──▶ data registry ─▶ content ─▶ app modules ─▶ router
   │                                   (window.KCNA)   (data/*.js)  (assets/js/*.js)
   └─ hash router (#/route) re-renders <main> via innerHTML on navigation
localStorage (kcna:*) ◀── progress (quiz stats, SRS schedule, plan, settings, streak)
service-worker.js ── caches the app shell + content for offline use
```

Each JavaScript module is an IIFE that assigns a single global
(`window.KCNA`, `window.Store`, `window.Exams`, …). Modules communicate only
through those globals — no imports, no bundler needed.

## Script load order (matters)

Defined at the bottom of `index.html`:

1. `theme-boot.js` — render-blocking in `<head>`; sets the theme before first paint.
2. `data-registry.js` — defines `window.KCNA` and the `register*` API.
3. `data/*.js` — content; each calls `KCNA.register({...})`.
4. `data/references.js`, `data/glossary.js` — knowledge base.
5. `storage.js` → `settings.js` → engines (`study-plan`, `readiness`, `flashcards`,
   `exams`) → `search.js` → `app.js` → `pwa.js`.

`settings.js` applies the saved exam date / theme before `app.js` renders.

## Modules

| File | Global | Responsibility |
|------|--------|----------------|
| `data-registry.js` | `KCNA` | Content registry, exam `meta`, references/glossary. |
| `storage.js` | `Store`, `Progress` | `localStorage` wrapper; per-domain stats, history, streak. |
| `settings.js` | `Settings` | Theme, motion, exam date, export/import/reset. |
| `study-plan.js` | `StudyPlan` | 11-week plan, countdown, task check-offs. |
| `readiness.js` | `Readiness` | Confidence-weighted readiness & predicted score. |
| `flashcards.js` | `Flashcards` | SM-2-lite spaced repetition; fuzzy typed-answer grading. |
| `exams.js` | `Exams` | Weighted question selection, shuffling, scoring. |
| `search.js` | `Search` | In-memory index over notes/glossary/domains. |
| `app.js` | — | Router + all views + keyboard shortcuts + search overlay. |
| `pwa.js` | `PWA` | Service-worker registration, update/offline UI, install. |

## Content model

A domain registered via `KCNA.register()`:

```js
KCNA.register({
  id: 'fundamentals',
  name: 'Kubernetes Fundamentals',
  weight: 44,                       // % of the exam (drives mock distribution)
  notes:      [{ id, topic, title, html }],
  flashcards: [{ id, front, back, topic }],
  questions:  [{ id, topic, difficulty, question, options:[…], answerIndex, explanation }],
});
```

`register()` stamps a stable `id` and `domainId` on every item, so flashcard SRS
state and quiz stats survive content edits.

### Exam blueprint (current)

Aligned to the **official KCNA update effective ~Nov 24, 2025** — four domains:

| Domain | Weight |
|---|---|
| Kubernetes Fundamentals | 44% |
| Container Orchestration | 28% |
| Cloud Native Application Delivery | 16% |
| Cloud Native Architecture (incl. Observability) | 12% |

Observability is examined within Architecture; its notes/cards/questions live
under the `architecture` domain.

## State & persistence

Everything is under the `kcna:` prefix in `localStorage`:
`domainStats`, `examHistory`, `srs`, `plan`, `settings`, `streak`, `fcMode`.
Export/import (Settings) serializes all of it to a portable JSON file.

## Regenerating PWA icons

PNGs are derived from the SVGs in `assets/icons/`. With any SVG rasterizer:

```bash
# example with rsvg-convert
rsvg-convert -w 512 -h 512 assets/icons/icon.svg          -o assets/icons/icon-512.png
rsvg-convert -w 192 -h 192 assets/icons/icon.svg          -o assets/icons/icon-192.png
rsvg-convert -w 180 -h 180 assets/icons/icon.svg          -o assets/icons/apple-touch-icon.png
rsvg-convert -w 512 -h 512 assets/icons/icon-maskable.svg -o assets/icons/icon-maskable-512.png
```

## Design constraints (please keep)

- No frameworks, no build step, no runtime dependencies.
- Escape user-derived strings with `esc()`; no inline event handlers / `<script>`
  (keeps the CSP strict).
- One global per module; render with string templates.
