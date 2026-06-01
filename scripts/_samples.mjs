// Generates a few stand-in photos so the gallery has something to render.
// Delete these (and your real downloads) from photos/incoming/ anytime.
//   usage:  npm run samples
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const samples = [
  { name: '01-ridgeline-golden-hour.jpg', w: 1600, h: 1067, a: '#3a7d83', b: '#e9714e', label: 'RIDGELINE · CO' },
  { name: '02-the-van-dusk.jpg',          w: 1000, h: 1400, a: '#3b2b4f', b: '#ff4d97', label: 'THE VAN · DUSK' },
  { name: '03-xt250-gravel.jpg',          w: 1280, h: 1280, a: '#19868c', b: '#19c2c9', label: 'XT250 · GRAVEL' },
  { name: '04-camp-night.jpg',            w: 1500, h: 1000, a: '#241a33', b: '#7a5a72', label: 'CAMP · NIGHT' },
  { name: '05-pass-summit.jpg',           w: 1200, h: 1500, a: '#e08a52', b: '#ffb06b', label: 'PASS · SUMMIT' },
];

await mkdir('photos/incoming', { recursive: true });
for (const s of samples) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="93%" text-anchor="middle" font-family="monospace"
      font-size="${Math.round(s.w * 0.034)}" letter-spacing="4" fill="#fbe9c8">${s.label}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile('photos/incoming/' + s.name);
  console.log('sample →', s.name);
}
