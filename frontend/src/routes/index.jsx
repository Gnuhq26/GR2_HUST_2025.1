import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import useAuthStore from '../store/authStore';

export default function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected Routes */}
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}/>

      {/* Catch all - redirect to login or dashboard */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}/>
    </Routes>
  );
}
