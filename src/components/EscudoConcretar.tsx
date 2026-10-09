import React from 'react';
import { ConcretarLogo3D } from './ConcretarLogo3D';

interface EscudoConcretarProps {
  onClick?: () => void;
  className?: string;
}

export const EscudoConcretar: React.FC<EscudoConcretarProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <div
      id="escudo-concretar-desarrollos"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
      title="Concretar Desarrollos (+15 Años de Trayectoria) - Empresa Desarrolladora y Propietaria. Haz clic para conocer el respaldo oficial."
      className={`group cursor-pointer select-none transition-transform duration-300 hover:scale-105 active:scale-95 inline-flex items-center ${className}`}
    >
      <ConcretarLogo3D size="md" showText={true} />
    </div>
  );
};
