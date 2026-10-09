import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlobalErrorHandler } from './GlobalErrorHandler';
import { AppErrorFallback } from './AppErrorFallback';

export interface ErrorBoundaryFallbackProps {
  error: Error | null;
  resetError: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const componentName = this.props.name || 'Component';

    // Log estructurado a consola
    console.error(`[ErrorBoundary:${componentName}] Error capturado:`, error, errorInfo);

    // Registrar en el servicio centralizado de telemetría y diagnósticos
    GlobalErrorHandler.reportError(error, {
      source: `ErrorBoundary:${componentName}`,
      componentStack: errorInfo.componentStack || undefined
    });

    // Callback personalizado si fue provisto
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Si hay resetKeys y alguna cambió, resetear el error automáticamente
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasChanged = resetKeys.some((key, idx) => key !== prevProps.resetKeys?.[idx]);
      if (hasChanged) {
        this.resetError();
      }
    }
  }

  public resetError = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback({
          error: this.state.error,
          resetError: this.resetError
        });
      }

      if (fallback) {
        // Si es un elemento React válido, inyectarle resetError y error si los acepta
        if (React.isValidElement(fallback)) {
          return React.cloneElement(fallback as React.ReactElement<any>, {
            error: this.state.error,
            resetError: this.resetError
          });
        }
        return fallback;
      }

      return <AppErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}
