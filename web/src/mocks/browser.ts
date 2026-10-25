import { setupWorker } from 'msw/browser';
import { handlers, setMockScenarioBehavior } from './handlers';

export const worker = setupWorker(...handlers);

if (typeof window !== 'undefined') {
  (window as any).__setMockBehavior = setMockScenarioBehavior;
}

export async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    return;
  }
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

