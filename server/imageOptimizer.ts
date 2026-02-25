import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';

// In-memory cache for optimized images
const imageCache = new Map<string, { buffer: Buffer; mimeType: string; timestamp: number }>();
const CACHE_MAX_SIZE = 500; // Max number of images to cache in memory
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Allowed image sizes for security (prevent arbitrary size attacks)
const ALLOWED_WIDTHS = [50, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000];

// Security: allowed base directories for images
const ALLOWED_BASE_DIRS = ['attached_assets', 'images'];

// Path remapping: logical path prefix → actual filesystem prefix
const PATH_REMAPS: Record<string, string> = {
  'images/': 'client/public/images/',
};

// Security: allowed image extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

// Object storage service for cloud-stored images
const objectStorageService = new ObjectStorageService();

// Check if path is an object storage path
export function isObjectStoragePath(imagePath: string): boolean {
  if (!imagePath) return false;
  const cleaned = imagePath.replace(/^\/+/, '');
  return cleaned.startsWith('objects/');
}

// Fetch image buffer from object storage
async function fetchFromObjectStorage(objectPath: string): Promise<Buffer | null> {
  try {
    // Ensure path starts with /objects/
    const normalizedPath = objectPath.startsWith('/objects/') 
      ? objectPath 
      : `/objects/${objectPath.replace(/^objects\//, '')}`;
    
    const objectFile = await objectStorageService.getObjectEntityFile(normalizedPath);
    
    // Download the file to a buffer
    const chunks: Buffer[] = [];
    const stream = objectFile.createReadStream();
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err: Error) => {
        console.error('Error streaming from object storage:', err);
        reject(err);
      });
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      console.warn(`Object not found in storage: ${objectPath}`);
      return null;
    }
    console.error('Error fetching from object storage:', error);
    return null;
  }
}

// Security: validate and sanitize image path (for local files only)
export function validateImagePath(imagePath: string): string | null {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }
  
  // Decode URL-encoded characters
  let decoded: string;
  try {
    decoded = decodeURIComponent(imagePath);
  } catch {
    return null;
  }
  
  // Remove leading slashes
  decoded = decoded.replace(/^\/+/, '');
  
  // Normalize the path and resolve any relative components
  const normalized = path.normalize(decoded);
  
  // Block path traversal attempts
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    console.warn(`Path traversal attempt blocked: ${imagePath}`);
    return null;
  }
  
  // Check if path starts with an allowed base directory
  const isAllowedBase = ALLOWED_BASE_DIRS.some(base => 
    normalized.startsWith(base + '/') || normalized.startsWith(base + path.sep)
  );
  
  if (!isAllowedBase) {
    console.warn(`Path not in allowed directory: ${imagePath}`);
    return null;
  }
  
  // Check file extension
  const ext = path.extname(normalized).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    console.warn(`Invalid image extension: ${ext}`);
    return null;
  }
  
  return normalized;
}

function getClosestWidth(requestedWidth: number): number {
  // Find the closest allowed width that's >= requested
  const closest = ALLOWED_WIDTHS.find(w => w >= requestedWidth);
  return closest || ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

function getCacheKey(imagePath: string, width: number, format: string, quality: number): string {
  return crypto.createHash('md5').update(`${imagePath}-${width}-${format}-${quality}`).digest('hex');
}

function cleanCache(): void {
  const now = Date.now();
  const entries = Array.from(imageCache.entries());
  
  // Remove expired entries
  entries.forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      imageCache.delete(key);
    }
  });
  
  // If still too many, remove oldest
  if (imageCache.size > CACHE_MAX_SIZE) {
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sortedEntries.slice(0, imageCache.size - CACHE_MAX_SIZE);
    toRemove.forEach(([key]) => imageCache.delete(key));
  }
}

export interface OptimizeOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

export async function optimizeImage(
  imagePath: string,
  options: OptimizeOptions = {}
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const { width = 800, quality = 80, format = 'webp' } = options;
  
  // Normalize width to allowed values
  const normalizedWidth = getClosestWidth(width);
  
  // Validate quality bounds
  const boundedQuality = Math.max(10, Math.min(100, quality));
  
  // Check if this is an object storage path
  const isObjectPath = isObjectStoragePath(imagePath);
  
  // For local files, validate the path; for object storage, just clean it
  let resolvedPath: string;
  if (isObjectPath) {
    resolvedPath = imagePath.replace(/^\/+/, '');
  } else {
    const validatedPath = validateImagePath(imagePath);
    if (!validatedPath) {
      return null;
    }
    resolvedPath = validatedPath;
  }
  
  // Check cache first
  const cacheKey = getCacheKey(resolvedPath, normalizedWidth, format, boundedQuality);
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { buffer: cached.buffer, mimeType: cached.mimeType };
  }
  
  try {
    let sourceBuffer: Buffer | null = null;
    
    if (isObjectPath) {
      // Fetch from object storage
      sourceBuffer = await fetchFromObjectStorage(resolvedPath);
      if (!sourceBuffer) {
        console.error(`Object storage image not found: ${resolvedPath}`);
        return null;
      }
    } else {
      // Apply path remapping for directories that live outside cwd root
      let fsPath = resolvedPath;
      for (const [logicalPrefix, fsPrefix] of Object.entries(PATH_REMAPS)) {
        if (resolvedPath.startsWith(logicalPrefix)) {
          fsPath = fsPrefix + resolvedPath.slice(logicalPrefix.length);
          break;
        }
      }
      // Check if local file exists
      if (!fs.existsSync(fsPath)) {
        console.error(`Image not found: ${fsPath}`);
        return null;
      }
      sourceBuffer = fs.readFileSync(fsPath);
    }
    
    let sharpInstance = sharp(sourceBuffer);
    
    // Get original metadata to check if resize is needed
    const metadata = await sharpInstance.metadata();
    
    // Only resize if original is larger than requested
    if (metadata.width && metadata.width > normalizedWidth) {
      sharpInstance = sharpInstance.resize(normalizedWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }
    
    // Convert to requested format with optimization
    let buffer: Buffer;
    let mimeType: string;
    
    switch (format) {
      case 'webp':
        buffer = await sharpInstance.webp({ quality, effort: 4 }).toBuffer();
        mimeType = 'image/webp';
        break;
      case 'avif':
        buffer = await sharpInstance.avif({ quality, effort: 4 }).toBuffer();
        mimeType = 'image/avif';
        break;
      case 'jpeg':
        buffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
        mimeType = 'image/jpeg';
        break;
      case 'png':
        buffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
        mimeType = 'image/png';
        break;
      default:
        buffer = await sharpInstance.webp({ quality, effort: 4 }).toBuffer();
        mimeType = 'image/webp';
    }
    
    // Clean cache periodically and add new entry
    cleanCache();
    imageCache.set(cacheKey, { buffer, mimeType, timestamp: Date.now() });
    
    return { buffer, mimeType };
  } catch (error) {
    console.error(`Error optimizing image ${imagePath}:`, error);
    return null;
  }
}

export async function warmImageCache(): Promise<void> {
  const productsDir = 'attached_assets/products';
  if (!fs.existsSync(productsDir)) return;
  
  const files = fs.readdirSync(productsDir).filter(f => 
    /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
  );
  
  console.log(`Warming image cache for ${files.length} product images (400px WebP for cards)...`);
  let warmed = 0;
  
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(async (file) => {
      try {
        const imagePath = `${productsDir}/${file}`;
        await optimizeImage(imagePath, { width: 400, quality: 80, format: 'webp' });
        warmed++;
      } catch {}
    }));
  }
  
  console.log(`Image cache warmed: ${warmed} product card images ready`);
}

// Helper to parse Accept header for best format
export function getBestImageFormat(acceptHeader: string | undefined): 'webp' | 'avif' | 'jpeg' {
  if (!acceptHeader) return 'jpeg';
  
  // Prefer AVIF > WebP > JPEG based on browser support
  if (acceptHeader.includes('image/avif')) return 'avif';
  if (acceptHeader.includes('image/webp')) return 'webp';
  return 'jpeg';
}
