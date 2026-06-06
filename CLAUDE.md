# Claude instructions for tarastarlov-site

## Git workflow

- **Never push directly to `main`.** All changes go through a PR, no exceptions — even mechanical cleanups.
- Use feature branches for all work. The naming convention Vercel assigns (`claude/<slug>`) is fine.
- Squash-merge PRs to keep the main history clean.

## Architecture

**Photo storage: Vercel Blob** (not the git repo)
- Photos are stored in Vercel Blob at `photos/{id}-{w}.{ext}` (AVIF + WebP at 480/960/1600px).
- The manifest lives at `photos/manifest.json` in Blob — a JSON array of `{id, alt, w, h, color, sizes}`.
- `api/photos.js` serves the manifest + Blob base URL to the gallery (no-cache).
- `api/upload.js` accepts browser-downscaled images, runs the sharp pipeline, writes to Blob.
- `api/delete.js` removes variants + manifest entry.
- `api/_lib.js` has all shared helpers (auth, manifest I/O, slug/title).
- The repo contains **no photo binary assets** — `assets/photos/` was removed after migration.

**Auth: single shared password**
- `ADMIN_UPLOAD_PASSWORD` env var on Vercel (Production + Preview).
- Checked via `crypto.timingSafeEqual` on SHA-256 digests — never compare raw strings.
- The `x-admin-token` request header carries the password.

**Vercel Blob auth: automatic OIDC (no static token)**
- The store uses `BLOB_STORE_ID` (injected by Vercel), not `BLOB_READ_WRITE_TOKEN`.
- Always use `blobOpts()` from `_lib.js` — it attaches a static token only if one exists, otherwise passes nothing so automatic auth kicks in. Never pass `token: null` or `token: undefined` — that disables auto-auth.

## Vercel environment

- Team: `ttarlovs-projects` (`team_T53LuckohwkkISL2ds0vngCk`)
- Project: `tarastarlov-site` (`prj_cpDNaKTDcxFyjqz3zB1CHgWEZOyS`)
- Preview deployments auto-create on every branch push — use them for staging before merging.
- Production deploys automatically on merge to `main`.

## Code style

- Vanilla JS, no framework, no build step for frontend.
- Serverless functions are plain ES modules (`import/export`), Node 20.x.
- No comments unless the WHY is non-obvious. No docstrings.
- Keep functions small and single-purpose.
