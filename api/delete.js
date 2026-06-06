// Protected: removes a photo's variants from Blob and its manifest entry.
// Deletes by exact variant URL (not prefix) so ids like "x" and "x-2" never collide.
import { del } from '@vercel/blob';
import { authed, readJson, loadManifest, writeManifest, blobToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const { id } = await readJson(req);
    if (!id) return res.status(400).json({ error: 'missing id' });

    const { host, photos } = await loadManifest();
    const entry = photos.find(p => p.id === id);

    if (host && entry) {
      const urls = [];
      for (const x of entry.sizes) {
        urls.push(`${host}/photos/${id}-${x}.avif`, `${host}/photos/${id}-${x}.webp`);
      }
      await del(urls, { token: blobToken() });
    }

    await writeManifest(photos.filter(p => p.id !== id));
    res.status(200).json({ ok: true, removed: !!entry });
  } catch (err) {
    console.error('delete error', err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
