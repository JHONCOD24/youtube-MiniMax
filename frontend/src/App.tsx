// Router principal de la app.
import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Layout } from './components/Layout';
import { AutoSaveInfo } from './components/AutoSaveInfo';
import { StorageToast } from './components/StorageToast';
import { useApp } from './store/useApp';
import { api } from './services/api';

// Cada página se carga en su propio chunk para no enviar toda la app
// (1.2MB) en la carga inicial: el navegador solo descarga la página visitada.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const NichoPage = lazy(() => import('./pages/NichoPage').then((m) => ({ default: m.NichoPage })));
const InvestigacionPage = lazy(() => import('./pages/InvestigacionPage').then((m) => ({ default: m.InvestigacionPage })));
const IdeasPage = lazy(() => import('./pages/IdeasPage').then((m) => ({ default: m.IdeasPage })));
const AssetsPage = lazy(() => import('./pages/AssetsPage').then((m) => ({ default: m.AssetsPage })));
const MonetizacionPage = lazy(() => import('./pages/MonetizacionPage').then((m) => ({ default: m.MonetizacionPage })));
const ExportarPage = lazy(() => import('./pages/ExportarPage').then((m) => ({ default: m.ExportarPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProyectosPage = lazy(() => import('./pages/ProyectosPage').then((m) => ({ default: m.ProyectosPage })));
const ComparadorPage = lazy(() => import('./pages/ComparadorPage').then((m) => ({ default: m.ComparadorPage })));
const HooksPage = lazy(() => import('./pages/HooksPage').then((m) => ({ default: m.HooksPage })));
const CalendarioPage = lazy(() => import('./pages/CalendarioPage').then((m) => ({ default: m.CalendarioPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );
}

export default function App() {
  const cargarProyectos = useApp((s) => s.cargarProyectos);
  const setBackendKeys = useApp((s) => s.setBackendKeys);

  useEffect(() => { 
    cargarProyectos(); 
  }, [cargarProyectos]);

  useEffect(() => {
    api.health()
      .then((data) => {
        if (data && data.keys) {
          setBackendKeys({
            youtube: Boolean(data.keys.youtube),
            gemini: Boolean(data.keys.gemini),
            claude: Boolean(data.keys.claude),
            mistral: Boolean(data.keys.mistral),
          });
        }
      })
      .catch((err) => {
        console.warn('No se pudo verificar el estado de las claves en el backend:', err);
      });
  }, [setBackendKeys]);

  return (
    <>
      <AutoSaveInfo />
      <StorageToast />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/nicho" element={<NichoPage />} />
            <Route path="/investigacion" element={<InvestigacionPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/monetizacion" element={<MonetizacionPage />} />
            <Route path="/exportar" element={<ExportarPage />} />
            <Route path="/proyectos" element={<ProyectosPage />} />
            <Route path="/comparador" element={<ComparadorPage />} />
            <Route path="/hooks" element={<HooksPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
