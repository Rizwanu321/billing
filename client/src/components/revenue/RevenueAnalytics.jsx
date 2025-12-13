// components/revenue/RevenueAnalytics.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Clock,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  DollarSign,
  Package,
  CreditCard,
  Percent,
  Target,
  Activity,
  Zap,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from "recharts";
import { fetchRevenueAnalytics } from "../../api/revenue";

const RevenueAnalytics = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
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

  const COLORS = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    pink: "#ec4899",
    indigo: "#6366f1",
    teal: "#14b8a6",
  };

  const CHART_COLORS = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.purple,
    COLORS.pink,
    COLORS.indigo,
    COLORS.teal,
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchRevenueAnalytics({
        period: selectedPeriod,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (period === "custom") {
      setShowCustomDatePicker(true);
      return;
    }
    setShowCustomDatePicker(false);

    const today = new Date();
    let startDate, endDate;

    today.setHours(0, 0, 0, 0);

    switch (period) {
      case "today":
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case "week":
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - diffToMonday);
        endDate = new Date(today);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case "quarter":
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        const quarterEndMonth = currentQuarter * 3 + 2;
        endDate = new Date(today.getFullYear(), quarterEndMonth + 1, 0);
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
      if (!date) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setDateRange({
      startDate: formatDate(startDate),
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

  const formatCompactCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(2)}K`;
    }
    return formatCurrency(value);
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const formatTime = (hour) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getPeriodLabel = (period) => {
    const labels = {
      week: t('dashboard.timePeriod.week'),
      month: t('dashboard.timePeriod.month'),
      quarter: t('dashboard.timePeriod.quarter'),
      year: t('dashboard.timePeriod.year'),
    };
    return labels[period] || t('dashboard.timePeriod.month');
  };

  const getPaymentMethodLabel = (method) => {
    const methodLower = (method || '').toLowerCase();
    const key = `revenue.paymentMethods.${methodLower}`;
    return t(key, method?.toUpperCase());
  };

  // KPI Card Component
  const KPICard = ({
    icon: Icon,
    title,
    value,
    change,
    subtitle,
    color,
    trend,
    info,
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? "text-green-600" : "text-red-600"
              }`}
          >
            {change >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-600 font-medium mb-1">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        {value}
      </p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      {info && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {info}
          </p>
        </div>
      )}
    </div>
  );

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatter ? formatter(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Safe data access with defaults to prevent undefined errors
  const safeAnalytics = analyticsData || {};

  return (
    <div className="min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('revenue.revenueAnalytics')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('revenue.comprehensiveAnalysis')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t('common.refresh')}</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={true}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: t('dashboard.timePeriod.today'), value: "today", icon: Calendar },
            { label: t('dashboard.timePeriod.week'), value: "week", icon: Activity },
            { label: t('dashboard.timePeriod.month'), value: "month", icon: BarChart3 },
            { label: t('dashboard.timePeriod.quarter'), value: "quarter", icon: TrendingUp },
            { label: t('dashboard.timePeriod.year'), value: "year", icon: PieChartIcon },
            { label: t('dashboard.timePeriod.allTime'), value: "all", icon: Infinity },
            { label: t('revenue.custom'), value: "custom", icon: Filter },
          ].map((period) => {
            const Icon = period.icon;
            return (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm ${selectedPeriod === period.value
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{period.label}</span>
                <span className="sm:hidden">{period.label.slice(0, 3)}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {showCustomDatePicker && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('revenue.startDate')}
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('revenue.endDate')}
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchAnalytics}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('common.apply')}
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {[
              { id: "overview", label: t('revenue.overview'), icon: BarChart3 },
              { id: "trends", label: t('revenue.trends'), icon: TrendingUp },
              { id: "customers", label: t('revenue.customers'), icon: Users },
              { id: "products", label: t('revenue.products'), icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all text-sm ${activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  icon={TrendingUp}
                  title={t('revenue.revenueGrowth')}
                  value={formatPercentage(analyticsData?.growthRate || 0)}
                  change={analyticsData?.growthRate}
                  color="bg-blue-500"
                  info={t('revenue.comparedToPrevious')}
                />

                <KPICard
                  icon={DollarSign}
                  title={t('revenue.revenuePerInvoice')}
                  value={formatCurrency(analyticsData?.revenuePerInvoice || 0)}
                  color="bg-green-500"
                  info={t('revenue.avgTransactionValue')}
                />

                <KPICard
                  icon={Percent}
                  title={t('revenue.profitMargin')}
                  value={formatPercentage(analyticsData?.profitMargin || 0)}
                  color="bg-purple-500"
                  info={t('revenue.netProfitPercentage')}
                />

                <KPICard
                  icon={CreditCard}
                  title={t('revenue.collectionRate')}
                  value={formatPercentage(analyticsData?.collectionRate || 0)}
                  change={analyticsData?.collectionGrowth}
                  color="bg-indigo-500"
                  info={t('revenue.paymentCollectionEfficiency')}
                />
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t('revenue.paymentSummary')}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">{t('revenue.grossRevenue')}</p>
                    <p className="text-2xl font-bold">
                      {formatCompactCurrency(
                        analyticsData?.paymentSummary?.totalRevenue || 0
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">
                      {t('revenue.collectedAmount')}
                    </p>
                    <p className="text-2xl font-bold text-green-300">
                      {formatCompactCurrency(
                        analyticsData?.paymentSummary?.actualReceived || 0
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">{t('revenue.currentDue')}</p>
                    <p className="text-2xl font-bold text-orange-300">
                      {formatCompactCurrency(
                        analyticsData?.paymentSummary?.totalDue || 0
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">{t('revenue.creditSales')}</p>
                    <p className="text-2xl font-bold text-purple-300">
                      {formatCompactCurrency(
                        analyticsData?.paymentSummary?.totalCreditUsed || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Returns & Net Revenue - Matching Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {t('revenue.totalReturns')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-red-100 text-sm mb-1">{t('revenue.totalReturns')}</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(analyticsData?.returns?.total || 0)}
                      </p>
                      <p className="text-red-200 text-xs mt-1">
                        {analyticsData?.returns?.count || 0} {t('revenue.returnTransactions')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t('revenue.returnsBreakdown')}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-orange-100 text-xs mb-1">{t('revenue.cashRefunds')} (Walk-in)</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(analyticsData?.returns?.cashRefunds || 0)}
                      </p>
                      <p className="text-orange-200 text-xs">{t('revenue.walkInReturnsMoneyOut')}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-orange-100 text-xs mb-1">{t('revenue.creditAdjustments')} (Due)</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(analyticsData?.returns?.creditAdjustments || 0)}
                      </p>
                      <p className="text-orange-200 text-xs">{t('revenue.creditReturnsNoCashOut')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t('revenue.netRevenue')}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-green-100 text-sm mb-1">{t('revenue.afterReturns')}</p>
                      <p className="text-3xl font-bold">
                        {formatCurrency(analyticsData?.netRevenue || 0)}
                      </p>
                      <p className="text-green-200 text-xs mt-1">
                        {t('revenue.grossMinusReturns')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  icon={Target}
                  title={t('revenue.conversionRate')}
                  value={formatPercentage(analyticsData?.conversionRate || 0)}
                  color="bg-teal-500"
                  info={t('revenue.draftToFinalRatio')}
                />

                <KPICard
                  icon={Users}
                  title={t('revenue.customerRetention')}
                  value={formatPercentage(analyticsData?.customerRetention || 0)}
                  color="bg-pink-500"
                  info={t('revenue.returningCustomers')}
                />

                <KPICard
                  icon={ShoppingCart}
                  title={t('revenue.avgOrderFrequency')}
                  value={(analyticsData?.averageOrderFrequency || 0).toFixed(1)}
                  subtitle={t('revenue.ordersPerCustomer')}
                  color="bg-orange-500"
                />

                <KPICard
                  icon={Zap}
                  title={t('revenue.collectionGrowth')}
                  value={formatPercentage(analyticsData?.collectionGrowth || 0)}
                  change={analyticsData?.collectionGrowth}
                  color="bg-yellow-500"
                  info={t('revenue.paymentCollectionImprovement')}
                />
              </div>

              {/* Payment Methods Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('revenue.paymentMethodPerformance')}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData?.paymentMethodPerformance || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {(analyticsData?.paymentMethodPerformance || []).map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip formatter={formatCurrency} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {(analyticsData?.paymentMethodPerformance || []).map(
                      (method, index) => (
                        <div
                          key={method.method}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {getPaymentMethodLabel(method?.method)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {t('revenue.transactionsCount', { count: method?.count || 0, plural: (method?.count || 0) !== 1 ? 's' : '' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCompactCurrency(method?.revenue || 0)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {t('revenue.avg')}: {formatCurrency(method?.avgTransactionValue || 0)}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              {/* Monthly Trend */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('revenue.monthlyRevenueTrend')}
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.monthlyTrend || []}>
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
                            stopColor={COLORS.primary}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.primary}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorReceived"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.success}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.success}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorProfit"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.purple}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.purple}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                        stroke="#6b7280"
                      />
                      <Tooltip
                        content={<CustomTooltip formatter={formatCurrency} />}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name={t('revenue.netRevenue')}
                      />
                      <Area
                        type="monotone"
                        dataKey="received"
                        stroke={COLORS.success}
                        fillOpacity={1}
                        fill="url(#colorReceived)"
                        name={t('revenue.totalCollected')}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke={COLORS.purple}
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        name={t('revenue.dashboardInfo.profit')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Stats Table */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          {t('revenue.dashboardInfo.month')}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          {t('revenue.dashboardInfo.revenue')}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          {t('revenue.dashboardInfo.received')}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          {t('revenue.dashboardInfo.pending')}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          {t('revenue.dashboardInfo.collectionRateLabel')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData?.monthlyTrend || []).map((month, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {month.month} {month.year}
                          </td>
                          <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(month.revenue)}
                          </td>
                          <td className="text-right py-3 px-4 text-sm text-green-600">
                            {formatCurrency(month.received)}
                          </td>
                          <td className="text-right py-3 px-4 text-sm text-orange-600">
                            {formatCurrency(month.due)}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${month.collectionRate >= 80
                                ? "bg-green-100 text-green-800"
                                : month.collectionRate >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                                }`}
                            >
                              {formatPercentage(month.collectionRate)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Time Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time of Day Analysis */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {t('revenue.dashboardInfo.revenueByTimeOfDay')}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.timeOfDayData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 11 }}
                          tickFormatter={formatTime}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) =>
                            `₹${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          labelFormatter={formatTime}
                          content={<CustomTooltip formatter={formatCurrency} />}
                        />
                        <Legend />
                        <Bar
                          dataKey="received"
                          fill={COLORS.success}
                          name={t('revenue.totalCollected')}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="due"
                          fill={COLORS.warning}
                          name={t('revenue.dashboardInfo.pending')}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Peak Hours Info */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      {t('revenue.dashboardInfo.peakBusinessHours')}
                    </p>
                    <p className="text-sm text-blue-700">
                      {(analyticsData?.timeOfDayData || []).length > 0 &&
                        (() => {
                          const peak = (analyticsData?.timeOfDayData || []).reduce(
                            (max, curr) =>
                              curr.revenue > max.revenue ? curr : max
                          );
                          return t('revenue.dashboardInfo.highestRevenueAt', {
                            time: formatTime(peak.hour),
                            amount: formatCurrency(peak.revenue)
                          });
                        })()}
                    </p>
                  </div>
                </div>

                {/* Day of Week Analysis */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t('revenue.dashboardInfo.revenueByDayOfWeek')}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.dayOfWeekData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) =>
                            `₹${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip
                          content={<CustomTooltip formatter={formatCurrency} />}
                        />
                        <Legend />
                        <Bar
                          dataKey="revenue"
                          fill={COLORS.primary}
                          name={t('revenue.netRevenue')}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="received"
                          fill={COLORS.success}
                          name={t('revenue.totalCollected')}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Best Day Info */}
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900 font-medium mb-2">
                      {t('revenue.dashboardInfo.bestPerformingDay')}
                    </p>
                    <p className="text-sm text-green-700">
                      {(analyticsData?.dayOfWeekData || []).length > 0 &&
                        (() => {
                          const best = (analyticsData?.dayOfWeekData || []).reduce(
                            (max, curr) =>
                              curr.revenue > max.revenue ? curr : max
                          );
                          return t('revenue.dashboardInfo.dayWithRevenue', {
                            day: best.day,
                            amount: formatCurrency(best.revenue),
                            count: best.orders
                          });
                        })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              {/* Customer Segments */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('revenue.dashboardInfo.customerSegments')}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData?.customerSegments || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => {
                            const translatedName = name.toLowerCase().includes('walk') || name.toLowerCase() === 'walk-in'
                              ? t('customer.walkIn')
                              : name.toLowerCase() === 'due' || name.toLowerCase() === 'credit'
                                ? t('revenue.paymentMethods.due')
                                : name;
                            return `${translatedName}: ${value}`;
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.customerSegments.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {analyticsData.customerSegments.map((segment, index) => (
                      <div
                        key={segment.name}
                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                            <h4 className="font-semibold text-gray-900">
                              {segment.name.toLowerCase().includes('walk') || segment.name.toLowerCase() === 'walk-in'
                                ? t('customer.walkIn')
                                : segment.name.toLowerCase() === 'due' || segment.name.toLowerCase() === 'credit'
                                  ? t('revenue.paymentMethods.due')
                                  : segment.name}
                            </h4>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {segment.value} {t('revenue.dashboardInfo.customers')}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.revenueLabel')}</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(segment.revenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.returnsLabel')}</p>
                            <p className="font-semibold text-red-600">
                              {formatCurrency(segment.returns || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.taxLabel')}</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(segment.tax || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.paidLabel')}</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(segment.paid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.pendingLabel')}</p>
                            <p className="font-semibold text-orange-600">
                              {formatCurrency(segment.due)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">
                              {t('revenue.dashboardInfo.collectionRateLabel')}
                            </p>
                            <p className="font-semibold text-blue-600">
                              {formatPercentage(segment.collectionRate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 opacity-80" />
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        {analyticsData.customerSegments.reduce(
                          (sum, seg) => sum + seg.value,
                          0
                        )}
                      </p>
                      <p className="text-sm text-blue-100 mt-1">
                        {t('revenue.dashboardInfo.totalCustomers')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 opacity-80" />
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        {formatPercentage(analyticsData.customerRetention)}
                      </p>
                      <p className="text-sm text-green-100 mt-1">
                        {t('revenue.dashboardInfo.retentionRate')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <ShoppingCart className="w-8 h-8 opacity-80" />
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        {analyticsData.averageOrderFrequency.toFixed(1)}
                      </p>
                      <p className="text-sm text-purple-100 mt-1">
                        {t('revenue.dashboardInfo.avgOrdersPerCustomer')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 opacity-80" />
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        {formatCompactCurrency(analyticsData.revenuePerInvoice)}
                      </p>
                      <p className="text-sm text-orange-100 mt-1">
                        {t('revenue.dashboardInfo.avgOrderValue')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Category Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('revenue.dashboardInfo.categoryPerformance')}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analyticsData.productPerformance}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                        />
                        <Radar
                          name={t('revenue.dashboardInfo.performanceScore')}
                          dataKey="score"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.6}
                        />
                        <Tooltip
                          formatter={(value) => `${value.toFixed(1)}%`}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {analyticsData.productPerformance.map((category, index) => (
                      <div
                        key={category.category}
                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {category.category}
                          </h4>
                          <span className="text-sm font-medium text-gray-600">
                            {t('revenue.dashboardInfo.score')} {category.score.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {t('revenue.dashboardInfo.revenueColon')}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(category.revenue)}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('revenue.dashboardInfo.totalCategories')}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.productPerformance.length}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t('revenue.dashboardInfo.activeCategoriesDesc')}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('revenue.dashboardInfo.topCategory')}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.productPerformance.length > 0
                          ? analyticsData.productPerformance[0].category
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t('revenue.dashboardInfo.highestRevenueCategory')}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {t('revenue.dashboardInfo.avgCategoryScore')}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.productPerformance.length > 0
                          ? (
                            analyticsData.productPerformance.reduce(
                              (sum, cat) => sum + cat.score,
                              0
                            ) / analyticsData.productPerformance.length
                          ).toFixed(0)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t('revenue.dashboardInfo.avgPerformanceDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !analyticsData && (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Analytics Data Available
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              There's no analytics data available for the selected period. Try
              changing the time period or check back later.
            </p>
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && analyticsData && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium text-center">
              Updating analytics...
            </p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueAnalytics;
