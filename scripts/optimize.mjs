// Crunches photos/incoming/* into responsive AVIF + WebP at several widths,
// and writes a manifest (manifest.js + photos.json) the gallery reads.
//   usage:  npm run photos
import sharp from 'sharp';
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = 'photos/incoming';
const OUT = 'assets/photos';
const WIDTHS = [480, 960, 1600];                 // responsive breakpoints
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);

const slug = f => f.replace(/\.[^.]+$/, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const title = f => f.replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '')   // drop ordering prefix
  .replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());

async function main() {
  if (!existsSync(SRC)) {
    console.error(`✗ No ${SRC}/ folder — create it and drop photos in.`);
    process.exit(1);
  }
  const files = (await readdir(SRC))
    .filter(f => EXT.has(path.extname(f).toLowerCase()))
    .sort();
  if (!files.length) {
    console.error(`✗ No images found in ${SRC}/  (jpg, png, webp, tif)`);
    process.exit(1);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const manifest = [];
  for (const file of files) {
    const src = path.join(SRC, file);
    const id = slug(file);

    // bake EXIF rotation in once → everything downstream is already upright,
    // so dimensions and crops are correct with no orientation guesswork
    const upright = await sharp(src, { failOn: 'none' }).rotate().toBuffer();
    const meta = await sharp(upright).metadata();
    const w = meta.width, h = meta.height;

    const { dominant } = await sharp(upright).stats();
    const color = '#' + [dominant.r, dominant.g, dominant.b]
      .map(n => n.toString(16).padStart(2, '0')).join('');

    let sizes = WIDTHS.filter(x => x < w);
    sizes.push(Math.min(w, WIDTHS[WIDTHS.length - 1]));
    sizes = [...new Set(sizes)].sort((a, b) => a - b);

    for (const x of sizes) {
      const base = sharp(upright).resize({ width: x, withoutEnlargement: true });
      await base.clone().avif({ quality: 50 }).toFile(path.join(OUT, `${id}-${x}.avif`));
      await base.clone().webp({ quality: 72 }).toFile(path.join(OUT, `${id}-${x}.webp`));
    }

    manifest.push({ id, alt: title(file), w, h, color, sizes });
    console.log(`✓ ${file}  →  ${sizes.join('/')}px   (${w}×${h}, ${color})`);
  }

  await writeFile(path.join(OUT, 'manifest.js'),
    `window.__PHOTOS__ = ${JSON.stringify(manifest, null, 2)};\n`);
  await writeFile('photos.json', JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\n${manifest.length} photo(s) → ${OUT}/  (+ manifest.js)`);
  console.log('Next:  open index.html  ·  then  git add -A && git commit && push');
}

main().catch(err => { console.error(err); process.exit(1); });
