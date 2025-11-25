// client/src/components/CustomerStats.jsx - UPDATED & IMPROVED
import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Activity,
  Wallet,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  CreditCard,
} from "lucide-react";
import api from "../utils/api";

const CustomerStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/stats?period=${period}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  // Color configurations for Tailwind CSS (avoiding dynamic classes)
  const getCardColors = (color) => {
    const colorMap = {
      blue: "bg-blue-50 text-blue-600",
      red: "bg-red-50 text-red-600",
      green: "bg-green-50 text-green-600",
      orange: "bg-orange-50 text-orange-600",
      purple: "bg-purple-50 text-purple-600",
    };
    return colorMap[color] || "bg-gray-50 text-gray-600";
  };

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Customers",
      value: stats.customers.total,
      change: stats.customers.percentChange,
      isPositive: stats.customers.isPositive,
      icon: Users,
      color: "blue",
      subtitle: `${stats.customers.active} active`,
      description: "Active in last 30 days",
    },
    {
      title: "Total Due Amount",
      value: formatCurrency(stats.dues.totalDue),
      count: stats.dues.count,
      icon: AlertCircle,
      color: "red",
      subtitle: `${stats.dues.count} customers`,
      avg: stats.dues.avgDue > 0 ? `Avg: ${formatCurrency(stats.dues.avgDue)}` : null,
      max: stats.dues.maxDue > 0 ? `Max: ${formatCurrency(stats.dues.maxDue)}` : null,
    },
    {
      title: "Credit Balance",
      value: formatCurrency(stats.credits.totalCredit),
      count: stats.credits.count,
      icon: Wallet,
      color: "green",
      subtitle: `${stats.credits.count} customers`,
      avg: stats.credits.avgCredit > 0 ? `Avg: ${formatCurrency(stats.credits.avgCredit)}` : null,
      max: stats.credits.maxCredit > 0 ? `Max: ${formatCurrency(stats.credits.maxCredit)}` : null,
    },
    {
      title: "Net Balance",
      value: formatCurrency(Math.abs(stats.netBalance.total)),
      icon: IndianRupee,
      color: stats.netBalance.isPositive ? "orange" : "purple",
      subtitle: stats.netBalance.isPositive ? "Receivable" : "Payable",
      description: "Overall balance position",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 -m-6 sm:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Statistics</h1>
              <p className="text-sm text-gray-500 mt-1">
                Overview of customer balances and activities
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Period Selector */}
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={`text-gray-600 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                   className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">
                      {stat.title}
                    </p>
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2 break-words">
                      {stat.value}
                    </p>

                    {stat.change !== undefined && (
                      <div className="flex items-center mt-3">
                        {stat.isPositive ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            stat.isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatPercentage(stat.change)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          vs last {period}
                        </span>
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-2">{stat.subtitle}</p>
                    {stat.avg && (
                      <p className="text-xs text-gray-400 mt-1">{stat.avg}</p>
                    )}
                    {stat.max && (
                      <p className="text-xs text-gray-400">{stat.max}</p>
                    )}
                    {stat.description && (
                      <p className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {stat.description}
                      </p>
                    )}
                  </div>

                  <div className={`p-3 rounded-lg ${getCardColors(stat.color)} ml-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Stats Cards - List View */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200 mb-6">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getCardColors(stat.color)}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {stat.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                      {(stat.avg || stat.max || stat.description) && (
                        <div className="flex flex-wrap gap-3 mt-2">
                          {stat.avg && (
                            <span className="text-xs text-gray-400">{stat.avg}</span>
                          )}
                          {stat.max && (
                            <span className="text-xs text-gray-400">{stat.max}</span>
                          )}
                          {stat.description && (
                            <span className="text-xs text-gray-400">
                              {stat.description}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change !== undefined && (
                      <div className="flex items-center">
                        {stat.isPositive ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            stat.isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatPercentage(stat.change)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Customer Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Growth Trend
            </h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Growth chart visualization</p>
              </div>
            </div>
          </div>

          {/* Payment Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Balance Distribution
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customers with Due</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.dues.count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customers with Credit</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.credits.count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Settled Customers</span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.max(0, stats.customers.total - stats.dues.count - stats.credits.count)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/customers/new'}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Add New Customer
              </button>
              <button
                onClick={() => window.location.href = '/invoices'}
                className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                Create Invoice
              </button>
              <button
                className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                Download Report
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-600" />
                Recent Activity
              </h3>
              <button
                onClick={() => window.location.href = '/customers/activity'}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-right pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right pb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.customerId?.name || "Unknown Customer"}
                        </p>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === "payment"
                            ? "bg-green-100 text-green-800"
                            : transaction.type === "purchase"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <p className={`text-sm font-semibold ${
                          transaction.type === "payment"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          {transaction.type === "payment" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </td>
                      <td className="py-3 text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {stats.recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "payment"
                          ? "bg-green-50 text-green-600"
                          : transaction.type === "purchase"
                          ? "bg-red-50 text-red-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {transaction.type === "payment" ? (
                        <CreditCard className="w-4 h-4" />
                      ) : (
                        <Wallet className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.customerId?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      transaction.type === "payment"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "payment" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerStats;