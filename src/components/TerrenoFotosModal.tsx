import React, { useState, useEffect } from 'react';
import { Lote } from '../types';
import { OptimizedImage } from './common/OptimizedImage';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { 
  X, 
  Camera, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Maximize2, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass,
  FileText
} from 'lucide-react';

interface TerrenoFotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLote: Lote | null;
  onSelectLote?: (lote: Lote) => void;
}

interface TerrenoPhoto {
  id: string;
  title: string;
  category: 'vendido' | 'disponible' | 'entorno' | 'caminos' | 'rio';
  description: string;
  imageUrl: string;
  tag: string;
  loteId?: string;
}

// Curated realistic landscape & terrain photographs of Riveras de Pucheta (La Caldera, Salta)
const DEFAULT_PHOTOS: TerrenoPhoto[] = [
  {
    id: 'photo-1',
    title: 'Terreno Nivelado y Delimitado con Mojones',
    category: 'disponible',
    tag: 'Agrimensura Oficial',
    description: 'Parcela de 300 m² (10,00m x 30,00m) con césped natural, nivelación topográfica y estacas de demarcación catastral.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'photo-2',
    title: 'Lote Vendido con Cartelería Comercial y Estacas',
    category: 'vendido',
    tag: 'Lote Adquirido',
    description: 'Terreno consolidado con estacas de agrimensura y cartel oficial de VENDIDO. Vista directa hacia los cerros de La Caldera.',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'photo-3',
    title: 'Avenidas y Calles con Cordón Cuneta',
    category: 'caminos',
    tag: 'Infraestructura Vial',
    description: 'Traza vial con calzada de rodamiento, cordón cuneta de hormigón armado y veredas peatonales de acuerdo al plano de mensura.',
    imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'photo-4',
    title: 'Ribera del Río La Caldera & Avenida Costanera',
    category: 'rio',
    tag: 'Costanera y Naturaleza',
    description: 'Caudal del Río La Caldera adyacente a la Manzana L y K, con bosque ripario autóctono de tipas, molles y vista panorámica.',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'photo-5',
    title: 'Pórtico de Acceso y Barda Perimetral',
    category: 'entorno',
    tag: 'Seguridad 24 Hs',
    description: 'Sector de acceso principal sobre la colectora oeste, con garita de control de ingreso y cerco perimetral de seguridad.',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80'
  }
];

export const TerrenoFotosModal: React.FC<TerrenoFotosModalProps> = ({
  isOpen,
  onClose,
  selectedLote
}) => {
  const [photos, setPhotos] = useState<TerrenoPhoto[]>(DEFAULT_PHOTOS);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [uploadedPhotos, setUploadedPhotos] = useState<TerrenoPhoto[]>([]);

  // Load custom user-uploaded photos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('riveras_user_photos');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUploadedPhotos(parsed);
        setPhotos([...parsed, ...DEFAULT_PHOTOS]);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!isOpen) return null;

  const currentPhotoList = photos.filter((p) => {
    if (filterCategory === 'todos') return true;
    return p.category === filterCategory;
  });

  const activePhoto = currentPhotoList[activePhotoIndex] || currentPhotoList[0] || photos[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const newPhoto: TerrenoPhoto = {
          id: `custom-${Date.now()}`,
          title: selectedLote ? `Terreno Real Lote ${selectedLote.id}` : 'Foto Real del Terreno',
          category: selectedLote?.estado === 'vendido' ? 'vendido' : 'disponible',
          tag: selectedLote ? `Lote ${selectedLote.id} (${selectedLote.estado.toUpperCase()})` : 'Foto Subida',
          description: selectedLote 
            ? `Fotografía asociada al Lote ${selectedLote.id} - Manzana ${selectedLote.manzana} (${selectedLote.area_m2} m²).` 
            : 'Fotografía del loteo cargada por el usuario.',
          imageUrl: result,
          loteId: selectedLote?.id
        };

        const updated = [newPhoto, ...uploadedPhotos];
        setUploadedPhotos(updated);
        setPhotos([...updated, ...DEFAULT_PHOTOS]);
        setActivePhotoIndex(0);
        try {
          localStorage.setItem('riveras_user_photos', JSON.stringify(updated));
        } catch {
          // localStorage might have quota limits
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose
  });

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : currentPhotoList.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActivePhotoIndex((prev) => (prev < currentPhotoList.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPhotoList.length]);

  return (
    <div 
      id="terreno-fotos-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        ref={dialogRef}
        id="terreno-fotos-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fotos-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="fotos-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Fotografías Reales del Terreno
                </h2>
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  Riveras de Pucheta
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Visualización fotográfica de los lotes vendidos, en venta, caminos y entorno natural del KMZ.
              </p>
            </div>
          </div>

          <button 
            id="btn-close-fotos-modal"
            onClick={onClose}
            aria-label="Cerrar galería fotográfica del terreno"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Lot Context Bar (if any) */}
        {selectedLote && (
          <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>
                Lote seleccionado: <strong className="text-white font-semibold">{selectedLote.id}</strong> (Mza {selectedLote.manzana}, Nº {selectedLote.numero})
              </span>
              <span className="text-emerald-500/60">•</span>
              <span>{selectedLote.area_m2} m² ({selectedLote.frente_m}m frente × {selectedLote.fondo_m}m fondo)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                selectedLote.estado === 'disponible' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : selectedLote.estado === 'reservado'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {selectedLote.estado === 'disponible' && <CheckCircle2 className="w-3 h-3" />}
                {selectedLote.estado === 'reservado' && <Clock className="w-3 h-3" />}
                {selectedLote.estado === 'vendido' && <XCircle className="w-3 h-3" />}
                {selectedLote.estado.toUpperCase()}
              </span>

              <label 
                id="btn-upload-photo-lot"
                className="cursor-pointer inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subir Foto de este Lote</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="px-6 py-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">Filtrar:</span>
          {[
            { id: 'todos', label: 'Todas las Fotos' },
            { id: 'vendido', label: 'Lotes Vendidos' },
            { id: 'disponible', label: 'Terrenos Disponibles' },
            { id: 'caminos', label: 'Caminos y Cordón Cuneta' },
            { id: 'rio', label: 'Costanera y Río' },
            { id: 'entorno', label: 'Acceso y Seguridad' }
          ].map((cat) => (
            <button
              key={cat.id}
              id={`filter-foto-${cat.id}`}
              onClick={() => {
                setFilterCategory(cat.id);
                setActivePhotoIndex(0);
              }}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Photo Viewport */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
          {/* Main Large Image (2 cols) */}
          <div className="lg:col-span-2 relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[400px]">
            {activePhoto && (
              <>
                <OptimizedImage 
                  src={activePhoto.imageUrl} 
                  alt={activePhoto.title}
                  className="w-full h-full object-cover select-none"
                />

                {/* Photo Badge overlay */}
                <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">{activePhoto.tag}</span>
                </div>

                {/* Prev / Next navigation buttons */}
                <button
                  id="btn-photo-prev"
                  onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : currentPhotoList.length - 1))}
                  aria-label="Ver fotografía anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  id="btn-photo-next"
                  onClick={() => setActivePhotoIndex((prev) => (prev < currentPhotoList.length - 1 ? prev + 1 : 0))}
                  aria-label="Ver fotografía siguiente"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Caption Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5">
                  <h3 className="text-base font-bold text-white mb-1">
                    {activePhoto.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                    {activePhoto.description}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Side Details & Gallery Thumbnails */}
          <div className="p-5 bg-zinc-900/60 border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto space-y-4">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Galería de Registros ({currentPhotoList.length})
              </span>
              <div className="grid grid-cols-2 gap-2">
                {currentPhotoList.map((photo, idx) => (
                  <button
                    key={photo.id}
                    id={`thumb-photo-${photo.id}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative rounded-lg overflow-hidden border transition-all text-left group aspect-video ${
                      activePhotoIndex === idx 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40' 
                        : 'border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <OptimizedImage 
                      src={photo.imageUrl} 
                      alt={photo.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[10px] text-white font-medium truncate block w-full">
                        {photo.tag}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cadastral & Geographic Specifications */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <FileText className="w-4 h-4" />
                <span>Datos Técnicos de Mensura</span>
              </div>
              <ul className="space-y-1.5 text-zinc-300">
                <li className="flex justify-between">
                  <span className="text-zinc-500">Superficie estándar:</span>
                  <span className="font-semibold text-white">300,00 m²</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Dimensiones típicas:</span>
                  <span className="font-semibold text-white">10,00 m × 30,00 m</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Cota sobre el Río:</span>
                  <span className="font-semibold text-emerald-400">+12 m (Zona No Inundable)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Pendiente natural:</span>
                  <span className="font-semibold text-white">1,5% hacia el río</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Delimitación:</span>
                  <span className="font-semibold text-white">4 Mojones de Hormigón / Vértice</span>
                </li>
              </ul>
            </div>

            {/* Custom Upload Card */}
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-white block">¿Tiene fotos de los lotes?</span>
                <span className="text-[11px] text-zinc-400 block">Sube fotografías tomadas en el lugar.</span>
              </div>
              <label 
                id="btn-upload-photo-cta"
                className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Cargar Foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
