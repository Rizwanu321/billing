// client/src/components/Dashboard.jsx - COMPLETE FIX FOR OVERFLOW ISSUES
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  fetchDashboardData,
  fetchStockAlerts,
  fetchSalesAnalytics,
  fetchCustomerStats,
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
  });

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    isPositive,
    color,
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-words">
            {typeof value === "number" &&
            title.toLowerCase().includes("revenue")
              ? currencyFormatter.format(value)
              : value.toLocaleString()}
          </h3>
          <div
            className={`flex items-center text-xs sm:text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUp size={14} className="flex-shrink-0" />
            ) : (
              <ArrowDown size={14} className="flex-shrink-0" />
            )}
            <span className="font-medium ml-1">{change}%</span>
            <span className="text-gray-500 ml-2 hidden sm:inline">
              vs last period
            </span>
          </div>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} flex-shrink-0`}>
          <Icon size={20} className="text-white sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );

  // Custom label for pie chart to prevent overflow
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const exportData = (format) => {
    console.log(`Exporting dashboard data as ${format}`);
  };

  if (isLoading && !dashboardData.revenueData.length) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <AlertTriangle size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Time Period Selector */}
              <div className="relative flex-1 sm:flex-initial min-w-[140px]">
                <select
                  value={timePeriod}
                  onChange={(e) => {
                    setTimePeriod(e.target.value);
                    if (e.target.value === "custom") {
                      setShowCustomDate(true);
                    } else {
                      setShowCustomDate(false);
                    }
                  }}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {timePeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
                <Calendar
                  size={14}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadDashboardData}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline text-sm font-medium">
                  Refresh
                </span>
              </button>

              {/* Export Button */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={16} />
                  <span className="hidden sm:inline text-sm font-medium">
                    Export
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportData("pdf")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => exportData("csv")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomDate && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Custom Date Range
                </h3>
                <button
                  onClick={() => {
                    setShowCustomDate(false);
                    setTimePeriod("month");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) =>
                      setCustomDateRange({
                        ...customDateRange,
                        start: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) =>
                      setCustomDateRange({
                        ...customDateRange,
                        end: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={IndianRupee}
            title="Total Revenue"
            value={dashboardData.statistics.revenue.value}
            change={dashboardData.statistics.revenue.change}
            isPositive={dashboardData.statistics.revenue.isPositive}
            color="bg-blue-500"
          />
          <StatCard
            icon={Users}
            title="Total Customers"
            value={dashboardData.statistics.customers.value}
            change={dashboardData.statistics.customers.change}
            isPositive={dashboardData.statistics.customers.isPositive}
            color="bg-green-500"
          />
          <StatCard
            icon={ShoppingBag}
            title="Total Orders"
            value={dashboardData.statistics.orders.value}
            change={dashboardData.statistics.orders.change}
            isPositive={dashboardData.statistics.orders.isPositive}
            color="bg-purple-500"
          />
          <StatCard
            icon={AlertTriangle}
            title="Stock Alerts"
            value={dashboardData.statistics.alerts.value}
            change={dashboardData.statistics.alerts.change}
            isPositive={dashboardData.statistics.alerts.isPositive}
            color="bg-amber-500"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Revenue Trend
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                  {timePeriod === "custom"
                    ? "Custom period"
                    : timePeriods.find((p) => p.value === timePeriod)?.label}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <TrendingUp className="text-green-500" size={18} />
                <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                  +{dashboardData.statistics.revenue.change}%
                </span>
              </div>
            </div>
            <div className="h-64 sm:h-80 w-full">
              {dashboardData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.revenueData}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value}`}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value) => [
                        currencyFormatter.format(value),
                        "Revenue",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No revenue data available
                </div>
              )}
            </div>
          </div>

          {/* Sales by Category */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 truncate">
              Sales by Category
            </h2>
            <div className="flex flex-col h-[400px] sm:h-[450px]">
              {dashboardData.salesByCategory?.length > 0 ? (
                <>
                  {/* Pie Chart Container */}
                  <div className="flex-shrink-0 h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.salesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dashboardData.salesByCategory.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend Container with Scroll */}
                  <div className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2 pr-2">
                      {dashboardData.salesByCategory.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs sm:text-sm py-1"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <span
                              className="text-gray-700 truncate"
                              title={category.name}
                            >
                              {category.name}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 flex-shrink-0">
                            {category.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No category data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Top Selling Products
              </h2>
              <Package className="text-blue-500 flex-shrink-0" size={20} />
            </div>
            <div className="h-64 sm:h-80 w-full overflow-hidden">
              {dashboardData.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.topProducts.slice(0, 8)}
                    margin={{ top: 10, right: 10, left: 0, bottom: 80 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="sales"
                      fill="#3B82F6"
                      radius={[6, 6, 0, 0]}
                      name="Units Sold"
                    >
                      {dashboardData.topProducts
                        .slice(0, 8)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No product data available
                </div>
              )}
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Stock Alerts
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                  Threshold:
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                  className="w-14 sm:w-16 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto custom-scrollbar">
              {dashboardData.stockAlerts.length > 0 ? (
                dashboardData.stockAlerts.map((item) => (
                  <div
                    key={item._id}
                    className={`p-3 sm:p-4 rounded-lg transition-all duration-200 ${
                      item.stock === 0
                        ? "bg-red-50 border border-red-200 hover:bg-red-100"
                        : item.stock <= 5
                        ? "bg-orange-50 border border-orange-200 hover:bg-orange-100"
                        : "bg-amber-50 border border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-sm sm:text-base text-gray-900 truncate"
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                        <div className="flex items-center mt-1 flex-wrap gap-2">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              item.stock === 0
                                ? "text-red-600"
                                : item.stock <= 5
                                ? "text-orange-600"
                                : "text-amber-600"
                            }`}
                          >
                            Stock: {item.stock}
                          </span>
                          {item.stock === 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full whitespace-nowrap">
                              OUT OF STOCK
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                          item.stock === 0
                            ? "bg-red-200 text-red-600"
                            : item.stock <= 5
                            ? "bg-orange-200 text-orange-600"
                            : "bg-amber-200 text-amber-600"
                        }`}
                      >
                        <AlertTriangle size={16} className="sm:w-5 sm:h-5" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    All products are well-stocked!
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    No alerts at this time
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {dashboardData.recentTransactions?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Recent Transactions
              </h2>
              <button className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 text-left sm:text-right">
                View All
              </button>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {dashboardData.recentTransactions
                .slice(0, 10)
                .map((transaction, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.customer}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          transaction.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "final"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        {transaction.items} items
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {currencyFormatter.format(transaction.total)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-3 lg:px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 lg:px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.recentTransactions
                        .slice(0, 10)
                        .map((transaction, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 lg:px-4 py-3 text-xs sm:text-sm text-gray-900">
                              <div
                                className="max-w-[150px] md:max-w-[200px] truncate"
                                title={transaction.customer}
                              >
                                {transaction.customer}
                              </div>
                            </td>
                            <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                              {transaction.items} items
                            </td>
                            <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 text-right">
                              {currencyFormatter.format(transaction.total)}
                            </td>
                            <td className="px-3 lg:px-4 py-3 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "final"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
