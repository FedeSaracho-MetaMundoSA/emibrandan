import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  Layers, 
  MousePointer, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Eye, 
  Maximize2,
  DollarSign,
  PhoneCall,
  Terminal,
  Cpu
} from 'lucide-react';
import { PROMO_CONFIG, getOficialWhatsAppUrl } from '../data/promoConfig';
import { LOTES_VENDIDOS_LIST } from '../data/lotesVendidos';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface GuiaTechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExplore3D?: () => void;
  onFilterAvailable?: () => void;
}

interface StepData {
  number: string;
  badge: string;
  badgeColor: string;
  title: string;
  summary: string;
  techDetails: {
    label: string;
    value: string;
  }[];
  instructions: {
    icon: string;
    action: string;
    description: string;
  }[];
  proTip: string;
  actionButton?: {
    text: string;
    action: () => void;
  };
}

export const GuiaTechModal: React.FC<GuiaTechModalProps> = ({
  isOpen,
  onClose,
  onExplore3D,
  onFilterAvailable
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'steps' | 'shortcuts'>('steps');

  if (!isOpen) return null;

  const steps: StepData[] = [
    {
      number: '01',
      badge: 'MOTOR GRÁFICO 3D',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      title: 'Vuelo y Navegación Espacial 3D',
      summary: 'Explorá las 374 parcelas de Riveras de Pucheta con cámara orbital libre en alta definición directamente desde tu navegador.',
      techDetails: [
        { label: 'Renderizador', value: 'Three.js / WebGL 2.0 (60 FPS)' },
        { label: 'Topografía', value: 'Valle de La Caldera + Río + Precordillera' },
        { label: 'Modo Cámara', value: 'Perspective Orbital Camera (FOV 45°)' }
      ],
      instructions: [
        {
          icon: '🖱️',
          action: 'Orbitar y Rotar 360°',
          description: 'Mantén presionado el clic izquierdo (en PC) o arrastra con 1 dedo (en celular) para girar alrededor del loteo.'
        },
        {
          icon: '🔍',
          action: 'Zoom de Precisión',
          description: 'Usa la rueda del mouse o pellizca la pantalla con 2 dedos para acercarte a nivel de suelo o alejarte a vista satelital.'
        },
        {
          icon: '↔️',
          action: 'Desplazamiento (Pan)',
          description: 'Mantén presionado el clic derecho (en PC) o arrastra con 2 dedos en simultáneo para moverte lateralmente por las calles.'
        }
      ],
      proTip: 'Usa los botones de vistas predefinidas en el lateral para saltar al instante a vista Aérea Top-Down o Vista Frontal.',
      actionButton: {
        text: 'Ir a Navegar en 3D',
        action: () => {
          onClose();
          onExplore3D?.();
        }
      }
    },
    {
      number: '02',
      badge: 'PADRÓN CATASTRAL EN VIVO',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      title: 'Disponibilidad y Lotes Vendidos en Tiempo Real',
      summary: 'Transparencia y tecnología presentada por ArgenSALTA PropTech. Cada lote refleja su estado legal y amojonamiento en tiempo real.',
      techDetails: [
        { label: 'Total Lotes', value: '374 Parcelas' },
        { label: 'Lotes Vendidos', value: `${LOTES_VENDIDOS_LIST.length} Unidades Registradas` },
        { label: 'Lotes Disponibles', value: `${374 - LOTES_VENDIDOS_LIST.length} Unidades para Reserva` }
      ],
      instructions: [
        {
          icon: '🟢',
          action: 'Lotes Disponibles (Verde)',
          description: 'Terrenos libres para compra inmediata con financiación directa o contado especial a USD 7.000.'
        },
        {
          icon: '🔴',
          action: 'Lotes Vendidos (Rojo con Estacas)',
          description: 'Cuentan con estacas catastrales y cartel oficial "VENDIDO - ARGENSALTA". No disponibles para oferta.'
        },
        {
          icon: '🏢',
          action: 'Filtro por Manzanas',
          description: 'Utilizá el selector del panel para filtrar por manzanas (A, B, C, E, G, I, K, L) y aislar las zonas que te interesan.'
        }
      ],
      proTip: 'Activá el modo "Solo Disponibles" para enfocar rápidamente las mejores ubicaciones frente al río o esquinas.',
      actionButton: {
        text: 'Filtrar Lotes Disponibles',
        action: () => {
          onClose();
          onFilterAvailable?.();
        }
      }
    },
    {
      number: '03',
      badge: 'TELEMETRÍA DE AGRIMENSURA',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      title: 'Inspección Técnica de la Parcela',
      summary: 'Tocá cualquier lote en el mapa 3D o búscalo en el listado para acceder a su ficha técnica completa de agrimensura.',
      techDetails: [
        { label: 'Superficie Estándar', value: '300 m² (10.00 m frente × 30.00 m fondo)' },
        { label: 'Topografía', value: 'Plano regular con apertura de calles' },
        { label: 'Georreferenciación', value: 'Coordenadas Gauss-Krüger / WGS84' }
      ],
      instructions: [
        {
          icon: '👆',
          action: 'Clic en Cualquier Parcela',
          description: 'Al hacer clic, la cámara se enfocará automáticamente en el lote y resaltará su perímetro perimetral.'
        },
        {
          icon: '📊',
          action: 'Lectura de Ficha Técnica',
          description: 'El panel lateral desplegará medidas perimetrales, número de manzana, coordenadas y orientación solar.'
        },
        {
          icon: '🧭',
          action: 'Orientación Solar',
          description: 'Comprobá el asoleamiento Este/Oeste para proyectar tu futura vivienda o quinta de fin de semana.'
        }
      ],
      proTip: 'Los lotes en esquina o frente a las avenidas principales ofrecen excelente plusvalía para inversión o comercio.'
    },
    {
      number: '04',
      badge: 'CONDICIONES COMERCIALES',
      badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
      title: 'Precio de Contado y Financiación Propia Directa',
      summary: 'Financiación directa con ArgenSALTA Desarrollos. Sin intermediación bancaria, sin recibo de sueldo y en dólares fijos.',
      techDetails: [
        { label: 'Precio Contado', value: `USD ${PROMO_CONFIG.precioActualUSD.toLocaleString()} (Precio Base Contado - No es promocional)` },
        { label: 'Plan Financiado', value: `Entrega USD ${PROMO_CONFIG.financiacion.entregaUSD.toLocaleString()} + ${PROMO_CONFIG.financiacion.cuotasCantidad} cuotas fijas de USD ${PROMO_CONFIG.financiacion.cuotaMontoUSD}` },
        { label: 'Garantía Obras', value: 'Máquinas viales en movimiento en terreno' }
      ],
      instructions: [
        {
          icon: '💵',
          action: 'Precio de Contado Directo',
          description: `Valor oficial de contado a USD ${PROMO_CONFIG.precioActualUSD.toLocaleString()} por lote regular de 300 m² (10m x 30m).`
        },
        {
          icon: '🔑',
          action: 'Entrega Inicial USD 5.000',
          description: `Ingresás con una entrega inicial de USD ${PROMO_CONFIG.financiacion.entregaUSD.toLocaleString()} al firmar el boleto de compraventa.`
        },
        {
          icon: '📅',
          action: '15 Cuotas Fijas de USD 200',
          description: `El saldo se abona en ${PROMO_CONFIG.financiacion.cuotasCantidad} cuotas fijas mensuales de USD ${PROMO_CONFIG.financiacion.cuotaMontoUSD} directamente con ArgenSALTA.`
        }
      ],
      proTip: 'Podés solicitar una visita presencial para verificar el avance de las motoniveladoras y excavadoras en el predio.'
    },
    {
      number: '05',
      badge: 'CONEXIÓN INMEDIATA 1-CLICK',
      badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      title: 'Reserva y Asesoramiento por WhatsApp',
      summary: 'Conectate al instante con el equipo de ventas oficial de ArgenSALTA con el lote preseleccionado en tu mensaje.',
      techDetails: [
        { label: 'Teléfono Oficial', value: PROMO_CONFIG.telefonoOficialFormatted },
        { label: 'Línea Directa', value: `+54 9 ${PROMO_CONFIG.telefonoOficial}` },
        { label: 'Atención', value: 'Lunes a Sábado de 9:00 a 20:00 hs' }
      ],
      instructions: [
        {
          icon: '📲',
          action: 'Botón Flotante de WhatsApp',
          description: 'Disponible permanentemente en la esquina inferior derecha para consultas en tiempo real.'
        },
        {
          icon: '📝',
          action: 'Mensaje Automático Inteligente',
          description: 'Si seleccionaste un lote (ej. Lote 45, Manzana C), el mensaje incluirá esos datos para que el asesor te responda de inmediato.'
        },
        {
          icon: '🤝',
          action: 'Coordinación de Visita a Terreno',
          description: 'Podes coordinar una visita presencial guiada para recorrer el predio y comprobar las estacas de amojonamiento.'
        }
      ],
      proTip: 'Tené a mano tu DNI si deseás señar la parcela en el momento para bloquearla del sistema catastral.',
      actionButton: {
        text: 'Consultar por WhatsApp Ahora',
        action: () => {
          const waUrl = getOficialWhatsAppUrl(null, true);
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
      }
    }
  ];

  const currentStep = steps[activeStep];

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose
  });

  // Keyboard navigation for steps using ArrowLeft and ArrowRight
  useEffect(() => {
    if (!isOpen || activeTab !== 'steps') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveStep(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, steps.length]);

  return (
    <div 
      id="guia-tech-modal-overlay"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={dialogRef}
        id="guia-tech-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guia-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[92vh] focus:outline-none"
      >
        {/* Top Header / HUD with Logos */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            {/* Logos ArgenSALTA + Concretar */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <div className="bg-white rounded-lg p-1 shadow-xs ring-1 ring-amber-400/50" title="ArgenSALTA - Comercialización PropTech Oficial">
                <img
                  src={PROMO_CONFIG.comercializadora.logo}
                  alt="ArgenSALTA Oficial"
                  className="h-6 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-1 shadow-xs" title="Concretar Desarrollos (+15 Años de Trayectoria)">
                <img
                  src={PROMO_CONFIG.desarrolladora.logo}
                  alt="Concretar Desarrollos"
                  className="h-6 w-auto object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 id="guia-modal-title" className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Guía de Uso Técnica · Masterplan 3D
                </h3>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                  Barrio Privado Cerrado
                </span>
                <span className="hidden lg:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono font-bold uppercase">
                  Posesión Diciembre 2026
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Barrio Privado Cerrado Riveras de Pucheta · Desarrolla Concretar (+15 años) · Comercializa ArgenSALTA · La Caldera, Salta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div role="tablist" aria-label="Secciones de la guía técnica" className="hidden sm:flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                id="btn-tab-guia-pasos"
                role="tab"
                aria-selected={activeTab === 'steps'}
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                  activeTab === 'steps' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Paso a Paso ({activeStep + 1}/5)
              </button>
              <button
                id="btn-tab-guia-atajos"
                role="tab"
                aria-selected={activeTab === 'shortcuts'}
                onClick={() => setActiveTab('shortcuts')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                  activeTab === 'shortcuts' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Atajos de Control
              </button>
            </div>

            <button
              id="btn-close-guia-tech-modal"
              onClick={onClose}
              aria-label="Cerrar guía de uso técnica 3D"
              className="p-2 text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 rounded-full border border-zinc-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title="Cerrar guía"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab switcher */}
        <div role="tablist" aria-label="Secciones de la guía técnica móvil" className="sm:hidden flex bg-zinc-900 border-b border-zinc-800 p-1.5 gap-1 text-xs">
          <button
            role="tab"
            aria-selected={activeTab === 'steps'}
            onClick={() => setActiveTab('steps')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              activeTab === 'steps' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            Paso a Paso ({activeStep + 1}/5)
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'shortcuts'}
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              activeTab === 'shortcuts' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
            }`}
          >
            Atajos de Control
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950 space-y-6">

          {activeTab === 'steps' && (
            <div className="space-y-6">
              {/* Step Navigation Pill Bar (Steps 1 to 5) */}
              <div className="flex items-center justify-between gap-1.5 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
                {steps.map((step, idx) => (
                  <button
                    key={step.number}
                    onClick={() => setActiveStep(idx)}
                    className={`flex-1 min-w-[70px] sm:min-w-[110px] py-2 px-2 sm:px-3 rounded-xl transition-all text-left flex items-center gap-2 cursor-pointer ${
                      activeStep === idx 
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60'
                    }`}
                  >
                    <span className={`text-xs font-mono font-black ${activeStep === idx ? 'text-zinc-950' : 'text-zinc-500'}`}>
                      {step.number}
                    </span>
                    <span className="hidden sm:inline text-xs truncate">
                      {idx === 0 && 'Vuelo 3D'}
                      {idx === 1 && 'Disponibilidad'}
                      {idx === 2 && 'Agrimensura'}
                      {idx === 3 && 'Financiación'}
                      {idx === 4 && 'Reserva'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Main Step Detail Card */}
              <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 p-5 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Step Title & Badge */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">PASO {currentStep.number} DE 05</span>
                    <span className="text-zinc-600">•</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${currentStep.badgeColor}`}>
                      {currentStep.badge}
                    </span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {currentStep.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {currentStep.summary}
                  </p>
                </div>

                {/* Technical Specs HUD Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80">
                  {currentStep.techDetails.map((tech, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                        {tech.label}
                      </span>
                      <span className="text-xs font-bold text-zinc-200">
                        {tech.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Interactive Action Steps */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instrucciones de Acción</span>
                  </h5>

                  <div className="grid grid-cols-1 gap-3">
                    {currentStep.instructions.map((inst, idx) => (
                      <div 
                        key={idx}
                        className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/60 flex items-start gap-3.5 hover:border-zinc-700/80 transition-colors"
                      >
                        <div className="text-xl shrink-0 mt-0.5">{inst.icon}</div>
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white block">
                            {inst.action}
                          </span>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {inst.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tip Box */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-200/90">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="font-bold text-amber-300">Consejo Experto ArgenSALTA: </strong>
                    <span>{currentStep.proTip}</span>
                  </div>
                </div>

                {/* Action CTA within step */}
                {currentStep.actionButton && (
                  <div className="pt-2">
                    <button
                      onClick={currentStep.actionButton.action}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/15"
                    >
                      <span>{currentStep.actionButton.text}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Carousel / Step Switcher Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  id="btn-prev-guia-step"
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-850 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Paso Anterior</span>
                </button>

                <div className="text-xs font-mono text-zinc-400">
                  Paso <span className="text-white font-bold">{activeStep + 1}</span> de {steps.length}
                </div>

                {activeStep < steps.length - 1 ? (
                  <button
                    id="btn-next-guia-step"
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-all cursor-pointer shadow-md"
                  >
                    <span>Siguiente Paso</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-finish-guia"
                    onClick={() => {
                      onClose();
                      onExplore3D?.();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Listo para Explorar!</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ATAJOS DE CONTROL Y HARDWARE */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Referencia Rápida de Interacción Multidispositivo</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  La plataforma está optimizada tanto para pantallas táctiles de celulares/tablets como para mouse de alta precisión en computadoras.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Control Celular / Tablet */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <h5 className="text-sm font-black text-white">
                      Gestos en Celular o Tablet
                    </h5>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Rotar vista 3D</span>
                      <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Arrastrar 1 dedo
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Zoom in / Zoom out</span>
                      <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Pellizcar con 2 dedos
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Mover lateralmente (Pan)</span>
                      <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Deslizar 2 dedos
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Seleccionar lote</span>
                      <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Toque simple (Tap)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Control Mouse & PC */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                    <MousePointer className="w-5 h-5 text-emerald-400" />
                    <h5 className="text-sm font-black text-white">
                      Controles en Computadora (Mouse)
                    </h5>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Orbitar cámara</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Clic Izquierdo + Mover
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Desplazamiento horizontal</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Clic Derecho + Mover
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Acercar / Alejar</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Rueda del mouse (Scroll)
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-850">
                      <span className="text-zinc-300 font-semibold">Ficha técnica y cotización</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Clic sobre el lote
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Rendimiento y Compatibilidad Técnica:</span>
                </span>
                <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                  <li><strong className="text-white">Aceleración GPU:</strong> Compatible con Chrome, Safari, Edge, Firefox y navegadores móviles con WebGL habilitado.</li>
                  <li><strong className="text-white">Bajo consumo de datos:</strong> La geometría se procesa en cliente, no consume streaming de video continuo.</li>
                  <li><strong className="text-white">Precisión topográfica:</strong> Basado en el plano de mensura y KML de amojonamiento de Riveras de Pucheta.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-zinc-200">ArgenSALTA Desarrollos</span>
            <span>•</span>
            <span>Atención Oficial: <strong className="text-white">{PROMO_CONFIG.telefonoOficialFormatted}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onExplore3D?.();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black transition-all cursor-pointer shadow-sm"
            >
              Comenzar a Usar la Plataforma →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
