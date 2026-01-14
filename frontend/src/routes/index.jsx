import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Customers from '../pages/Customers';
import Suppliers from '../pages/Suppliers';
import Inventory from '../pages/Inventory';
import Orders from '../pages/Orders';
import Reports from '../pages/Reports';
import MainLayout from '../layouts/MainLayout';
import useAuthStore from '../store/authStore';

export default function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected Routes with Layout */}
      <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      {/* Catch all - redirect to login or dashboard */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}/>
    </Routes>
  );
}
