import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WizardProvider } from './context/WizardContext';
import WizardPage from './pages/WizardPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <WizardProvider>
            <WizardPage />
          </WizardProvider>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
