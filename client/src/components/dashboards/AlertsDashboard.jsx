// components/dashboards/AlertsDashboard.jsx
import React, { useState, useEffect } from "react";
import { fetchAlertsSummary, fetchStockAlerts } from "../../api/dashboard";
import {
  AlertTriangle,
  Clock,
  Filter,
  Bell,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  Calendar,
  RefreshCw,
  Package,
  IndianRupee,
} from "lucide-react";

const AlertsDashboard = () => {
  const [alertsData, setAlertsData] = useState({
    stockAlerts: [],
    revenueAlerts: [],
    systemAlerts: [],
    summary: {
      critical: 0,
      warning: 0,
      info: 0,
      resolved: 0,
    },
    recentAlerts: [],
  });
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlertsData();
  }, []);

  const loadAlertsData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAlertsSummary();
      const stockAlerts = await fetchStockAlerts(10);

      setAlertsData({
        ...data,
        stockAlerts,
      });
    } catch (error) {
      console.error("Error loading alerts data:", error);

      // Mock data for demo
      setAlertsData({
        stockAlerts: [
          {
            id: "sa1",
            name: "Laptop Model A",
            stock: 2,
            threshold: 10,
            severity: "critical",
            date: "2023-11-21T09:23:18Z",
          },
          {
            id: "sa2",
            name: "Smart Watch",
            stock: 5,
            threshold: 10,
            severity: "warning",
            date: "2023-11-20T14:52:33Z",
          },
          {
            id: "sa3",
            name: "Headphones",
            stock: 8,
            threshold: 15,
            severity: "warning",
            date: "2023-11-19T11:15:42Z",
          },
        ],
        revenueAlerts: [
          {
            id: "ra1",
            title: "Revenue Target at Risk",
            message: "Monthly revenue target is 15% below projection",
            severity: "warning",
            date: "2023-11-21T10:45:18Z",
            category: "revenue",
          },
          {
            id: "ra2",
            title: "Unusual Expense Increase",
            message:
              "Operating expenses increased by 23% compared to last month",
            severity: "warning",
            date: "2023-11-18T08:30:22Z",
            category: "expense",
          },
          {
            id: "ra3",
            title: "Profit Margin Decline",
            message:
              "Profit margin has declined from 38% to 32% in the last quarter",
            severity: "critical",
            date: "2023-11-17T15:12:45Z",
            category: "profit",
          },
        ],
        systemAlerts: [
          {
            id: "sys1",
            title: "System Maintenance",
            message: "Scheduled maintenance on Nov 25 from 2-4 AM",
            severity: "info",
            date: "2023-11-20T17:05:11Z",
            category: "maintenance",
          },
          {
            id: "sys2",
            title: "Database Backup Completed",
            message: "Weekly database backup completed successfully",
            severity: "info",
            date: "2023-11-19T03:15:00Z",
            category: "backup",
            isResolved: true,
          },
          {
            id: "sys3",
            title: "System Update Required",
            message: "New security update available for your system",
            severity: "warning",
            date: "2023-11-15T09:45:33Z",
            category: "update",
          },
        ],
        summary: {
          critical: 2,
          warning: 4,
          info: 3,
          resolved: 1,
        },
        recentAlerts: [
          {
            id: "recent1",
            title: "Laptop Model A Stock Critical",
            type: "stock",
            severity: "critical",
            date: "2023-11-21T09:23:18Z",
          },
          {
            id: "recent2",
            title: "Revenue Target at Risk",
            type: "revenue",
            severity: "warning",
            date: "2023-11-21T10:45:18Z",
          },
          {
            id: "recent3",
            title: "System Maintenance",
            type: "system",
            severity: "info",
            date: "2023-11-20T17:05:11Z",
          },
          {
            id: "recent4",
            title: "Smart Watch Stock Low",
            type: "stock",
            severity: "warning",
            date: "2023-11-20T14:52:33Z",
          },
          {
            id: "recent5",
            title: "Database Backup Completed",
            type: "system",
            severity: "info",
            date: "2023-11-19T03:15:00Z",
            isResolved: true,
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-800",
          icon: <AlertTriangle className="text-red-600" size={20} />,
          badge: "bg-red-100 text-red-800",
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-800",
          icon: <Bell className="text-amber-600" size={20} />,
          badge: "bg-amber-100 text-amber-800",
        };
      case "info":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          icon: <Info className="text-blue-600" size={20} />,
          badge: "bg-blue-100 text-blue-800",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-800",
          icon: <Info className="text-gray-600" size={20} />,
          badge: "bg-gray-100 text-gray-800",
        };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "stock":
        return <Package size={18} />;
      case "revenue":
        return <IndianRupee size={18} />;
      case "system":
        return <RefreshCw size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const getFilteredAlerts = () => {
    let allAlerts = [
      ...alertsData.stockAlerts.map((alert) => ({
        ...alert,
        title: `${alert.name} Stock ${alert.stock <= 5 ? "Critical" : "Low"}`,
        message: `Current stock: ${alert.stock}, Threshold: ${alert.threshold}`,
        type: "stock",
      })),
      ...alertsData.revenueAlerts.map((alert) => ({
        ...alert,
        type: "revenue",
      })),
      ...alertsData.systemAlerts.map((alert) => ({
        ...alert,
        type: "system",
      })),
    ];

    if (filter !== "all") {
      if (filter === "critical" || filter === "warning" || filter === "info") {
        return allAlerts.filter((alert) => alert.severity === filter);
      } else if (filter === "resolved") {
        return allAlerts.filter((alert) => alert.isResolved);
      } else {
        return allAlerts.filter((alert) => alert.type === filter);
      }
    }

    return allAlerts;
  };

  const filteredAlerts = getFilteredAlerts();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
        <button
          onClick={loadAlertsData}
          className="flex items-center bg-amber-100 hover:bg-amber-200 text-amber-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh Alerts
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-5 flex items-center justify-between"
          onClick={() => setFilter("critical")}
        >
          <div>
            <p className="text-red-800 text-sm font-medium mb-1">
              CRITICAL ALERTS
            </p>
            <h3 className="text-2xl font-bold text-red-900">
              {alertsData.summary.critical}
            </h3>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div
          className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-5 flex items-center justify-between"
          onClick={() => setFilter("warning")}
        >
          <div>
            <p className="text-amber-800 text-sm font-medium mb-1">WARNINGS</p>
            <h3 className="text-2xl font-bold text-amber-900">
              {alertsData.summary.warning}
            </h3>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Bell size={24} />
          </div>
        </div>

        <div
          className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-5 flex items-center justify-between"
          onClick={() => setFilter("info")}
        >
          <div>
            <p className="text-blue-800 text-sm font-medium mb-1">
              INFORMATION
            </p>
            <h3 className="text-2xl font-bold text-blue-900">
              {alertsData.summary.info}
            </h3>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Info size={24} />
          </div>
        </div>

        <div
          className="bg-green-50 border border-green-200 rounded-xl shadow-sm p-5 flex items-center justify-between"
          onClick={() => setFilter("resolved")}
        >
          <div>
            <p className="text-green-800 text-sm font-medium mb-1">RESOLVED</p>
            <h3 className="text-2xl font-bold text-green-900">
              {alertsData.summary.resolved}
            </h3>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Filters and List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Filter size={18} className="mr-2" />
                Alert Filters
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "all"
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                All Alerts
              </button>
              <button
                onClick={() => setFilter("stock")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "stock"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                Stock Alerts
              </button>
              <button
                onClick={() => setFilter("revenue")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "revenue"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                Revenue Alerts
              </button>
              <button
                onClick={() => setFilter("system")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "system"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                System Alerts
              </button>
              <button
                onClick={() => setFilter("critical")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "critical"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilter("warning")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "warning"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                Warnings
              </button>
            </div>

            <div className="space-y-4 mt-6">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => {
                  const styles = getSeverityStyles(alert.severity);

                  return (
                    <div
                      key={alert.id}
                      className={`${styles.bg} ${styles.border} ${styles.text} rounded-lg p-4 border transition-all duration-200`}
                    >
                      <div className="flex items-start">
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-white border ${styles.border}`}
                        >
                          {styles.icon}
                        </div>

                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold">
                              {alert.title}
                            </h3>
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}
                              >
                                {alert.severity.charAt(0).toUpperCase() +
                                  alert.severity.slice(1)}
                              </span>
                              {alert.isResolved && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Resolved
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-1 text-sm">{alert.message}</p>

                          <div className="mt-2 flex items-center text-xs">
                            <Clock size={14} className="mr-1" />
                            <span>{getFormattedDate(alert.date)}</span>
                            <span className="inline-block mx-2">•</span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                alert.type === "stock"
                                  ? "bg-purple-100 text-purple-800"
                                  : alert.type === "revenue"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {alert.type.charAt(0).toUpperCase() +
                                alert.type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-gray-50 text-gray-700 p-4 rounded-lg border border-gray-200 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle size={24} className="text-green-500" />
                    <p className="font-medium">
                      No alerts found for the selected filter
                    </p>
                    <button
                      onClick={() => setFilter("all")}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View all alerts
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6 sticky top-20">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Calendar size={18} className="mr-2" />
              Recent Activity
            </h2>

            <div className="relative">
              <div className="absolute h-full border-l border-gray-200 left-4"></div>
              <ul className="space-y-4">
                {alertsData.recentAlerts.map((alert) => {
                  const styles = getSeverityStyles(alert.severity);

                  return (
                    <li key={alert.id} className="ml-10 relative">
                      <div className="absolute -left-10 mt-1.5">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border ${styles.border} bg-white`}
                        >
                          {getTypeIcon(alert.type)}
                        </div>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          alert.isResolved
                            ? "bg-gray-50 border border-gray-200"
                            : `${styles.bg} ${styles.border}`
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <p
                            className={`text-sm font-medium ${
                              alert.isResolved ? "text-gray-500" : styles.text
                            }`}
                          >
                            {alert.title}
                          </p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${styles.badge}`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
                          <span>{getTimeSince(alert.date)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold mb-3">Alert Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-700 mb-1">Critical</p>
                  <p className="text-xl font-bold text-red-800">
                    {alertsData.summary.critical}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 mb-1">Warnings</p>
                  <p className="text-xl font-bold text-amber-800">
                    {alertsData.summary.warning}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 mb-1">Info</p>
                  <p className="text-xl font-bold text-blue-800">
                    {alertsData.summary.info}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-700 mb-1">Resolved</p>
                  <p className="text-xl font-bold text-green-800">
                    {alertsData.summary.resolved}
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors border border-indigo-200 flex items-center justify-center">
              <RefreshCw size={16} className="mr-2" />
              Refresh Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsDashboard;
