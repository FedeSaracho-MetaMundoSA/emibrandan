import { useEffect, useRef } from 'react';

const scrollPositions = new Map<string, number>();

/**
 * Hook de accesibilidad para restaurar la posición de scroll
 * de paneles, listas o vistas al navegar entre pestañas o cambiar de modo.
 */
export function useScrollRestoration<T extends HTMLElement = HTMLDivElement>(
  key: string,
  enabled: boolean = true
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;
    const element = elementRef.current;
    if (!element) return;

    // Restaurar posición guardada
    const savedPosition = scrollPositions.get(key);
    if (typeof savedPosition === 'number') {
      element.scrollTop = savedPosition;
    }

    const handleScroll = () => {
      scrollPositions.set(key, element.scrollTop);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (element) {
        scrollPositions.set(key, element.scrollTop);
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [key, enabled]);

  return elementRef;
}
