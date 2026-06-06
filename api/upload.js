// Protected: accepts a base64 JPEG (already downscaled in the browser), runs the
// same sharp pipeline as scripts/optimize.mjs, uploads AVIF+WebP variants to
// Blob, and prepends the entry to the manifest (newest first).
import { put } from '@vercel/blob';
import sharp from 'sharp';
import { authed, readJson, loadManifest, writeManifest, slug, titleCase, blobOpts } from './_lib.js';

const WIDTHS = [480, 960, 1600];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { data, name, alt } = await readJson(req);
    if (!data || typeof data !== 'string') return res.status(400).json({ error: 'missing image data' });
    const buf = Buffer.from(data, 'base64');
    if (!buf.length) return res.status(400).json({ error: 'empty image' });
    if (buf.length > 6 * 1024 * 1024) return res.status(413).json({ error: 'image too large' });

    // ---- sharp pipeline (preserved from scripts/optimize.mjs:42-58) ----
    const upright = await sharp(buf, { failOn: 'none' }).rotate().toBuffer();   // bake EXIF rotation
    const meta = await sharp(upright).metadata();
    const w = meta.width, h = meta.height;
    if (!w || !h) return res.status(400).json({ error: 'not a valid image' });

    const { dominant } = await sharp(upright).stats();
    const color = '#' + [dominant.r, dominant.g, dominant.b]
      .map(n => n.toString(16).padStart(2, '0')).join('');

    let sizes = WIDTHS.filter(x => x < w);
    sizes.push(Math.min(w, WIDTHS[WIDTHS.length - 1]));
    sizes = [...new Set(sizes)].sort((a, b) => a - b);

    // ---- unique id against the current manifest (suffix on collision) ----
    const { photos } = await loadManifest();
    const ids = new Set(photos.map(p => p.id));
    const stem = slug(name || alt || 'photo') || 'photo';
    let id = stem, k = 2;
    while (ids.has(id)) id = `${stem}-${k++}`;

    // ---- encode + upload each variant (immutable → long cache) ----
    for (const x of sizes) {
      const pipe = sharp(upright).resize({ width: x, withoutEnlargement: true });
      const [avif, webp] = await Promise.all([
        pipe.clone().avif({ quality: 50 }).toBuffer(),
        pipe.clone().webp({ quality: 72 }).toBuffer(),
      ]);
      await put(`photos/${id}-${x}.avif`, avif, blobOpts({
        access: 'public', contentType: 'image/avif',
        addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
      }));
      await put(`photos/${id}-${x}.webp`, webp, blobOpts({
        access: 'public', contentType: 'image/webp',
        addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
      }));
    }

    const entry = { id, alt: (alt && alt.trim()) || titleCase(name || id), w, h, color, sizes };
    photos.unshift(entry);            // newest first
    await writeManifest(photos);

    res.status(200).json({ ok: true, entry });
  } catch (err) {
    console.error('upload error', err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
