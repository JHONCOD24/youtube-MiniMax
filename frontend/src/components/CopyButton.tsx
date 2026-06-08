// Botón reutilizable "Copiar" con confirmación visual.
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/format';

export function CopyButton({ text, label = 'Copiar', className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className={`btn-secondary ${className}`}>
      {copied ? <><Check className="w-4 h-4 text-green-500" /> ¡Copiado!</> : <><Copy className="w-4 h-4" /> {label}</>}
    </button>
  );
}
