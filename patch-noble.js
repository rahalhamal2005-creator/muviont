/**
 * 1. Patch @noble/ciphers to add missing './utils' export.
 * 2. Patch @opennextjs/aws copyTracedFiles to handle Windows symlink EPERM gracefully.
 */
const fs = require('fs');
const path = require('path');

// Patch 1: @noble/ciphers
const pkgPath = path.join(__dirname, 'node_modules', '@noble', 'ciphers', 'package.json');
try {
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.exports['./utils']) {
      pkg.exports['./utils'] = './utils.js';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('✅ Patched @noble/ciphers: added ./utils export alias');
    } else {
      console.log('ℹ️  @noble/ciphers already has ./utils export');
    }
  }
} catch (e) {
  console.warn('⚠️  Could not patch @noble/ciphers:', e.message);
}

// Patch 2: @opennextjs/aws copyTracedFiles for Windows EPERM symlink
const copyTracedPath = path.join(__dirname, 'node_modules', '@opennextjs', 'aws', 'dist', 'build', 'copyTracedFiles.js');
try {
  if (fs.existsSync(copyTracedPath)) {
    let content = fs.readFileSync(copyTracedPath, 'utf8');
    const targetPattern = `if (symlink) {\n            try {\n                symlinkSync(symlink, to);`;
    const replacement = `if (symlink) {\n            try {\n                symlinkSync(symlink, to, process.platform === 'win32' ? 'junction' : undefined);`;

    if (content.includes(targetPattern)) {
      content = content.replace(targetPattern, replacement);
      // Also catch EPERM and fallback to copyFileAndMakeOwnerWritable
      content = content.replace(
        `if (e.code !== "EEXIST") {\n                    throw e;\n                }`,
        `if (e.code !== "EEXIST") {\n                    try { copyFileAndMakeOwnerWritable(from, to); } catch (_err) { throw e; }\n                }`
      );
      fs.writeFileSync(copyTracedPath, content, 'utf8');
      console.log('✅ Patched @opennextjs/aws copyTracedFiles: added Windows symlink fallback');
    } else {
      console.log('ℹ️  @opennextjs/aws copyTracedFiles already patched or modified');
    }
  }
} catch (e) {
  console.warn('⚠️  Could not patch @opennextjs/aws copyTracedFiles:', e.message);
}
