# Changelog

All notable changes to **KCNA Prep** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [1.3.1] - 2026-06-17

### Changed
- Deadline warning is now simply dismissible: removed the "Book exam" and
  "I've scheduled it" buttons in favor of a **✕ close** control in the top-right.
  Dismissal persists; re-show it via **Settings → Deadline & plan → Deadline warning**.

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

[Unreleased]: https://github.com/seanyfresh/kcna-prep/compare/v1.3.1...HEAD
[1.3.1]: https://github.com/seanyfresh/kcna-prep/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/seanyfresh/kcna-prep/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/seanyfresh/kcna-prep/releases/tag/v1.0.0
