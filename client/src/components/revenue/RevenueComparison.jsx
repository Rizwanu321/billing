// components/revenue/RevenueComparison.jsx - COMPLETE PROFESSIONAL VERSION
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  ComposedChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Info,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  Users,
  CreditCard,
  Percent,
  Target,
  Activity,
  FileText,
  Zap,
  Award,
  Package,
} from "lucide-react";
import { fetchRevenueComparison } from "../../api/revenue";

const RevenueComparison = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonType, setComparisonType] = useState("month-over-month");
  const [activeTab, setActiveTab] = useState("overview");

  const CHART_COLORS = {
    current: "#3b82f6",
    previous: "#94a3b8",
    positive: "#10b981",
    negative: "#ef4444",
    warning: "#f59e0b",
    info: "#6366f1",
  };

  useEffect(() => {
    fetchData();
  }, [comparisonType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchRevenueComparison({ type: comparisonType });
      setComparisonData(response);
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      setComparisonData(null);
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

  const formatCompactCurrency = (value) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const getComparisonTypeLabel = (type) => {
    const labels = {
      "day-over-day": t('revenue.dayOverDay'),
      "week-over-week": t('revenue.weekOverWeek'),
      "month-over-month": t('revenue.monthOverMonth'),
      "quarter-over-quarter": t('revenue.quarterOverQuarter'),
      "year-over-year": t('revenue.yearOverYear'),
    };
    return labels[type] || t('revenue.comparison');
  };

  const getMetricLabel = (metricName) => {
    const metricMap = {
      'Gross Revenue': t('revenue.grossRevenue'),
      'Returns': t('revenue.totalReturns'),
      'Net Revenue': t('revenue.netRevenue'),
      'Total Collected': t('revenue.totalCollected'),
      'Credit Payments': t('revenue.creditPayments'),
      'Net Position': t('revenue.netPosition'),
      'Transactions': t('revenue.transactions'),
      'Avg Order Value': t('revenue.avgOrderValue'),
      'Collection Rate': t('revenue.collectionRate'),
    };
    return metricMap[metricName] || metricName;
  };

  const getPaymentMethodLabel = (method) => {
    const methodUpper = (method || '').toUpperCase();
    if (methodUpper === 'CASH') return t('revenue.paymentMethods.cash');
    if (methodUpper === 'DUE') return t('revenue.paymentMethods.due');
    if (methodUpper === 'ONLINE') return t('revenue.paymentMethods.online');
    if (methodUpper === 'CARD') return t('revenue.paymentMethods.card');
    if (methodUpper === 'UPI') return t('revenue.paymentMethods.upi');
    return method;
  };

  // Enhanced Metric Card Component
  const MetricCard = ({
    title,
    current,
    previous,
    icon: Icon,
    format = "currency",
  }) => {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const isPositive = change >= 0;
    const difference = current - previous;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-lg ${isPositive ? "bg-green-100" : "bg-red-100"
              }`}
          >
            <Icon
              className={`w-5 h-5 ${isPositive ? "text-green-600" : "text-red-600"
                }`}
            />
          </div>
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {formatPercentage(Math.abs(change))}
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('revenue.currentPeriod')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {format === "currency"
                ? formatCompactCurrency(current)
                : format === "percentage"
                  ? formatPercentage(current)
                  : current}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('revenue.previousPeriod')}</p>
              <p className="text-lg font-semibold text-gray-600">
                {format === "currency"
                  ? formatCompactCurrency(previous)
                  : format === "percentage"
                    ? formatPercentage(previous)
                    : previous}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">{t('revenue.difference')}</p>
              <p
                className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"
                  }`}
              >
                {isPositive ? "+" : ""}
                {format === "currency"
                  ? formatCompactCurrency(difference)
                  : format === "percentage"
                    ? formatPercentage(difference)
                    : difference}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Insight Card Component
  const InsightCard = ({ insight }) => {
    const icons = {
      positive: CheckCircle,
      negative: AlertTriangle,
      warning: Info,
      info: Activity,
    };
    const Icon = icons[insight.type] || Info;

    const colors = {
      positive: "bg-green-50 border-green-200 text-green-800",
      negative: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-orange-50 border-orange-200 text-orange-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    return (
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border ${colors[insight.type] || colors.info
          }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium">{insight.message}</p>
      </div>
    );
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-semibold">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !comparisonData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {t('common.loading')}...
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              {t('revenue.revenueComparison')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('revenue.comparePerformance')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t('common.refresh')}</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={true}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </button>
          </div>
        </div>

        {/* Comparison Type Selector */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">{t('revenue.comparisonPeriod')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "day-over-day", label: t('revenue.dayOverDay'), icon: "📆", shortLabel: t('revenue.today') || "Today" },
              { value: "week-over-week", label: t('revenue.weekOverWeek'), icon: "📅", shortLabel: t('revenue.week') || "Week" },
              { value: "month-over-month", label: t('revenue.monthOverMonth'), icon: "📊", shortLabel: t('revenue.month') || "Month" },
              { value: "quarter-over-quarter", label: t('revenue.quarterOverQuarter'), icon: "💹", shortLabel: t('revenue.quarter') || "Quarter" },
              { value: "year-over-year", label: t('revenue.yearOverYear'), icon: "📈", shortLabel: t('revenue.year') || "Year" },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setComparisonType(type.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${comparisonType === type.value
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
                <span className="sm:hidden">{type.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Ranges Display */}
        {comparisonData?.dateRanges && (
          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">
                    {t('revenue.currentPeriod')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {comparisonData.dateRanges.current.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-400 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    {t('revenue.previousPeriod')}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {comparisonData.dateRanges.previous.label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-1">
            {[
              { id: "overview", label: t('revenue.overview'), icon: Activity },
              { id: "metrics", label: t('revenue.detailedMetrics'), icon: BarChart },
              { id: "trends", label: t('revenue.trends'), icon: TrendingUp },
              { id: "insights", label: t('revenue.insights'), icon: Award },
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
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {comparisonData && (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics Grid - Row 1: Revenue metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title={t('revenue.grossRevenue')}
                  current={comparisonData.current.revenue}
                  previous={comparisonData.previous.revenue}
                  icon={DollarSign}
                />
                <MetricCard
                  title={t('revenue.totalReturns')}
                  current={comparisonData.current.totalReturns || 0}
                  previous={comparisonData.previous.totalReturns || 0}
                  icon={TrendingDown}
                />
                <MetricCard
                  title={t('revenue.netRevenue')}
                  current={comparisonData.current.netRevenue || comparisonData.current.revenue}
                  previous={comparisonData.previous.netRevenue || comparisonData.previous.revenue}
                  icon={TrendingUp}
                />
                <MetricCard
                  title={t('revenue.totalInvoices')}
                  current={comparisonData.current.transactionCount}
                  previous={comparisonData.previous.transactionCount}
                  icon={FileText}
                  format="number"
                />
              </div>

              {/* Key Metrics Grid - Row 2: Collection metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title={t('revenue.totalCollected')}
                  current={comparisonData.current.actualReceived}
                  previous={comparisonData.previous.actualReceived}
                  icon={CheckCircle}
                />
                <MetricCard
                  title={t('revenue.creditPayments')}
                  current={comparisonData.current.creditPayments || 0}
                  previous={comparisonData.previous.creditPayments || 0}
                  icon={CreditCard}
                />
                <MetricCard
                  title={t('revenue.netPosition')}
                  current={comparisonData.current.totalDue}
                  previous={comparisonData.previous.totalDue}
                  icon={AlertTriangle}
                />
                <MetricCard
                  title={t('revenue.collectionRate')}
                  current={comparisonData.current.collectionRate}
                  previous={comparisonData.previous.collectionRate}
                  icon={Percent}
                  format="percentage"
                />
              </div>

              {/* Performance Summary */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t('revenue.performanceSummary')}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">{t('revenue.netRevenueGrowth')}</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {(comparisonData.growth.netRevenue || comparisonData.growth.revenue) >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-green-300" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-300" />
                      )}
                      {formatPercentage(
                        Math.abs(comparisonData.growth.netRevenue || comparisonData.growth.revenue)
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">
                      {t('revenue.collectionGrowth')}
                    </p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {comparisonData.growth.collection >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-green-300" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-300" />
                      )}
                      {formatPercentage(
                        Math.abs(comparisonData.growth.collection)
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">
                      {t('revenue.transactionGrowth')}
                    </p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {comparisonData.growth.transactions >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-green-300" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-300" />
                      )}
                      {formatPercentage(
                        Math.abs(comparisonData.growth.transactions)
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">{t('revenue.customerGrowth')}</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {comparisonData.growth.customers >= 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-green-300" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-300" />
                      )}
                      {formatPercentage(Math.abs(comparisonData.growth.customers || 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Comparison Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    {t('revenue.revenueComparison')}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            if (value === 'Current') return t('revenue.dashboardInfo.current');
                            if (value === 'Previous') return t('revenue.dashboardInfo.previous');
                            return value;
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) =>
                            `₹${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="revenue"
                          fill={CHART_COLORS.current}
                          name={t('revenue.dashboardInfo.grossRevenueChart')}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="netRevenue"
                          fill="#6366f1"
                          name={t('revenue.netRevenue')}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="received"
                          fill={CHART_COLORS.positive}
                          name={t('revenue.totalCollected')}
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="due"
                          fill={CHART_COLORS.warning}
                          name={t('revenue.netPosition')}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Collection Rate Comparison */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    {t('revenue.collectionRateTrend')}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={comparisonData.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            if (value === 'Current') return t('revenue.dashboardInfo.current');
                            if (value === 'Previous') return t('revenue.dashboardInfo.previous');
                            return value;
                          }}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) =>
                            `₹${(value / 1000).toFixed(0)}k`
                          }
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="received"
                          fill={CHART_COLORS.positive}
                          name={t('revenue.totalCollected')}
                          radius={[8, 8, 0, 0]}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="collectionRate"
                          stroke={CHART_COLORS.current}
                          strokeWidth={3}
                          name={t('revenue.dashboardInfo.collectionRatePercent')}
                          dot={{ r: 5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title={t('revenue.totalTaxCollected')}
                  current={comparisonData.current.totalTax || 0}
                  previous={comparisonData.previous.totalTax || 0}
                  icon={DollarSign}
                />
                <MetricCard
                  title={t('revenue.avgOrderValue')}
                  current={comparisonData.current.avgOrderValue}
                  previous={comparisonData.previous.avgOrderValue}
                  icon={ShoppingCart}
                />
                <MetricCard
                  title={t('revenue.customerCount')}
                  current={comparisonData.current.customerCount || 0}
                  previous={comparisonData.previous.customerCount || 0}
                  icon={Users}
                  format="number"
                />
                <MetricCard
                  title={t('revenue.creditUsed')}
                  current={comparisonData.current.totalCreditUsed || 0}
                  previous={comparisonData.previous.totalCreditUsed || 0}
                  icon={CreditCard}
                />
              </div>
            </div>
          )}

          {/* Detailed Metrics Tab */}
          {activeTab === "metrics" && (
            <div className="space-y-6">
              {/* Detailed Comparison Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('revenue.comprehensiveMetricsComparison')}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                          {t('revenue.metrics')}
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">
                          {t('revenue.currentPeriod')}
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">
                          {t('revenue.previousPeriod')}
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">
                          {t('revenue.difference')}
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">
                          {t('revenue.changePercent')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.chartData.map((row, index) => {
                        const difference = row.current - row.previous;
                        return (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-6 font-medium text-gray-900">
                              {getMetricLabel(row.metric)}
                            </td>
                            <td className="text-right py-4 px-6 text-gray-900 font-semibold">
                              {row.isPercentage
                                ? formatPercentage(row.current)
                                : typeof row.current === "number" &&
                                  row.current > 100
                                  ? formatCurrency(row.current)
                                  : row.current}
                            </td>
                            <td className="text-right py-4 px-6 text-gray-600">
                              {row.isPercentage
                                ? formatPercentage(row.previous)
                                : typeof row.previous === "number" &&
                                  row.previous > 100
                                  ? formatCurrency(row.previous)
                                  : row.previous}
                            </td>
                            <td
                              className={`text-right py-4 px-6 font-semibold ${row.isPositive
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                            >
                              {row.isPositive ? "+" : ""}
                              {row.isPercentage
                                ? formatPercentage(difference)
                                : typeof difference === "number" &&
                                  Math.abs(difference) > 100
                                  ? formatCompactCurrency(difference)
                                  : typeof difference === "number"
                                    ? Number(difference.toFixed(2))
                                    : difference}
                            </td>
                            <td className="text-right py-4 px-6">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${row.isPositive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {row.isPositive ? (
                                  <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                  <ArrowDownRight className="w-4 h-4" />
                                )}
                                {formatPercentage(Math.abs(row.growth))}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Methods Comparison */}
              {comparisonData.paymentMethods &&
                comparisonData.paymentMethods.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      {t('revenue.paymentMethodsComparison')}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonData.paymentMethods}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="type"
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) =>
                                value?.toUpperCase() || ""
                              }
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) =>
                                `₹${(value / 1000).toFixed(0)}k`
                              }
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                              dataKey="current"
                              fill={CHART_COLORS.current}
                              name={t('revenue.dashboardInfo.current')}
                              radius={[8, 8, 0, 0]}
                            />
                            <Bar
                              dataKey="previous"
                              fill={CHART_COLORS.previous}
                              name={t('revenue.dashboardInfo.previous')}
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {comparisonData.paymentMethods.map((method, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">
                                {getPaymentMethodLabel(method.type)}
                              </h4>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${method.growth >= 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {method.growth >= 0 ? "+" : ""}
                                {formatPercentage(method.growth)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.current')}</p>
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(method.current)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {method.currentCount} {t('revenue.dashboardInfo.transactions')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">{t('revenue.dashboardInfo.previous')}</p>
                                <p className="font-semibold text-gray-600">
                                  {formatCurrency(method.previous)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {method.previousCount} {t('revenue.dashboardInfo.transactions')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">
                                  {t('revenue.dashboardInfo.currentCollection')}
                                </p>
                                <p className="font-semibold text-green-600">
                                  {formatPercentage(
                                    method.currentCollectionRate
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">
                                  {t('revenue.dashboardInfo.previousCollection')}
                                </p>
                                <p className="font-semibold text-gray-600">
                                  {formatPercentage(
                                    method.previousCollectionRate
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Category Breakdown */}
              {comparisonData.categoryBreakdown &&
                comparisonData.categoryBreakdown.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {t('revenue.dashboardInfo.categoryPerformanceComparison')}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                              {t('revenue.dashboardInfo.category')}
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              {t('revenue.dashboardInfo.currentRevenue')}
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              {t('revenue.dashboardInfo.previousRevenue')}
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              {t('revenue.dashboardInfo.growth')}
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              {t('revenue.dashboardInfo.currentCollection')}
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                              {t('revenue.dashboardInfo.collectionGrowthLabel')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.categoryBreakdown.map(
                            (category, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {category.name}
                                </td>
                                <td className="text-right py-3 px-4 font-semibold text-gray-900">
                                  {formatCurrency(category.current)}
                                </td>
                                <td className="text-right py-3 px-4 text-gray-600">
                                  {formatCurrency(category.previous)}
                                </td>
                                <td className="text-right py-3 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${category.growth >= 0
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                      }`}
                                  >
                                    {category.growth >= 0 ? (
                                      <ArrowUpRight className="w-3 h-3" />
                                    ) : (
                                      <ArrowDownRight className="w-3 h-3" />
                                    )}
                                    {formatPercentage(
                                      Math.abs(category.growth)
                                    )}
                                  </span>
                                </td>
                                <td className="text-right py-3 px-4 text-green-600 font-semibold">
                                  {formatPercentage(
                                    category.currentCollectionRate
                                  )}
                                </td>
                                <td className="text-right py-3 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${category.collectionGrowth >= 0
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                      }`}
                                  >
                                    {category.collectionGrowth >= 0 ? "+" : ""}
                                    {formatPercentage(
                                      category.collectionGrowth
                                    )}
                                  </span>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              {/* Daily Trend Analysis */}
              {comparisonData.dailyTrend &&
                comparisonData.dailyTrend.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      {t('revenue.dailyRevenueTrend')}
                    </h3>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={comparisonData.dailyTrend}>
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
                                stopColor={CHART_COLORS.current}
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor={CHART_COLORS.current}
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) =>
                              `₹${(value / 1000).toFixed(0)}k`
                            }
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => `${value.toFixed(0)}%`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke={CHART_COLORS.current}
                            fill="url(#colorRevenue)"
                            name={t('revenue.revenue')}
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="received"
                            fill={CHART_COLORS.positive}
                            name={t('revenue.received')}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="collectionRate"
                            stroke={CHART_COLORS.warning}
                            strokeWidth={2}
                            name={t('revenue.dashboardInfo.collectionRatePercent')}
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              {/* Performance Radar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {t('revenue.performanceRadar')}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={[
                          {
                            metric: t('revenue.revenue'),
                            current: Math.min(
                              100,
                              (comparisonData.current.revenue /
                                Math.max(
                                  comparisonData.current.revenue,
                                  comparisonData.previous.revenue
                                )) *
                              100
                            ),
                            previous: Math.min(
                              100,
                              (comparisonData.previous.revenue /
                                Math.max(
                                  comparisonData.current.revenue,
                                  comparisonData.previous.revenue
                                )) *
                              100
                            ),
                          },
                          {
                            metric: t('revenue.collection'),
                            current: comparisonData.current.collectionRate,
                            previous: comparisonData.previous.collectionRate,
                          },
                          {
                            metric: t('revenue.transactions'),
                            current: Math.min(
                              100,
                              (comparisonData.current.transactionCount /
                                Math.max(
                                  comparisonData.current.transactionCount,
                                  comparisonData.previous.transactionCount
                                )) *
                              100
                            ),
                            previous: Math.min(
                              100,
                              (comparisonData.previous.transactionCount /
                                Math.max(
                                  comparisonData.current.transactionCount,
                                  comparisonData.previous.transactionCount
                                )) *
                              100
                            ),
                          },
                          {
                            metric: t('revenue.avgOrder'),
                            current: Math.min(
                              100,
                              (comparisonData.current.avgOrderValue /
                                Math.max(
                                  comparisonData.current.avgOrderValue,
                                  comparisonData.previous.avgOrderValue
                                )) *
                              100
                            ),
                            previous: Math.min(
                              100,
                              (comparisonData.previous.avgOrderValue /
                                Math.max(
                                  comparisonData.current.avgOrderValue,
                                  comparisonData.previous.avgOrderValue
                                )) *
                              100
                            ),
                          },
                          {
                            metric: t('revenue.dashboardInfo.profit'),
                            current: comparisonData.current.profitMargin,
                            previous: comparisonData.previous.profitMargin,
                          },
                        ]}
                      >
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="metric"
                          tick={{ fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                        />
                        <Radar
                          name={t('revenue.currentPeriod')}
                          dataKey="current"
                          stroke={CHART_COLORS.current}
                          fill={CHART_COLORS.current}
                          fillOpacity={0.6}
                        />
                        <Radar
                          name={t('revenue.previousPeriod')}
                          dataKey="previous"
                          stroke={CHART_COLORS.previous}
                          fill={CHART_COLORS.previous}
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Growth Indicators */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {t('revenue.growthIndicators')}
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        label: t('revenue.revenueGrowth'),
                        value: comparisonData.growth.revenue,
                        icon: DollarSign,
                      },
                      {
                        label: t('revenue.collectionGrowth'),
                        value: comparisonData.growth.collection,
                        icon: CheckCircle,
                      },
                      {
                        label: t('revenue.transactionGrowth'),
                        value: comparisonData.growth.transactions,
                        icon: FileText,
                      },
                      {
                        label: t('revenue.customerGrowth'),
                        value: comparisonData.growth.customers,
                        icon: Users,
                      },
                      {
                        label: t('revenue.profitGrowth'),
                        value: comparisonData.growth.profit,
                        icon: TrendingUp,
                      },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      const isPositive = item.value >= 0;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-lg ${isPositive ? "bg-green-100" : "bg-red-100"
                                }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${isPositive ? "text-green-600" : "text-red-600"
                                  }`}
                              />
                            </div>
                            <span className="font-medium text-gray-900">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"
                                  }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.abs(item.value)
                                  )}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-red-600"
                                }`}
                            >
                              {isPositive ? "+" : ""}
                              {formatPercentage(item.value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              {/* Key Insights */}
              {comparisonData.insights &&
                comparisonData.insights.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      {t('revenue.keyInsightsRecommendations')}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {comparisonData.insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} />
                      ))}
                    </div>
                  </div>
                )}

              {/* Performance Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Revenue Performance */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      {t('revenue.revenuePerformance')}
                    </h4>
                    <DollarSign className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-blue-100 text-sm mb-2">
                        {t('revenue.currentPeriod')}
                      </p>
                      <p className="text-3xl font-bold">
                        {formatCompactCurrency(comparisonData.current.revenue)}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-blue-400">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-100 text-sm">{t('revenue.dashboardInfo.growth')}</span>
                        <span className="text-xl font-bold">
                          {comparisonData.growth.revenue >= 0 ? "+" : ""}
                          {formatPercentage(comparisonData.growth.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Performance */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      {t('revenue.collectionPerformance')}
                    </h4>
                    <CheckCircle className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-green-100 text-sm mb-2">
                        {t('revenue.collectionRate')}
                      </p>
                      <p className="text-3xl font-bold">
                        {formatPercentage(
                          comparisonData.current.collectionRate
                        )}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-green-400">
                      <div className="flex items-center justify-between">
                        <span className="text-green-100 text-sm">
                          {t('revenue.improvement')}
                        </span>
                        <span className="text-xl font-bold">
                          {comparisonData.current.collectionRate -
                            comparisonData.previous.collectionRate >=
                            0
                            ? "+"
                            : ""}
                          {formatPercentage(
                            comparisonData.current.collectionRate -
                            comparisonData.previous.collectionRate
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Performance */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">
                      {t('revenue.transactionVolume')}
                    </h4>
                    <ShoppingCart className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-purple-100 text-sm mb-2">
                        {t('revenue.totalTransactions')}
                      </p>
                      <p className="text-3xl font-bold">
                        {comparisonData.current.transactionCount}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-purple-400">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-100 text-sm">{t('revenue.dashboardInfo.growth')}</span>
                        <span className="text-xl font-bold">
                          {comparisonData.growth.transactions >= 0 ? "+" : ""}
                          {formatPercentage(comparisonData.growth.transactions)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {t('revenue.strengths')}
                  </h4>
                  <div className="space-y-3">
                    {comparisonData.chartData
                      .filter((item) => item.isPositive && item.growth > 5)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              {getMetricLabel(item.metric)}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-green-600">
                            +{formatPercentage(item.growth)}
                          </span>
                        </div>
                      ))}
                    {comparisonData.chartData.filter(
                      (item) => item.isPositive && item.growth > 5
                    ).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {t('revenue.continueBuilding')}
                        </p>
                      )}
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    {t('revenue.areasForImprovement')}
                  </h4>
                  <div className="space-y-3">
                    {comparisonData.chartData
                      .filter((item) => !item.isPositive || item.growth < -5)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              {getMetricLabel(item.metric)}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-orange-600">
                            {formatPercentage(item.growth)}
                          </span>
                        </div>
                      ))}
                    {comparisonData.chartData.filter(
                      (item) => !item.isPositive || item.growth < -5
                    ).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {t('revenue.allPositiveTrends')}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  {t('revenue.actionableRecommendations')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comparisonData.current.collectionRate < 70 && (
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        {t('revenue.improveCollectionRate')}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {t('revenue.yourCollectionRateIs')} {formatPercentage(comparisonData.current.collectionRate)}. {t('revenue.considerStricterPolicies')}
                      </p>
                    </div>
                  )}

                  {comparisonData.growth.revenue < 0 && (
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        {t('revenue.boostRevenueGrowth')}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {t('revenue.revenueDeclinedBy')} {formatPercentage(Math.abs(comparisonData.growth.revenue))}. {t('revenue.focusOnRetention')}
                      </p>
                    </div>
                  )}

                  {comparisonData.growth.transactions < 0 && (
                    <div className="bg-white p-4 rounded-lg border border-indigo-200">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        {t('revenue.increaseTransactionVolume')}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {t('revenue.transactionCountDecreased')}
                      </p>
                    </div>
                  )}

                  {comparisonData.current.avgOrderValue <
                    comparisonData.previous.avgOrderValue && (
                      <div className="bg-white p-4 rounded-lg border border-indigo-200">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Increase Average Order Value
                        </h5>
                        <p className="text-sm text-gray-600">
                          AOV decreased by{" "}
                          {formatCurrency(
                            comparisonData.previous.avgOrderValue -
                            comparisonData.current.avgOrderValue
                          )}
                          . Try bundling products or suggesting complementary
                          items.
                        </p>
                      </div>
                    )}

                  {comparisonData.growth.revenue >= 10 &&
                    comparisonData.growth.collection >= 5 && (
                      <div className="bg-white p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-2">
                          Excellent Performance! 🎉
                        </h5>
                        <p className="text-sm text-green-700">
                          Both revenue and collection are growing strongly.
                          Maintain this momentum and consider scaling
                          operations.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !comparisonData && (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <TrendingUp className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Comparison Data Available
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              There's not enough data to perform a comparison. Please try a
              different time period or check back later.
            </p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <RefreshCw className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && comparisonData && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium text-center">
              Updating comparison data...
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
          .bg-gradient-to-br,
          .bg-gradient-to-r {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueComparison;
