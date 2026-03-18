import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import NoStore from '../pages/NoStore';
import CreateStore from '../pages/CreateStore';
import SelectStore from '../pages/SelectStore';
import Forbidden from '../pages/Forbidden';
import MainLayout from '../layouts/MainLayout';
import PermissionRoute from '../components/PermissionRoute';
import { protectedRoutes } from './protectedRoutes';
import useAuthStore from '../store/authStore';

export default function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  const renderProtectedElement = (route) => {
    const Component = route.component;
    const element = <Component />;

    if (!route.permission) {
      return element;
    }

    return (
      <PermissionRoute
        action={route.permission.action}
        subject={route.permission.subject}
      >
        {element}
      </PermissionRoute>
    );
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* Multi-store Management (Auth Required) */}
      <Route path="/no-store" element={isAuthenticated ? <NoStore /> : <Navigate to="/login" replace />} />
      <Route path="/create-store" element={isAuthenticated ? <CreateStore /> : <Navigate to="/login" replace />} />
      <Route path="/select-store" element={isAuthenticated ? <SelectStore /> : <Navigate to="/login" replace />} />
      <Route path="/forbidden" element={isAuthenticated ? <Forbidden /> : <Navigate to="/login" replace />} />

      {/* Protected Routes with Layout */}
      <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={renderProtectedElement(route)}
          />
        ))}
      </Route>

      {/* Catch all - redirect to login or dashboard */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}/>
    </Routes>
  );
}
