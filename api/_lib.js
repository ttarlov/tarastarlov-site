// Shared helpers for the photo API. Files prefixed with "_" are not routed by
// Vercel, but can be imported by the sibling functions in this folder.
import { put, list } from '@vercel/blob';
import crypto from 'node:crypto';

export const MANIFEST = 'photos/manifest.json';

// constant-time password check on SHA-256 digests (always 32 bytes, so
// timingSafeEqual never throws on a length mismatch and leaks nothing)
const sha = s => crypto.createHash('sha256').update(String(s ?? '')).digest();
export function authed(req) {
  const want = process.env.ADMIN_UPLOAD_PASSWORD || '';
  if (!want) return false;
  const got = req.headers['x-admin-token'] || '';
  return crypto.timingSafeEqual(sha(got), sha(want));
}

// Vercel auto-parses JSON bodies, but fall back to reading the stream so the
// functions work the same under `vercel dev` and any runtime quirks.
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

// Load the manifest from Blob. Returns the canonical public host so callers can
// build image/variant URLs without hardcoding the store id anywhere.
export async function loadManifest() {
  const { blobs } = await list({ prefix: MANIFEST, limit: 1 });
  if (!blobs.length) return { url: null, host: null, photos: [] };
  const url = blobs[0].url;
  const host = new URL(url).origin;
  const photos = await fetch(url, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : []))
    .catch(() => []);
  return { url, host, photos: Array.isArray(photos) ? photos : [] };
}

export async function writeManifest(photos) {
  await put(MANIFEST, JSON.stringify(photos), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,            // always fresh; gallery also fetches no-store
  });
}

// id slug + display title, mirrored from scripts/optimize.mjs
export const slug = f => String(f).replace(/\.[^.]+$/, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const titleCase = f => String(f).replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '')
  .replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
