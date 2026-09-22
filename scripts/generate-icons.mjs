import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcIcon = '/opt/cursor/artifacts/assets/app_icon_1024.png';
const publicDir = join(root, 'public');
const resources = join(root, 'resources');

mkdirSync(publicDir, { recursive: true });
mkdirSync(resources, { recursive: true });

if (!existsSync(srcIcon)) {
  console.error('Missing', srcIcon);
  process.exit(1);
}

await sharp(srcIcon).png().toFile(join(resources, 'icon.png'));
await sharp(srcIcon).resize(1024, 1024).png().toFile(join(publicDir, 'app-icon-1024.png'));
await sharp(srcIcon).resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'));
await sharp(srcIcon).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
await sharp(srcIcon)
  .resize(1284, 2778, { fit: 'cover', background: '#050d12' })
  .png()
  .toFile(join(resources, 'splash.png'));

// Also write a store marketing splash-like image
await sharp({
  create: {
    width: 1284,
    height: 2778,
    channels: 3,
    background: '#050d12',
  },
})
  .composite([{ input: await sharp(srcIcon).resize(600, 600).png().toBuffer(), gravity: 'centre' }])
  .png()
  .toFile(join(resources, 'splash-logo.png'));

console.log('Generated resources/icon.png, splash.png and public icons');
