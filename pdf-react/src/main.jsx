import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from './AuthPage';
import App from './App';


const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/app" element={<App />} />
      </Routes>
    </Router>
  </StrictMode>,
);