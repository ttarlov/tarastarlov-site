// ONE-TIME migration endpoint: uploads the git-committed photo variants from
// assets/photos/ into Vercel Blob and seeds photos/manifest.json from photos.json.
// Protected by the same admin password. Delete this file after the migration.
import { put } from '@vercel/blob';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { authed, blobOpts } from './_lib.js';

const ASSETS = path.join(process.cwd(), 'assets', 'photos');
const MANIFEST_SRC = path.join(process.cwd(), 'photos.json');

const contentType = f => (f.endsWith('.avif') ? 'image/avif' : 'image/webp');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const photos = JSON.parse(await readFile(MANIFEST_SRC, 'utf8'));
    const files = (await readdir(ASSETS)).filter(f => /\.(avif|webp)$/.test(f));
    if (!files.length) return res.status(500).json({ error: 'no variant files found' });

    let uploaded = 0;
    for (const f of files) {
      const buf = await readFile(path.join(ASSETS, f));
      await put(`photos/${f}`, buf, blobOpts({
        access: 'public', contentType: contentType(f),
        addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
      }));
      uploaded++;
    }

    await put('photos/manifest.json', JSON.stringify(photos), blobOpts({
      access: 'public', contentType: 'application/json',
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0,
    }));

    res.status(200).json({ ok: true, uploaded, photos: photos.length });
  } catch (err) {
    console.error('migrate-seed error', err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
