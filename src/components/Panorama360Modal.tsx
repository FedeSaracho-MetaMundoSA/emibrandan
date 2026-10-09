import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lote } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { 
  X, 
  Compass, 
  RotateCw, 
  Sun, 
  Sunset, 
  Eye, 
  Maximize2, 
  Minimize2, 
  MapPin, 
  Navigation, 
  Check, 
  Share2,
  Sparkles
} from 'lucide-react';

interface Panorama360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: Lote | null;
}

export const Panorama360Modal: React.FC<Panorama360ModalProps> = ({
  isOpen,
  onClose,
  lote
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de control de la cámara 360°
  const [yaw, setYaw] = useState<number>(45); // Ángulo horizontal (0 a 360)
  const [pitch, setPitch] = useState<number>(5); // Ángulo vertical (-30 a 45)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<'dia' | 'atardecer'>('dia');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Animación continua y renderizado en Canvas
  const animationFrameRef = useRef<number | null>(null);
  const yawRef = useRef<number>(yaw);
  const pitchRef = useRef<number>(pitch);
  const autoRotateRef = useRef<boolean>(autoRotate);
  const timeOfDayRef = useRef<'dia' | 'atardecer'>(timeOfDay);

  yawRef.current = yaw;
  pitchRef.current = pitch;
  autoRotateRef.current = autoRotate;
  timeOfDayRef.current = timeOfDay;

  // Manejo de pantalla completa
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Copiar coordenadas al portapapeles
  const handleCopyCoordinates = () => {
    if (!lote) return;
    const text = `Lote ${lote.numero ?? lote.id} - Riveras de Pucheta (La Caldera, Salta)\nLat: ${lote.lat}, Lng: ${lote.lon}\nhttps://www.google.com/maps?q=${lote.lat},${lote.lon}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    });
  };

  // Renderizado del panorama cilíndrico / esférico en Canvas
  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const currentYaw = yawRef.current;
    const currentPitch = pitchRef.current;
    const isSunset = timeOfDayRef.current === 'atardecer';

    // 1. Cielo con degradado atmosférico de alta montaña
    const horizonY = height * 0.52 - currentPitch * 4;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);

    if (isSunset) {
      // Atardecer cálido en los cerros de La Caldera
      skyGrad.addColorStop(0, '#1c1917');
      skyGrad.addColorStop(0.3, '#431407');
      skyGrad.addColorStop(0.65, '#9a3412');
      skyGrad.addColorStop(0.85, '#ea580c');
      skyGrad.addColorStop(1, '#f59e0b');
    } else {
      // Día soleado andino despejado
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.4, '#38bdf8');
      skyGrad.addColorStop(0.8, '#bae6fd');
      skyGrad.addColorStop(1, '#f0f9ff');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // 2. Sol o resplandor de atardecer en el horizonte según el ángulo yaw
    const sunYawOffset = isSunset ? 260 : 120; // Posición del sol en grados
    const relSunAngle = (((sunYawOffset - currentYaw) % 360) + 540) % 360 - 180;
    const sunScreenX = width * 0.5 + (relSunAngle / 90) * (width * 0.5);

    if (sunScreenX > -100 && sunScreenX < width + 100) {
      const sunY = isSunset ? horizonY - 18 : horizonY - height * 0.28;
      const sunGlow = ctx.createRadialGradient(
        sunScreenX,
        sunY,
        5,
        sunScreenX,
        sunY,
        isSunset ? 120 : 80
      );
      if (isSunset) {
        sunGlow.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
        sunGlow.addColorStop(0.25, 'rgba(251, 146, 60, 0.6)');
        sunGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
      } else {
        sunGlow.addColorStop(0, 'rgba(255, 255, 255, 1)');
        sunGlow.addColorStop(0.3, 'rgba(254, 240, 138, 0.5)');
        sunGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunScreenX, sunY, isSunset ? 120 : 80, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Cadena de Cerros Lejanos de las Yungas (Silueta 1)
    const drawMountainRange = (
      baseY: number,
      heightScale: number,
      color: string,
      freq: number,
      phase: number
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 6) {
        const panAngle = ((x / width) * 90 + currentYaw) * (Math.PI / 180);
        const yOffset =
          Math.sin(panAngle * freq + phase) * heightScale * 0.5 +
          Math.cos(panAngle * (freq * 2) + phase * 1.5) * heightScale * 0.3 +
          Math.sin(panAngle * 1.2) * heightScale * 0.2;
        ctx.lineTo(x, baseY + yOffset);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    };

    // Capa 1: Cerros distantes azulados/morados
    const farColor = isSunset ? '#291e2b' : '#334155';
    drawMountainRange(horizonY - 45, 55, farColor, 2.5, 1.2);

    // Capa 2: Cerros intermedios con vegetación
    const midColor = isSunset ? '#1a2318' : '#1e3a2b';
    drawMountainRange(horizonY - 20, 42, midColor, 4.0, 3.4);

    // Capa 3: Lomas cercanas y río Pucheta
    const nearColor = isSunset ? '#162215' : '#164e2f';
    drawMountainRange(horizonY + 10, 30, nearColor, 6.0, 0.8);

    // 4. Terreno plano y suelo del loteo (césped natural, topografía nivelada)
    const groundGrad = ctx.createLinearGradient(0, horizonY + 15, 0, height);
    if (isSunset) {
      groundGrad.addColorStop(0, '#1c1917');
      groundGrad.addColorStop(0.3, '#292524');
      groundGrad.addColorStop(1, '#0c0a09');
    } else {
      groundGrad.addColorStop(0, '#3f6212');
      groundGrad.addColorStop(0.2, '#4d7c0f');
      groundGrad.addColorStop(0.6, '#365314');
      groundGrad.addColorStop(1, '#1a2e05');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY + 15, width, height - (horizonY + 15));

    // 5. Huellas de calle consolidada y textura del suelo
    ctx.strokeStyle = isSunset ? 'rgba(217, 119, 6, 0.25)' : 'rgba(254, 240, 138, 0.2)';
    ctx.lineWidth = 2;
    const roadAngle = (((80 - currentYaw) % 360) + 540) % 360 - 180;
    const roadX = width * 0.5 + (roadAngle / 90) * (width * 0.5);

    ctx.beginPath();
    ctx.moveTo(roadX - 80, horizonY + 25);
    ctx.lineTo(width * 0.2, height);
    ctx.moveTo(roadX + 80, horizonY + 25);
    ctx.lineTo(width * 0.8, height);
    ctx.stroke();

    // 6. Delimitación de Mojones y Perímetro Virtual del Lote 3D
    // Proyectar los 4 vértices del lote según el ángulo de visión
    const stakes = [
      { name: 'Mojón V1 (Frente Izq.)', angle: 25, dist: 12 },
      { name: 'Mojón V2 (Frente Der.)', angle: 55, dist: 12 },
      { name: 'Mojón V3 (Fondo Der.)', angle: 65, dist: 32 },
      { name: 'Mojón V4 (Fondo Izq.)', angle: 15, dist: 32 }
    ];

    const projectedPoints: { x: number; y: number; name: string }[] = [];

    stakes.forEach((stake) => {
      const relAngle = (((stake.angle - currentYaw) % 360) + 540) % 360 - 180;
      if (Math.abs(relAngle) < 80) {
        const sx = width * 0.5 + (relAngle / 70) * (width * 0.5);
        const sy = horizonY + (height - horizonY) * (stake.dist / 38) + 10;
        projectedPoints.push({ x: sx, y: sy, name: stake.name });

        // Dibujar mojón físico estaca de agrimensura con tope rojo/amarillo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - 28);
        ctx.stroke();

        // Cabeza reflectiva del mojón
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(sx, sy - 28, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Etiqueta flotante del mojón
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        const textWidth = ctx.measureText(stake.name).width;
        ctx.beginPath();
        ctx.roundRect(sx - textWidth / 2 - 6, sy - 48, textWidth + 12, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stake.name, sx, sy - 36);
      }
    });

    // Líneas de límite perimetral entre mojones visibles
    if (projectedPoints.length >= 2) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
      for (let i = 1; i < projectedPoints.length; i++) {
        ctx.lineTo(projectedPoints[i].x, projectedPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Retícula / Brújula de orientación en el centro de la pantalla
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 30, 0, Math.PI * 2);
    ctx.moveTo(width * 0.5 - 10, height * 0.5);
    ctx.lineTo(width * 0.5 + 10, height * 0.5);
    ctx.moveTo(width * 0.5, height * 0.5 - 10);
    ctx.lineTo(width * 0.5, height * 0.5 + 10);
    ctx.stroke();
  }, []);

  // Bucle de animación para auto-rotación y re-dibujado fluido
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        renderScene();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = () => {
      if (autoRotateRef.current) {
        setYaw((prev) => (prev + 0.15) % 360);
      }
      renderScene();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, renderScene]);

  // Eventos de Mouse y Touch para arrastrar y explorar 360°
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    setYaw((prev) => (prev - deltaX * 0.3 + 360) % 360);
    setPitch((prev) => Math.max(-20, Math.min(35, prev + deltaY * 0.2)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setAutoRotate(false);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });

    setYaw((prev) => (prev - deltaX * 0.35 + 360) % 360);
    setPitch((prev) => Math.max(-20, Math.min(35, prev + deltaY * 0.25)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen || !lote) return null;

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose
  });

  // Keyboard navigation for 360 viewer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setAutoRotate(false);
        setYaw((prev) => (prev + 10) % 360);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setAutoRotate(false);
        setYaw((prev) => (prev - 10 + 360) % 360);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPitch((prev) => Math.min(35, prev + 5));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPitch((prev) => Math.max(-20, prev - 5));
      } else if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setAutoRotate((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Cálculo de rumbo cardenal para la brújula
  const cardinalDirections = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const cardinalIndex = Math.round(yaw / 45) % 8;
  const currentCardinal = cardinalDirections[cardinalIndex];

  return (
    <div
      id="panorama-360-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={(el) => {
          containerRef.current = el;
          if (dialogRef) {
            (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }}
        id="panorama-360-viewport"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panorama-modal-title"
        tabIndex={-1}
        className="relative w-full h-full max-w-6xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none focus:outline-none"
      >
        {/* ===================================================================== */}
        {/* HEADER SUPERIOR TRANSLÚCIDO TIPO HUD DE REALIDAD VIRTUAL              */}
        {/* ===================================================================== */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          {/* Datos del Lote */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-lg">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="panorama-modal-title" className="text-base sm:text-lg font-black text-white tracking-tight">
                  Vista 360° en Terreno · Lote {lote.numero ?? lote.id}
                </h2>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Manzana {lote.manzana}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400" />
                <span>Riveras de Pucheta, La Caldera · ~1,420 msnm</span>
              </p>
            </div>
          </div>

          {/* Brújula interactiva central con azimut en grados */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/85 backdrop-blur-md border border-white/10 text-white shadow-xl pointer-events-auto">
            <Compass
              className="w-4 h-4 text-rose-400 transition-transform duration-150"
              style={{ transform: `rotate(${-yaw}deg)` }}
            />
            <span className="text-xs font-mono font-bold">{Math.round(yaw)}° {currentCardinal}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-[11px] text-zinc-300 font-sans">
              Cerros {yaw > 180 ? 'Oeste / Yungas' : 'Este / Río'}
            </span>
          </div>

          {/* Botones de acción derecha */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Alternar Día / Atardecer */}
            <button
              id="btn-toggle-time-of-day"
              onClick={() => setTimeOfDay((prev) => (prev === 'dia' ? 'atardecer' : 'dia'))}
              aria-label={timeOfDay === 'dia' ? 'Cambiar a modo atardecer en los cerros' : 'Cambiar a modo luz de día'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title={timeOfDay === 'dia' ? 'Ver atardecer en los cerros' : 'Ver luz de día'}
            >
              {timeOfDay === 'dia' ? (
                <>
                  <Sunset className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Atardecer</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-yellow-300" />
                  <span className="hidden sm:inline">Día</span>
                </>
              )}
            </button>

            {/* Auto-Rotación */}
            <button
              id="btn-toggle-autorotate"
              onClick={() => setAutoRotate((prev) => !prev)}
              aria-label={autoRotate ? 'Pausar rotación automática 360 grados' : 'Iniciar rotación automática 360 grados'}
              aria-pressed={autoRotate}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                autoRotate
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900/85 border-zinc-700/80 text-zinc-400 hover:text-white'
              }`}
              title={autoRotate ? 'Pausar rotación 360°' : 'Activar rotación 360°'}
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
            </button>

            {/* Pantalla completa */}
            <button
              id="btn-toggle-fullscreen-panorama"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
              className="p-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Cerrar modal */}
            <button
              id="btn-close-panorama-modal"
              onClick={onClose}
              aria-label="Cerrar vista 360° del lote"
              className="p-2 rounded-xl bg-zinc-900/90 hover:bg-rose-500/20 border border-zinc-700/80 text-zinc-300 hover:text-rose-400 transition-colors ml-1 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title="Cerrar vista 360°"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CANVAS INTERACTIVO 360°                                               */}
        {/* ===================================================================== */}
        <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
          <canvas
            ref={canvasRef}
            id="canvas-panorama-360"
            className="w-full h-full block touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Micro-aviso central animado al inicio */}
          <div className="absolute bottom-14 sm:bottom-16 inset-x-0 flex justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/15 text-white text-xs flex items-center gap-2 shadow-2xl">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>Haz clic o arrastra con el dedo para girar 360° la visual en el lote</span>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* FOOTER INFERIOR TIPO PANEL DE TELEMETRÍA DEL LOTE                     */}
        {/* ===================================================================== */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Métricas geodésicas del lote */}
          <div className="flex items-center gap-4 text-xs text-zinc-300 pointer-events-auto">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Superficie</span>
              <span className="font-extrabold text-white">{lote.area_m2 ? lote.area_m2.toFixed(1) : '300.0'} m²</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Geometría</span>
              <span className="font-extrabold text-white">
                {lote.frente_m ? lote.frente_m.toFixed(0) : '10'}m × {lote.fondo_m ? lote.fondo_m.toFixed(0) : '30'}m
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Coordenadas GPS</span>
              <span className="font-mono text-white text-[11px]">
                {lote.lat.toFixed(5)}, {lote.lon.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Botones de acción en el footer */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              id="btn-copy-360-coords"
              onClick={handleCopyCoordinates}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir Coordenadas</span>
                </>
              )}
            </button>

            <a
              id="btn-whatsapp-from-360"
              href={`https://wa.me/5493875123456?text=${encodeURIComponent(
                `Hola! Estuve viendo la vista 360° del Lote ${lote.numero ?? lote.id} (Manzana ${lote.manzana}, ${lote.area_m2 ? lote.area_m2.toFixed(1) : '300'}m²) en Riveras de Pucheta. ¿Podríamos coordinar una visita presencial al terreno?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Coordinar Visita Presencial</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
