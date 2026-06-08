// Router principal de la app.
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AutoSaveInfo } from './components/AutoSaveInfo';
import { DashboardPage } from './pages/DashboardPage';
import { NichoPage } from './pages/NichoPage';
import { InvestigacionPage } from './pages/InvestigacionPage';
import { IdeasPage } from './pages/IdeasPage';
import { AssetsPage } from './pages/AssetsPage';
import { MonetizacionPage } from './pages/MonetizacionPage';
import { ExportarPage } from './pages/ExportarPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProyectosPage } from './pages/ProyectosPage';
import { ComparadorPage } from './pages/ComparadorPage';
import { HooksPage } from './pages/HooksPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { useApp } from './store/useApp';
import { api } from './services/api';

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
      <Layout>
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
      </Layout>
    </>
  );
}
