// components/revenue/RevenueDashboard.jsx - FULLY PROFESSIONAL VERSION

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileText,
  Target,
  Download,
  CreditCard,
  Users,
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard as CardIcon,
  Clock,
  HandCoins,
  Zap,
  Filter,
  Eye,
  RotateCcw,
  Percent,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp as TrendIcon,
  X,
  Menu,
  Infinity,
} from "lucide-react";
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
  ComposedChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  fetchRevenueSummary,
  fetchPaymentsSummary,
  generateRevenuePDF,
} from "../../api/revenue";
import toast, { Toaster } from 'react-hot-toast';

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-6 max-w-[1600px] mx-auto">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-48 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>
    </div>

    {/* Net Revenue Analysis Skeleton (3 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={`net-${i}`} className="bg-white p-6 rounded-2xl border border-slate-100 h-48 flex flex-col justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-10 w-40 bg-slate-200 rounded"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>

    {/* Key Metrics Skeleton (3 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={`key-${i}`} className="bg-white p-6 rounded-2xl border border-slate-100 h-32 flex flex-col justify-center gap-3">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-8 w-32 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 h-96"></div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 h-96"></div>
    </div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
    <div className="bg-red-50 p-6 rounded-full mb-6 animate-in fade-in zoom-in duration-300">
      <AlertTriangle className="w-12 h-12 text-red-500" />
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">Failed to load dashboard</h3>
    <p className="text-slate-500 mb-8 max-w-md leading-relaxed">{error || "Something went wrong while fetching the data. Please try again."}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 font-medium group"
    >
      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
      <span>Try Again</span>
    </button>
  </div>
);

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [revenueType, setRevenueType] = useState("all");
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
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChart, setSelectedChart] = useState("trend");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const COLORS = {
    cash: "#10b981",
    online: "#3b82f6",
    card: "#8b5cf6",
    due: "#f59e0b",
  };

  const CHART_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  useEffect(() => {
    fetchAllData();
  }, [dateRange, revenueType, selectedPeriod]);

  const fetchAllData = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add minimum delay to prevent flickering and show loading state
      const minDelay = new Promise(resolve => setTimeout(resolve, 800));

      const [revenue, payments] = await Promise.all([
        fetchRevenueSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: selectedPeriod,
          revenueType,
        }),
        fetchPaymentsSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: selectedPeriod,
        }),
        minDelay // Ensure loading state is visible for at least 800ms
      ]);

      setRevenueData(revenue);
      setPaymentsData(payments);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      setError(err.message || "Failed to load revenue data");
      setLoading(false);
      toast.error("Failed to update dashboard");
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        period: selectedPeriod,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }).toString();

      const response = await fetch(`http://localhost:5000/api/revenue/export?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setShowPdfPreview(true);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let startDate, endDate;

    today.setHours(0, 0, 0, 0);

    switch (period) {
      case "today":
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case "week":
        // Get current week (Monday to Sunday)
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days; else go back (dayOfWeek - 1) days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - diffToMonday); // Set to Monday of current week
        endDate = new Date(today); // Today
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case "quarter":
        // Get current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        // Get the last day of the quarter
        const quarterEndMonth = currentQuarter * 3 + 2; // 2, 5, 8, 11
        endDate = new Date(today.getFullYear(), quarterEndMonth + 1, 0); // Last day of quarter
        // If we're still in the quarter, use today instead
        if (endDate > today) {
          endDate = new Date(today);
        }
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
      case "all":
        startDate = null;
        endDate = new Date(today);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
    }

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setDateRange({
      startDate: startDate ? formatDate(startDate) : "",
      endDate: formatDate(endDate),
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const enhancedMetrics = useMemo(() => {
    if (!revenueData || !paymentsData) return null;

    const totalRevenue = revenueData.summary.totalRevenue || 0;
    const actualReceived = revenueData.summary.actualReceivedRevenue || 0;
    const totalDue = revenueData.summary.totalDueRevenue || 0;
    const paymentsReceived = revenueData.summary.paymentsReceived || 0;

    // Calculate instant payments from new sales
    const instantPayments = actualReceived - paymentsReceived;

    // Get due sales amount from comprehensive breakdown (includes all dues, not just payment method = "due")
    const dueSalesAmount = revenueData.comprehensiveBreakdown?.sales.components.dueSales.amount || 0;

    // PERIOD-BASED: Due Sales - Dues Collected = Still Outstanding
    const totalOutstanding = revenueData.duesSummary.periodBased?.stillOutstanding || 0;

    // Instant Sales - Cash + Online + Card ONLY (excludes partial payments on due invoices)
    const instantSalesOnly = revenueData.comprehensiveBreakdown?.sales.components.instantSales.amount || 0;

    // Total money received at invoice time (includes partials on due invoices)
    const totalInitialCollection = instantPayments;

    // Returns
    const returns = revenueData.summary.returns || 0;
    const returnsCount = revenueData.summary.returnsCount || 0;
    const netRevenue = revenueData.summary.netRevenue || (totalRevenue - returns);

    return {
      totalRevenue, // Gross Revenue
      netRevenue,   // Net Revenue (Gross - Returns)
      returns,
      returnsCount,
      totalCollected: actualReceived,
      collectionRate:
        totalRevenue > 0
          ? ((actualReceived - paymentsReceived) / totalRevenue) * 100
          : 0,
      instantPaymentRate:
        totalRevenue > 0 ? (instantSalesOnly / totalRevenue) * 100 : 0,
      dueSalesRate:
        totalRevenue > 0 ? (dueSalesAmount / totalRevenue) * 100 : 0,
      averageTransactionValue: revenueData.summary.averageOrderValue || 0,
      paymentEfficiency: paymentsData.summary.efficiency || {
        duesClearanceRate: 0,
        creditAdditionRate: 0,
      },
      // PERIOD-BASED: Net Position = Still Outstanding
      netReceivables: revenueData.duesSummary.periodBased?.netReceivables || 0,
      instantPayments,
      dueSalesAmount,
      duePaymentsReceived: paymentsReceived,
      totalOutstanding,
      instantCollection: instantSalesOnly, // Cash + Online + Card ONLY
      totalInitialCollection, // All initial collection (for internal use)
      newSalesCollected: instantPayments,
      oldDuesCollected: paymentsReceived,
    };
  }, [revenueData, paymentsData]);

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: HandCoins,
      online: Smartphone,
      card: CardIcon,
      due: Clock,
    };
    return icons[method] || CreditCard;
  };

  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Cash",
      online: "Online",
      card: "Card",
      due: "Due Sale",
    };
    return labels[method] || method;
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color,
    info,
    onClick,
  }) => (
    <div
      className={`group relative bg-white rounded-2xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${onClick ? "cursor-pointer" : ""
        }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg ring-4 ring-white`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1 tracking-wide uppercase">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>
      {info && (
        <div className="mt-4 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-300" />
            <span className="line-clamp-1">{info}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm mb-2">
            {new Date(label).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !revenueData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  const PREDEFINED_RANGES = [
    { label: "Today", value: "today", icon: Calendar },
    { label: "Week", value: "week", icon: Activity },
    { label: "Month", value: "month", icon: BarChart3 },
    { label: "Quarter", value: "quarter", icon: TrendIcon },
    { label: "Year", value: "year", icon: PieChartIcon },
    { label: "All Time", value: "all", icon: Infinity },
    { label: "Custom", value: "custom", icon: Filter },
  ];

  const renderChart = () => {
    if (!revenueData || !revenueData.revenueByDate) return null;

    const data = revenueData.revenueByDate.map((rev) => {
      const payment = paymentsData.dailyPayments.find(
        (p) => p._id === rev._id
      );
      return {
        date: rev._id,
        revenue: rev.revenue,
        received: rev.actualReceived,
        due: rev.dueAmount,
        payments: payment?.totalPayments || 0,
        duesCleared: payment?.duesCleared || 0,
      };
    });

    if (selectedChart === "comparison") {
      return (
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          <Bar dataKey="revenue" name="Total Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="received" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      );
    }

    // Default: Trend (Composed Chart)
    return (
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(value) => new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
        <Area type="monotone" dataKey="revenue" name="Total Sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
        <Bar dataKey="received" name="Instant Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
        <Line type="monotone" dataKey="due" name="Outstanding" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }} />
      </ComposedChart>
    );
  };

  if (loading && !revenueData) {
    return (
      <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8 font-sans">
        <Toaster position="top-right" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8 font-sans">
        <Toaster position="top-right" />
        <ErrorDisplay error={error} onRetry={fetchAllData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              Revenue Dashboard
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
              Comprehensive analysis of your business performance
            </p>
          </div>

          <div className="flex flex-wrap gap-3">


            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md text-sm font-medium text-slate-700"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>



        {/* Period Selector */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
          <div className="overflow-x-auto">
            <div className="flex sm:grid sm:grid-cols-6 gap-1 min-w-max sm:min-w-0">
              {PREDEFINED_RANGES.map((range) => {
                const Icon = range.icon;
                const isSelected = selectedPeriod === range.value;
                return (
                  <button
                    key={range.value}
                    onClick={() =>
                      range.value !== "custom"
                        ? handlePeriodChange(range.value)
                        : setSelectedPeriod("custom")
                    }
                    className={`
                      flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap
                      ${isSelected
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{range.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom Date Range */}
        {selectedPeriod === "custom" && (
          <div className="mt-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAllData}
                  className="w-full px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {revenueData && paymentsData && enhancedMetrics && (
        <>
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Key Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={IndianRupee}
                title="Gross Revenue"
                value={formatCurrency(enhancedMetrics.totalRevenue)}
                subtitle="Total Sales Value"
                trend={parseFloat(revenueData?.growth?.percentage || 0)}
                color="bg-violet-500"
              />

              <StatCard
                icon={Target}
                title="Net Revenue"
                value={enhancedMetrics.netRevenue}
                subtitle="Gross - Returns"
                trend={parseFloat(revenueData?.growth?.percentage || 0)}
                color="bg-blue-500"
              />

              <StatCard
                icon={RotateCcw}
                title="Returns"
                value={enhancedMetrics.returns}
                subtitle={`${enhancedMetrics.returnsCount} items returned`}
                trend={0} // Returns trend not calculated yet
                color="bg-rose-500"
              />

              <StatCard
                icon={Wallet}
                title="Total Collected"
                value={enhancedMetrics.totalCollected}
                subtitle="Cash + Online + Due Payments"
                trend={parseFloat(paymentsData?.growth?.collection?.percentage || 0)}
                color="bg-emerald-500"
              />

              <StatCard
                icon={Zap}
                title="Instant Collection"
                value={enhancedMetrics.instantCollection}
                subtitle="Cash + Online + Card"
                trend={parseFloat(revenueData?.growth?.percentage || 0)} // Using revenue growth as proxy
                color="bg-indigo-500"
              />

              <StatCard
                icon={Clock}
                title="Due Sales"
                value={enhancedMetrics.dueSalesAmount}
                subtitle="Sales on Credit"
                trend={parseFloat(revenueData?.growth?.percentage || 0)}
                color="bg-orange-500"
              />

              <StatCard
                icon={HandCoins}
                title="Due Payments"
                value={enhancedMetrics.duePaymentsReceived}
                subtitle={`${paymentsData?.summary?.paymentCount || 0} payments`}
                trend={parseFloat(paymentsData?.growth?.duesCleared?.percentage || 0)}
                color="bg-teal-500"
              />

              {/* Credit Used StatCard Removed */}

              <StatCard
                icon={Target}
                title="Net Position"
                value={
                  enhancedMetrics.netReceivables > 0
                    ? `+${formatCurrency(enhancedMetrics.netReceivables)}`
                    : formatCurrency(enhancedMetrics.netReceivables)
                }
                subtitle={
                  enhancedMetrics.netReceivables > 0
                    ? "To Receive"
                    : enhancedMetrics.netReceivables < 0
                      ? "Advance Received"
                      : "Settled"
                }
                color={
                  enhancedMetrics.netReceivables > 0
                    ? "bg-orange-500"
                    : enhancedMetrics.netReceivables < 0
                      ? "bg-green-500"
                      : "bg-slate-500"
                }
                info={enhancedMetrics.netReceivables >= 0 ? "From Period Sales" : "Overpayment"}
              />
            </div>
          </div>

          {/* Net Revenue Analysis Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-indigo-600" />
                  Net Revenue Analysis
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Breakdown of Gross Revenue, Returns, and final Net Revenue
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-600">Return Rate:</span>
                <span className={`${enhancedMetrics.returns > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {((enhancedMetrics.returns / (enhancedMetrics.totalRevenue || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Gross Revenue */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Gross Revenue</div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(enhancedMetrics.totalRevenue)}
                </div>
                <div className="text-xs text-slate-400 mt-1">Total Invoiced Amount</div>
              </div>

              {/* Returns */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                <div className="text-sm text-rose-600 mb-1 flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4" /> Returns & Refunds
                </div>
                <div className="text-2xl font-bold text-rose-700">
                  -{formatCurrency(enhancedMetrics.returns)}
                </div>
                <div className="text-xs text-rose-500 mt-1">
                  {enhancedMetrics.returnsCount} items returned
                </div>
              </div>

              {/* Net Revenue */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="text-sm text-indigo-600 mb-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Net Revenue
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {formatCurrency(enhancedMetrics.netRevenue)}
                </div>
                <div className="text-xs text-indigo-500 mt-1">Actual Realized Revenue</div>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${100 - ((enhancedMetrics.returns / (enhancedMetrics.totalRevenue || 1)) * 100)}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${((enhancedMetrics.returns / (enhancedMetrics.totalRevenue || 1)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Net Revenue ({(100 - ((enhancedMetrics.returns / (enhancedMetrics.totalRevenue || 1)) * 100)).toFixed(1)}%)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                Returns ({((enhancedMetrics.returns / (enhancedMetrics.totalRevenue || 1)) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Collection Efficiency Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 mb-8">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                  <Percent className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    Collection Performance
                  </h3>
                  <p className="text-indigo-100 text-sm font-medium opacity-90">
                    Tracking your payment efficiency for this period
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-12">
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {enhancedMetrics.instantCollection}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">
                    Instant
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {enhancedMetrics.dueSalesAmount}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">Due Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {enhancedMetrics.duePaymentsReceived}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">Collected</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {(() => {
                      const value = revenueData.duesSummary.periodBased?.stillOutstanding || 0;
                      if (value > 0) return `+${formatCurrency(value)}`;
                      if (value < 0) return formatCurrency(value);
                      return formatCurrency(0);
                    })()}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">
                    {(() => {
                      const value = revenueData.duesSummary.periodBased?.stillOutstanding || 0;
                      if (value > 0) return "Outstanding";
                      if (value < 0) return "Overpaid";
                      return "Settled";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COMPREHENSIVE REVENUE BREAKDOWN - Professional & User-Friendly */}
          {revenueData.comprehensiveBreakdown && (
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Breakdown Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Sales Breakdown
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    {revenueData.comprehensiveBreakdown.sales.count} invoices
                  </span>
                </div>

                <div className="mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium mb-1">Total Sales (Period)</p>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(revenueData.comprehensiveBreakdown.sales.total)}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Instant Sales */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-emerald-900">Instant Sales</h3>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {revenueData.comprehensiveBreakdown.sales.components.instantSales.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 mb-1">
                      {formatCurrency(revenueData.comprehensiveBreakdown.sales.components.instantSales.amount)}
                    </p>
                    <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-3">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${revenueData.comprehensiveBreakdown.sales.components.instantSales.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Sales */}
                  <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-semibold text-orange-900">Due Sales</h3>
                      </div>
                      <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        {revenueData.comprehensiveBreakdown.sales.components.dueSales.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700 mb-1">
                      {formatCurrency(revenueData.comprehensiveBreakdown.sales.components.dueSales.amount)}
                    </p>
                    <div className="w-full bg-orange-100 rounded-full h-1.5 mt-3 mb-3">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${revenueData.comprehensiveBreakdown.sales.components.dueSales.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-orange-100">
                      <span className="text-slate-500">Collected: <span className="font-medium text-emerald-600">{formatCurrency(revenueData.comprehensiveBreakdown.sales.components.dueSales.collectedSoFar)}</span></span>
                      <span className="text-slate-500">Outstanding: <span className="font-medium text-orange-600">{formatCurrency(revenueData.comprehensiveBreakdown.sales.components.dueSales.currentOutstanding)}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Money Collection Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Money Collection
                  </h2>
                </div>

                <div className="mb-6 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Total Money In (Period)</p>
                  <p className="text-3xl font-bold text-emerald-900 tracking-tight">
                    {formatCurrency(revenueData.comprehensiveBreakdown.collection.totalMoneyIn)}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Instant Collection */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Instant Collection</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(revenueData.comprehensiveBreakdown.collection.components.instantCollection.amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        {revenueData.comprehensiveBreakdown.collection.components.instantCollection.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Due Payments */}
                  {revenueData.comprehensiveBreakdown.collection.components.duePayments && (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Due Payments</p>
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(revenueData.comprehensiveBreakdown.collection.components.duePayments.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                          {revenueData.comprehensiveBreakdown.collection.components.duePayments.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics Mini-Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Collection Rate</p>
                      <p className={`text-lg font-bold ${revenueData.comprehensiveBreakdown.performance.collectionRate >= 80 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {revenueData.comprehensiveBreakdown.performance.collectionRate.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">Dues Recovery</p>
                      <p className="text-lg font-bold text-blue-600">
                        {revenueData.comprehensiveBreakdown.performance.duesCollectionEfficiency.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUE & CREDIT MANAGEMENT SECTION */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Due Management
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* DUE MANAGEMENT PANEL */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-900">Dues Management</h3>
                    <p className="text-sm text-orange-700/80 font-medium">Money you need to receive from customers</p>
                  </div>
                </div>

                {/* What are Dues? */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-100">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">What are Dues?</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Dues represent sales made on credit where customers haven't paid yet.
                        This is money you will receive in the future when customers make payments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dues Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Total Due Sales (Period) */}
                  <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">Due Sales (Period)</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(revenueData.duesSummary.periodBased.creditSales || 0)}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {revenueData.duesSummary.periodBased.invoicesWithDue || 0} invoices
                    </p>
                  </div>

                  {/* Dues Collected (Period) */}
                  <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Dues Collected (Period)</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(revenueData.duesSummary.periodBased.duesCollected || 0)}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {paymentsData?.summary?.paymentCount || 0} payments
                    </p>
                  </div>

                  {/* Still Outstanding (Period) */}
                  <div className="bg-white rounded-xl p-5 border border-red-100 shadow-sm">
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-2">Still Outstanding</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(revenueData.duesSummary.periodBased.stillOutstanding || 0)}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      Yet to receive
                    </p>
                  </div>
                </div>

                {/* Collection Efficiency Bar */}
                <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-slate-700">Collection Efficiency</p>
                    <p className="text-lg font-bold text-slate-900">
                      {revenueData.duesSummary.periodBased.creditSales > 0
                        ? ((revenueData.duesSummary.periodBased.duesCollected / revenueData.duesSummary.periodBased.creditSales) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${revenueData.duesSummary.periodBased.creditSales > 0
                          ? Math.min(100, (revenueData.duesSummary.periodBased.duesCollected / revenueData.duesSummary.periodBased.creditSales) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Percentage of due sales collected in this period
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts Section - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Payment Methods Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Methods
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {revenueData.paymentBreakdown.length} types
                </span>
              </div>

              {/* Payment Method Cards */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {revenueData.paymentBreakdown.map((method) => {
                  const Icon = getPaymentMethodIcon(method._id);
                  const percentage =
                    method.total > 0
                      ? revenueData.summary.totalRevenue > 0
                        ? (method.total / revenueData.summary.totalRevenue) *
                        100
                        : 0
                      : 0;

                  // Get the current outstanding for this payment method
                  const stillPending = method.currentDue || 0;

                  return (
                    <div
                      key={method._id}
                      className="group p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                      style={{
                        borderColor: `${COLORS[method._id] || "#94a3b8"}30`,
                        backgroundColor: `${COLORS[method._id] || "#94a3b8"}05`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2.5 rounded-lg shadow-sm"
                            style={{
                              backgroundColor: COLORS[method._id] || "#94a3b8",
                            }}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {getPaymentMethodLabel(method._id)}
                              {method.isOutstandingOnly && (
                                <span className="ml-2 text-xs text-orange-600 font-normal">
                                  (Old Dues)
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {method.count > 0
                                ? `${method.count} transactions`
                                : method.paymentsReceived > 0
                                  ? "Payments on old dues"
                                  : "No activity"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {method.total > 0 ? (
                            <p
                              className="text-xl font-bold"
                              style={{ color: COLORS[method._id] || "#64748b" }}
                            >
                              {percentage.toFixed(1)}%
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400">N/A</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {method.total > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-xs">Total Sales</span>
                            <span className="font-bold text-slate-900">
                              {method.total}
                            </span>
                          </div>
                        )}
                        {method.paymentsReceived > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-xs">
                              Payments Received
                            </span>
                            <span className="font-bold text-emerald-600">
                              {method.paymentsReceived}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 text-xs">Total Collected</span>
                          <span className="font-bold text-emerald-600">
                            {method.actualReceived || 0}
                          </span>
                        </div>
                        {stillPending > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                            <span className="text-slate-600 text-xs font-medium">
                              {method._id === "due"
                                ? "Total Outstanding"
                                : "Still Pending"}
                            </span>
                            <span className="font-bold text-orange-600">
                              {stillPending}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {method.total > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor:
                                  COLORS[method._id] || "#94a3b8",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue Trends Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Revenue Trends
                </h3>
                <select
                  value={selectedChart}
                  onChange={(e) => setSelectedChart(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="trend">Trend</option>
                  <option value="comparison">Comparison</option>
                </select>
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Paying Customers - Mobile Optimized */}
          {paymentsData.topPayingCustomers &&
            paymentsData.topPayingCustomers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Top Paying Customers
                </h3>

                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Total Paid
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Transactions
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Last Payment
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {paymentsData.topPayingCustomers.map((customer, idx) => (
                            <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
                                    {idx + 1}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-bold text-slate-900">
                                      {customer.customerName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {customer.customerPhone || "No phone"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm font-bold text-slate-900">
                                  {formatCurrency(customer.totalPaid)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-slate-600 font-medium">
                                  {customer.paymentCount}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="text-sm text-slate-500">
                                  {/* We don't have lastPayment date in the aggregation, so we'll omit or use a placeholder if needed, but for now I'll just show 'Recent' or remove the column content if data missing */}
                                  Recent
                                </div>
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

          {/* Insights & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Key Insights */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-indigo-100 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Key Insights
              </h3>
              <div className="space-y-4">
                {/* Revenue Growth Insight */}
                <div className="flex gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                  <div className={`p-3 rounded-xl h-fit ${revenueData.summary.growth >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {revenueData.summary.growth >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Revenue Trajectory</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Revenue is <span className={`font-bold ${revenueData.summary.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {revenueData.summary.growth >= 0 ? 'up' : 'down'} by {Math.abs(revenueData.summary.growth).toFixed(1)}%
                      </span> compared to the previous period.
                      {revenueData.summary.growth >= 0
                        ? " Great job! Keep up the momentum."
                        : " Consider running a promotion to boost sales."}
                    </p>
                  </div>
                </div>

                {/* Collection Efficiency Insight */}
                {revenueData.comprehensiveBreakdown && (
                  <div className="flex gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                    <div className="p-3 rounded-xl h-fit bg-blue-100 text-blue-600">
                      <HandCoins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">Collection Efficiency</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        You've collected <span className="font-bold text-blue-600">{revenueData.comprehensiveBreakdown.performance.collectionRate.toFixed(1)}%</span> of the total revenue generated in this period.
                        {revenueData.comprehensiveBreakdown.performance.collectionRate < 80
                          ? " Focus on following up with customers who have outstanding dues."
                          : " Your collection process is working well."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recommended Actions
              </h3>
              <div className="space-y-4">
                {revenueData.duesSummary.periodBased.stillOutstanding > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Follow up on Dues</h4>
                        <p className="text-xs text-slate-500">Recover {formatCurrency(revenueData.duesSummary.periodBased.stillOutstanding)} pending</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Analyze Top Sellers</h4>
                      <p className="text-xs text-slate-500">Review your best performing items</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {
        !loading && !revenueData && (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <IndianRupee className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Revenue Data
              </h3>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                There's no revenue data available for the selected period.
              </p>
              <button
                onClick={fetchAllData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        )
      }

      {/* Loading Overlay */}
      {
        loading && revenueData && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600">Updating revenue data...</p>
            </div>
          </div>
        )
      }

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }

        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Horizontal scroll for mobile */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        /* Animation for fade in */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .recharts-surface {
            font-size: 10px;
          }
          .recharts-cartesian-axis-tick {
            font-size: 9px;
          }
          .recharts-legend-wrapper {
            font-size: 10px;
          }
        }

        /* Ensure touch targets are at least 44x44 on mobile */
        @media (max-width: 640px) {
          button {
            min-height: 44px;
          }
        }

        /* Better contrast for small text */
        .text-xs {
          letter-spacing: 0.025em;
        }

        /* Improve tap targets on mobile */
        @media (pointer: coarse) {
          .group {
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueDashboard;
