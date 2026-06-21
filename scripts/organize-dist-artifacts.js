const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const distDir = path.join(root, 'dist');
const versionDir = path.join(distDir, pkg.version);
const releaseExtensions = new Set(['.exe', '.zip', '.blockmap']);

function isCurrentVersionArtifact(name) {
  if (!name.includes(pkg.version)) return false;
  if (releaseExtensions.has(path.extname(name))) return true;
  return name.endsWith('.exe.blockmap');
}

function moveFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) fs.rmSync(target, { force: true });
  fs.renameSync(source, target);
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.log('dist directory does not exist; nothing to organize.');
    return;
  }

  fs.mkdirSync(versionDir, { recursive: true });
  const moved = [];

  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isFile() || !isCurrentVersionArtifact(entry.name)) continue;

    const source = path.join(distDir, entry.name);
    const target = path.join(versionDir, entry.name);
    moveFile(source, target);
    moved.push(path.relative(root, target));
  }

  if (moved.length) {
    console.log(`Organized ${moved.length} release artifact(s) into dist/${pkg.version}`);
    for (const file of moved) console.log(`- ${file}`);
  } else {
    console.log(`No ${pkg.version} release artifacts found in dist root.`);
  }
}

main();
