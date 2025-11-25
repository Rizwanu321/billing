// components/revenue/CategoryRevenue.jsx - Professional Redesign with Advanced Filters
import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Line,
  Area,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Clock,
  AlertCircle,
  Package,
  FileText,
  Download,
  Calendar,
  Filter,
  X,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Infinity,
  CheckCircle,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Percent,
  Info,
  RotateCcw,
  Wallet,
  Receipt,
  HandCoins,
} from "lucide-react";
import { fetchRevenueByCategory } from "../../api/revenue";
import toast, { Toaster } from "react-hot-toast";

const CategoryRevenue = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [totals, setTotals] = useState(null);
  const [summary, setSummary] = useState(null); // Enhanced summary for cards
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("pie"); // 'pie', 'bar', or 'trend'
  const [selectedCategories, setSelectedCategories] = useState([]); // For category filtering
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [timePeriod, setTimePeriod] = useState("month");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    return {
      startDate: formatDate(firstDayOfMonth),
      endDate: formatDate(today),
    };
  });

  const COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
  ];

  const TIME_PERIODS = [
    { label: "Today", value: "today", icon: Calendar },
    { label: "Week", value: "week", icon: Activity },
    { label: "Month", value: "month", icon: BarChart3 },
    { label: "Quarter", value: "quarter", icon: TrendingUp },
    { label: "Year", value: "year", icon: PieChartIcon },
    { label: "All Time", value: "all", icon: Infinity },
    { label: "Custom", value: "custom", icon: Filter },
  ];

  useEffect(() => {
    fetchCategoryData();
  }, [dateRange]);

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    const now = new Date();
    let startDate, endDate;
    now.setHours(0, 0, 0, 0);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    switch (period) {
      case "today":
        startDate = new Date(now);
        endDate = new Date(now);
        break;
      case "week":
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diffToMonday);
        endDate = new Date(now);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const quarterEndMonth = currentQuarter * 3 + 2;
        endDate = new Date(now.getFullYear(), quarterEndMonth + 1, 0);
        if (endDate > now) endDate = new Date(now);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        break;
      case "all":
        startDate = null;
        endDate = new Date(now);
        break;
      case "custom":
        return; // Don't change dates for custom
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
    }

    setDateRange({
      startDate: startDate ? formatDate(startDate) : "",
      endDate: formatDate(endDate),
    });
  };

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      const response = await fetchRevenueByCategory(dateRange);
      setCategoryData(response.categories || []);
      setTotals(response.totals || null);
      setSummary(response.summary || null); // Store enhanced summary
      // Initialize all categories as selected
      setSelectedCategories(response.categories?.map((cat) => cat._id) || []);
    } catch (error) {
      console.error("Error fetching category data:", error);
      toast.error("Failed to load category data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const exportToCSV = () => {
    const headers = [
      "Category",
      "Total Revenue",
      "Received",
      "Due",
      "Invoices",
      "Quantity",
      "Received %",
      "Due %",
    ];

    const csvData = filteredCategories.map((cat) => [
      cat.categoryName,
      cat.totalRevenue,
      cat.actualReceived,
      cat.dueAmount,
      cat.invoiceCount,
      cat.quantity,
      cat.receivedPercentage.toFixed(2),
      cat.duePercentage.toFixed(2),
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category-revenue-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("CSV exported successfully!");
  };

  const toggleAllCategories = () => {
    if (selectedCategories.length === categoryData.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categoryData.map((cat) => cat._id));
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filtered data based on selected categories
  const filteredCategories = useMemo(() => {
    return categoryData.filter((cat) => selectedCategories.includes(cat._id));
  }, [categoryData, selectedCategories]);

  // Compute totals for filtered categories
  const filteredTotals = useMemo(() => {
    if (!filteredCategories.length) return null;

    const totalRevenue = filteredCategories.reduce((sum, cat) => sum + (cat.totalRevenue || 0), 0);
    const actualReceived = filteredCategories.reduce((sum, cat) => sum + (cat.actualReceived || 0), 0);
    const dueAmount = filteredCategories.reduce((sum, cat) => sum + (cat.dueAmount || 0), 0);

    return {
      totalRevenue,
      actualReceived,
      dueAmount,
      totalInvoices: filteredCategories.reduce((sum, cat) => sum + (cat.invoiceCount || 0), 0),
      totalCategories: filteredCategories.length,
      receivedPercentage: totalRevenue > 0 ? ((actualReceived / totalRevenue) * 100).toFixed(2) : "0.00",
      duePercentage: totalRevenue > 0 ? ((dueAmount / totalRevenue) * 100).toFixed(2) : "0.00",
    };
  }, [filteredCategories]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="group relative bg-white rounded-2xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg ring-4 ring-white`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1 tracking-wide uppercase">
        {title}
      </h3>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">
            {data.categoryName}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Total:</span>{" "}
              {formatCurrency(data.totalRevenue)}
            </p>
            <p className="text-green-600">
              <span className="font-medium">Received:</span>{" "}
              {formatCurrency(data.actualReceived)}
            </p>
            {data.dueAmount > 0 && (
              <p className="text-orange-600">
                <span className="font-medium">Due:</span>{" "}
                {formatCurrency(data.dueAmount)}
              </p>
            )}
            <p className="text-gray-600">
              <span className="font-medium">Invoices:</span> {data.invoiceCount}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!filteredCategories.length) {
      return (
        <div className="h-[400px] flex items-center justify-center text-slate-500">
          <div className="text-center">
            <PieChartIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p>No categories selected</p>
          </div>
        </div>
      );
    }

    if (viewMode === "pie") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={filteredCategories}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ categoryName, receivedPercentage }) =>
                `${categoryName}: ${receivedPercentage.toFixed(0)}%`
              }
              outerRadius={window.innerWidth < 640 ? 80 : 120}
              fill="#8884d8"
              dataKey="totalRevenue"
            >
              {filteredCategories.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (viewMode === "bar") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={filteredCategories}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="categoryName"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
              tick={{ fill: '#64748b' }}
            />
            <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
            <Bar
              dataKey="actualReceived"
              fill="#10B981"
              name="Received"
              radius={[4, 4, 0, 0]}
            />
            <Bar dataKey="dueAmount" fill="#F59E0B" name="Due" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      // Trend view (Composed chart)
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={filteredCategories}
            margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="categoryName"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={11}
              tick={{ fill: '#64748b' }}
            />
            <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="totalRevenue"
              name="Total Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Bar dataKey="actualReceived" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="dueAmount"
              name="Due"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: "#f59e0b" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
  };

  if (loading && !categoryData.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading category data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px",
          },
          success: {
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                Revenue by Category
              </h1>
              <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
                Analyze revenue distribution with advanced filtering
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium text-slate-700"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? "Hide" : "Show"} Filters</span>
              </button>
              <button
                onClick={fetchCategoryData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md text-sm font-medium text-slate-700"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportToCSV}
                disabled={loading || filteredCategories.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mb-4">
            <div className="overflow-x-auto">
              <div className="flex sm:grid sm:grid-cols-7 gap-1 min-w-max sm:min-w-0">
                {TIME_PERIODS.map((period) => {
                  const Icon = period.icon;
                  const isSelected = timePeriod === period.value;
                  return (
                    <button
                      key={period.value}
                      onClick={() => handleTimePeriodChange(period.value)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap ${isSelected
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                      <span>{period.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100 mb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Custom Date Range */}
                {timePeriod === "custom" && (
                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Custom Date Range
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, startDate: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, endDate: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={fetchCategoryData}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                          {loading ? "Loading..." : "Apply"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Category Filter
                      <span className="text-xs font-normal text-slate-500">
                        ({selectedCategories.length} of {categoryData.length} selected)
                      </span>
                    </h3>
                    <button
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showCategoryFilter ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Show
                        </>
                      )}
                    </button>
                  </div>

                  {showCategoryFilter && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                        <button
                          onClick={toggleAllCategories}
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {selectedCategories.length === categoryData.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {categoryData.map((cat, index) => (
                          <label
                            key={cat._id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat._id)}
                              onChange={() => toggleCategory(cat._id)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {cat.categoryName}
                            </span>
                            <span className="ml-auto text-xs text-slate-500 font-medium">
                              {formatCurrency(cat.totalRevenue)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Indicator */}
          {(timePeriod !== "month" || selectedCategories.length !== categoryData.length) && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium flex-1">
                {timePeriod !== "month" && `Time: ${TIME_PERIODS.find(p => p.value === timePeriod)?.label}`}
                {timePeriod !== "month" && selectedCategories.length !== categoryData.length && " • "}
                {selectedCategories.length !== categoryData.length && `${selectedCategories.length} categories selected`}
              </span>
              <button
                onClick={() => {
                  handleTimePeriodChange("month");
                  setSelectedCategories(categoryData.map((cat) => cat._id));
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Summary Stats Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            <StatCard
              icon={Receipt}
              title="Net Revenue"
              value={formatCurrency(summary.netRevenue || 0)}
              subtitle={`Gross: ${formatCurrency(summary.totalRevenue || 0)}`}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Wallet}
              title="Total Collected"
              value={formatCurrency(summary.totalCollected || 0)}
              subtitle="Cash + Online + Due Payments"
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <StatCard
              icon={Clock}
              title="Due Sales"
              value={formatCurrency(summary.dueSales || 0)}
              subtitle="Sales on Credit"
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard
              icon={HandCoins}
              title="Due Payments"
              value={formatCurrency(summary.duePayments || 0)}
              subtitle={`${summary.paymentCount || 0} payments`}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <StatCard
              icon={FileText}
              title="Total Invoices"
              value={summary.invoiceCount || 0}
              subtitle={`Avg: ${formatCurrency((summary.totalRevenue || 0) / (summary.invoiceCount || 1))}/invoice`}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </div>
        )}

        {categoryData.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-100">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-medium mb-2">
              No category data available
            </p>
            <p className="text-slate-500 text-sm">
              Try adjusting your date range or add some products
            </p>
          </div>
        ) : (
          <>
            {/* View Mode Toggle */}
            <div className="flex justify-end mb-4">
              <div className="bg-white rounded-xl shadow-sm p-1 border border-slate-200 inline-flex">
                <button
                  onClick={() => setViewMode("pie")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "pie"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  Pie Chart
                </button>
                <button
                  onClick={() => setViewMode("bar")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "bar"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  Bar Chart
                </button>
                <button
                  onClick={() => setViewMode("trend")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "trend"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  Trend
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart Section */}
              <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-600" />
                  {viewMode === "pie"
                    ? "Revenue Distribution"
                    : viewMode === "bar"
                      ? "Revenue Comparison"
                      : "Revenue Trend"}
                </h3>
                {renderChart()}
              </div>

              {/* Category List */}
              <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Category Details
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <Info className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No categories selected</p>
                    </div>
                  ) : (
                    <>
                      {filteredCategories.map((category, index) => (
                        <div
                          key={category._id}
                          className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <h4 className="font-semibold text-slate-900">
                                {category.categoryName}
                              </h4>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Total Revenue</span>
                              <span className="font-semibold text-slate-900">
                                {formatCurrency(category.totalRevenue)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className=" text-green-600">Received</span>
                              <span className="font-semibold text-green-700">
                                {formatCurrency(category.actualReceived)}
                              </span>
                            </div>
                            {category.dueAmount > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-orange-600">Due</span>
                                <span className="font-semibold text-orange-700">
                                  {formatCurrency(category.dueAmount)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                              <span>{category.invoiceCount} invoices</span>
                              <span>{category.quantity.toFixed(2)} units</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredTotals && filteredCategories.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">Total Revenue</span>
                              <span className="text-lg font-bold text-slate-900">{formatCurrency(filteredTotals.totalRevenue)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-700">Actual Received</span>
                              <span className="text-lg font-bold text-green-800">{formatCurrency(summary?.totalCollected || filteredTotals.actualReceived)}</span>
                            </div>
                            {filteredTotals.dueAmount > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-orange-700">Pending Dues</span>
                                <span className="text-lg font-bold text-orange-800">{formatCurrency(filteredTotals.dueAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {filteredCategories.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-slate-100">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Category Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const topCategory = [...filteredCategories].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
                    return (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">Top Performer</h4>
                        </div>
                        <p className="text-lg font-bold text-green-800 mb-1">{topCategory.categoryName}</p>
                        <p className="text-sm text-green-700">{formatCurrency(topCategory.totalRevenue)} revenue</p>
                        <p className="text-xs text-green-600 mt-1">{topCategory.invoiceCount} invoices • {topCategory.quantity.toFixed(2)} units</p>
                      </div>
                    );
                  })()}

                  {(() => {
                    const bestPayment = [...filteredCategories].sort((a, b) => b.receivedPercentage - a.receivedPercentage)[0];
                    return (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Best Collection</h4>
                        </div>
                        <p className="text-lg font-bold text-blue-800 mb-1">{bestPayment.categoryName}</p>
                        <p className="text-sm text-blue-700">{bestPayment.receivedPercentage.toFixed(1)}% collected</p>
                        <p className="text-xs text-blue-600 mt-1">{formatCurrency(bestPayment.actualReceived)} received</p>
                      </div>
                    );
                  })()}

                  {(() => {
                    const highestDue = [...filteredCategories].sort((a, b) => b.dueAmount - a.dueAmount)[0];
                    return highestDue.dueAmount > 0 ? (
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <h4 className="font-semibold text-orange-900">Highest Pending</h4>
                        </div>
                        <p className="text-lg font-bold text-orange-800 mb-1">{highestDue.categoryName}</p>
                        <p className="text-sm text-orange-700">{formatCurrency(highestDue.dueAmount)} pending</p>
                        <p className="text-xs text-orange-600 mt-1">{highestDue.duePercentage.toFixed(1)}% of category revenue</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-900">Excellent!</h4>
                        </div>
                        <p className="text-sm text-green-700">No pending dues across selected categories</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default CategoryRevenue;
