import { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

const PLACEHOLDER_IMAGE = '/attached_assets/placeholder.png';

function getOptimizedUrl(src: string, width: number, quality: number = 80): string {
  if (!src) return PLACEHOLDER_IMAGE;
  
  // Skip optimization for external URLs (Shopify CDN, etc.)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Remove leading slash for the /img endpoint
  const cleanPath = src.startsWith('/') ? src.slice(1) : src;
  
  // Handle object storage paths (e.g., /objects/uploads/uuid)
  // These are now optimized through the /img endpoint
  return `/img/${cleanPath}?w=${width}&q=${quality}`;
}

function generateSrcSet(src: string, quality: number = 80): string {
  if (!src || src.startsWith('http://') || src.startsWith('https://')) {
    return '';
  }
  
  const widths = [200, 400, 600, 800, 1000, 1200];
  return widths
    .map(w => `${getOptimizedUrl(src, w, quality)} ${w}w`)
    .join(', ');
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  quality = 80,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Use placeholder if no src or error occurred
  const imageSrc = hasError || !src ? PLACEHOLDER_IMAGE : src;
  
  // For external URLs, use them directly
  const isExternal = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
  
  // Default fallback size for srcSet
  const defaultWidth = width || 800;
  
  if (isExternal) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  const srcSet = generateSrcSet(imageSrc, quality);
  const optimizedSrc = getOptimizedUrl(imageSrc, defaultWidth, quality);

  const imgProps: React.ImgHTMLAttributes<HTMLImageElement> & { fetchpriority?: string } = {
    src: optimizedSrc,
    srcSet: srcSet || undefined,
    sizes: srcSet ? sizes : undefined,
    alt,
    width,
    height,
    loading: priority ? 'eager' : 'lazy',
    decoding: priority ? 'sync' : 'async',
    className: `${className} ${!isLoaded ? 'animate-pulse bg-muted' : ''}`,
    onLoad: handleLoad,
    onError: handleError,
  };
  
  if (priority) {
    imgProps.fetchpriority = 'high';
  }

  return <img {...imgProps} />;
}

export function ProductImage({
  src,
  alt,
  className = '',
  size = 'medium',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'full';
  priority?: boolean;
}) {
  const sizeConfig = {
    thumbnail: { width: 100, sizes: '100px' },
    small: { width: 200, sizes: '200px' },
    medium: { width: 400, sizes: '(max-width: 640px) 50vw, 400px' },
    large: { width: 800, sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px' },
    full: { width: 1200, sizes: '100vw' },
  };

  const config = sizeConfig[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      width={config.width}
      sizes={config.sizes}
      priority={priority}
      quality={size === 'thumbnail' ? 70 : 80}
    />
  );
}

export function getOptimizedImageUrl(src: string, width: number = 800): string {
  return getOptimizedUrl(src, width);
}
