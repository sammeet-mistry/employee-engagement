import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getProfile } from './store/slices/authSlice';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ScenarioManagementPage from './pages/ScenarioManagementPage';
import ScenarioReviewQueuePage from './pages/ScenarioReviewQueuePage';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      dispatch(getProfile());
    }
  }, [dispatch, token, user]);

  if (loading && token) {
    return <LoadingSpinner />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
      <Routes location={location}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scenarios"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><ScenarioManagementPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/review-queue"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout><ScenarioReviewQueuePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;