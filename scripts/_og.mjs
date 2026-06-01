// Generates the social share image (Open Graph, 1200x630) → assets/og.jpg
//   usage:  node scripts/_og.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const W = 1200, H = 630, cx = 600, sunY = 300, r = 70;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#173a52"/>
      <stop offset="45%" stop-color="#7a5a72"/>
      <stop offset="72%" stop-color="#e9714e"/>
      <stop offset="100%" stop-color="#ffb06b"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe2a3"/>
      <stop offset="60%" stop-color="#ffcf86" stop-opacity=".45"/>
      <stop offset="100%" stop-color="#ffcf86" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${cx}" cy="${sunY}" r="260" fill="url(#glow)"/>
  <circle cx="${cx}" cy="${sunY}" r="${r}" fill="#ffe9bd"/>

  <!-- ridges -->
  <polygon fill="#3a7d83" points="0,360 200,330 380,360 560,335 740,362 920,332 1100,360 1200,342 1200,430 0,430"/>
  <polygon fill="#e08a52" points="0,420 220,380 430,418 640,378 860,415 1080,380 1200,415 1200,520 0,520"/>
  <polygon fill="#3b2b4f" points="0,500 260,450 480,500 700,448 920,498 1140,452 1200,478 1200,630 0,630"/>

  <!-- name: TARAS (sun) TARLOV -->
  <text x="${cx - r - 26}" y="${sunY + 28}" text-anchor="end" fill="#fbe9c8"
    font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="92" letter-spacing="-2">TARAS</text>
  <text x="${cx + r + 26}" y="${sunY + 28}" text-anchor="start" fill="#fbe9c8"
    font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="92" letter-spacing="-2">TARLOV</text>

  <text x="${cx}" y="120" text-anchor="middle" fill="#fbe9c8" opacity="0.92"
    font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="26" letter-spacing="8">BUILDER · RIDER · VAN-DWELLER</text>
  <text x="${cx}" y="582" text-anchor="middle" fill="#fbe9c8" opacity="0.8"
    font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="6">tarastarlov.com</text>
</svg>`;

await mkdir('assets', { recursive: true });
await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile('assets/og.jpg');
console.log('og image → assets/og.jpg (1200×630)');
