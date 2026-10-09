import { Lote, ManzanaKey, LoteEstado } from '../../types';

export interface InfoPanelProps {
  onOpenPlanoModal?: () => void;
  onOpenUbicacionModal?: () => void;
  onOpenJSONModal?: () => void;
  onOpenFotosModal?: () => void;
  onOpenTabletMapDrawer?: () => void;
  onOpenGuiaTech?: () => void;
  onOpenIntroModal?: () => void;
  isTablet?: boolean;
  isMobile?: boolean;
  forcedView?: 'all' | 'info' | 'lotes' | 'mapa';
  onSwitchTo3D?: () => void;
}

export interface StatusBadgeConfig {
  text: string;
  color: string;
  dot: string;
  icon: any;
}
