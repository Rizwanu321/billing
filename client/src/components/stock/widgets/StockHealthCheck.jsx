// Complete components/stock/widgets/StockHealthCheck.jsx

import React from "react";
import { CheckCircle, AlertCircle, XCircle, Package } from "lucide-react";

const StockHealthCheck = ({ products }) => {
  const healthMetrics = {
    healthy: products.filter((p) => p.isStockRequired && p.stock > 10).length,
    warning: products.filter(
      (p) => p.isStockRequired && p.stock > 0 && p.stock <= 10
    ).length,
    critical: products.filter((p) => p.isStockRequired && p.stock === 0).length,
    noStockRequired: products.filter((p) => !p.isStockRequired).length,
  };

  const totalManaged = products.filter((p) => p.isStockRequired).length;
  const healthScore =
    totalManaged > 0
      ? Math.round((healthMetrics.healthy / totalManaged) * 100)
      : 0;

  const getHealthColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600" />;
    return <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />;
  };

  const getHealthBg = (score) => {
    if (score >= 80) return "from-green-50 to-emerald-50";
    if (score >= 60) return "from-yellow-50 to-orange-50";
    return "from-red-50 to-pink-50";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Stock Health Overview</h3>

      <div className={`text-center mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br ${getHealthBg(healthScore)} border border-gray-200`}>
        <div className="flex justify-center mb-2 sm:mb-3">
          {getHealthIcon(healthScore)}
        </div>
        <p className={`text-3xl sm:text-4xl font-bold ${getHealthColor(healthScore)} mb-1`}>
          {healthScore}%
        </p>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">Overall Stock Health</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-gray-900">Healthy Stock</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-green-600">
            {healthMetrics.healthy}
          </span>
        </div>

        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-gray-900">Low Stock</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-yellow-600">
            {healthMetrics.warning}
          </span>
        </div>

        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-gray-900">Out of Stock</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-red-600">
            {healthMetrics.critical}
          </span>
        </div>

        <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-gray-900">No Stock Required</span>
          </div>
          <span className="text-sm sm:text-base font-bold text-gray-600">
            {healthMetrics.noStockRequired}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockHealthCheck;