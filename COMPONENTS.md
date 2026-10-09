# Catálogo de Componentes — Riveras de Pucheta

Este documento detalla los componentes de la interfaz de usuario, sus propiedades (*props*), ejemplos de uso y directrices de rendimiento aplicadas.

---

## 1. Componentes del Núcleo 3D

### `Canvas3D`
Contenedor de la escena WebGL. Inicializa el canvas Three.js, orquesta los controladores de cámara, la brújula y las capas de interacción.

```tsx
interface Canvas3DProps {
  lotes: Lote[];
  selectedLote: Lote | null;
  onSelectLote: (lote: Lote) => void;
  colorMode: ColorMode;
  cameraPreset?: string;
  selectedManzanaFilter?: string;
  filteredLoteIds?: Set<string>;
  showGrid?: boolean;
  onLoadingComplete?: () => void;
  isTablet?: boolean;
  onOpenTabletDrawer?: () => void;
}
```

**Ejemplo de uso:**
```tsx
<Canvas3D
  lotes={lotes}
  selectedLote={selectedLote}
  onSelectLote={(lote) => setSelectedLote(lote)}
  colorMode="estado"
  cameraPreset="isometric"
  showGrid={true}
/>
```

**Notas de rendimiento:**
- Monta la escena una sola vez mediante `useThreeScene`.
- Contiene un `ResizeObserver` reactivo para responder al redimensionamiento de paneles sin fugas de memoria.

---

### `Canvas3DRenderer`
Subcomponente responsable del bucle continuo de animación (`requestAnimationFrame`), la actualización de geometrías extruidas de los lotes y el renderizado instanciado.

**Notas de rendimiento:**
- Emplea `THREE.InstancedMesh` para agrupar todas las estacas de «VENDIDO» en 2 llamadas de dibujo.
- Asigna `frustumCulled = true` y precomputa `computeBoundingSphere()` en cada lote.
- Aplica distancia LOD: apaga las estacas pequeñas si la cámara se encuentra a más de 420 metros.

---

## 2. Paneles de Información y Exploración

### `LotesListPanel`
Panel con listado virtualizado de lotes, filtros por manzana y estado, buscador y acceso a vistas satelitales.

```tsx
interface LotesListPanelProps {
  activeManzanaKey: ManzanaKey | 'all';
  lotesDeManzana: Lote[];
  selectedLote: Lote | null;
  manzanaFilter: string;
  setManzanaFilter: (mza: string) => void;
  estadoFilter: string;
  setEstadoFilter: (estado: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectLote: (lote: Lote) => void;
  onSwitchTo3D?: () => void;
  isTablet?: boolean;
  onOpenTabletMapDrawer?: () => void;
}
```

**Notas de rendimiento:**
- **Virtualización de ventana**: En lugar de renderizar los 374 elementos en el DOM, calcula matemáticamente el rango visible según el `scrollTop` y posiciona de forma absoluta solo ~15 filas (`visibleLotes`).
- Envuelto en `React.memo` para evitar re-renderizados cuando cambia el estado de otros paneles.

---

### `LoteDetailPanel`
Ficha técnica completa del lote seleccionado. Presenta superficie en m², cotas de frente y fondo, orientación, desglose de cuotas de financiación oficial y botón directo a WhatsApp.

**Ejemplo de uso:**
```tsx
<LoteDetailPanel
  lote={selectedLote}
  onClose={() => setSelectedLote(null)}
  onStatusChange={handleStatusChange}
  onFocusLote={handleFocusLoteIn3D}
/>
```

---

## 3. Tarjetas y Elementos Atómicos

### `LoteCard`
Ficha comercial de alta fidelidad que visualiza el precio promocional, la financiación de ArgenSALTA (entrega USD 3.500 + 15 cuotas fijas de USD 200) y la opción de compartir los datos al portapapeles.

```tsx
interface LoteCardProps {
  lote: Lote;
  manzanaConfig: ManzanaConfig;
  onClose?: () => void;
  onStatusChange?: (loteId: string, newStatus: 'disponible' | 'reservado' | 'vendido') => void;
  onFocusLote?: (lote: Lote) => void;
}
```

**Notas de rendimiento:**
- Memorizado con `React.memo`.

---

### `LoteCardCompact`
Elemento de fila optimizado para listas de alta densidad. Muestra el número de lote, metraje, precio abreviado y una insignia de estado con icono.

**Notas de rendimiento:**
- Altura estandarizada (`46px` útiles + `6px` margen) que permite la virtualización matemática de la lista sin cálculo de layout asíncrono.

---

### `StatsCard`
Tarjeta de métrica que exhibe contadores globales (lotes disponibles, vendidos, metraje promedio, precio base).

```tsx
interface StatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'emerald' | 'amber' | 'zinc';
}
```

---

## 4. Componentes Comunes y Optimización Multimedia

### `OptimizedImage`
Componente que implementa la etiqueta estándar `<picture>` de HTML5 para entregar imágenes en formato **WebP** moderno con alternativa automática en **PNG** o **JPEG**.

```tsx
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  pngFallback?: string;
}
```

**Ejemplo de uso:**
```tsx
<OptimizedImage
  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
  alt="Vista del terreno en Salta"
  className="w-full h-64 object-cover rounded-xl"
/>
```

**Notas de rendimiento:**
- Configura por defecto `loading="lazy"` y `decoding="async"`.
- Reemplaza parámetros de URL en proveedores de imagen dinámicos (como Unsplash) para solicitar variantes WebP comprimidas.

---

## 5. Modales Cargados On-Demand (Lazy Loading)

Todos los modales pesados se importan mediante `React.lazy` a través de `/src/utils/lazyLoader.ts` y se envuelven en un `<Suspense fallback={<LoadingSpinner />}>`, liberando más de 80 KB del bundle JavaScript inicial:

- `GuiaTechModal`: Guía arquitectónica, atajos de teclado y controles táctiles móviles.
- `Plano2DModal`: Plano catastral de mensura y subdivisión oficial en 2D.
- `Panorama360Modal`: Visor panorámico 360° procedimental con ciclo de iluminación día/atardecer.
- `TerrenoFotosModal`: Galería fotográfica con registros de agrimensura y paisaje.
- `AmenidadDetalleModal`: Información detallada sobre amenidades (Club House, deportes, tirolesa, etc.).
- `UbicacionModal`: Mapa de acceso geográfico a La Caldera y distancias a puntos de interés.
- `ProyectoJSONModal`: Inspección y descarga de los datos catastrales en formato JSON estructurado.
