# Security Policy

KCNA Prep is a **fully client-side static web application**. It has no backend,
no user accounts, no network API, and no server-side data store. All progress is
kept in the browser's `localStorage` on the user's own device. This sharply
limits the attack surface, but we still take security seriously.

A full threat model and assessment lives in
[`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md).

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

Security fixes are applied to the latest minor release.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately using one of:

1. **GitHub Security Advisories** — preferred. Go to the repository's
   **Security → Report a vulnerability** tab to open a private advisory.
2. **Email** — `me@seanyfresh.com` with the subject `SECURITY: KCNA Prep`.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (a proof-of-concept helps).
- The affected version/commit and browser.

### What to expect

- **Acknowledgement** within **3 business days**.
- A **triage assessment** (severity, affected versions) within **7 business days**.
- A fix or mitigation plan, with public disclosure coordinated once a fix ships.
- Credit in the release notes if you'd like it.

## Scope

In scope:

- XSS or HTML/JS injection in the rendered app.
- Insecure handling of imported progress files.
- Misconfigured Content-Security-Policy or response headers in the shipped deploy
  configs (Docker/nginx, Netlify, Vercel, Pages).
- Supply-chain risk in CI workflows or pinned actions.

Out of scope:

- Self-XSS that requires the user to paste attacker-supplied content into devtools.
- Lack of a backend feature (auth, multi-device sync) — this is by design.
- Issues that require a compromised device or browser extension.
- Findings against third-party hosts you deploy to (report those upstream).

## Hardening already in place

- A restrictive **Content-Security-Policy** (`default-src 'self'`, no inline event
  handlers, fonts limited to Google Fonts).
- All user-derived strings are HTML-escaped before rendering; authored study
  content is the only trusted HTML and is version-controlled.
- **No third-party JavaScript** and **no analytics/trackers**.
- Imported progress files are validated and size-limited before use.
- Security response headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy`) for every deploy target.
- Automated **CodeQL** scanning on every push and pull request.
