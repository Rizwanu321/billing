// components/revenue/RevenueAnalytics.jsx
import React, { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

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
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchRevenueAnalytics({ period: selectedPeriod });
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData(null);
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
      week: "Last 7 Days",
      month: "This Month",
      quarter: "This Quarter",
      year: "This Year",
    };
    return labels[period] || "This Month";
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
            Loading analytics data...
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Revenue Analytics
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Comprehensive insights into your business performance
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
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["week", "month", "quarter", "year"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${selectedPeriod === period
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "trends", label: "Trends", icon: TrendingUp },
              { id: "customers", label: "Customers", icon: Users },
              { id: "products", label: "Products", icon: Package },
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
                  title="Revenue Growth"
                  value={formatPercentage(analyticsData.growthRate)}
                  change={analyticsData.growthRate}
                  color="bg-blue-500"
                  info="Compared to previous period"
                />

                <KPICard
                  icon={DollarSign}
                  title="Revenue Per Invoice"
                  value={formatCurrency(analyticsData.revenuePerInvoice)}
                  color="bg-green-500"
                  info="Average transaction value"
                />

                <KPICard
                  icon={Percent}
                  title="Profit Margin"
                  value={formatPercentage(analyticsData.profitMargin)}
                  color="bg-purple-500"
                  info="Net profit percentage"
                />

                <KPICard
                  icon={CreditCard}
                  title="Collection Rate"
                  value={formatPercentage(analyticsData.collectionRate)}
                  change={analyticsData.collectionGrowth}
                  color="bg-indigo-500"
                  info="Payment collection efficiency"
                />
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Payment Summary
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCompactCurrency(
                        analyticsData.paymentSummary.totalRevenue
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">
                      Amount Received
                    </p>
                    <p className="text-2xl font-bold text-green-300">
                      {formatCompactCurrency(
                        analyticsData.paymentSummary.actualReceived
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">Pending Due</p>
                    <p className="text-2xl font-bold text-orange-300">
                      {formatCompactCurrency(
                        analyticsData.paymentSummary.totalDue
                      )}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-sm mb-1">Credit Used</p>
                    <p className="text-2xl font-bold text-purple-300">
                      {formatCompactCurrency(
                        analyticsData.paymentSummary.totalCreditUsed
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  icon={Target}
                  title="Conversion Rate"
                  value={formatPercentage(analyticsData.conversionRate)}
                  color="bg-teal-500"
                  info="Draft to final invoice ratio"
                />

                <KPICard
                  icon={Users}
                  title="Customer Retention"
                  value={formatPercentage(analyticsData.customerRetention)}
                  color="bg-pink-500"
                  info="Returning customers"
                />

                <KPICard
                  icon={ShoppingCart}
                  title="Avg. Order Frequency"
                  value={analyticsData.averageOrderFrequency.toFixed(1)}
                  subtitle="orders per customer"
                  color="bg-orange-500"
                />

                <KPICard
                  icon={Zap}
                  title="Collection Growth"
                  value={formatPercentage(analyticsData.collectionGrowth)}
                  change={analyticsData.collectionGrowth}
                  color="bg-yellow-500"
                  info="Payment collection improvement"
                />
              </div>

              {/* Payment Methods Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods Performance
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.paymentMethodPerformance}
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
                          {analyticsData.paymentMethodPerformance.map(
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
                    {analyticsData.paymentMethodPerformance.map(
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
                                {method.method?.toUpperCase() || "Unknown"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {method.count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCompactCurrency(method.revenue)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Avg: {formatCurrency(method.avgTransactionValue)}
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
                  Monthly Revenue Trend
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.monthlyTrend}>
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
                        name="Total Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="received"
                        stroke={COLORS.success}
                        fillOpacity={1}
                        fill="url(#colorReceived)"
                        name="Received"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke={COLORS.purple}
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        name="Profit"
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
                          Month
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Revenue
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Received
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Pending
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Collection Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.monthlyTrend.map((month, index) => (
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
                    Revenue by Time of Day
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.timeOfDayData}>
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
                          name="Received"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="due"
                          fill={COLORS.warning}
                          name="Pending"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Peak Hours Info */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      📊 Peak Business Hours
                    </p>
                    <p className="text-sm text-blue-700">
                      {analyticsData.timeOfDayData.length > 0 &&
                        (() => {
                          const peak = analyticsData.timeOfDayData.reduce(
                            (max, curr) =>
                              curr.revenue > max.revenue ? curr : max
                          );
                          return `Highest revenue at ${formatTime(
                            peak.hour
                          )} with ${formatCurrency(peak.revenue)}`;
                        })()}
                    </p>
                  </div>
                </div>

                {/* Day of Week Analysis */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Revenue by Day of Week
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.dayOfWeekData}>
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
                          name="Total Revenue"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="received"
                          fill={COLORS.success}
                          name="Received"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Best Day Info */}
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900 font-medium mb-2">
                      🏆 Best Performing Day
                    </p>
                    <p className="text-sm text-green-700">
                      {analyticsData.dayOfWeekData.length > 0 &&
                        (() => {
                          const best = analyticsData.dayOfWeekData.reduce(
                            (max, curr) =>
                              curr.revenue > max.revenue ? curr : max
                          );
                          return `${best.day} with ${formatCurrency(
                            best.revenue
                          )} (${best.orders} orders)`;
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
                  Customer Segments
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.customerSegments}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
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
                              {segment.name}
                            </h4>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {segment.value} customers
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Revenue</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(segment.revenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Paid</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(segment.paid)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Pending</p>
                            <p className="font-semibold text-orange-600">
                              {formatCurrency(segment.due)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">
                              Collection Rate
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
                        Total Customers
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
                        Retention Rate
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
                        Avg Orders/Customer
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
                        Avg Order Value
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
                  Category Performance
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
                          name="Performance Score"
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
                            Score: {category.score.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Revenue:
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
                      <p className="text-sm text-gray-600">Total Categories</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.productPerformance.length}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Active product categories in your inventory
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Top Category</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analyticsData.productPerformance.length > 0
                          ? analyticsData.productPerformance[0].category
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Highest revenue generating category
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Avg Category Score
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
                    Average performance across all categories
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
