# CLAUDE.md — KCNA Prep

Offline-capable study app for the **Kubernetes & Cloud Native Associate (KCNA)** exam: notes, spaced-repetition flashcards, weighted mock exams, a readiness model, and an 11-week plan. Repo: `seanyfresh/kcna-prep`. Deploys to GitHub Pages / Netlify / Vercel.

## Stack
- Static, **zero-build** web app: vanilla HTML/CSS/JS + a service worker (`service-worker.js`) for offline/PWA. No bundler, no framework, no runtime npm deps.
- `serve.py` — tiny zero-dependency Python 3 dev server that mirrors the production security headers.
- Content/data in `data/`, UI assets in `assets/`, tooling in `tools/`, docs in `docs/`. Container serving via `Dockerfile` + `docker-compose.yml`.

## Commands (Makefile)
- `make serve` — run locally on :4178 and open the browser. Override port: `make serve PORT=9000`.
- `make lint` — `node --check` every JS file + `htmlhint index.html`. Run before every commit.
- `make links` — check markdown links (needs `lychee`).
- `make up` / `make down` — `docker compose` up (detached) / down.
- `make docker-build` / `make docker-run` — build / run the container image.
- `make version` — print `VERSION`.

## Conventions
- Stay dependency-free and offline-first: nothing that requires a network at runtime or breaks the service worker / offline use.
- When you change cached assets, bump `VERSION` and the service-worker cache name, or clients keep stale files.
- Keep exam content accurate to the current KCNA curriculum; cite the source when changing facts.
- Keep CI green (GitHub Actions: CI, CodeQL, Pages) — run `make lint` locally first.
- Conventional Commits.
