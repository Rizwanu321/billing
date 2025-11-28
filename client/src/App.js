// client/src/App.jsx - UPDATED (Remove dashboard sub-routes)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyOTP from "./components/auth/VerifyOTP";
import ResetPassword from "./components/auth/ResetPassword";
import Layout from "./components/Layout";
import AdminUserManagement from "./components/Admin/AdminUserManagement";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./components/Admin/AdminDashboard";
import CustomerForm from "./components/CustomerForm";
import CustomerList from "./components/CustomerList";
import CustomerTransactionsPage from "./components/CustomerTransactionsPage";
import SettingsPage from "./components/SettingsPage";
import InvoicePage from "./components/invoicePage/InvoicePage";
import BillingList from "./components/billingList/BillingList";
import Products from "./components/products/Products";
import Categories from "./components/categories/Categories";
import ProfilePage from "./components/profile/ProfilePage";

// Stock Management Components
import StockManagementDashboard from "./components/stock/StockDashboard";
import StockMovements from "./components/stock/StockMovements";
import StockAlerts from "./components/stock/StockAlerts";
import StockReports from "./components/stock/StockReports";
import StockAdjustment from "./components/stock/StockAdjustment";
import "./App.css";

// Revenue Components
import {
  RevenueDashboard,
  RevenueTransactions,
  CategoryRevenue,
  RevenueAnalytics,
  RevenueComparison,
  RevenueByProducts,
  ProductReturns,
} from "./components/revenue";
import CustomerStats from "./components/CustomerStats";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '500px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              style: {
                background: '#ffffff',
                color: '#10B981',
                border: '1px solid #E5E7EB',
              },
              iconTheme: {
                primary: '#10B981',
                secondary: '#ffffff',
              },
            },
            error: {
              style: {
                background: '#ffffff',
                color: '#EF4444',
                border: '1px solid #E5E7EB',
              },
              iconTheme: {
                primary: '#EF4444',
                secondary: '#ffffff',
              },
            },
            loading: {
              style: {
                background: '#ffffff',
                color: '#3B82F6',
                border: '1px solid #E5E7EB',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Single Dashboard Route - No submenu */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/invoices" element={<InvoicePage />} />
            <Route path="/billinglist" element={<BillingList />} />
            <Route path="/customers/new" element={<CustomerForm />} />
            <Route path="/customers/list" element={<CustomerList />} />
            <Route path="/customers/stats" element={<CustomerStats />} />
            <Route path="/categories" element={<Categories />} />
            <Route
              path="customers/:customerId/transactions"
              element={<CustomerTransactionsPage />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Stock Management Routes */}
            <Route
              path="/stock"
              element={<Navigate to="/stock/dashboard" replace />}
            />
            <Route
              path="/stock/dashboard"
              element={<StockManagementDashboard />}
            />
            <Route path="/stock/movements" element={<StockMovements />} />
            <Route path="/stock/alerts" element={<StockAlerts />} />
            <Route path="/stock/reports" element={<StockReports />} />
            <Route path="/stock/adjustment" element={<StockAdjustment />} />
            {/* Revenue Routes */}
            <Route
              path="/revenue"
              element={<Navigate to="/revenue/dashboard" replace />}
            />
            <Route path="/revenue/dashboard" element={<RevenueDashboard />} />
            <Route
              path="/revenue/transactions"
              element={<RevenueTransactions />}
            />
            <Route path="/revenue/by-category" element={<CategoryRevenue />} />
            <Route path="/revenue/analytics" element={<RevenueAnalytics />} />
            <Route path="/revenue/comparison" element={<RevenueComparison />} />
            <Route
              path="/revenue/by-products"
              element={<RevenueByProducts />}
            />
            <Route path="/revenue/returns" element={<ProductReturns />} />
          </Route>

          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
