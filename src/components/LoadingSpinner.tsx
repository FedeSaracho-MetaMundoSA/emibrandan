import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Cargando módulo...',
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 select-none">
      <Loader2 className={`${sizeClasses} animate-spin text-emerald-400`} />
      {message && (
        <span className="text-xs font-semibold text-zinc-400 tracking-wide">
          {message}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[160px] flex items-center justify-center">
      {content}
    </div>
  );
};
