// src/main.jsx (Reverted)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// Removed: import CssBaseline from '@mui/material/CssBaseline';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* Removed: <CssBaseline /> */}
    <App />
  </React.StrictMode>
);