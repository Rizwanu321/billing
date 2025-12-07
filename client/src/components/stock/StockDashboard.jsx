// components/stock/StockDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Box,
  ShoppingCart,
  RefreshCw,
  Clock,
  TrendingDown,
  TrendingUp,
  Activity
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
  const [lastUpdated, setLastUpdated] = useState(new Date());

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
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const StatCard = ({ icon: Icon, title, value, change, trend, colorName, colorBg }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colorName}`} strokeWidth={2} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}>
            {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {typeof value === 'number' && title.toLowerCase().includes('value')
            ? currencyFormatter.format(value)
            : value}
        </h3>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white/50 backdrop-blur rounded-full"></div>
            </div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-8 py-4 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stock Overview</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1 justify-center sm:justify-start">
              <Clock size={14} /> Updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <button
            onClick={loadDashboardData}
            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Total Products"
            value={analytics.totalProducts}
            colorBg="bg-blue-50"
            colorName="text-blue-600"
          />
          <StatCard
            icon={ShoppingCart}
            title="Total Stock Value"
            value={analytics.totalValue}
            colorBg="bg-emerald-50"
            colorName="text-emerald-600"
          />
          <StatCard
            icon={AlertTriangle}
            title="Low Stock Items"
            value={analytics.lowStockCount}
            colorBg="bg-amber-50"
            colorName="text-amber-600"
          />
          <StatCard
            icon={Box}
            title="Out of Stock"
            value={analytics.outOfStockCount}
            colorBg="bg-rose-50"
            colorName="text-rose-600"
          />
        </div>

        {/* Charts Row */}
        {(analytics.stockByCategory.length > 0 || analytics.movementTrends.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {analytics.stockByCategory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StockValueChart data={analytics.stockByCategory} />
              </div>
            )}
            {analytics.movementTrends.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <StockMovementChart data={analytics.movementTrends} />
              </div>
            )}
          </div>
        )}

        {/* Widgets Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" /> Stock Health
              </h3>
            </div>
            <div className="p-0">
              <StockHealthCheck products={products} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> Low Stock Alerts
              </h3>
            </div>
            <div className="p-4">
              <LowStockWidget products={products} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw size={18} className="text-emerald-500" /> Recent Movements
              </h3>
            </div>
            <div className="p-4">
              <RecentMovementsWidget movements={analytics.recentMovements} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;