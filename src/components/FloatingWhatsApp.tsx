import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Lote } from '../types';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';

interface FloatingWhatsAppProps {
  selectedLote?: Lote | null;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ selectedLote }) => {
  const whatsappUrl = getOficialWhatsAppUrl(selectedLote, false);

  return (
    <aside 
      id="floating-whatsapp-container"
      aria-label="Contacto de WhatsApp oficial de ArgenSALTA"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-30 flex items-center pointer-events-none select-none"
    >
      {/* Botón Flotante Discreto de WhatsApp - No Invasivo */}
      <a
        id="btn-floating-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-emerald-500/30"
        title={`Contactar por WhatsApp Oficial a ${PROMO_CONFIG.dueno.nombre} (${PROMO_CONFIG.dueno.telefonoDirectoFormatted})`}
        aria-label="Abrir WhatsApp oficial"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-zinc-950 stroke-zinc-950 transition-transform group-hover:rotate-6" />
      </a>
    </aside>
  );
};
