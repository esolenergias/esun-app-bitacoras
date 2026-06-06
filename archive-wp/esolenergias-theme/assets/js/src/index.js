import React from 'react';
import ReactDOM from 'react-dom/client';
import Header from './Header';
import Calculator from './components/Calculator';

// Find the mount points for the React components
const heroRoot = document.getElementById('esol-header-root');
const calcRoot = document.getElementById('esol-calculator-root');

if (heroRoot) {
  const root = ReactDOM.createRoot(heroRoot);
  root.render(
    <React.StrictMode>
      <Header />
    </React.StrictMode>
  );
}

if (calcRoot) {
  const root = ReactDOM.createRoot(calcRoot);
  root.render(
    <React.StrictMode>
      <Calculator />
    </React.StrictMode>
  );
}
