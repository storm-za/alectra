import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_DIR = 'attached_assets/products';
const OUTPUT_DIR = 'attached_assets/optimized/products';
const WIDTHS = [600];
const QUALITY = 80;

async function pregenerateImages() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => 
    /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
  );

  console.log(`Processing ${files.length} images...`);
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(async (file) => {
      const baseName = path.parse(file).name;
      const outputFile = path.join(OUTPUT_DIR, `${baseName}.webp`);

      if (fs.existsSync(outputFile)) {
        skipped++;
        return;
      }

      try {
        const inputPath = path.join(SOURCE_DIR, file);
        const metadata = await sharp(inputPath).metadata();
        const targetWidth = WIDTHS[0];
        
        let pipeline = sharp(inputPath);
        if (metadata.width && metadata.width > targetWidth) {
          pipeline = pipeline.resize(targetWidth, null, {
            withoutEnlargement: true,
            fit: 'inside',
          });
        }

        await pipeline
          .webp({ quality: QUALITY, effort: 4 })
          .toFile(outputFile);

        processed++;
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
        errors++;
      }
    }));
    
    if ((i + batchSize) % 50 === 0 || i + batchSize >= files.length) {
      console.log(`Progress: ${Math.min(i + batchSize, files.length)}/${files.length}`);
    }
  }

  console.log(`Done! Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);
  
  const outputFiles = fs.readdirSync(OUTPUT_DIR);
  const totalSize = outputFiles.reduce((sum, f) => {
    return sum + fs.statSync(path.join(OUTPUT_DIR, f)).size;
  }, 0);
  console.log(`Output: ${outputFiles.length} files, ${(totalSize / 1024 / 1024).toFixed(1)}MB total`);
}

pregenerateImages().catch(console.error);
