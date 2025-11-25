// components/stock/StockDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { fetchProducts } from "../../api/products";
import { fetchStockAnalytics } from "../../api/stock";
import StockValueChart from "./charts/StockValueChart";
import StockMovementChart from "./charts/StockMovementChart";
import LowStockWidget from "./widgets/LowStockWidget";
import RecentMovementsWidget from "./widgets/RecentMovementsWidget";
import { toast } from "react-hot-toast";
import StockHealthCheck from "./widgets/StockHealthCheck";

const StockDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    recentMovements: [],
    stockByCategory: [],
    movementTrends: [],
  });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const productsData = await fetchProducts();
      setProducts(productsData);

      // Fetch analytics
      try {
        const analyticsData = await fetchStockAnalytics();
        setAnalytics(analyticsData);
      } catch (analyticsError) {
        console.error("Analytics error:", analyticsError);

        // If analytics fails, calculate from products data
        const calculatedAnalytics = {
          totalProducts: productsData.length,
          totalValue: productsData.reduce(
            (sum, p) => sum + p.stock * p.price,
            0
          ),
          lowStockCount: productsData.filter(
            (p) => p.isStockRequired && p.stock > 0 && p.stock <= 10
          ).length,
          outOfStockCount: productsData.filter(
            (p) => p.isStockRequired && p.stock === 0
          ).length,
          recentMovements: [],
          stockByCategory: [],
          movementTrends: [],
        };

        // Group by category
        const categoryGroups = {};
        productsData.forEach((product) => {
          const categoryName = product.category?.name || "Uncategorized";
          if (!categoryGroups[categoryName]) {
            categoryGroups[categoryName] = { name: categoryName, value: 0 };
          }
          categoryGroups[categoryName].value += product.stock * product.price;
        });

        calculatedAnalytics.stockByCategory = Object.values(categoryGroups);
        setAnalytics(calculatedAnalytics);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color} shadow-sm`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-600 line-clamp-2">{title}</h3>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              )}
              <span
                className={`text-xs sm:text-sm font-medium ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {change}%
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                  Stock Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                  Monitor and manage your inventory in real-time
                </p>
              </div>
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-medium"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <StatCard
            icon={Package}
            title="Total Products"
            value={analytics.totalProducts}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={ShoppingCart}
            title="Total Stock Value"
            value={`₹${analytics.totalValue.toFixed(2)}`}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            icon={AlertTriangle}
            title="Low Stock Items"
            value={analytics.lowStockCount}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <StatCard
            icon={Box}
            title="Out of Stock"
            value={analytics.outOfStockCount}
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>

        {/* Charts Row - Only show if data exists */}
        {(analytics.stockByCategory.length > 0 ||
          analytics.movementTrends.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {analytics.stockByCategory.length > 0 && (
              <div className="animate-fadeIn">
                <StockValueChart data={analytics.stockByCategory} />
              </div>
            )}
            {analytics.movementTrends.length > 0 && (
              <div className="animate-fadeIn">
                <StockMovementChart data={analytics.movementTrends} />
              </div>
            )}
          </div>
        )}

        {/* Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="animate-fadeIn">
            <StockHealthCheck products={products} />
          </div>
          <div className="animate-fadeIn">
            <LowStockWidget products={products} />
          </div>
          <div className="animate-fadeIn">
            <RecentMovementsWidget movements={analytics.recentMovements} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;