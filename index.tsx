import React from 'react';
import ReactDOM from 'react-dom/client';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
import { analytics } from '@heycatch/sdk';
import App from './App';

analytics.init({
  projectKey: 'hck_pk_vqsEOmoqdUnwRUMxhby2rkoa3PxynZj5',
  install: {
    framework: 'vite-react',
    frameworkVersion: '19',
    agent: 'claude-code',
  },
});

const appId = import.meta.env.VITE_LOGROCKET_APP_ID;
if (appId) {
  LogRocket.init(appId);
  setupLogRocketReact(LogRocket);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
