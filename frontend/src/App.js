import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { WizardProvider } from './context/WizardContext';
import { AdminProvider } from './context/AdminContext';
import { CartProvider } from './context/CartContext';
import CollectionsIndexPage from './pages/store/CollectionsIndexPage';
import CollectionDetailPage from './pages/store/CollectionDetailPage';
import ShopProductDetailPage from './pages/store/ShopProductDetailPage';
import CartPage from './pages/store/CartPage';
import CheckoutSuccessPage from './pages/store/CheckoutSuccessPage';
import ProductsAdminPage from './pages/admin/ProductsAdminPage';
import CollectionsAdminPage from './pages/admin/CollectionsAdminPage';
import MenuBuilderPage from './pages/admin/MenuBuilderPage';
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
import ShowcasePage from './pages/admin/ShowcasePage';
import ProjectsAdminPage from './pages/admin/ProjectsAdminPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CutsPage from './pages/CutsPage';
import ProjectsIndexPage from './pages/ProjectsIndexPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ContactPage from './pages/ContactPage';
import BlogIndexPage from './pages/BlogIndexPage';
import BlogDetailPage from './pages/BlogDetailPage';
import BlogAdminPage from './pages/admin/BlogAdminPage';
import MessagesAdminPage from './pages/admin/MessagesAdminPage';
import PitchLoginPage from './pages/PitchLoginPage';
import PitchPage from './pages/PitchPage';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <CartProvider>
        <Routes>
          {/* Customer-facing routes */}
          <Route path="/" element={
            <WizardProvider>
              <WizardPage />
            </WizardProvider>
          } />
          <Route path="/thank-you" element={
            <WizardProvider>
              <WizardPage />
            </WizardProvider>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cuts" element={<CutsPage />} />
          <Route path="/projects" element={<ProjectsIndexPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          {/* Storefront / commerce routes */}
          <Route path="/collections" element={<CollectionsIndexPage />} />
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
          <Route path="/products/:slug" element={<ShopProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/pitch/login" element={<PitchLoginPage />} />
          <Route path="/pitch" element={<PitchPage />} />

          {/* Admin routes — all share same AdminProvider */}
          <Route path="/admin/*" element={
            <AdminProvider>
              <Routes>
                <Route path="login" element={<AdminLoginPage />} />
                <Route path="*" element={<AdminLayout />}>
                  <Route index element={<AnalyticsDashboard />} />
                  <Route path="leads" element={<LeadsCRM />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="projects" element={<ProjectsAdminPage />} />
                  <Route path="products" element={<ProductsAdminPage />} />
                  <Route path="collections" element={<CollectionsAdminPage />} />
                  <Route path="menu" element={<MenuBuilderPage />} />
                  <Route path="blog" element={<BlogAdminPage />} />
                  <Route path="messages" element={<MessagesAdminPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="tracking" element={<TrackingPage />} />
                  <Route path="showcase" element={<ShowcasePage />} />
                </Route>
              </Routes>
            </AdminProvider>
          } />
        </Routes>
        </CartProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
