# 🎬 YouTube Niche Lab

> Estudio todo-en-uno para encontrar nichos virales en YouTube y producir videos listos para publicar.
> En español de Latinoamérica, sin bases de datos pesadas, sin costos innecesarios.

![status](https://img.shields.io/badge/status-MVP-blue) ![stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Express-green) ![i18n](https://img.shields.io/badge/i18n-es--LATAM-yellow)

---

## ✨ ¿Qué hace?

1. **Nicho** → 15 nichos predefinidos + opción de nicho personalizado.
2. **Investigación** → Top videos, outliers, semáforo de oportunidad, sub-nichos, ángulos, competencia (datos reales de YouTube).
3. **Ideas** → 8-12 ideas de video con hook, ángulo y razón de viralidad.
4. **Activos** → Títulos de alto CTR, guion persuasivo, descripción SEO + keywords, prompts para thumbnail / video / música.
5. **Monetización** → CPM/RPM estimados, vías de ingreso personalizadas, proyección, checklist YPP.
6. **Exportar** → `.md`, `.txt`, `.json`, copiar todo, checklist de publicación.

**Extras incluidos:**
- 🔁 Comparador de hasta 3 nichos lado a lado.
- 🪝 Banco de hooks reutilizables.
- 📅 Calendario de contenido tipo Kanban (idea → guion → grabado → publicado).
- 📊 Contador de cuota de YouTube en la barra lateral.
- 🌗 Modo claro / oscuro.
- 🧪 "Modo demo" si no tienes keys (puedes probar todo el flujo).

---

## 🧱 Stack técnico

- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + Zustand (estado) + react-router-dom + lucide-react.
- **Backend (proxy):** Node.js + Express + helmet + cors + express-rate-limit.
- **APIs externas:** YouTube Data API v3 + Google Gemini API.
- **Persistencia:** `localStorage` (proyectos, settings, calendario, hooks).
- **Sin base de datos.** Sin servicios pagos adicionales.

---

## 📋 Requisitos previos

- **Node.js >= 18** ([descargar](https://nodejs.org/)).
- **npm** (viene con Node).
- Una **API key de YouTube Data API v3** (gratis con cuota diaria).
- Una **API key de Google Gemini** (gratis, con free tier generoso).

> 💡 Si no tienes las keys, la app funciona en **modo demo** con datos de ejemplo.

---

## 🔑 Cómo obtener las API keys

### YouTube Data API v3

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo (o usa uno existente).
3. Menú lateral → **APIs y servicios** → **Biblioteca** → busca **YouTube Data API v3** → **Habilitar**.
4. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **Clave de API**.
5. (Opcional) Restringe la key solo a "YouTube Data API v3" por seguridad.
6. Copia la key (empieza con `AIzaSy...`).

### Google Gemini API

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Inicia sesión con tu cuenta de Google.
3. **Create API key** → selecciona un proyecto (o crea uno).
4. Copia la key.

---

## 🚀 Instalación y arranque

### 1. Clonar / descargar

```bash
# Si lo descargas como ZIP, descomprímelo. Si usas git:
git clone <tu-repo> youtube-niche-lab
cd youtube-niche-lab
```

### 2. Instalar dependencias (una sola vez)

```bash
# En la raíz (instala concurrently)
npm install

# Backend
npm install --prefix backend

# Frontend
npm install --prefix frontend
```

> **Tip:** también puedes correr `npm run install:all` desde la raíz.

### 3. Configurar las API keys

Crea el archivo `backend/.env` copiando el ejemplo:

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env` y pega tus keys:

```env
YOUTUBE_API_KEY=AIzaSy...tu_key
GEMINI_API_KEY=AIzaSy...tu_key
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

> 🔒 **Importante:** nunca subas el archivo `.env` a un repositorio. Ya está en `.gitignore`.

### 4. Arrancar la app

**Opción A — un solo comando (recomendado):**

```bash
npm run dev
```

Esto levanta **backend y frontend a la vez** en dos procesos paralelos.

**Opción B — por separado (dos terminales):**

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

### 5. Abrir en el navegador

👉 **http://localhost:5173**

Verás el onboarding la primera vez. Si no configuraste keys, presiona "Empezar (modo demo)" para ver el flujo completo con datos de ejemplo.

---

## 📁 Estructura del proyecto

```
youtube-niche-lab/
├── backend/                 # Proxy Express (oculta las API keys)
│   ├── src/
│   │   ├── server.js        # Entry point
│   │   ├── routes/          # /api/youtube, /api/gemini, /api/health
│   │   └── services/        # youtubeService, geminiService (con caché y backoff)
│   ├── .env.example
│   └── package.json
├── frontend/                # App React
│   ├── src/
│   │   ├── components/      # Layout, PipelineProgress, CopyButton, etc.
│   │   ├── pages/           # NichoPage, InvestigacionPage, …, SettingsPage
│   │   ├── services/        # api.ts, youtubeClient.ts, geminiClient.ts
│   │   ├── store/           # Zustand store global
│   │   ├── data/            # Nichos predefinidos, datos demo
│   │   ├── types/           # Tipos TS compartidos
│   │   ├── utils/           # format, copy, download
│   │   └── App.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts       # Incluye proxy /api → backend
│   └── package.json
├── package.json             # Scripts orquestadores (dev, install:all, etc.)
└── README.md
```

---

## 💰 Manejo de cuota de YouTube (importante)

La API de YouTube es **gratis** pero tiene **10.000 unidades/día**. Los costes son:

| Operación | Coste | Notas |
|---|---|---|
| `videos.list` / `channels.list` | **1 unidad** | Trae stats en lote (hasta 50 ids) |
| `search.list` | **100 unidades** | Solo ~100 búsquedas/día |

**Cómo está optimizado en esta app:**

- ✅ Caché en backend de 6-12h para `search` y `videos`.
- ✅ El frontend cachea adicionalmente proyectos y settings en `localStorage`.
- ✅ `videos.list` y `channels.list` en lote (1 llamada, hasta 50 ids).
- ✅ Contador de cuota en vivo en la barra lateral.
- ✅ Mensaje claro cuando se llega al límite + sugerencia de esperar al reinicio (medianoche hora del Pacífico).

---

## 🎨 Personalización

- **Cambiar paleta de colores:** edita `frontend/tailwind.config.js` → `theme.extend.colors.brand`.
- **Agregar nichos:** edita `frontend/src/data/niches.ts`.
- **Cambiar prompts de Gemini:** edita `frontend/src/services/geminiClient.ts`.
- **Cambiar el modelo Gemini por defecto:** ajusta `DEFAULT_MODEL` en `backend/src/services/geminiService.js`.

---

## 📦 Empaquetar como app de escritorio (futuro, con Tauri)

Esta app está pensada para ser empaquetable con [Tauri](https://tauri.app/) (no Electron, mucho más liviano).

Pasos resumidos (NO incluidos en este MVP):

1. `npm install --save-dev @tauri-apps/cli` dentro de `frontend/`.
2. `npx tauri init` apuntando al `dist/` que genera `npm run build`.
3. Reemplazar el `dev` de Vite por el de Tauri (`npx tauri dev`).
4. Empaquetar con `npx tauri build`.

---

## 🛠️ Mejoras futuras (ideas)

- [ ] **Generador de variantes A/B de thumbnail** (3 prompts diferentes para testear).
- [ ] **Sincronización con Notion / Google Sheets** para el calendario.
- [ ] **Plantillas de descripción personalizables** (en Ajustes).
- [ ] **Importar/exportar proyectos entre navegadores** (vía JSON).
- [ ] **Historial de versiones de cada proyecto** (rollback).
- [ ] **Soporte multi-idioma** (es/en/pt).
- [ ] **Integración opcional con YouTube Analytics** (OAuth).
- [ ] **Vista de Shorts vs Largo** con detección automática del formato ganador por nicho.
- [ ] **PWA** (instalable como app, offline-first).

---

## 🐛 Problemas comunes

**"Backend no disponible" / no carga nada**
- Verifica que el backend esté corriendo en `http://localhost:4000`.
- En la consola del navegador (F12) busca errores 5xx.

**"Cuota de YouTube agotada"**
- Esperar al reinicio (medianoche hora del Pacífico).
- O usa otra API key.

**"Gemini 403 / 429"**
- Verifica que la key esté bien pegada.
- Si es 429, espera unos segundos; el backend ya reintenta con backoff.

**Las páginas dan error en blanco**
- Abre la consola (F12) y mira el error. Casi siempre es una variable de entorno mal configurada.

---

## 📜 Licencia

MIT — úsalo, modifícalo, véndelo, sin restricciones. (Ajusta según prefieras.)

---

## 🙌 Créditos

- Iconos por [lucide-react](https://lucide.dev/).
- Datos de nichos curados a mano (CPMs y potencial son referenciales, no garantizados).
- Construido con ❤️ para creadores hispanohablantes.
