import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { ApplicationsListPage } from './pages/ApplicationsListPage';
import { ApplicationWizardPage } from './pages/ApplicationWizardPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { InstitutionProfilePage } from './pages/InstitutionProfilePage';
import { ReviewerDashboard } from './pages/ReviewerDashboard';
import { ApprovingAuthorityPage } from './pages/ApprovingAuthorityPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RulesManagementPage } from './pages/RulesManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';

const ProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Portal Routes */}
          <Route element={<ProtectedLayout />}>
            {/* Institution Routes */}
            <Route path="/dashboard" element={<InstitutionDashboard />} />
            <Route path="/applications" element={<ApplicationsListPage />} />
            <Route path="/applications/new" element={<ApplicationWizardPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/institution/profile" element={<InstitutionProfilePage />} />

            {/* Reviewer Routes */}
            <Route path="/reviewer" element={<ReviewerDashboard />} />

            {/* Approving Authority Routes */}
            <Route path="/approvals" element={<ApprovingAuthorityPage />} />

            {/* Admin & Audit Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/applications" element={<ApplicationsListPage />} />
            <Route path="/admin/rules" element={<RulesManagementPage />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />

            {/* Common Notification Center */}
            <Route path="/notifications" element={<NotificationCenterPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
