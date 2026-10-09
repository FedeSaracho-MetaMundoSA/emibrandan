import React from 'react';
import { Rotate3d, Info, MapPin, Layers } from 'lucide-react';
import { MobileTab, Lote } from '../types';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  selectedLote?: Lote | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  selectedLote
}) => {
  const tabs: { id: MobileTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: '3d', label: 'Masterplan', icon: Rotate3d },
    { id: 'info', label: 'Información', icon: Info },
    { id: 'mapa', label: 'Mapa', icon: MapPin },
    { id: 'lotes', label: 'Lotes', icon: Layers },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navegación principal en dispositivos móviles"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t border-zinc-800 z-40 px-2 flex items-center justify-around select-none shadow-2xl"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`mobile-nav-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`relative flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-emerald-400 font-extrabold'
                : 'text-zinc-400 hover:text-zinc-200 font-semibold'
            }`}
          >
            {/* Active pill background highlight */}
            {isActive && (
              <span className="absolute top-1 w-8 h-1 bg-emerald-400 rounded-full animate-fade-in shadow-[0_0_8px_#10B981]" />
            )}

            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-zinc-400'}`} />
              {/* Little indicator badge if lot is selected and on info/3d tab */}
              {tab.id === 'info' && selectedLote && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-zinc-950" />
              )}
            </div>

            <span className="text-[10px] tracking-tight leading-none mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
