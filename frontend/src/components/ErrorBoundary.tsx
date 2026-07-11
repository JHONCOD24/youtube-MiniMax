import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reiniciar = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="card max-w-md w-full p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Algo salió mal</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            La app encontró un error inesperado. Tus datos guardados en el navegador no se borraron.
          </p>
          <p className="text-xs text-slate-400 font-mono break-all">{this.state.error.message}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button onClick={this.reiniciar} className="btn-primary gap-2">
              <RefreshCw className="w-4 h-4" /> Recargar app
            </button>
            <a href="/" className="btn-secondary gap-2 inline-flex items-center justify-center">
              <Home className="w-4 h-4" /> Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }
}