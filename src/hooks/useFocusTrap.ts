import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocus?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * Hook de accesibilidad WCAG 2.1 AA para atrapar el foco dentro de modales y diálogos,
 * soportando navegación por Tab/Shift+Tab, cierre con Escape y restauración de foco al cerrar.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
  returnFocus = true
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Guardar el elemento previamente enfocado para restaurarlo al cerrar
    if (returnFocus && typeof document !== 'undefined') {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    const container = containerRef.current;
    if (!container) return;

    // Enfocar elemento inicial o primer elemento interactivo
    const setInitialFocus = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }
      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        container.focus();
      }
    };

    const timer = setTimeout(setInitialFocus, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      // Manejar cierre con tecla Escape
      if (event.key === 'Escape') {
        if (onClose) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
        return;
      }

      // Manejar ciclado de foco con Tab y Shift+Tab
      if (event.key === 'Tab') {
        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null); // Solo visibles

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: si estamos en el primer elemento, mover al último
          if (document.activeElement === firstElement || document.activeElement === container) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: si estamos en el último elemento, volver al primero
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);

      // Restaurar foco al elemento que lo tenía antes de abrir el modal
      if (returnFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef, returnFocus]);

  return containerRef;
}
