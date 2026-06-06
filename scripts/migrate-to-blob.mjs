// One-time: seed Vercel Blob from the existing processed photos in the repo.
// Uploads every assets/photos/*.{avif,webp} variant and seeds photos/manifest.json
// from the current photos.json. No reprocessing, no originals needed.
//
//   usage:  export BLOB_READ_WRITE_TOKEN=...   (vercel env pull, or copy from dashboard)
//           npm run migrate
import { put } from '@vercel/blob';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'assets/photos';
const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error('✗ Set BLOB_READ_WRITE_TOKEN first (vercel env pull, or copy from the Vercel dashboard).');
  process.exit(1);
}

const contentType = f => (f.endsWith('.avif') ? 'image/avif' : 'image/webp');

async function main() {
  const photos = JSON.parse(await readFile('photos.json', 'utf8'));
  const files = (await readdir(OUT)).filter(f => /\.(avif|webp)$/.test(f));
  if (!files.length) { console.error(`✗ No variants found in ${OUT}/`); process.exit(1); }

  let n = 0;
  for (const f of files) {
    const buf = await readFile(path.join(OUT, f));
    await put(`photos/${f}`, buf, {
      access: 'public', contentType: contentType(f),
      addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000, token,
    });
    console.log(`↑ ${++n}/${files.length}  ${f}`);
  }

  await put('photos/manifest.json', JSON.stringify(photos), {
    access: 'public', contentType: 'application/json',
    addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0, token,
  });

  console.log(`\n✓ Migrated ${files.length} variant(s) + manifest (${photos.length} photos) to Blob.`);
}

main().catch(err => { console.error(err); process.exit(1); });
