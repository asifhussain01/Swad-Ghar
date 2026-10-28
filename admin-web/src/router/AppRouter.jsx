import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RestaurantsPage from '../pages/RestaurantsPage';
import CustomersPage from '../pages/CustomersPage';
import OrdersPage from '../pages/OrdersPage';
import CODMonitoringPage from '../pages/CODMonitoringPage';
import ComplaintsPage from '../pages/ComplaintsPage';
import AuditLogsPage from '../pages/AuditLogsPage';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Authenticating SwadGhar session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Admin Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/cod-monitor" element={<CODMonitoringPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
