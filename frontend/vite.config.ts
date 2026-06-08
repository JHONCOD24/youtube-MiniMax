import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Config de Vite. El dev server escucha en 5173 por defecto.
export default defineConfig({
  plugins: [react()],
  server: {
    // Exponer el dev server en IPv4/IPv6 para que "localhost" sea accesible.
    host: true,
    port: 5173,
    proxy: {
      // Redirige las llamadas /api/* al backend (evita CORS y mantiene las keys seguras).
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
});
