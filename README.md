# tarastarlov.com

Personal site — photos, travel, hobbies, writing. Hand-built static site, hosted on Vercel.

## Photo workflow

Raw photos live in `photos/incoming/` (gitignored). A build script crunches them into
responsive AVIF + WebP and writes a manifest the gallery reads. Only the optimized,
web-ready files in `assets/photos/` get committed.

```bash
# drop selects into photos/incoming/, name them meaningfully
# (filename → caption + sort order, e.g. 01-ridgeline-golden-hour.jpg)
npm install        # first time only
npm run photos     # generate assets/photos/* + manifest.js
git add -A && git commit -m "photos: update gallery" && git push   # Vercel auto-deploys
```

`npm run samples` regenerates placeholder images for local testing.

## Stack

Static HTML/CSS/JS. No framework. `sharp` for image optimization (build-time only).
