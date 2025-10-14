import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runScript(scriptPath, scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Running: ${scriptName}`);
    console.log(`${'='.repeat(60)}\n`);

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: path.dirname(scriptPath),
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${scriptName} exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function sync() {
  console.log('🔄 Syncing Figma design system...\n');
  
  const scriptsDir = __dirname;
  
  try {
    // Step 1: Extract design tokens
    await runScript(
      path.join(scriptsDir, 'extract-tokens.js'),
      'Extract Design Tokens'
    );

    // Step 2: Download assets
    await runScript(
      path.join(scriptsDir, 'download-assets.js'),
      'Download Assets'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ Figma sync completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📦 What was synced:');
    console.log('  - Design tokens (colors, typography, spacing, shadows, radii)');
    console.log('  - Assets (icons, images, logos, components)');
    console.log('\n💡 Next steps:');
    console.log('  - Import design tokens: import { colors } from "@/theme"');
    console.log('  - Use assets in components');
    console.log('  - Run this sync again anytime designs change\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run sync
sync();
