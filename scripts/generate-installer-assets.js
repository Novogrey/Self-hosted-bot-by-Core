const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const buildDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(buildDir, { recursive: true });

function svgTemplate(width, height, body) {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f1419"/>
          <stop offset="0.54" stop-color="#18232b"/>
          <stop offset="1" stop-color="#203830"/>
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#43c7b2"/>
          <stop offset="1" stop-color="#e0b14f"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="30%" r="65%">
          <stop offset="0" stop-color="#43c7b2" stop-opacity="0.32"/>
          <stop offset="1" stop-color="#43c7b2" stop-opacity="0"/>
        </radialGradient>
      </defs>
      ${body}
    </svg>
  `;
}

function logoSvg(size) {
  const radius = Math.round(size * 0.18);
  const inset = Math.round(size * 0.13);
  const fontSize = Math.round(size * 0.5);
  return svgTemplate(size, size, `
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
    <circle cx="${size * 0.72}" cy="${size * 0.18}" r="${size * 0.45}" fill="url(#glow)"/>
    <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${Math.max(5, radius - 4)}" fill="url(#accent)"/>
    <rect x="${inset + 5}" y="${inset + 5}" width="${size - (inset + 5) * 2}" height="${size - (inset + 5) * 2}" rx="${Math.max(4, radius - 7)}" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="${Math.max(1, Math.round(size * 0.025))}"/>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="#061614">C</text>
  `);
}

function sidebarSvg() {
  return svgTemplate(164, 314, `
    <rect width="164" height="314" fill="url(#bg)"/>
    <circle cx="130" cy="28" r="86" fill="url(#glow)"/>
    <path d="M-18 256 C32 222 65 262 119 224 C150 202 176 207 196 218 L196 314 L-18 314 Z" fill="#13221f" opacity="0.88"/>
    <path d="M0 0 L164 0 L164 314" fill="none" stroke="#43c7b2" stroke-opacity="0.22" stroke-width="2"/>
    <g transform="translate(22 28)">
      <rect width="58" height="58" rx="11" fill="url(#accent)"/>
      <rect x="6" y="6" width="46" height="46" rx="8" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="2"/>
      <text x="29" y="35" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="900" fill="#061614">C</text>
    </g>
    <text x="22" y="124" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="800" fill="#f2f5f7">Self-hosted</text>
    <text x="22" y="146" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="800" fill="#f2f5f7">bot by Core</text>
    <rect x="22" y="166" width="72" height="2" rx="1" fill="#43c7b2"/>
    <text x="22" y="194" font-family="Segoe UI, Arial, sans-serif" font-size="10.5" fill="#9aa7b2">Desktop control panel</text>
    <text x="22" y="212" font-family="Segoe UI, Arial, sans-serif" font-size="10.5" fill="#9aa7b2">SQLite runtime</text>
    <text x="22" y="230" font-family="Segoe UI, Arial, sans-serif" font-size="10.5" fill="#9aa7b2">Discord moderation</text>
    <g opacity="0.8">
      <rect x="22" y="268" width="120" height="1" fill="#2f3843"/>
      <text x="22" y="289" font-family="Segoe UI, Arial, sans-serif" font-size="9.5" fill="#43c7b2">discord.gg/YF8krDPCZh</text>
    </g>
  `);
}

function headerSvg() {
  return svgTemplate(150, 57, `
    <rect width="150" height="57" fill="#f7faf8"/>
    <circle cx="127" cy="4" r="45" fill="#43c7b2" opacity="0.16"/>
    <rect x="13" y="11" width="34" height="34" rx="7" fill="url(#accent)"/>
    <rect x="17" y="15" width="26" height="26" rx="5" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.4"/>
    <text x="30" y="31" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="900" fill="#061614">C</text>
    <text x="56" y="25" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="800" fill="#172025">Core bot</text>
    <text x="56" y="40" font-family="Segoe UI, Arial, sans-serif" font-size="8.5" fill="#5d6c72">self-hosted installer</text>
  `);
}

async function svgToPng(svg, outPath, size) {
  await sharp(Buffer.from(svg)).resize(size?.width, size?.height).png().toFile(outPath);
}

async function svgToRawRgb(svg, width, height) {
  const { data } = await sharp(Buffer.from(svg))
    .resize(width, height)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

async function writeBmp(svg, width, height, outPath) {
  const rgb = await svgToRawRgb(svg, width, height);
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const imageSize = rowStride * height;
  const fileSize = 14 + 40 + imageSize;
  const bmp = Buffer.alloc(fileSize);

  bmp.write('BM', 0, 'ascii');
  bmp.writeUInt32LE(fileSize, 2);
  bmp.writeUInt32LE(54, 10);
  bmp.writeUInt32LE(40, 14);
  bmp.writeInt32LE(width, 18);
  bmp.writeInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26);
  bmp.writeUInt16LE(24, 28);
  bmp.writeUInt32LE(0, 30);
  bmp.writeUInt32LE(imageSize, 34);
  bmp.writeInt32LE(2835, 38);
  bmp.writeInt32LE(2835, 42);

  let offset = 54;
  for (let y = height - 1; y >= 0; y -= 1) {
    const rowStart = y * width * 3;
    for (let x = 0; x < width; x += 1) {
      const source = rowStart + x * 3;
      bmp[offset++] = rgb[source + 2];
      bmp[offset++] = rgb[source + 1];
      bmp[offset++] = rgb[source];
    }
    offset += rowStride - width * 3;
  }

  fs.writeFileSync(outPath, bmp);
}

function writePngIco(images, outPath) {
  const count = images.length;
  const headerSize = 6 + count * 16;
  const totalSize = headerSize + images.reduce((sum, image) => sum + image.buffer.length, 0);
  const ico = Buffer.alloc(totalSize);

  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);

  let imageOffset = headerSize;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    ico.writeUInt8(image.size === 256 ? 0 : image.size, entry);
    ico.writeUInt8(image.size === 256 ? 0 : image.size, entry + 1);
    ico.writeUInt8(0, entry + 2);
    ico.writeUInt8(0, entry + 3);
    ico.writeUInt16LE(1, entry + 4);
    ico.writeUInt16LE(32, entry + 6);
    ico.writeUInt32LE(image.buffer.length, entry + 8);
    ico.writeUInt32LE(imageOffset, entry + 12);
    image.buffer.copy(ico, imageOffset);
    imageOffset += image.buffer.length;
  });

  fs.writeFileSync(outPath, ico);
}

async function buildIcon() {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = [];
  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(logoSvg(size))).png().toBuffer();
    images.push({ size, buffer });
  }
  writePngIco(images, path.join(buildDir, 'icon.ico'));
  await svgToPng(logoSvg(256), path.join(buildDir, 'icon.png'));
}

async function main() {
  const sidebar = sidebarSvg();
  const header = headerSvg();

  await writeBmp(sidebar, 164, 314, path.join(buildDir, 'installer-sidebar.bmp'));
  await writeBmp(sidebar, 164, 314, path.join(buildDir, 'uninstaller-sidebar.bmp'));
  await writeBmp(header, 150, 57, path.join(buildDir, 'installer-header.bmp'));
  await svgToPng(sidebar, path.join(buildDir, 'installer-sidebar-preview.png'));
  await svgToPng(header, path.join(buildDir, 'installer-header-preview.png'));
  await buildIcon();

  console.log(`Installer assets generated in ${buildDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
