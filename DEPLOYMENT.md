# Guía de Despliegue y Operaciones — Riveras de Pucheta

Este documento detalla el proceso de compilación, variables de entorno, configuración de Docker, Cloud Run y directivas de almacenamiento en caché para CDN.

---

## 1. Variables de Entorno

Declara las siguientes variables en un archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```ini
# Google Maps Platform (Opcional para el visor satelital interactivo)
VITE_GOOGLE_MAPS_API_KEY=

# Puerto de ejecución (Fijo en 3000 en entornos Cloud Run)
PORT=3000
```

> **Nota de Seguridad**: Las variables expuestas al navegador en Vite deben incluir obligatoriamente el prefijo `VITE_`. Ninguna clave secreta del servidor debe exponerse al frontend.

---

## 2. Proceso de Compilación (Build Process)

Para generar la compilación estática de producción:

```bash
npm run build
```

Este comando ejecuta `vite build`, produciendo los archivos optimizados dentro del directorio `/dist`:
- **Minificación**: Eliminación de espacios en blanco y ofuscación segura.
- **Tree-Shaking**: Descarte de código Three.js o utilidades no importadas.
- **Code-Splitting**: Los modales pesados (`GuiaTechModal`, `Plano2DModal`, `Panorama360Modal`) se compilan como fragmentos asíncronos (`chunks`) independientes que solo se descargan cuando el usuario abre el modal.

---

## 3. Despliegue con Docker

A continuación se presenta un `Dockerfile` multietapa optimizado con **Nginx Alpine** para un consumo de memoria mínimo (< 25 MB):

```dockerfile
# Etapa 1: Compilación
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx ultra-ligero
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración recomendada de Nginx (`nginx.conf`):

```nginx
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip para chunks JS, KML y JSON
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Chunks estáticos con hash inmutable (1 año de caché)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # KML y datos catastrales locales (1 día de caché)
    location ~* \.(kml|json)$ {
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # SPA Fallback para React Router / navegación
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
```

---

## 4. Despliegue en Google Cloud Run

Si despliegas la aplicación en Google Cloud Run:

```bash
# 1. Construir imagen en Google Artifact Registry
gcloud builds submit --tag gcr.io/[PROJECT_ID]/riveras-pucheta-masterplan

# 2. Desplegar en Cloud Run especificando el puerto 3000
gcloud run deploy riveras-pucheta-masterplan \
  --image gcr.io/[PROJECT_ID]/riveras-pucheta-masterplan \
  --platform managed \
  --region us-central1 \
  --port 3000 \
  --allow-unauthenticated
```

---

## 5. Estrategia de Caché en CDN (Cloudflare / Fastly / Cloud CDN)

Para optimizar el **First Contentful Paint (FCP)** y minimizar el ancho de banda:

1. **HTML Principal (`/index.html`)**:
   - Encabezado: `Cache-Control: no-cache, no-store, must-revalidate`.
   - Garantiza que cualquier nueva versión publicada sea detectada de inmediato.
2. **Artefactos con Hash (`/assets/*.js`, `/assets/*.css`)**:
   - Encabezado: `Cache-Control: public, max-age=31536000, immutable`.
   - Al poseer huella de contenido (hash en el nombre del archivo), son permanentemente seguros para almacenar en la CDN y en el navegador del cliente.
3. **Archivos KML y JSON (`/doc.kml`, `*.json`)**:
   - Encabezado: `Cache-Control: public, max-age=86400, stale-while-revalidate=3600`.
   - Permite una respuesta instantánea desde el borde (*edge*) mientras se revalida en segundo plano si hubiera cambios catastrales.
