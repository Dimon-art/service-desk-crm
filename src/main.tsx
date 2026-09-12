import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import LandingView from './components/LandingView';
import PublicCreateRequest from './components/PublicCreateRequest';
import './index.css';

function shouldOpenPublicCreate() {
  return window.location.pathname === '/create-request';
}

function shouldOpenApp() {
  const params = new URLSearchParams(window.location.search);

  return Boolean(
    params.get('token') === 'manager' ||
    (params.get('requestId') && params.get('accessToken'))
  );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    {shouldOpenApp() ? <App /> : shouldOpenPublicCreate() ? <PublicCreateRequest /> : <LandingView />}
  </StrictMode>
);
