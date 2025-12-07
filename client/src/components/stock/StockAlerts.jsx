import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  Settings,
  Package,
  X,
  Check,
  Clock,
  Filter,
  ChevronRight,
  ShieldAlert,
  Info
} from "lucide-react";
import { fetchStockAlerts, updateAlertSettings, fetchAlertSettings } from "../../api/stock";
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
  const [filter, setFilter] = useState("all"); // all, critical, warning

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, settingsData] = await Promise.all([
        fetchStockAlerts(),
        fetchAlertSettings()
      ]);
      setAlerts(alertsData);
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error loading stock data:", error);
      toast.error("Failed to load alerts info");
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await fetchStockAlerts();
      setAlerts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      await updateAlertSettings(settings);
      toast.success("Alert settings updated successfully");
      setShowSettings(false);
      loadAlerts(); // Reload to reflect changes if any backend logic uses stats
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "all") return true;
    return alert.severity === filter;
  });

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-rose-50",
          border: "border-rose-100",
          itemBorder: "border-rose-200",
          text: "text-rose-700",
          iconBg: "bg-rose-100",
          iconColor: "text-rose-600",
          icon: AlertTriangle
        };
      case "warning":
        return {
          bg: "bg-amber-50",
          border: "border-amber-100",
          itemBorder: "border-amber-200",
          text: "text-amber-700",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          icon: Bell
        };
      default:
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-100",
          itemBorder: "border-indigo-200",
          text: "text-indigo-700",
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
          icon: Info
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-8 py-4 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <ShieldAlert className="text-indigo-600" size={28} />
              Stock Alerts
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-10">Real-time inventory notifications</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-sm"
            >
              <Settings size={18} />
              <span>Configure Rules</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-bold text-slate-700">Critical</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {alerts.filter(a => a.severity === 'critical').length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Stock below {settings.criticalStockThreshold} units</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Bell size={20} />
                </div>
                <h3 className="font-bold text-slate-700">Warning</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {alerts.filter(a => a.severity === 'warning').length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Stock below {settings.lowStockThreshold} units</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Package size={20} />
                </div>
                <h3 className="font-bold text-slate-700">Total Alerts</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {alerts.length}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active notifications</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          {/* Filters Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter("critical")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'critical' ? 'bg-rose-500' : 'bg-rose-400'}`} />
              Critical
            </button>
            <button
              onClick={() => setFilter("warning")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filter === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filter === 'warning' ? 'bg-amber-500' : 'bg-amber-400'}`} />
              Warnings
            </button>
          </div>

          {/* Alerts List */}
          <div className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium">Scanning inventory...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="bg-emerald-50 p-6 rounded-full mb-4 ring-8 ring-emerald-50/50">
                  <Check size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">All Clear!</h3>
                <p className="text-slate-500 max-w-sm">No stock alerts found matching your criteria. Your inventory levels are looking healthy.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredAlerts.map(alert => {
                  const styles = getSeverityStyles(alert.severity);
                  const Icon = styles.icon;

                  return (
                    <div key={alert._id} className="group p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                      {/* Icon Status */}
                      <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={styles.text} size={24} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-slate-800 truncate">{alert.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{alert.message}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                          {alert.product && (
                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                              <Package size={12} />
                              {alert.product.category?.name || 'Item'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400 font-bold uppercase">Current Stock</p>
                          <p className={`text-lg font-bold ${styles.text}`}>
                            {Number(alert.product?.stock).toFixed(2).replace(/\.00$/, '')} <span className="text-xs">{alert.product?.unit}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Alert Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Warning Threshold (Low Stock)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-slate-800 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">Units</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Critical Threshold (Very Low)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.criticalStockThreshold}
                    onChange={(e) => setSettings({ ...settings, criticalStockThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full pl-4 pr-12 py-3 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-bold text-rose-800 outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-400 uppercase">Units</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notifications</p>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Email Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">SMS Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>

              <div className="flex gap-3 mt-8 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettingsUpdate}
                  className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
