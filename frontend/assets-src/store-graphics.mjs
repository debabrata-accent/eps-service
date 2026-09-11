import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', '..', 'store-assets');
mkdirSync(outDir, { recursive: true });

const logoSvg = readFileSync(resolve(here, 'logo.svg'));

// 1) Play Store icon — 512x512
await sharp(logoSvg).resize(512, 512).png().toFile(resolve(outDir, 'play-icon-512.png'));
console.log('✅ store-assets/play-icon-512.png (512x512)');

// 2) Feature graphic — 1024x500, dark bg with logo + app name
const logo = await sharp(logoSvg).resize(300, 300).png().toBuffer();

// Render app name + tagline as an SVG text overlay
const textSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
  <text x="400" y="230" font-family="Arial, sans-serif" font-size="76" font-weight="bold" fill="#ffffff">EPS Service</text>
  <text x="402" y="300" font-family="Arial, sans-serif" font-size="34" fill="#93c5fd">Electrical Panel Service Platform</text>
</svg>
`);

await sharp({
  create: { width: 1024, height: 500, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } },
})
  .composite([
    { input: logo, left: 70, top: 100 },
    { input: textSvg, left: 0, top: 0 },
  ])
  .png()
  .toFile(resolve(outDir, 'feature-graphic-1024x500.png'));
console.log('✅ store-assets/feature-graphic-1024x500.png (1024x500)');
