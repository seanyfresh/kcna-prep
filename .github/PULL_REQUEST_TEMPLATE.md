# Pull request

## Summary

<!-- What does this change and why? -->

## Type of change

- [ ] 🐛 Bug fix
- [ ] ✨ Feature
- [ ] 📚 Content correction / addition
- [ ] 🔧 Tooling / CI / docs
- [ ] ♻️ Refactor (no behavior change)

## Checklist

- [ ] App loads with **no console errors** (`make serve`, open DevTools).
- [ ] `make lint` passes (HTMLHint + `node --check` on every JS file).
- [ ] User-derived strings go through `esc()`; **no** inline event handlers or
      inline `<script>` added (keeps the Content-Security-Policy intact).
- [ ] No new runtime dependencies, frameworks, or build step.
- [ ] `CHANGELOG.md` updated under **[Unreleased]**.

## Content PRs only

- [ ] Each factual claim is backed by an **authoritative source** (linked below).

Sources:
<!-- kubernetes.io / cncf.io / prometheus.io / … -->

## Screenshots (UI changes)

<!-- Before / after -->
