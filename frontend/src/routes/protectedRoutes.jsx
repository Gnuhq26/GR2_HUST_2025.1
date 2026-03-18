import { FiHome, FiShoppingBag, FiGrid, FiPackage, FiShoppingCart, FiUsers, FiTruck, FiBarChart2, FiSettings, FiShield } from 'react-icons/fi';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Customers from '../pages/Customers';
import Suppliers from '../pages/Suppliers';
import Inventory from '../pages/Inventory';
import Orders from '../pages/Orders';
import Reports from '../pages/Reports';
import StoreSettings from '../pages/StoreSettings';
import StoreMembers from '../pages/StoreMembers';
import Roles from '../pages/Roles';

/**
 * Single source of truth for authenticated app routes.
 * This config is shared by both router and sidebar to avoid permission drift.
 */
export const protectedRoutes = [
  {
    path: '/',
    component: Dashboard,
    permission: null,
    menu: {
      group: 'main',
      label: 'Dashboard',
      icon: FiHome,
    },
  },
  {
    path: '/products',
    component: Products,
    permission: { action: 'read', subject: 'Product' },
    menu: {
      group: 'main',
      label: 'Sản phẩm',
      icon: FiShoppingBag,
    },
  },
  {
    path: '/categories',
    component: Categories,
    permission: { action: 'read', subject: 'Category' },
    menu: {
      group: 'main',
      label: 'Danh mục',
      icon: FiGrid,
    },
  },
  {
    path: '/inventory',
    component: Inventory,
    permission: { action: 'read', subject: 'Inventory' },
    menu: {
      group: 'main',
      label: 'Nhập kho',
      icon: FiPackage,
    },
  },
  {
    path: '/orders',
    component: Orders,
    permission: { action: 'read', subject: 'Order' },
    menu: {
      group: 'main',
      label: 'Đơn hàng',
      icon: FiShoppingCart,
    },
  },
  {
    path: '/customers',
    component: Customers,
    permission: { action: 'read', subject: 'Customer' },
    menu: {
      group: 'main',
      label: 'Khách hàng',
      icon: FiUsers,
    },
  },
  {
    path: '/suppliers',
    component: Suppliers,
    permission: { action: 'read', subject: 'Supplier' },
    menu: {
      group: 'main',
      label: 'Nhà cung cấp',
      icon: FiTruck,
    },
  },
  {
    path: '/reports',
    component: Reports,
    permission: { action: 'read', subject: 'Report' },
    menu: {
      group: 'main',
      label: 'Báo cáo',
      icon: FiBarChart2,
    },
  },
  {
    path: '/store/settings',
    component: StoreSettings,
    permission: { action: 'read', subject: 'Store' },
    menu: {
      group: 'store',
      label: 'Cài đặt',
      icon: FiSettings,
    },
  },
  {
    path: '/store/members',
    component: StoreMembers,
    permission: { action: 'read', subject: 'User' },
    menu: {
      group: 'store',
      label: 'Thành viên',
      icon: FiShield,
    },
  },
  {
    path: '/store/roles',
    component: Roles,
    permission: { action: 'read', subject: 'Role' },
    menu: {
      group: 'store',
      label: 'Vai trò',
      icon: FiShield,
    },
  },
];
