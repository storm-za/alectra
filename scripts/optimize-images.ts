import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const QUALITY = 80;

interface ImageOptimization {
  input: string;
  output: string;
  width: number;
  height?: number;
}

const imagesToOptimize: ImageOptimization[] = [
  // Category images - displayed at 665x665 on homepage, resize to 800px
  {
    input: 'attached_assets/products/8-line-30-meter-advanced-electric-fence-kit.png',
    output: 'attached_assets/optimized/electric-fencing-category.webp',
    width: 800
  },
  {
    input: 'attached_assets/products/centurion-nova-4-button-remote.png',
    output: 'attached_assets/optimized/remotes-category.webp',
    width: 800
  },
  {
    input: 'attached_assets/products/4k-solar-powered-security-camera.png',
    output: 'attached_assets/optimized/cctv-category.webp',
    width: 800
  },
  {
    input: 'attached_assets/products/centurion-d10-smart-turbo-gate-motor.png',
    output: 'attached_assets/optimized/gate-motors-category.webp',
    width: 800
  },
  {
    input: 'attached_assets/products/19kg-exchange.png',
    output: 'attached_assets/optimized/lp-gas-category.webp',
    width: 800
  },
  {
    input: 'attached_assets/products/nylon-roller-heavy-duty.png',
    output: 'attached_assets/optimized/garage-door-parts-category.webp',
    width: 800
  },
  // Hero background - mobile version, keep reasonable size
  {
    input: 'attached_assets/hero-background-mobile.png',
    output: 'attached_assets/optimized/hero-background-mobile.webp',
    width: 800
  },
  // Hero background - desktop version
  {
    input: 'attached_assets/hero-background.png',
    output: 'attached_assets/optimized/hero-background-desktop.webp',
    width: 1920
  },
  // Logo - keep small
  {
    input: 'attached_assets/Alectra__8_-removebg-preview.png',
    output: 'attached_assets/optimized/logo.webp',
    width: 400
  }
];

async function optimizeImage(config: ImageOptimization): Promise<void> {
  const { input, output, width, height } = config;
  
  if (!fs.existsSync(input)) {
    console.log(`⚠️ Skipping ${input} - file not found`);
    return;
  }
  
  const outputDir = path.dirname(output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const inputStats = fs.statSync(input);
  const inputSizeKB = (inputStats.size / 1024).toFixed(1);
  
  await sharp(input)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(output);
  
  const outputStats = fs.statSync(output);
  const outputSizeKB = (outputStats.size / 1024).toFixed(1);
  const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(0);
  
  console.log(`✅ ${path.basename(input)} → ${path.basename(output)}`);
  console.log(`   ${inputSizeKB} KB → ${outputSizeKB} KB (${savings}% smaller)`);
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  let totalInputSize = 0;
  let totalOutputSize = 0;
  
  for (const config of imagesToOptimize) {
    try {
      if (fs.existsSync(config.input)) {
        totalInputSize += fs.statSync(config.input).size;
      }
      await optimizeImage(config);
      if (fs.existsSync(config.output)) {
        totalOutputSize += fs.statSync(config.output).size;
      }
    } catch (error) {
      console.error(`❌ Failed to optimize ${config.input}:`, error);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total input: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total output: ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total savings: ${((1 - totalOutputSize / totalInputSize) * 100).toFixed(0)}%`);
  console.log('\n✨ Optimization complete!');
}

main();
