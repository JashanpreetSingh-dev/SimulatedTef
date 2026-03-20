import React from 'react';
import ReactDOM from 'react-dom/client';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
import App from './App';

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
