import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App';
import { loadConfig } from './config';
import { enableMocking } from './mocks/browser';

async function bootstrap() {
  await enableMocking();
  await loadConfig();

  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

bootstrap();
