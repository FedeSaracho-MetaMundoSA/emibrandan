# Riveras de Pucheta — Masterplan Interactivo 3D & Catastro Digital

Plataforma web de visualización catastral y comercialización inmobiliaria en 3D interactivo para el desarrollo **Riveras de Pucheta** (La Caldera, Salta, Argentina), comercializado y promovido oficialmente por **ArgenSALTA Inmobiliaria**.

Desarrollada con **React 19**, **Three.js**, **Tailwind CSS v4** y **TypeScript**, la aplicación permite explorar de manera inmersiva el loteo completo de 374 parcelas, consultar datos catastrales oficiales en tiempo real, visualizar amenidades con animaciones 3D, recorrer calles mediante vista peatonal y contactar a los asesores comerciales vía WhatsApp con datos parametrizados de cada lote.

---

## ⚡ Inicio Rápido (Quick Start)

### Requisitos Previos
- **Node.js**: v18.0.0 o superior (se recomienda Node 20 LTS o 22)
- **Gestor de paquetes**: `npm` v9+, `bun` o `pnpm`

### Instalación y Ejecución

```bash
# 1. Clonar el repositorio o ingresar al directorio del proyecto
cd riveras-pucheta-masterplan

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo (puerto 3000)
npm run dev
```

Abre tu navegador en `http://localhost:3000` para interactuar con la aplicación.

### Scripts Disponibles en `package.json`

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo Vite en `0.0.0.0:3000`. |
| `npm run build` | Compila el bundle optimizado para producción en `/dist`. |
| `npm run preview` | Previsualiza localmente el build de producción. |
| `npm run lint` | Ejecuta la verificación de tipos con `tsc --noEmit`. |
| `npm run clean` | Elimina directorios de compilación temporal (`dist`). |

---

## 🛠️ Stack Tecnológico

| Capa / Tecnología | Versión | Propósito / Beneficio |
|---|---|---|
| **React** | `^19.0.1` | Librería central de UI, componentes basados en hooks y gestión reactiva de estado. |
| **Three.js** | `^0.185.1` | Motor de renderizado 3D WebGL para el terreno, lotes, árboles instanciados y río. |
| **TypeScript** | `~5.8.2` | Tipado estricto en modelos de datos (`Lote`, `Manzana`, `Amenidad3D`) y contratos de props. |
| **Vite** | `^6.2.3` | Empaquetador ultra-rápido con ESM nativo y compilación optimizada en producción. |
| **Tailwind CSS** | `^4.1.14` | Framework utilitario para diseño responsivo fluido y estilos de alto contraste. |
| **Motion** | `^12.23.24` | Animaciones fluidas para modales, drawers móviles y transiciones de interfaz. |
| **Lucide React** | `^0.546.0` | Set iconográfico consistente y escalable en SVG. |
| **Google Maps Loader** | `^2.1.1` | Carga asíncrona de mapas satelitales y capas geográficas complementarias. |

---

## 🚀 Arquitectura de Rendimiento para Móviles de Gama Baja

Para garantizar una experiencia a **60 FPS** incluso en dispositivos móviles económicos, la arquitectura implementa:

1. **Geometry Instancing**:
   - Más de 300 árboles perimetrales generados con solo 5 llamadas `THREE.InstancedMesh`.
   - Más de 180 carteles de «VENDIDO» agrupados en 2 mallas instanciadas con una única textura compartida.
2. **Virtualización de Listas (Window Virtualization)**:
   - `LotesListPanel` utiliza un algoritmo de ventana deslizante (`startIndex` / `endIndex`) que renderiza únicamente las ~15 filas visibles en el viewport en lugar de los 374 lotes simultáneamente.
3. **Carga Diferida de KML (Lazy KML Loading)**:
   - Los datos catastrales poligonales se importan dinámicamente mediante `import()` y se procesan durante periodos de inactividad (`requestIdleCallback`), garantizando un **First Contentful Paint (FCP) menor a 2.0s**.
4. **Caché en IndexedDB para Texturas Procedurales**:
   - Las texturas sintéticas de césped, asfalto y relieve se calculan una sola vez en canvas y se persisten en IndexedDB.
5. **Ajuste Adaptativo de GPU**:
   - Detección automática de dispositivos móviles: límite de Pixel Ratio a `1.25x`, mapa de sombras atenuado a `1024x1024` y desactivación de antialiasing pesado en GPUs lentas.

---

## 📱 Gestos Táctiles Móviles Soportados

- **Pellizcar para Zoom (Pinch-to-zoom)**: Acercamiento y alejamiento suave y continuo.
- **Rotación con 2 Dedos (2-Finger Rotate)**: Detección de giro angular sobre el eje vertical del loteo.
- **Desplazamiento Inercial (Momentum Pan)**: Amortiguación configurada con `enableDamping = true` y factor `0.08`.
- **Doble Toque para Enfoque (Double-Tap to Focus)**: Enfoque y acercamiento suave mediante *raycasting* directo al lote o zona del terreno pulsada.

---

## 📂 Estructura de Directorios

```
├── public/
│   ├── doc.kml                       # Archivo KML original de mensura catastral
│   └── riveras_pucheta_reales...json  # Respaldo estructurado de geometría de lotes
├── src/
│   ├── components/
│   │   ├── 3d/                       # Escena Three.js, renderer, canvas y hooks de cámara
│   │   ├── cards/                    # Tarjetas de lotes y estadísticas
│   │   ├── common/                   # Componentes transversales (OptimizedImage)
│   │   ├── panels/                   # Paneles laterales de exploración, filtros y detalle
│   │   └── modals/                   # Modales (Plano 2D, Fotos, 360°, Guía Técnica)
│   ├── context/                      # LotesContext (estado global del catastro)
│   ├── data/                         # Configuración comercial, manzanas, amenidades
│   ├── types/                        # Definiciones TypeScript globales
│   └── utils/                        # Parsers KML, matemáticas 3D, generadores de texturas
├── ARCHITECTURE.md                   # Documentación detallada de arquitectura y flujo 3D
├── COMPONENTS.md                     # Catálogo exhaustivo de componentes y props
├── API.md                            # Documentación de Context, Hooks y Utilidades
├── DEPLOYMENT.md                     # Guía de despliegue en producción y Docker
└── README.md                         # Este archivo
```

---

## 🔧 Solución de Problemas (Troubleshooting)

### 1. La escena 3D no carga o muestra pantalla negra
- **Causa**: El navegador tiene deshabilitada la aceleración por hardware o WebGL.
- **Solución**: Verifica en `chrome://gpu` que WebGL esté disponible. Asegúrate de tener actualizados los controladores de tu placa de video.

### 2. Error al compilar por falta de dependencias
- **Solución**: Ejecuta `npm install` o elimina `node_modules` y reinstala:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 3. Las texturas procedurales no se ven en modo incógnito
- **Solución**: La aplicación utiliza una capa de *fallback* automática en memoria cuando `IndexedDB` está restringido en ventanas privadas. No requiere acción del usuario.

### 4. Puerto 3000 ocupado al ejecutar en desarrollo
- **Solución**: Especifica un puerto alternativo o libera el puerto 3000:
  ```bash
  npx kill-port 3000
  npm run dev
  ```
