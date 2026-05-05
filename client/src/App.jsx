import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from './modules/auth/authSlice';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth pages
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import OtpVerifyPage from './modules/auth/pages/OtpVerifyPage';
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';

// Public pages
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import NotificationsPage from './pages/NotificationsPage';

// Donor pages
import DonorDashboard from './modules/donor/pages/DonorDashboard';
import DonorProfile from './modules/donor/pages/DonorProfile';
import DonorRequests from './modules/donor/pages/DonorRequests';
import DonorHistoryPage from './modules/donor/pages/DonorHistoryPage';
import DonorBadgesPage from './modules/donor/pages/DonorBadgesPage';

// Requester pages
import CreateRequestPage from './modules/requester/pages/CreateRequestPage';
import RequestHistoryPage from './modules/requester/pages/RequestHistoryPage';

// Hospital pages
import HospitalDashboard from './modules/hospital/pages/HospitalDashboard';

// Admin pages
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import UsersPage from './modules/admin/pages/UsersPage';
import DonorsPage from './modules/admin/pages/DonorsPage';
import RequestsPage from './modules/admin/pages/RequestsPage';
import HospitalsPage from './modules/admin/pages/HospitalsPage';
import BroadcastPage from './modules/admin/pages/BroadcastPage';
import VerifyAccountPage from './modules/auth/pages/VerifyAccountPage';
import CompleteProfilePage from './modules/auth/pages/CompleteProfilePage';
import FeedbackPage from './modules/admin/pages/FeedbackPage';
import ReportsPage from './modules/admin/pages/ReportsPage';
import AuditLogsPage from './modules/admin/pages/AuditLogsPage';

// ─── Route Guards ─────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  // 1. Must be logged in
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // 2. Must have required role
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={`/${user?.role}/dashboard`} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  if (isAuthenticated && user) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth routes */}
        <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Auth Required Routes (Dashboard-access components) */}
        <Route path="/verify-account" element={
          <ProtectedRoute>
            <VerifyAccountPage />
          </ProtectedRoute>
        } />
        <Route path="/complete-profile" element={
          <ProtectedRoute>
            <CompleteProfilePage />
          </ProtectedRoute>
        } />

        {/* Donor routes */}
        <Route element={<ProtectedRoute allowedRoles={['donor']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/donor/requests" element={<DonorRequests />} />
          <Route path="/donor/profile" element={<DonorProfile />} />
          <Route path="/donor/history" element={<DonorHistoryPage />} />
          <Route path="/donor/badges" element={<DonorBadgesPage />} />
        </Route>

        {/* Requester routes */}
        <Route element={<ProtectedRoute allowedRoles={['requester']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/requester/dashboard" element={<RequestHistoryPage />} />
          <Route path="/requester/create-request" element={<CreateRequestPage />} />
          <Route path="/requester/tracking" element={<CreateRequestPage />} />
          <Route path="/requester/history" element={<RequestHistoryPage />} />
        </Route>

        {/* Hospital routes */}
        <Route element={<ProtectedRoute allowedRoles={['hospital']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
          <Route path="/hospital/approvals" element={<HospitalDashboard />} />
          <Route path="/hospital/inventory" element={<HospitalDashboard />} />
          <Route path="/hospital/bulk-request" element={<HospitalDashboard />} />
        </Route>

        {/* Admin routes — use AdminLayout (own sidebar) */}
        <Route element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/donors" element={<DonorsPage />} />
          <Route path="/admin/requests" element={<RequestsPage />} />
          <Route path="/admin/hospitals" element={<HospitalsPage />} />
          <Route path="/admin/broadcast" element={<BroadcastPage />} />
          <Route path="/admin/feedback" element={<FeedbackPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        </Route>

        {/* Shared protected routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<DonorProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
