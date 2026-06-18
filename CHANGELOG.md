# Changelog

All notable changes to **KCNA Prep** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Each release lists what changed (seriously), then *why* (less seriously).

## [Unreleased]

_Nothing yet._

> 😴 *The changelog naps. It has earned it.*

## [1.6.1] - 2026-06-17

### Added
- **Mock-score trend chart** in the progress report — a clean SVG line of your
  mock-exam scores over time with the 75% pass mark drawn in, so a manager sees
  the trajectory at a glance (renders in print and the downloaded file too).
- **Footer links** across the app: **About**, **README**, **Contributors**, and
  **Changelog**.

> 📈 *Why: a line going up and to the right says more in one glance than a table
> ever will — and now the footer admits where this thing actually lives.*

## [1.6.0] - 2026-06-17

### Added
- **Progress report for your manager** — a new **Progress report** page (linked
  from the dashboard and Readiness) generates a clean, professional one-pager:
  a plain-language readiness verdict, predicted score vs. the pass mark, domain
  mastery by exam weight, study activity, and mock-exam history. Add your name and
  (optionally) your scheduled exam date, then **Print / Save as PDF**, **download a
  standalone `.html` file** to email, or **copy a text summary** to paste into chat.

> 🧑‍💼 *Why: "are you actually studying?" deserves a one-click answer. Hand the boss
> a tidy PDF and reclaim your afternoons.*

## [1.5.0] - 2026-06-17

### Changed
- **No more first-run onboarding modal.** Returning users (who load a session
  file) are no longer interrupted. Pick your difficulty from a new **difficulty
  button in the top bar** instead — it opens New / Some / Experienced and marks
  the current choice.
- **Study plans no longer display a total-week count.** Plans are still designed
  to different depths internally, but the headline "N-week plan" is hidden so it
  doesn't conflict with the hard Oct 1 deadline.

### Added
- **Adaptive difficulty** — when you're scoring well on both practice questions
  (≥85%) and flashcards (≥80%), the app offers to bump you up a level. Asked at
  most once per level; flashcard accuracy is now tracked to power this.

> 🥋 *Why: nobody wants a "choose your fighter" screen on every launch, telling a
> seasoned engineer they have "7 weeks" when the boss said "October" helps no one,
> and if you're clearly smurfing the easy questions the app should have the decency
> to notice and put you in the deep end.*

## [1.4.0] - 2026-06-17

### Added
- **Experience-level personalization** — a first-run prompt (and a Settings
  control) asks how familiar you are with Kubernetes, then tailors the app to
  **New / Some / Experienced**. Because sessions are per-person, each user gets
  their own fit. It drives:
  - **Study plan** — three distinct plans: a gentle ~12-week foundational plan
    (New), the ~11-week balanced plan (Some), and an accelerated diagnose-first
    ~7-week plan (Experienced). Each shows a "tailored for…" strategy card.
  - **Practice difficulty** — free practice quizzes lean easier for New and
    harder for Experienced (the diagnostic and mock stay representative so
    readiness and scores remain honest).
  - **Flashcard default** — Experienced starts in type-the-answer mode; others
    in multiple-choice (your explicit choice always wins).
  - **Guidance & tone** — the Plan and Readiness pages show level-specific advice.

> 🎚️ *Why: one-size-fits-all fits no one. The person on day one and the person who
> babysits prod clusters for a living should not get the same homework.*

## [1.3.1] - 2026-06-17

### Changed
- Deadline warning is now simply dismissible: removed the "Book exam" and
  "I've scheduled it" buttons in favor of a **✕ close** control in the top-right.
  Dismissal persists; re-show it via **Settings → Deadline & plan → Deadline warning**.

> 🚪 *Why: two buttons walked into a banner. We showed them the ✕. The banner is
> roomier and much calmer now.*

## [1.3.0] - 2026-06-17

### Changed
- **Countdown now targets the company deadline to pass the KCNA by Oct 1, 2026**
  (was the Sept 1 exam date). The top-bar and dashboard countdowns, study plan,
  and readiness all reflect the new date.

### Added
- A persistent **"book your exam" warning** on the dashboard (the app can't
  schedule the exam for you), with a one-click link to the official registration
  page and an **"I've scheduled it"** action. The reminder escalates within 30
  days of the deadline and can be toggled in **Settings → Deadline & plan**.
- A study-plan task to book the exam seat during mock-exam week.

> ⏰ *Why: a company-wide deadline materialized, as they do. The app double-checked
> and, no, it still cannot sit the exam on your behalf — so it will keep poking you
> to book it yourself.*

## [1.2.0] - 2026-06-17

### Added
- **Save / Load session** menu in the top bar (save icon → "Save session…" /
  "Load session…"), so several people can share one device without accounts —
  each keeps their own session file and loads it when they sit down.
  - Sessions save as **`KCNA Exam Prep - YYYY-MM-DD HHMM.seanyprep`**.
  - Uses the **File System Access API** to open a native dialog that **defaults to
    the Documents folder** (Chrome/Edge); falls back to a normal download +
    file-picker on Safari/Firefox.
  - Loading a session cleanly **replaces** the current progress (a true switch
    between users), after validating the file.

### Removed
- The separate **Export / Import progress** buttons in Settings — superseded by
  the top-bar Save / Load session menu (one consistent file flow).

> 💾 *Why: "just use the same browser tab, everyone" is not multi-user support —
> it's a group trust fall. Now each person clutches their own `.seanyprep` file.*

## [1.1.0] - 2026-06-17

### Changed
- **Visual redesign styled after the Nutanix brand guidelines** so the app feels
  familiar to Nutanix colleagues (this is an independent study app, not a Nutanix
  product, and it does not use the Nutanix logo or wordmark):
  - **Color system** — Iris Purple (`#7855FA`) primary on Charcoal Gray
    (`#131313`), with Aqua Blue, Mantis Green, and Peach Pink accents. Both the
    dark and light themes were re-derived from the official palette.
  - **Typography** — switched to **Montserrat** (the Nutanix brand typeface) with
    Arial as the system fallback.
  - Recolored the app icon, favicon, PWA/maskable icons, and `theme-color`.
- Bumped the service-worker cache to `v1.1.0` so returning users get the refresh.

> 🎨 *Why: so it feels like home for Nutanix colleagues — purple and all — minus
> the actual logo, because trademark law is not whimsical.*

## [1.0.0] - 2026-06-17

The first packaged, enterprise-grade release. Everything below ships in one go:
the original study app plus the tooling, deployment, and knowledge features that
make it production-ready and easy for anyone to run.

### Added

#### Study app (core)
- **Learn** — 35 concise, exam-focused notes across all five KCNA domains.
- **Flashcards** — 139 spaced-repetition cards (SM-2 lite) with Easy (multiple
  choice), Hard (type-the-answer with fuzzy grading), and Flip review modes.
- **Practice** — 253 fact-checked questions: per-domain quizzes, a 25-question
  diagnostic, and a full 60-question / 90-minute mock weighted to the real exam.
- **Readiness** — honest readiness score, predicted exam score, pass likelihood,
  per-domain mastery, and recommended next actions.
- **Plan** — an 11-week study plan with a live countdown and check-off tasks.

#### Knowledge base & references
- **Reference** section: a searchable **Glossary** of essential KCNA terms, a
  curated set of **authoritative documentation links** per domain (kubernetes.io,
  CNCF, Prometheus, Helm, Argo CD, and more), verified **exam facts**, and an
  official-resources list.
- **Further reading / Sources** on each domain's Learn page.

#### New features
- **Settings** page: configurable exam date and plan start, light/dark/auto theme,
  reduced-motion preference, and one-click **export / import / reset** of progress.
- **Light theme** plus automatic OS theme matching.
- **Global search** (`⌘/Ctrl + K`) across notes, glossary, and topics.
- **Progress export / import** as a JSON file so you can move between devices.
- **Study streak** tracking surfaced on the dashboard.
- **Keyboard shortcuts** for quizzes and flashcards, with a `?` help overlay.
- **Progressive Web App**: installable, works fully offline via a service worker.
- **Accessibility**: skip link, ARIA live route announcements, focus management,
  reduced-motion support, and labelled controls.

#### Engineering, security & deployment
- MIT `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`.
- **Security**: `SECURITY.md` policy, a full `docs/SECURITY-AUDIT.md` threat model,
  a Content-Security-Policy, and hardened response headers for every deploy target.
- **CI/CD**: GitHub Actions for linting/validation/link-checking, CodeQL scanning,
  and automatic GitHub Pages deployment; Dependabot for action updates.
- **One-command deploy**: Docker (`Dockerfile` + `docker-compose.yml` + hardened
  `nginx.conf`), Netlify, Vercel, GitHub Pages, and cross-platform local launchers.
- Issue/PR templates, `CODEOWNERS`, `Makefile`, and `docs/` (deployment, content
  authoring, architecture, and security).

> 🌱 *Why: it set out to be a humble study app and woke up with CI, a threat model,
> and a Dockerfile. They grow up so fast.*

[Unreleased]: https://github.com/seanyfresh/kcna-prep/compare/v1.6.1...HEAD
[1.6.1]: https://github.com/seanyfresh/kcna-prep/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/seanyfresh/kcna-prep/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/seanyfresh/kcna-prep/releases/tag/v1.0.0
