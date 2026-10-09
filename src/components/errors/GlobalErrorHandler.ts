/**
 * GlobalErrorHandler
 * Sistema centralizado de captura, diagnóstico y telemetría de errores
 * para Riveras de Pucheta Masterplan 3D.
 */

export interface ErrorReport {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  stack?: string;
  componentStack?: string;
  context?: Record<string, unknown>;
  handled: boolean;
}

type ErrorListener = (report: ErrorReport) => void;

class GlobalErrorHandlerService {
  private errors: ErrorReport[] = [];
  private listeners: Set<ErrorListener> = new Set();
  private maxStoredErrors = 30;

  constructor() {
    this.setupGlobalHooks();
  }

  private setupGlobalHooks() {
    if (typeof window === 'undefined') return;

    // Escuchar pérdida de contexto WebGL a nivel documento/canvas
    window.addEventListener('webglcontextlost', (event) => {
      this.reportError(new Error('WebGL context lost - GPU reset or memory limit reached'), {
        source: 'WebGL',
        context: {
          type: 'webglcontextlost',
          originalEvent: event
        }
      });
    }, false);

    // Escuchar errores de recursos o scripts no controlados
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.reportError(reason, {
        source: 'UnhandledPromiseRejection',
        handled: false
      });
    });
  }

  /**
   * Registra un error capturado por un ErrorBoundary, hook o componente.
   */
  public reportError(
    error: Error | unknown,
    metadata: {
      source?: string;
      componentStack?: string;
      context?: Record<string, unknown>;
      handled?: boolean;
    } = {}
  ): ErrorReport {
    const err = error instanceof Error ? error : new Error(String(error));

    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      source: metadata.source || 'App',
      message: err.message || 'Error desconocido',
      stack: err.stack,
      componentStack: metadata.componentStack,
      context: metadata.context,
      handled: metadata.handled ?? true
    };

    // Guardar en memoria (con límite)
    this.errors.unshift(report);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors.pop();
    }

    // Log formateado para depuración local
    console.error(`[GlobalErrorHandler] [${report.source}] ${report.message}`, {
      report,
      error: err
    });

    // Notificar a listeners registrados (e.g. paneles de diagnóstico, analytics)
    this.notifyListeners(report);

    return report;
  }

  /**
   * Suscribe un listener a nuevos errores reportados.
   */
  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(report: ErrorReport) {
    this.listeners.forEach((listener) => {
      try {
        listener(report);
      } catch (err) {
        console.warn('Error en listener de GlobalErrorHandler:', err);
      }
    });
  }

  /**
   * Retorna el historial de errores recientes.
   */
  public getRecentErrors(): ErrorReport[] {
    return [...this.errors];
  }

  /**
   * Limpia el registro de errores en memoria.
   */
  public clearErrors(): void {
    this.errors = [];
  }
}

export const GlobalErrorHandler = new GlobalErrorHandlerService();
