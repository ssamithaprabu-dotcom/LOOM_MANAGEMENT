import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LoomProvider } from './context/LoomContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LoomProvider>
        <App />
      </LoomProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
