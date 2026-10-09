# Arquitectura del Sistema — Riveras de Pucheta 3D

Este documento describe la arquitectura de software, el flujo unidireccional de datos, el ciclo de vida del estado y los fundamentos matemáticos del motor 3D interactivo implementado para **Riveras de Pucheta**.

---

## 1. Diagrama de Jerarquía de Componentes

```
                                  [App.tsx]
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
      [LotesProvider]                                   [Header.tsx]
              │                                               │
      ┌───────┴───────────────────────────────┐               │
      │                                       │               │
[Canvas3D]                             [InfoPanel]     [FloatingWhatsApp]
   │                                          │
   ├── [useThreeScene]                        ├── [ProjectHeaderPanel]
   ├── [useOrbitControls]                     ├── [ProjectStatsPanel]
   ├── [Canvas3DRenderer]                     ├── [FilterBar]
   │       ├── [THREE.InstancedMesh] (Forest) └── [LotesListPanel] (Virtualized)
   │       ├── [THREE.InstancedMesh] (Stakes)         └── [LoteCardCompact]
   │       ├── [THREE.Mesh] (Lots & Roads)                    │
   │       └── [River / Amenities 3D]                        v
   └── [Overlay Controles 3D]                         [LoteDetailPanel]
           (Presets, Brújula, Drone Tour)             (Ficha comercial, cuotas)
                                                              │
   ┌──────────────────────────────────────────────────────────┴───┐
   │ Modales On-Demand (Code-Splitting / React.lazy + Suspense)   │
   │  ├── [GuiaTechModal]       ├── [Panorama360Modal]             │
   │  ├── [Plano2DModal]        ├── [TerrenoFotosModal]            │
   │  ├── [AmenidadDetalleModal]└── [UbicacionModal]              │
   └──────────────────────────────────────────────────────────────┘
```

---

## 2. Diagrama de Flujo de Datos (Data Flow)

```
 [doc.kml / docKmlString.ts] ──(Dynamic import / requestIdleCallback)──┐
                                                                        v
 [riveras_pucheta_reales.json] ─────────────────────────────> [kmlParser.ts]
                                                                        │
                                                                        v
                                                               [LotesContext]
                                                              (Estado Global)
                                                                │         │
                   ┌────────────────────────────────────────────┘         │
                   │                                                      │
                   v                                                      v
             [Canvas3D]                                             [InfoPanel]
     (Motor Gráfico WebGL)                                      (Catastro & Filtros)
           │            │                                             │
           v            v                                             v
  [Geometrías 3D] [Raycasting Click] ────────(onSelectLote)──────> [LoteCard]
  - Shapes        - Coordenadas NDC                               - Superficie
  - Extrusiones   - Focus Cámara                                  - Financiación
  - Instancing    - Pin pulsante                                  - WhatsApp CTA
```

---

## 3. Gestión del Estado (State Management Flow)

La aplicación utiliza una estrategia híbrida que garantiza reactividad instantánea sin acoplamiento innecesario:

1. **Estado Global en Context (`LotesContext`)**:
   - `lotes`: Array completo de 374 objetos `Lote`.
   - `selectedLote`: Referencia al lote actualmente activo en vista 3D y ficha técnica.
   - `colorMode`: Modo de visualización de colores en 3D (`'natural'` o `'estado'`).
   - `cameraPreset`: Ángulo de cámara activo (`'isometric'`, `'topDown'`, `'river'`, `'entrance'`, `'panorama'`).
   - `showGrid`: Interruptor de visibilidad de la cuadrícula métrica de agrimensura.

2. **Estado de Vista Local (`LotesListPanel`)**:
   - `scrollTop`: Posición del scroll vertical para el cálculo de la ventana de virtualización.
   - `manzanaFilter` y `estadoFilter`: Criterios de filtrado reactivo combinados mediante `useMemo`.
   - `searchQuery`: Búsqueda textual por número de lote o manzana.

3. **Sincronización Bidireccional 3D ⇄ UI**:
   - Cuando el usuario hace clic sobre un lote en el canvas 3D, el *raycaster* emite `onSelectLote(lote)`.
   - Cuando el usuario selecciona un lote en la lista, el hook `useOrbitControls` activa una animación suave tipo *lerp* (`flyToLot`) reposicionando la cámara con amortiguación.

---

## 4. Fundamentos Matemáticos 3D (3D Math & Proyecciones)

### A. Transformación de Coordenadas Geodésicas WGS84 a Plano Cartesiano Local
Las coordenadas catastrales del archivo KML están en latitud y longitud ($\phi, \lambda$). Para representarlas en un espacio métrico euclidiano de Three.js ($X, Y, Z$), se utiliza una proyección equidistante local centrada en el origen del desarrollo:

$$\text{Origen de Referencia: } \phi_0 = -24.6062^\circ, \quad \lambda_0 = -65.3785^\circ$$

La conversión a metros locales se calcula mediante:

$$X = (\lambda - \lambda_0) \cdot \left( \frac{\pi}{180} \right) \cdot R \cdot \cos(\phi_0)$$

$$Z = -(\phi - \phi_0) \cdot \left( \frac{\pi}{180} \right) \cdot R$$

Donde $R = 6,371,000 \text{ metros}$ (radio medio de la Tierra). El signo negativo en $Z$ compensa la convención del sistema de coordenadas de Three.js, donde el eje $+Z$ apunta hacia el sur del plano de la pantalla.

### B. Triangulación y Extrusión de Polígonos Catastrales
Cada parcela delimitada en el KML posee una secuencia de vértices que definen su perímetro. El pipeline de modelado ejecuta:
1. Conversión de cada vértice geodésico a punto 2D $(x_i, z_i)$.
2. Centrado local del polígono respecto a su baricentro:
   $$\bar{x} = \frac{1}{N}\sum_{i=1}^N x_i, \quad \bar{z} = \frac{1}{N}\sum_{i=1}^N z_i$$
3. Construcción de un `THREE.Shape` y triangulación mediante corte de orejas (*ear-clipping*).
4. Generación de `THREE.ExtrudeGeometry` con una cota de extrusión vertical ($Y = 0.35\text{ m}$ por defecto, elevándose a $0.95\text{ m}$ cuando está seleccionado).
5. Generación de `THREE.EdgesGeometry` para delimitar las líneas perimetrales de agrimensura con alto contraste.

### C. Proyección de Rayo (*Raycasting*) para Selección y Doble Toque
Para detectar la pulsación del usuario sobre un lote o sobre el terreno en dispositivos móviles:
1. Normalización de la posición del cursor o toque a Coordenadas de Dispositivo Normalizadas (NDC):
   $$x_{\text{ndc}} = \left( \frac{x_{\text{pantalla}}}{W} \right) \cdot 2 - 1, \quad y_{\text{ndc}} = -\left( \frac{y_{\text{pantalla}}}{H} \right) \cdot 2 + 1$$
2. Creación del rayo con origen en la cámara perspectiva y dirección hacia el punto proyectado:
   $$\vec{R}_{\text{origen}} = \vec{C}, \quad \vec{R}_{\text{dir}} = \text{normalize}\left( M_{\text{inv}} \cdot (x_{\text{ndc}}, y_{\text{ndc}}, 1)^T \right)$$
3. Cálculo de la intersección con el plano del terreno ($Y = 0$):
   $$t = \frac{-C_y}{R_{\text{dir}, y}}, \quad \vec{P}_{\text{impacto}} = \vec{C} + t \cdot \vec{R}_{\text{dir}}$$

### D. Interpolación de Cámara (*Camera Lerp & Damping*)
Durante los recorridos automáticos (*presets* y selección de lotes), la posición de la cámara $\vec{P}$ y el objetivo de mira $\vec{T}$ se interpolan en cada fotograma mediante una curva exponencial suave:

$$\vec{P}_{k+1} = \vec{P}_k + \alpha \cdot (\vec{P}_{\text{meta}} - \vec{P}_k), \quad \alpha \in [0.05, 0.18]$$

Esto evita saltos bruscos y garantiza una experiencia visual cinematográfica y profesional.
