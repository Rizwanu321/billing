// components/stock/StockAlerts.jsx
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  Settings,
  Package,
  X,
  Check,
  Clock,
} from "lucide-react";
import { fetchStockAlerts, updateAlertSettings } from "../../api/stock";
import { toast } from "react-hot-toast";

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    emailNotifications: false,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchStockAlerts();
      setAlerts(data);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      await updateAlertSettings(settings);
      toast.success("Alert settings updated successfully");
      setShowSettings(false);
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const AlertCard = ({ alert }) => {
    const getSeverityColor = (severity) => {
      switch (severity) {
        case "critical":
          return "bg-red-50 border-red-200 text-red-800";
        case "warning":
          return "bg-orange-50 border-orange-200 text-orange-800";
        default:
          return "bg-blue-50 border-blue-200 text-blue-800";
      }
    };

    const getSeverityIcon = (severity) => {
      switch (severity) {
        case "critical":
          return <AlertTriangle className="w-5 h-5 text-red-600" />;
        case "warning":
          return <Bell className="w-5 h-5 text-orange-600" />;
        default:
          return <Package className="w-5 h-5 text-blue-600" />;
      }
    };

    return (
      <div
        className={`p-4 rounded-lg border ${getSeverityColor(
          alert.severity
        )} transition-all hover:shadow-md`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getSeverityIcon(alert.severity)}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{alert.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
                {alert.product && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {alert.product.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8 animate-fadeIn">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
              <Bell className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                Stock Alerts
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                Manage stock alerts and notifications
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-medium w-full sm:w-auto justify-center"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Alert Settings
          </button>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fadeIn">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-5 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-xs sm:text-sm font-medium mb-1">
                  Critical Alerts
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-red-800">
                  {alerts.filter((a) => a.severity === "critical").length}
                </p>
              </div>
              <div className="bg-red-200 p-2 sm:p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 sm:p-5 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-xs sm:text-sm font-medium mb-1">
                  Warning Alerts
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-800">
                  {alerts.filter((a) => a.severity === "warning").length}
                </p>
              </div>
              <div className="bg-orange-200 p-2 sm:p-3 rounded-xl">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs sm:text-sm font-medium mb-1">Info Alerts</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-800">
                  {alerts.filter((a) => a.severity === "info").length}
                </p>
              </div>
              <div className="bg-blue-200 p-2 sm:p-3 rounded-xl">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max">
              {["active", "resolved", "all"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize transition-all ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab} Alerts
                </button>
              ))}
            </div>
          </div>

          {/* Alerts List */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading alerts...</p>
                </div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">No alerts found</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {alerts.map((alert) => (
                  <AlertCard key={alert._id} alert={alert} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 animate-scaleIn">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Alert Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      lowStockThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Critical Stock Threshold
                </label>
                <input
                  type="number"
                  value={settings.criticalStockThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      criticalStockThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Email Notifications
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smsNotifications: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    SMS Notifications
                  </span>
                </label>
              </div>
            </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettingsUpdate}
                  className="px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlerts;
