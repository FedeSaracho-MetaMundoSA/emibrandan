# Referencia de API, Hooks y Utilidades — Riveras de Pucheta

Este documento detalla la API pública de Context, los Hooks personalizados de Three.js y las funciones utilitarias del proyecto.

---

## 1. Context API: `LotesContext`

Ubicación: `/src/context/LotesContext.tsx`

### Consumo mediante Hook:
```tsx
import { useLotes } from '../context/LotesContext';

function MiComponente() {
  const {
    lotes,
    selectedLote,
    setSelectedLote,
    colorMode,
    setColorMode,
    cameraPreset,
    setCameraPreset,
    showGrid,
    setShowGrid,
    cambiarEstadoLote,
    estadisticas
  } = useLotes();
  // ...
}
```

### Propiedades y Métodos Disponibles:

| Identificador | Tipo | Descripción |
|---|---|---|
| `lotes` | `Lote[]` | Listado completo de 374 parcelas catastrales. |
| `selectedLote` | `Lote \| null` | Parcela seleccionada actualmente o `null`. |
| `setSelectedLote` | `(lote: Lote \| null) => void` | Establece el lote activo para la cámara 3D y la ficha. |
| `colorMode` | `'natural' \| 'estado'` | Modo cromático (tonos de manzana o semáforo de disponibilidad). |
| `setColorMode` | `(mode: ColorMode) => void` | Cambia el modo de color en tiempo real. |
| `cameraPreset` | `CameraPreset` | Vista preestablecida activa (`'isometric'`, `'topDown'`, `'river'`, `'entrance'`, `'panorama'`). |
| `setCameraPreset` | `(preset: CameraPreset) => void` | Ordena a la cámara volar hacia la perspectiva deseada. |
| `showGrid` | `boolean` | Alterna la visualización de la cuadrícula de agrimensura. |
| `cambiarEstadoLote` | `(id: string, nuevoEstado: LoteEstado) => void` | Modifica el estado comercial de un lote (`'disponible'`, `'reservado'`, `'vendido'`). |
| `getLoteById` | `(id: string) => Lote \| undefined` | Búsqueda O(1) de una parcela por su identificador. |
| `estadisticas` | `Object` | Totales calculados (`total`, `disponibles`, `vendidos`, `reservados`, `areaPromedio`). |

---

## 2. Hooks Personalizados de Gráficos 3D

### `useOrbitControls`
Ubicación: `/src/components/3d/hooks/useOrbitControls.ts`

Controla la cámara de Three.js, la amortiguación inercial (*damping*), los recorridos en dron y los gestos táctiles móviles.

```tsx
interface UseOrbitControlsProps {
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: RefObject<THREE.WebGLRenderer | null>;
  initialPreset?: CameraPreset;
  selectedLote?: Lote | null;
}
```

**Retorna:**
- `controlsRef`: Referencia a la instancia de `OrbitControls`.
- `setCameraView(preset)`: Interpola la cámara a un preset cinemático.
- `flyToLot(lote)`: Vuela y enfoca la cámara sobre una parcela específica.
- `flyToAmenity(amenidad)`: Enfoca una amenidad del masterplan.
- `toggleAutoOrbit()`: Inicia o detiene la rotación orbital continua de 360°.
- `startDroneTour()` / `stopDroneTour()`: Ejecuta una secuencia guiada aérea por 4 puntos panorámicos del loteo.
- `alignToNorth()`: Reorienta la brújula y la cámara hacia el Norte geográfico verdadero.

---

### `useThreeScene`
Ubicación: `/src/components/3d/hooks/useThreeScene.ts`

Inicializa la escena WebGL, la iluminación solar con sombras direccionales, el horizonte de fondo y el terreno base.

```tsx
interface UseThreeSceneProps {
  containerRef: RefObject<HTMLDivElement | null>;
}
```

**Optimizaciones automáticas incluidas:**
- Detección de agente móvil (`/Android|iPhone|iPad/i`).
- En móviles: `devicePixelRatio` acotado a `1.25` y tamaño de sombra a `1024x1024`.
- En escritorio: `devicePixelRatio` hasta `1.75` con `PCFSoftShadowMap` y tamaño `2048x2048`.

---

## 3. Utilidades Principales

### `cargarLotesDesdeKML()`
Ubicación: `/src/utils/kmlParser.ts`

Carga y procesa el archivo de mensura catastral de forma asíncrona y no bloqueante.

```ts
export async function cargarLotesDesdeKML(): Promise<Lote[]>
```
- **Prioridad 1**: Carga dinámica (`import()`) del KML en bundle diferido.
- **Prioridad 2**: Petición de red local a `/doc.kml`.
- **Prioridad 3**: Fallback a `/riveras_pucheta_reales_con_geometria.json`.

---

### `buildLoteThreeGeometry()`
Ubicación: `/src/utils/geometry3d.ts`

Construye las geometrías de Three.js para un lote a partir de sus coordenadas perimetrales.

```ts
export function buildLoteThreeGeometry(
  lote: Lote, 
  options?: { defaultHeight?: number }
): {
  meshGeometry: THREE.BufferGeometry;
  outlineGeometry: THREE.BufferGeometry;
  boundingBox: { width: number; depth: number };
  center: { x: number; y: number; z: number };
  rotationY: number;
  isParametricFallback: boolean;
}
```

---

### `openTextureDB()` y Gestión de Caché en IndexedDB
Ubicación: `/src/utils/textureCacheDB.ts`

Almacena imágenes de texturas procedurales codificadas en base64 en la base de datos `RiverasPuchetaTexturesDB` del navegador.

```ts
export async function getStoredTexture(key: string): Promise<string | null>;
export async function setStoredTexture(key: string, dataUrl: string): Promise<void>;
```

---

### `getOficialWhatsAppUrl()`
Ubicación: `/src/data/promoConfig.ts`

Genera un enlace profundo (*deep link*) hacia la API de WhatsApp preconfigurado con el asesor de ArgenSALTA y el lote consultado.

```ts
export function getOficialWhatsAppUrl(lote?: Lote | null, incluirFinanciacion = true): string;
```

---

## 4. Ejemplo de Extensión: Agregar una Nueva Amenidad 3D

Para incorporar una nueva amenidad al masterplan:

1. Editar `/src/data/amenidadesData.ts` y añadir la entrada:
```ts
{
  id: 'cancha-padel-2',
  nombre: 'Segunda Cancha de Pádel de Cristal',
  categoria: 'deportes',
  posicion3D: [120, 0, -45], // Coordenadas [X, Y, Z] métricas
  icono: 'Activity',
  descripcion: 'Cancha reglamentaria con césped sintético e iluminación LED nocturna.',
  destacada: true
}
```
2. La amenidad se integrará automáticamente al marcador flotante interactivo, al panel de amenidades y al sistema de enfoque de cámara.
