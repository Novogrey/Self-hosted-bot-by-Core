const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'desktop', 'renderer', 'assets', 'onboarding');

const sources = [
  {
    input: 'C:/Users/olexa/AppData/Local/Temp/codex-clipboard-a7042924-b820-4259-acd4-de7ddca788ad.png',
    output: 'step-01-applications.png',
    labels: [
      { x: 1500, y: 92, w: 260, h: 76, text: '1. New Application', tx: 1240, ty: 170, arrow: [1630, 132] }
    ]
  },
  {
    input: 'C:/Users/olexa/AppData/Local/Temp/codex-clipboard-eb64e956-c502-4834-80c2-9c1037d362af.png',
    output: 'step-02-create-app.png',
    labels: [
      { x: 18, y: 96, w: 420, h: 48, text: '2. Имя бота', tx: 150, ty: 56, arrow: [225, 120] },
      { x: 20, y: 244, w: 420, h: 54, text: '3. Галочка условий', tx: 128, ty: 235, arrow: [32, 258] },
      { x: 272, y: 306, w: 188, h: 50, text: '4. Create', tx: 285, ty: 372, arrow: [365, 330] }
    ]
  },
  {
    input: 'C:/Users/olexa/AppData/Local/Temp/codex-clipboard-c56bbaf1-ea6a-4d23-998a-77120d0eba21.png',
    output: 'step-03-application-id.png',
    labels: [
      { x: 570, y: 590, w: 100, h: 100, text: '5. Application ID = ID бота', tx: 720, ty: 650, arrow: [628, 658] }
    ]
  },
  {
    input: 'C:/Users/olexa/AppData/Local/Temp/codex-clipboard-e0306290-1294-497c-ba1c-f44ddca4137c.png',
    output: 'step-04-token.png',
    labels: [
      { x: 26, y: 326, w: 220, h: 54, text: '6. Вкладка Bot', tx: 285, ty: 360, arrow: [120, 354] },
      { x: 372, y: 732, w: 128, h: 62, text: '7. Reset Token -> copy', tx: 540, ty: 775, arrow: [432, 760] }
    ]
  },
  {
    input: 'C:/Users/olexa/AppData/Local/Temp/codex-clipboard-feb02ecf-13a1-4d69-a35f-e81279553833.png',
    output: 'step-05-intents.png',
    labels: [
      { x: 1690, y: 276, w: 92, h: 46, text: '8. Presence Intent', tx: 1290, ty: 275, arrow: [1735, 292] },
      { x: 1690, y: 392, w: 92, h: 46, text: '9. Server Members Intent', tx: 1210, ty: 410, arrow: [1735, 408] },
      { x: 1690, y: 508, w: 92, h: 46, text: '10. Message Content Intent', tx: 1190, ty: 545, arrow: [1735, 524] }
    ]
  }
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function arrowPath(fromX, fromY, toX, toY) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const size = 14;
  const leftX = toX - size * Math.cos(angle - Math.PI / 6);
  const leftY = toY - size * Math.sin(angle - Math.PI / 6);
  const rightX = toX - size * Math.cos(angle + Math.PI / 6);
  const rightY = toY - size * Math.sin(angle + Math.PI / 6);
  return `<line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="#43c7b2" stroke-width="6" stroke-linecap="round"/>
  <polygon points="${toX},${toY} ${leftX},${leftY} ${rightX},${rightY}" fill="#43c7b2"/>`;
}

function overlay(width, height, labels) {
  const body = labels.map((label) => {
    const fromX = label.tx + 16;
    const fromY = label.ty + 18;
    const [toX, toY] = label.arrow;
    return `
      <rect x="${label.x}" y="${label.y}" width="${label.w}" height="${label.h}" rx="12" fill="rgba(67,199,178,0.16)" stroke="#43c7b2" stroke-width="5"/>
      <rect x="${label.tx}" y="${label.ty - 28}" width="${Math.max(210, label.text.length * 10)}" height="44" rx="12" fill="#111820" stroke="#43c7b2" stroke-width="2"/>
      <text x="${label.tx + 16}" y="${label.ty}" fill="#f7fbff" font-family="Arial, Segoe UI, sans-serif" font-size="21" font-weight="700">${escapeXml(label.text)}</text>
      ${arrowPath(fromX, fromY, toX, toY)}
    `;
  }).join('');

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.10)"/>
      ${body}
    </svg>
  `);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of sources) {
    const target = path.join(outDir, item.output);
    if (!fs.existsSync(item.input)) {
      if (fs.existsSync(target)) {
        console.log(`Skipped ${item.output}: output already exists.`);
        continue;
      }
      console.warn(`Missing source screenshot: ${item.input}`);
      continue;
    }

    const image = sharp(item.input);
    const meta = await image.metadata();
    await image
      .composite([{ input: overlay(meta.width, meta.height, item.labels), top: 0, left: 0 }])
      .png({ compressionLevel: 9 })
      .toFile(target);
    console.log(`Generated ${path.relative(process.cwd(), target)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
