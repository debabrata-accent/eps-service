import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'assets');
mkdirSync(outDir, { recursive: true });

const logoSvg = readFileSync(resolve(here, 'logo.svg'));

// 1) App icon — 1024x1024 direct rasterization of the logo
await sharp(logoSvg)
  .resize(1024, 1024)
  .png()
  .toFile(resolve(outDir, 'icon.png'));
console.log('✅ assets/icon.png (1024x1024)');

// 2) Splash — 2732x2732 dark background with the logo centered (~40% size)
const logoSize = 1100;
const logoPng = await sharp(logoSvg).resize(logoSize, logoSize).png().toBuffer();

await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a
  },
})
  .composite([{ input: logoPng, gravity: 'center' }])
  .png()
  .toFile(resolve(outDir, 'splash.png'));
console.log('✅ assets/splash.png (2732x2732)');

// 3) Dark splash variant (same, since our brand is already dark)
await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: { r: 15, g: 23, b: 42, alpha: 1 },
  },
})
  .composite([{ input: logoPng, gravity: 'center' }])
  .png()
  .toFile(resolve(outDir, 'splash-dark.png'));
console.log('✅ assets/splash-dark.png (2732x2732)');
