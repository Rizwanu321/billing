// client/src/components/Dashboard.jsx - FULLY PROFESSIONAL VERSION

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  fetchDashboardData,
  exportDashboardData,
} from "../api/dashboard";
import {
  ArrowUp,
  ArrowDown,
  IndianRupee,
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar,
  Download,
  RefreshCw,
  X,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2
} from "lucide-react";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    revenueData: [],
    topProducts: [],
    stockAlerts: [],
    salesByCategory: [],
    recentTransactions: [],
    statistics: {
      revenue: { value: 0, change: 0, isPositive: true },
      customers: { value: 0, change: 0, isPositive: true },
      orders: { value: 0, change: 0, isPositive: true },
      alerts: { value: 0, change: 0, isPositive: true },
    },
  });

  const [timePeriod, setTimePeriod] = useState("month");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const timePeriods = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  useEffect(() => {
    loadDashboardData();
  }, [timePeriod, lowStockThreshold]);

  useEffect(() => {
    if (
      timePeriod === "custom" &&
      customDateRange.start &&
      customDateRange.end
    ) {
      loadDashboardData();
    }
  }, [customDateRange]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params =
        timePeriod === "custom" && customDateRange.start && customDateRange.end
          ? {
            period: timePeriod,
            startDate: customDateRange.start,
            endDate: customDateRange.end,
          }
          : { period: timePeriod };

      const data = await fetchDashboardData(params);

      setDashboardData({
        revenueData: data.revenueData || [],
        topProducts: data.topProducts || [],
        stockAlerts: data.stockAlerts || [],
        salesByCategory: data.salesByCategory || [],
        recentTransactions: data.recentTransactions || [],
        statistics: data.statistics || {
          revenue: { value: 0, change: 0, isPositive: true },
          customers: { value: 0, change: 0, isPositive: true },
          orders: { value: 0, change: 0, isPositive: true },
          alerts: { value: 0, change: 0, isPositive: true },
        },
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const COLORS = [
    "#6366f1", // Indigo 500
    "#10b981", // Emerald 500
    "#f59e0b", // Amber 500
    "#ef4444", // Red 500
    "#8b5cf6", // Violet 500
    "#ec4899", // Pink 500
  ];

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      toast.loading(`Exporting as ${format.toUpperCase()}...`, { id: "export" });
      await exportDashboardData(format, timePeriod);
      toast.success("Export successful!", { id: "export" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export dashboard data", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, isPositive, colorName, colorBg }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colorName}`} strokeWidth={2} />
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
          {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {change}%
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {typeof value === "number" && title.toLowerCase().includes("revenue")
            ? currencyFormatter.format(value)
            : value.toLocaleString()}
        </h3>
        <p className="text-xs text-slate-400 mt-2 font-medium">vs last period</p>
      </div>
    </div>
  );

  if (isLoading && !dashboardData.revenueData.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white/50 backdrop-blur rounded-full"></div>
            </div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Dashboard</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={loadDashboardData}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-8 py-4 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="text-center xl:text-left">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Business Overview</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1 justify-center xl:justify-start">
              <Clock size={14} /> Updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Time Period Filter */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center">
              <select
                value={timePeriod}
                onChange={(e) => {
                  setTimePeriod(e.target.value);
                  setShowCustomDate(e.target.value === "custom");
                }}
                className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer pr-8 pl-4 py-2"
              >
                {timePeriods.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Custom Date Picker */}
            {showCustomDate && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={() => setShowCustomDate(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>

            <div className="relative group">
              <button
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                <span>Export</span>
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 transform origin-top-right">
                <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> PDF Report
                </button>
                <div className="h-px bg-slate-50" />
                <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> CSV Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={IndianRupee}
            title="Total Revenue"
            value={dashboardData.statistics.revenue.value}
            change={dashboardData.statistics.revenue.change}
            isPositive={dashboardData.statistics.revenue.isPositive}
            colorBg="bg-blue-50"
            colorName="text-blue-600"
          />
          <StatCard
            icon={Users}
            title="Total Customers"
            value={dashboardData.statistics.customers.value}
            change={dashboardData.statistics.customers.change}
            isPositive={dashboardData.statistics.customers.isPositive}
            colorBg="bg-emerald-50"
            colorName="text-emerald-600"
          />
          <StatCard
            icon={ShoppingBag}
            title="Total Orders"
            value={dashboardData.statistics.orders.value}
            change={dashboardData.statistics.orders.change}
            isPositive={dashboardData.statistics.orders.isPositive}
            colorBg="bg-violet-50"
            colorName="text-violet-600"
          />
          <StatCard
            icon={AlertTriangle}
            title="Stock Alerts"
            value={dashboardData.statistics.alerts.value}
            change={dashboardData.statistics.alerts.change}
            isPositive={dashboardData.statistics.alerts.isPositive}
            colorBg="bg-amber-50"
            colorName="text-amber-600"
          />
        </div>

        {/* Charts Section - Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Revenue Analysis</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`flex items-center text-sm font-bold ${dashboardData.statistics.revenue.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                    {dashboardData.statistics.revenue.isPositive ? "+" : "-"}{dashboardData.statistics.revenue.change}%
                  </span>
                  <span className="text-sm text-slate-400 font-medium">vs last period</span>
                </div>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wide shadow-sm">
                {timePeriod === 'custom' ? 'Custom Range' : timePeriods.find(p => p.value === timePeriod)?.label}
              </div>
            </div>

            <div className="h-[350px] w-full">
              {dashboardData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      tickFormatter={(value) => `₹${value}`}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        padding: '12px 16px'
                      }}
                      itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                      formatter={(value) => [currencyFormatter.format(value), 'Revenue']}
                      cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <TrendingUp size={48} className="mb-4 opacity-20" />
                  <p>No revenue data for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Sales by Category */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Category Distribution</h3>

            <div className="h-[320px] w-full relative">
              {dashboardData.salesByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.salesByCategory}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {dashboardData.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '12px 16px'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 600, fontSize: '13px' }}
                        formatter={(val) => [`${val}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-2 mt-2 bg-white/95 backdrop-blur-sm p-2 border-t border-slate-50">
                    {dashboardData.salesByCategory.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate flex-1 font-semibold text-slate-600" title={cat.name}>{cat.name}</span>
                        <span className="text-slate-900 font-bold">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <PieChart size={48} className="mb-4 opacity-20" />
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section - Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800">Top Performers</h3>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                View All <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="h-[350px] w-full">
              {dashboardData.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.topProducts.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="sales" name="Sales Unit" radius={[0, 4, 4, 0]} barSize={28}>
                      {dashboardData.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">No product data</div>
              )}
            </div>
          </div>

          {/* Stock Alerts & Low Inventory */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 flex flex-col h-[480px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Inventory Status
                {dashboardData.stockAlerts.length > 0 && (
                  <span className="bg-rose-100 text-rose-600 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-200">
                    {dashboardData.stockAlerts.length} Alerts
                  </span>
                )}
              </h3>

              {/* Enhanced Threshold Input */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Alert Limit:</span>
                <div className="relative group">
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-center outline-none"
                  />
                  <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col -space-y-px">
                      <div className="text-[8px] text-slate-400">▲</div>
                      <div className="text-[8px] text-slate-400">▼</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {dashboardData.stockAlerts.length > 0 ? (
                dashboardData.stockAlerts.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-red-200 hover:bg-red-50/50 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${item.stock === 0 ? "bg-white text-rose-500 border border-rose-100" : "bg-white text-amber-500 border border-amber-100"
                        }`}>
                        <Package size={24} className={item.stock === 0 ? "animate-pulse" : ""} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate pr-4">{item.name}</h4>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">ID: {item._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-2xl font-bold tracking-tight ${item.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>
                        {item.stock}
                      </span>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                        {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-slate-800 font-bold mb-1">Inventory Healthy</h4>
                  <p className="text-slate-500 text-sm">All items are above the alert threshold</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
            <button className="text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg w-full sm:w-auto text-center">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-4 whitespace-nowrap">Invoice ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Items</th>
                  <th className="px-6 py-4 whitespace-nowrap">Total</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.recentTransactions.length > 0 ? (
                  dashboardData.recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 font-mono text-xs whitespace-nowrap">
                        {tx.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
                            {tx.customer ? tx.customer.charAt(0) : '?'}
                          </div>
                          {tx.customer}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                        {tx.items} <span className="text-slate-400 text-xs">items</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 whitespace-nowrap">
                        {currencyFormatter.format(tx.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${tx.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No recent transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
