// Página de Ajustes: configurar API keys, probar conexión, etc.
import { useState } from 'react';
import { useApp } from '../store/useApp';
import { Save, CheckCircle2, AlertCircle, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

function normalizeSecret(value?: string | null) {
  return String(value || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .trim();
}

export function SettingsPage() {
  const { settings, updateSettings } = useApp();
  const [ytKey, setYtKey] = useState(settings.youtubeKey);
  const [gemKey, setGemKey] = useState(settings.geminiKey);
  const [modelo, setModelo] = useState(settings.modeloGemini);
  const [claudeKey, setClaudeKey] = useState(settings.claudeKey || '');
  const [modeloClaude, setModeloClaude] = useState(settings.modeloClaude || 'claude-sonnet-4-6');
  const [mistralKey, setMistralKey] = useState(settings.mistralKey || '');
  const [modeloMistral, setModeloMistral] = useState(settings.modeloMistral || 'mistral-large-latest');
  const [proveedor, setProveedor] = useState(settings.proveedorIA || 'gemini');
  const [show, setShow] = useState(false);
  const [test, setTest] = useState<{ yt?: 'ok' | 'fail' | 'loading'; gem?: 'ok' | 'fail' | 'loading'; claude?: 'ok' | 'fail' | 'loading'; mistral?: 'ok' | 'fail' | 'loading' }>({});
  const [testMsg, setTestMsg] = useState<{ yt?: string; gem?: string; claude?: string; mistral?: string }>({});

  const guardar = () => {
    const normalizedClaudeKey = normalizeSecret(claudeKey);
    const normalizedMistralKey = normalizeSecret(mistralKey);
    updateSettings({
      youtubeKey: normalizeSecret(ytKey),
      geminiKey: normalizeSecret(gemKey),
      modeloGemini: modelo,
      claudeKey: normalizedClaudeKey,
      modeloClaude,
      mistralKey: normalizedMistralKey,
      modeloMistral,
      proveedorIA: proveedor as 'gemini' | 'claude' | 'mistral',
    });
    setClaudeKey(normalizedClaudeKey);
    setMistralKey(normalizedMistralKey);
    setTest({});
  };

  const testYT = async () => {
    if (!ytKey.trim()) { setTest((s) => ({ ...s, yt: 'fail' })); setTestMsg((s) => ({ ...s, yt: 'Pega una key primero' })); return; }
    updateSettings({ youtubeKey: ytKey.trim() });
    setTest((s) => ({ ...s, yt: 'loading' })); setTestMsg((s) => ({ ...s, yt: '' }));
    try {
      // Llamada de prueba barata
      const r = await api.youtubeSearch('test', 1);
      if (r.quota) { setTest((s) => ({ ...s, yt: 'ok' })); setTestMsg((s) => ({ ...s, yt: `Cuota usada hoy: ${r.quota.used}/10000` })); }
    } catch (e: any) {
      setTest((s) => ({ ...s, yt: 'fail' }));
      setTestMsg((s) => ({ ...s, yt: e?.message || 'Error' }));
    }
  };

  const testGem = async () => {
    if (!gemKey.trim()) { setTest((s) => ({ ...s, gem: 'fail' })); setTestMsg((s) => ({ ...s, gem: 'Pega una key primero' })); return; }
    updateSettings({ geminiKey: gemKey.trim() });
    setTest((s) => ({ ...s, gem: 'loading' })); setTestMsg((s) => ({ ...s, gem: '' }));
    try {
      const r = await api.geminiText('Responde solo: "ok"', 'Eres conciso.', modelo);
      if (r.text) { setTest((s) => ({ ...s, gem: 'ok' })); setTestMsg((s) => ({ ...s, gem: `Respuesta: "${r.text.slice(0, 40)}"` })); }
    } catch (e: any) {
      setTest((s) => ({ ...s, gem: 'fail' }));
      setTestMsg((s) => ({ ...s, gem: e?.message || 'Error' }));
    }
  };

  const testClaude = async () => {
    const normalizedClaudeKey = normalizeSecret(claudeKey);
    if (!normalizedClaudeKey) { setTest((s) => ({ ...s, claude: 'fail' })); setTestMsg((s) => ({ ...s, claude: 'Pega una key primero' })); return; }
    if (!normalizedClaudeKey.startsWith('sk-ant-')) {
      setTest((s) => ({ ...s, claude: 'fail' }));
      setTestMsg((s) => ({ ...s, claude: 'La key de Claude debe empezar por "sk-ant-". Revisa si pegaste una key de otro proveedor o si viene con texto extra.' }));
      return;
    }
    setClaudeKey(normalizedClaudeKey);
    updateSettings({ claudeKey: normalizedClaudeKey });
    setTest((s) => ({ ...s, claude: 'loading' })); setTestMsg((s) => ({ ...s, claude: '' }));
    try {
      const r = await api.claudeText('Responde solo: "ok"', 'Eres conciso.', modeloClaude);
      if (r.text) { setTest((s) => ({ ...s, claude: 'ok' })); setTestMsg((s) => ({ ...s, claude: `Respuesta: "${r.text.slice(0, 40)}"` })); }
    } catch (e: any) {
      setTest((s) => ({ ...s, claude: 'fail' }));
      setTestMsg((s) => ({ ...s, claude: e?.message || 'Error' }));
    }
  };

  const testMistral = async () => {
    const normalizedMistralKey = normalizeSecret(mistralKey);
    if (!normalizedMistralKey) { setTest((s) => ({ ...s, mistral: 'fail' })); setTestMsg((s) => ({ ...s, mistral: 'Pega una key primero' })); return; }
    setMistralKey(normalizedMistralKey);
    updateSettings({ mistralKey: normalizedMistralKey });
    setTest((s) => ({ ...s, mistral: 'loading' })); setTestMsg((s) => ({ ...s, mistral: '' }));
    try {
      const r = await api.mistralText('Responde solo: "ok"', 'Eres conciso.', modeloMistral);
      if (r.text) { setTest((s) => ({ ...s, mistral: 'ok' })); setTestMsg((s) => ({ ...s, mistral: `Respuesta: "${r.text.slice(0, 40)}"` })); }
    } catch (e: any) {
      setTest((s) => ({ ...s, mistral: 'fail' }));
      setTestMsg((s) => ({ ...s, mistral: e?.message || 'Error' }));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Ajustes</h1>
        <p className="text-slate-600 dark:text-slate-300">Configura tus claves de API. Se guardan en tu navegador.</p>
      </header>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label font-semibold">Proveedor de IA Activo</label>
          <select value={proveedor} onChange={(e) => setProveedor(e.target.value as any)} className="input">
            <option value="gemini">Google Gemini</option>
            <option value="claude">Anthropic Claude</option>
            <option value="mistral">Mistral AI</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Elige qué Inteligencia Artificial impulsará los análisis y generaciones.</p>

          {/* La variante del modelo se despliega automáticamente según el proveedor elegido arriba */}
          <div className="mt-3 pl-4 border-l-2 border-brand-200 dark:border-brand-900/50">
            {proveedor === 'gemini' && (
              <div>
                <label className="label">Modelo de Gemini</label>
                <select value={modelo} onChange={(e) => setModelo(e.target.value as any)} className="input">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (recomendado)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (más rápido, más barato)</option>
                </select>
              </div>
            )}
            {proveedor === 'claude' && (
              <div>
                <label className="label">Modelo de Claude</label>
                <select value={modeloClaude} onChange={(e) => setModeloClaude(e.target.value)} className="input">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (recomendado)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (rápido y económico)</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (compatible)</option>
                </select>
              </div>
            )}
            {proveedor === 'mistral' && (
              <div>
                <label className="label">Modelo de Mistral</label>
                <select value={modeloMistral} onChange={(e) => setModeloMistral(e.target.value)} className="input">
                  <option value="mistral-large-latest">Mistral Large (potente y recomendado)</option>
                  <option value="mistral-small-latest">Mistral Small (rápido y económico)</option>
                  <option value="codestral-latest">Codestral (especializado en código/lógica)</option>
                  <option value="open-mistral-3b">Open Mistral 3B (liviano)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>YouTube Data API v3 Key</span>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
               className="text-xs text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline">
              Obtener key <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input value={ytKey} onChange={(e) => setYtKey(e.target.value)}
                type={show ? 'text' : 'password'} placeholder="AIzaSy..." className="input pr-10" />
              <button onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={testYT} className="btn-secondary">
              {test.yt === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar'}
            </button>
          </div>
          <TestMsg status={test.yt} msg={testMsg.yt} />
          <p className="text-xs text-slate-500 mt-1">1) Crea un proyecto en Google Cloud · 2) Habilita "YouTube Data API v3" · 3) Crea una API key · 4) Pégala aquí</p>
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>Google Gemini API Key</span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
               className="text-xs text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline">
              Obtener key <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <div className="flex gap-2">
            <input value={gemKey} onChange={(e) => setGemKey(e.target.value)}
              type={show ? 'text' : 'password'} placeholder="AIzaSy..." className="input flex-1" />
            <button onClick={testGem} className="btn-secondary">
              {test.gem === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar'}
            </button>
          </div>
          <TestMsg status={test.gem} msg={testMsg.gem} />
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>Anthropic Claude API Key</span>
            <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer"
               className="text-xs text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline">
              Obtener key <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <div className="flex gap-2">
            <input value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)}
              type={show ? 'text' : 'password'} placeholder="sk-ant-..." className="input flex-1" />
            <button onClick={testClaude} className="btn-secondary">
              {test.claude === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar'}
            </button>
          </div>
          <TestMsg status={test.claude} msg={testMsg.claude} />
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>Mistral AI API Key</span>
            <a href="https://console.mistral.ai/" target="_blank" rel="noreferrer"
               className="text-xs text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline">
              Obtener key <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <div className="flex gap-2">
            <input value={mistralKey} onChange={(e) => setMistralKey(e.target.value)}
              type={show ? 'text' : 'password'} placeholder="Pega tu API Key de Mistral..." className="input flex-1" />
            <button onClick={testMistral} className="btn-secondary">
              {test.mistral === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar'}
            </button>
          </div>
          <TestMsg status={test.mistral} msg={testMsg.mistral} />
        </div>

        <button onClick={guardar} className="btn-primary w-full sm:w-auto">
          <Save className="w-4 h-4" /> Guardar configuración
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-bold mb-2">Sobre los datos y la privacidad</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
          <li>• Las keys se guardan <b>solo en tu navegador</b> (localStorage).</li>
          <li>• Tu navegador envía cada petición a <b>tu propio backend local</b>, que es quien llama a YouTube/Gemini.</li>
          <li>• No se envía nada a servidores externos. Todo el trabajo ocurre en tu máquina.</li>
          <li>• Si no configuras keys, la app funciona en <b>modo demo</b> con datos de ejemplo.</li>
        </ul>
      </div>
    </div>
  );
}

function TestMsg({ status, msg }: { status?: string; msg?: string }) {
  if (!status || status === 'loading') return null;
  if (status === 'ok') return <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {msg}</p>;
  return <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {msg}</p>;
}
