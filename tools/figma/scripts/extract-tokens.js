import FigmaClient from '../lib/figma-client.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../../../apps/mobile/theme');

async function extractDesignTokens() {
  console.log('🎨 Extracting design tokens from Figma...\n');

  try {
    const client = new FigmaClient();
    
    // Get file data
    console.log('📥 Fetching Figma file...');
    const fileData = await client.getFile();
    
    // Get styles
    console.log('🎨 Fetching styles...');
    const styles = await client.getFileStyles();
    
    const tokens = {
      colors: {},
      typography: {},
      spacing: {},
      shadows: {},
      radii: {},
    };

    // Extract color styles
    console.log('🎨 Extracting colors...');
    if (styles.meta && styles.meta.styles) {
      for (const style of styles.meta.styles) {
        if (style.style_type === 'FILL') {
          try {
            const styleDetails = await client.getStyle(style.key);
            const node = styleDetails.meta.node;
            
            if (node.fills && node.fills.length > 0) {
              const color = client.extractColor(node.fills[0]);
              if (color) {
                const name = style.name.toLowerCase()
                  .replace(/\//g, '-')
                  .replace(/\s+/g, '-');
                tokens.colors[name] = color;
              }
            }
          } catch (error) {
            console.warn(`  ⚠️  Could not extract style ${style.name}:`, error.message);
          }
        }
      }
    }

    // Extract colors from document nodes
    console.log('🔍 Scanning document for additional colors...');
    const colorMap = new Map();
    
    client.traverseNodes(fileData.document, (node) => {
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach(fill => {
          const color = client.extractColor(fill);
          if (color && node.name) {
            const colorKey = node.name.toLowerCase()
              .replace(/\//g, '-')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
            
            if (colorKey && !colorMap.has(colorKey)) {
              colorMap.set(colorKey, color);
            }
          }
        });
      }

      // Extract text styles (typography)
      if (node.type === 'TEXT' && node.style) {
        const { fontSize, fontFamily, fontWeight, lineHeightPx, letterSpacing } = node.style;
        const typographyKey = node.name.toLowerCase()
          .replace(/\//g, '-')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        if (typographyKey && fontSize) {
          tokens.typography[typographyKey] = {
            fontSize,
            fontFamily: fontFamily || 'System',
            fontWeight: fontWeight || 400,
            lineHeight: lineHeightPx ? `${lineHeightPx}px` : undefined,
            letterSpacing: letterSpacing || 0,
          };
        }
      }

      // Extract spacing from layout constraints
      if (node.paddingLeft !== undefined) {
        const spacingKey = node.name.toLowerCase()
          .replace(/\//g, '-')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        if (spacingKey) {
          tokens.spacing[spacingKey] = {
            paddingTop: node.paddingTop,
            paddingRight: node.paddingRight,
            paddingBottom: node.paddingBottom,
            paddingLeft: node.paddingLeft,
          };
        }
      }

      // Extract corner radius
      if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
        const radiusKey = node.name.toLowerCase()
          .replace(/\//g, '-')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        if (radiusKey) {
          tokens.radii[radiusKey] = node.cornerRadius;
        }
      }

      // Extract effects (shadows)
      if (node.effects && Array.isArray(node.effects) && node.effects.length > 0) {
        node.effects.forEach((effect, index) => {
          if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
            const shadowKey = `${node.name.toLowerCase()
              .replace(/\//g, '-')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')}-${index}`;
            
            tokens.shadows[shadowKey] = {
              offsetX: effect.offset?.x || 0,
              offsetY: effect.offset?.y || 0,
              radius: effect.radius || 0,
              color: client.extractColor({ type: 'SOLID', color: effect.color }),
            };
          }
        });
      }
    });

    // Merge discovered colors with existing tokens
    colorMap.forEach((color, name) => {
      if (!tokens.colors[name]) {
        tokens.colors[name] = color;
      }
    });

    // Ensure output directory exists
    await fs.ensureDir(OUTPUT_DIR);

    // Write tokens to TypeScript files
    console.log('\n📝 Writing design tokens...');
    
    await writeTokenFile('colors.ts', tokens.colors, 'Colors');
    await writeTokenFile('typography.ts', tokens.typography, 'Typography');
    await writeTokenFile('spacing.ts', tokens.spacing, 'Spacing');
    await writeTokenFile('shadows.ts', tokens.shadows, 'Shadows');
    await writeTokenFile('radii.ts', tokens.radii, 'Radii');

    // Write index file
    await writeIndexFile();

    console.log('\n✅ Design tokens extracted successfully!');
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Colors: ${Object.keys(tokens.colors).length}`);
    console.log(`   Typography: ${Object.keys(tokens.typography).length}`);
    console.log(`   Spacing: ${Object.keys(tokens.spacing).length}`);
    console.log(`   Shadows: ${Object.keys(tokens.shadows).length}`);
    console.log(`   Radii: ${Object.keys(tokens.radii).length}`);

  } catch (error) {
    console.error('❌ Error extracting design tokens:', error.message);
    process.exit(1);
  }
}

async function writeTokenFile(filename, tokens, typeName) {
  const content = `// Auto-generated from Figma
// Do not edit manually - run 'pnpm figma:sync' to update

export const ${typeName.toLowerCase()} = ${JSON.stringify(tokens, null, 2)} as const;

export type ${typeName} = typeof ${typeName.toLowerCase()};
`;

  await fs.writeFile(path.join(OUTPUT_DIR, filename), content);
  console.log(`  ✓ ${filename}`);
}

async function writeIndexFile() {
  const content = `// Auto-generated from Figma
// Do not edit manually - run 'pnpm figma:sync' to update

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './radii';
`;

  await fs.writeFile(path.join(OUTPUT_DIR, 'index.ts'), content);
  console.log(`  ✓ index.ts`);
}

// Run extraction
extractDesignTokens();
