# Security Assessment — KCNA Prep

**Scope:** the KCNA Prep web application (HTML/CSS/JS) and its shipped deploy
configurations.
**Date:** 2026-06-17 · **Version:** 1.0.0
**Methodology:** manual code review of the render/storage paths plus an automated
multi-agent audit, mapped to the OWASP Top 10 and reviewed against the realistic
threat model for a static, client-side, no-backend application.

## 1. Architecture & trust boundaries

KCNA Prep is a **static single-page app**. There is:

- **No backend / API / database.** Nothing is sent to a server.
- **No authentication** and **no user accounts**.
- **No third-party JavaScript**, analytics, or trackers.
- **One** third-party network dependency: Google Fonts CSS/WOFF2 (styling only).
- **Local persistence only:** all progress lives in the browser's `localStorage`
  under the `kcna:` key prefix, on the user's own device.

The only meaningful trust boundary is **untrusted data → the DOM**. The two data
sources are (a) version-controlled study content authored in this repo and
(b) a progress-backup JSON file the user may import.

## 2. Threat model & findings

| # | Threat | Vector | Risk (pre) | Status |
|---|--------|--------|------------|--------|
| T1 | Stored/DOM XSS | `innerHTML` rendering in `app.js` | Medium | **Mitigated** |
| T2 | Malicious import file | Settings → Import progress | Medium | **Mitigated** |
| T3 | Supply-chain (fonts) | `fonts.googleapis.com` CSS | Low | **Accepted, bounded** |
| T4 | Clickjacking | Framing the app | Low | **Mitigated** (headers) |
| T5 | MIME sniffing | Mis-served content types | Low | **Mitigated** (headers) |
| T6 | Sensitive-data exposure | localStorage contents | Low | **N/A by design** |
| T7 | CI/CD supply chain | GitHub Actions | Low | **Mitigated** |

### T1 — Cross-site scripting (XSS)
The app renders views by assigning strings to `innerHTML`. All **user-derived and
dynamic** values pass through the `esc()` helper (escapes `& < > "`). The only
**unescaped** HTML is the authored study notes (`note.html`), which are
version-controlled and reviewed — not user input.

**Controls in place**
- A restrictive **Content-Security-Policy** (`script-src 'self'`,
  `object-src 'none'`, `base-uri 'self'`) shipped as a `<meta>` tag and as a
  response header on every deploy target — a backstop even if an escaping bug slips in.
- **No inline event handlers** and **no inline `<script>`**, so `script-src 'self'`
  holds without `'unsafe-inline'`. (`style-src` keeps `'unsafe-inline'` for the
  many inline `style` attributes; this does not enable script execution.)
- CodeQL `security-extended` runs on every push/PR.

### T2 — Malicious progress-import file
Import (`Settings.importFromText`) validates before applying: total size ≤ 2 MB,
the file must declare `app: "kcna-prep"`, only string keys/values are accepted,
each value must itself be parseable JSON, and per-value size is capped. Imported
data is written only under the `kcna:` prefix and is **never** evaluated as code.

### T3 — Third-party fonts (accepted, bounded)
Google Fonts is the sole external request. SRI is not feasible for the
per-user-agent CSS Google returns, so the risk is bounded by CSP instead:
`style-src`/`font-src` are pinned to the Google Fonts origins and nothing else.
The app degrades gracefully to system fonts offline. *Hardening option:* self-host
the WOFF2 files to remove the dependency entirely (tracked as a future enhancement).

### T4–T5 — Headers
Every deploy path (Docker/nginx, Netlify `_headers`, Vercel `vercel.json`, and the
local `serve.py`) sets: `Content-Security-Policy` (with `frame-ancestors 'none'`),
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
no-referrer`, `Permissions-Policy` (geolocation/camera/microphone denied),
`Cross-Origin-Opener-Policy`, and `Strict-Transport-Security` (HTTPS deploys).

### T6 — Data exposure
Progress data is non-sensitive (quiz stats, flashcard schedule, plan checkboxes)
and never leaves the device except when the user explicitly exports it to a file
they control. No PII is collected.

### T7 — CI/CD
Workflows pin actions to major versions, request **least-privilege** `permissions`
(read-only by default; `security-events: write` only for CodeQL), use
`concurrency` to cancel stale runs, and Dependabot keeps actions and the Docker
base image patched.

## 3. Residual risk & recommendations

| Priority | Item |
|----------|------|
| Low | Self-host fonts to eliminate the last third-party request (removes T3). |
| Low | Pin the Docker base image and Actions to SHA digests for full reproducibility. |
| Low | Add Subresource Integrity if any same-origin asset is ever served from a CDN. |

**Overall:** the realistic attack surface is small and the high-value paths
(rendering, import) are defended in depth (escaping **and** CSP). No
critical or high-severity issues remain open.

## 4. Reporting

See [`../SECURITY.md`](../SECURITY.md) for how to report a vulnerability privately.
