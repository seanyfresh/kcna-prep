# Deployment guide

KCNA Prep is a **static site** — plain HTML/CSS/JS with no build step and no
runtime dependencies. Anything that can serve a folder of files can host it.
Pick whichever path fits you.

> The app uses a **hash router** (`#/dashboard`), so it works from any subpath and
> needs no server-side rewrite rules.

---

## 1. Local — just study (no install)

**macOS:** double-click **`Open KCNA Prep.command`**.
**Windows:** double-click **`Open KCNA Prep (Windows).bat`**.
**Linux:** run **`./open-kcna-prep.sh`**.

All three call `serve.py`, which finds a free port from 4178, opens your browser,
and serves with the production security headers. Or directly:

```bash
python3 serve.py            # → http://localhost:4178
make serve                  # same thing
python3 -m http.server 4178 # simplest possible (no security headers)
```

---

## 2. Docker (one command, hardened)

```bash
docker compose up -d        # → http://localhost:4178
# or
docker build -t kcna-prep .
docker run --rm -p 4178:8080 kcna-prep
```

The image is `nginx-unprivileged` (runs as non-root on port 8080), serves with a
hardened [`nginx.conf`](../nginx.conf) (CSP, security headers, gzip, caching,
`/healthz`). `docker-compose.yml` adds `read_only`, `cap_drop: ALL`, and
`no-new-privileges`. Health check: `GET /healthz` → `ok`.

---

## 3. GitHub Pages (free hosting + CI)

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. The [`pages.yml`](../.github/workflows/pages.yml) workflow deploys the whole
   repo on every push to `main`. Your site: `https://<user>.github.io/<repo>/`.

No build is run — the repo root *is* the site.

---

## 4. Netlify

Connect the repo in the Netlify UI, or drag-and-drop the folder. Config is in
[`netlify.toml`](../netlify.toml) and [`_headers`](../_headers):
publish directory `.`, empty build command, full security headers.

## 5. Vercel

Import the repo (Framework preset: **Other**, no build command, output `.`).
[`vercel.json`](../vercel.json) applies `cleanUrls` and the security headers.

## 6. Any other static host

Cloudflare Pages, S3 + CloudFront, Firebase Hosting, nginx/Caddy on a VPS — copy
these files to the web root:

```
index.html  manifest.webmanifest  service-worker.js  assets/  data/
```

Then re-create the headers from [`_headers`](../_headers) in your host's config.
Serve `service-worker.js` and `index.html` with `Cache-Control: no-cache` so
updates ship promptly.

---

## Updating a deployed version

The service worker is cache-versioned (`kcna-prep-vX.Y.Z` in
[`service-worker.js`](../service-worker.js)). When you change content:

1. Bump `VERSION`, `KCNA.meta.version`, and the `CACHE` name in the service worker.
2. Update [`CHANGELOG.md`](../CHANGELOG.md).
3. Redeploy. Returning users get an in-app **"new version ready — Reload"** prompt.

## Offline / install

After the first visit, the service worker caches the full app, so it works with no
network. In Chrome/Edge an **Install** prompt appears (also in **Settings →
Install**), giving a home-screen/desktop icon.

## PWA icons

SVG icons render everywhere; PNG fallbacks (`assets/icons/icon-{192,512}.png`,
`apple-touch-icon.png`, `icon-maskable-512.png`) are included for iOS/older
browsers. To regenerate from the SVGs, see the comment in
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md).
