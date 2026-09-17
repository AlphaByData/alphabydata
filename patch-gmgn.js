import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signerPath = path.join(__dirname, 'node_modules/gmgn-cli/dist/client/signer.js');

try {
  if (fs.existsSync(signerPath)) {
    let content = fs.readFileSync(signerPath, 'utf8');
    if (!content.includes('CLOCK_OFFSET_MS')) {
      content = content.replace(
        'return {\n        timestamp: Math.floor(Date.now() / 1000),',
        `const offsetMs = parseInt(process.env.CLOCK_OFFSET_MS || '0', 10);\n    return {\n        timestamp: Math.floor((Date.now() + offsetMs) / 1000),`
      );
      fs.writeFileSync(signerPath, content, 'utf8');
      console.log('✅ [patch-gmgn] Successfully patched gmgn-cli signer.js for CLOCK_OFFSET_MS support');
    } else {
      console.log('ℹ️ [patch-gmgn] gmgn-cli signer.js is already patched.');
    }
  }
} catch (err) {
  console.warn('⚠️ [patch-gmgn] Could not patch signer.js:', err.message);
}
