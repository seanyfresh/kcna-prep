# Contributing to KCNA Prep

Thanks for helping make KCNA Prep better! Whether you're fixing a typo in a study
note, correcting a question, or adding a feature, this guide gets you going.

This project is intentionally **dependency-free** and **build-free**: it's plain
HTML, CSS, and vanilla JavaScript served as static files. You don't need Node to
run it — only (optionally) to run the linters.

## Quick start

```bash
git clone https://github.com/seanyfresh/kcna-prep.git
cd kcna-prep

# Serve it (any static server works):
python3 -m http.server 4178
# → open http://localhost:4178

# …or
make serve
```

## Ways to contribute

### 1. Content corrections (most valuable)

The study notes, flashcards, and questions are in `data/*.js` — one file per
domain. Each file calls `KCNA.register({...})` with `notes`, `flashcards`, and
`questions` arrays. If you spot a factual error:

- Open a **Content correction** issue, **or**
- Edit the relevant `data/<domain>.js` entry and open a PR.

Every factual claim should be checkable against an **authoritative source**
(kubernetes.io, cncf.io, prometheus.io, etc.). Cite it in the PR description.

### 2. References & glossary

Authoritative links live in `data/references.js`; glossary terms in
`data/glossary.js`. Only add **official documentation** URLs, and confirm they
resolve (HTTP 200) and cover the topic before submitting.

### 3. Features & fixes

App logic lives in `assets/js/`. Keep the existing style:

- **No frameworks, no build step, no runtime dependencies.**
- Each module is an IIFE assigned to a single `window.*` global.
- Render with string templates; **always** pass user-derived text through the
  `esc()` helper before inserting it into HTML.
- Match the surrounding naming, spacing, and idioms.

## Pull request checklist

- [ ] The app loads with **no console errors** (`make serve`, open devtools).
- [ ] New content is **cited** from an authoritative source.
- [ ] User-derived strings are escaped; no new inline event handlers or inline
      `<script>` (keeps the CSP intact).
- [ ] Lint passes: `make lint` (HTMLHint + `node --check` on every JS file).
- [ ] You updated `CHANGELOG.md` under **\[Unreleased\]**.
- [ ] You bumped `VERSION` only if this is a release PR.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add light theme toggle
fix: correct kube-proxy flashcard answer
docs: clarify Docker deploy steps
content: fix HPA metric description in architecture notes
```

## Code of Conduct

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Contributions are licensed under the project's [MIT License](LICENSE).
