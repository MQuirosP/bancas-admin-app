// lib/global-error-hooks.ts
export function installGlobalErrorHooks() {
  if (typeof window === 'undefined') return;

  // Errores JS no capturados
  window.addEventListener('error', (e) => {
    console.error('[GLOBAL ERROR]', e.error || e.message || e);
    // Aquí podrías enviar a tu logger remoto
  });

  // Promesas no manejadas
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    console.error('[UNHANDLED REJECTION]', e.reason);
  });

  // Detección de error de hidración / chunks no cargados
  (async () => {
    // @ts-ignore
    if (window.__NEXT_DATA__ || (window as any).__expo) return; // opcional según stack
  })();
}
