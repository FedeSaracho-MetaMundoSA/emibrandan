import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  pngFallback?: string;
}

/**
 * Componente de imagen de alto rendimiento optimizado para dispositivos móviles:
 * - Sirve WebP nativamente mediante el tag <picture>
 * - Provee fallback automático a PNG / JPEG
 * - Decodificación asíncrona (decoding="async")
 * - Carga diferida nativa (loading="lazy")
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  pngFallback,
  ...props
}) => {
  // Para URLs de Unsplash u orígenes dinámicos, derivar WebP y PNG automáticamente
  let webpUrl = src;
  let fallbackUrl = pngFallback || src;

  if (src.includes('images.unsplash.com')) {
    webpUrl = src.includes('fm=') ? src.replace(/fm=[a-zA-Z0-9]+/, 'fm=webp') : `${src}&fm=webp`;
    if (!pngFallback) {
      fallbackUrl = src.includes('fm=') ? src.replace(/fm=[a-zA-Z0-9]+/, 'fm=png') : `${src}&fm=png`;
    }
  }

  return (
    <picture className="w-full h-full block">
      <source type="image/webp" srcSet={webpUrl} />
      <img
        src={fallbackUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={className}
        {...props}
      />
    </picture>
  );
};
