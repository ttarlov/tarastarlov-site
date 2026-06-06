// Public: returns the gallery manifest + the Blob base URL the gallery uses to
// build image URLs. Served no-cache so newly uploaded photos appear at once.
import { loadManifest, blobToken } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');

  // TEMP diagnostic (remove before launch): report token presence + env var names
  if (req.query && req.query.debug === '1') {
    const tokenEnvKeys = Object.keys(process.env).filter(k => /TOKEN|BLOB/i.test(k));
    let listErr = null, count = null;
    try { count = (await loadManifest()).photos.length; }
    catch (e) { listErr = String((e && e.message) || e); }
    return res.status(200).json({ blobTokenFound: !!blobToken(), tokenEnvKeys, manifestCount: count, listErr });
  }

  try {
    const { host, photos } = await loadManifest();
    res.status(200).json({ base: host ? `${host}/photos/` : '', photos });
  } catch (err) {
    console.error('photos error', err);
    res.status(200).json({ base: '', photos: [] });
  }
}
