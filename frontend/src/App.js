import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WizardProvider } from './context/WizardContext';
import { AdminProvider } from './context/AdminContext';
import WizardPage from './pages/WizardPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import LeadsCRM from './pages/admin/LeadsCRM';
import OrdersPage from './pages/admin/OrdersPage';
import SettingsPage from './pages/admin/SettingsPage';
import TrackingPage from './pages/admin/TrackingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer-facing routes */}
        <Route path="/" element={
          <WizardProvider>
            <WizardPage />
          </WizardProvider>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Admin routes — all share same AdminProvider */}
        <Route path="/admin/*" element={
          <AdminProvider>
            <Routes>
              <Route path="login" element={<AdminLoginPage />} />
              <Route path="*" element={<AdminLayout />}>
                <Route index element={<AnalyticsDashboard />} />
                <Route path="leads" element={<LeadsCRM />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="tracking" element={<TrackingPage />} />
              </Route>
            </Routes>
          </AdminProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App;
