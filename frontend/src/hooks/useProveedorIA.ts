import { useApp } from '../store/useApp';

export function useProveedorIA() {
  const settings = useApp((s) => s.settings);
  const backendKeys = useApp((s) => s.backendKeys);

  const youtubeDisponible = Boolean(settings.youtubeKey) || backendKeys.youtube;
  const geminiOk = Boolean(settings.geminiKey) || backendKeys.gemini;
  const claudeOk = Boolean(settings.claudeKey) || backendKeys.claude;
  const mistralOk = Boolean(settings.mistralKey) || backendKeys.mistral;
  const proveedor = settings.proveedorIA;

  const iaDisponible =
    proveedor === 'claude' ? claudeOk : proveedor === 'mistral' ? mistralOk : geminiOk;

  return {
    youtubeDisponible,
    geminiOk,
    claudeOk,
    mistralOk,
    proveedor,
    iaDisponible,
    investigacionDisponible: iaDisponible && youtubeDisponible,
  };
}