import FigmaClient from '../lib/figma-client.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../../../apps/mobile/assets/figma');
const CACHE_DIR = path.resolve(__dirname, '../.cache');

async function downloadAssets() {
  console.log('📥 Downloading assets from Figma...\n');

  try {
    const client = new FigmaClient();
    
    // Get file data
    console.log('📥 Fetching Figma file...');
    const fileData = await client.getFile();
    
    // Collect all exportable nodes
    const exportableNodes = [];
    const componentNodes = [];
    
    client.traverseNodes(fileData.document, (node) => {
      // Look for nodes marked for export or with specific naming conventions
      if (node.name && (
        node.name.startsWith('icon/') ||
        node.name.startsWith('image/') ||
        node.name.startsWith('logo/') ||
        node.name.includes('[export]')
      )) {
        exportableNodes.push({
          id: node.id,
          name: node.name.replace('[export]', '').trim(),
          type: node.type,
        });
      }
      
      // Collect components
      if (node.type === 'COMPONENT') {
        componentNodes.push({
          id: node.id,
          name: node.name,
          type: node.type,
        });
      }
    });

    if (exportableNodes.length === 0 && componentNodes.length === 0) {
      console.log('⚠️  No assets found to export.');
      console.log('💡 Tip: Name nodes with prefixes like "icon/", "image/", or "logo/" to export them.');
      console.log('   Or add "[export]" to any node name to mark it for export.');
      return;
    }

    // Ensure output directories exist
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(path.join(OUTPUT_DIR, 'icons'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'images'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'logos'));
    await fs.ensureDir(path.join(OUTPUT_DIR, 'components'));
    await fs.ensureDir(CACHE_DIR);

    // Download exportable assets
    if (exportableNodes.length > 0) {
      console.log(`\n📦 Found ${exportableNodes.length} exportable assets`);
      await downloadNodeAssets(client, exportableNodes);
    }

    // Download component previews
    if (componentNodes.length > 0) {
      console.log(`\n🎨 Found ${componentNodes.length} components`);
      await downloadNodeAssets(client, componentNodes, 'components');
    }

    console.log('\n✅ Assets downloaded successfully!');
    console.log(`📁 Output: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error downloading assets:', error.message);
    process.exit(1);
  }
}

async function downloadNodeAssets(client, nodes, defaultFolder = null) {
  // Process in batches to avoid rate limits
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE);
    const nodeIds = batch.map(n => n.id);
    
    console.log(`\n📥 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(nodes.length / BATCH_SIZE)}`);
    
    try {
      // Get image URLs
      const imageData = await client.getImages(nodeIds, {
        format: 'png',
        scale: 2,
      });
      
      if (!imageData.images) {
        console.warn('  ⚠️  No images returned for this batch');
        continue;
      }

      // Download each image
      for (const node of batch) {
        const imageUrl = imageData.images[node.id];
        
        if (!imageUrl) {
          console.warn(`  ⚠️  No image URL for ${node.name}`);
          continue;
        }

        try {
          // Determine output folder
          let folder = defaultFolder;
          if (!folder) {
            if (node.name.startsWith('icon/')) {
              folder = 'icons';
            } else if (node.name.startsWith('image/')) {
              folder = 'images';
            } else if (node.name.startsWith('logo/')) {
              folder = 'logos';
            } else {
              folder = 'other';
            }
          }

          // Clean filename
          const filename = node.name
            .replace(/^(icon|image|logo)\//, '')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          const outputPath = path.join(OUTPUT_DIR, folder, `${filename}.png`);

          // Download image
          const imageBuffer = await client.downloadImage(imageUrl);
          await fs.writeFile(outputPath, imageBuffer);
          
          console.log(`  ✓ ${folder}/${filename}.png`);
        } catch (error) {
          console.error(`  ✗ Failed to download ${node.name}:`, error.message);
        }
      }
      
      // Rate limiting
      if (i + BATCH_SIZE < nodes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`  ✗ Batch failed:`, error.message);
    }
  }
}

// Run download
downloadAssets();
