// components/stock/widgets/StockHealthCheck.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertCircle, XCircle, Package } from "lucide-react";

const StockHealthCheck = ({ products }) => {
  const { t } = useTranslation();
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
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />;
    if (score >= 60) return <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" />;
    return <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-600" />;
  };

  const getHealthBg = (score) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-100";
    if (score >= 60) return "bg-amber-50 border-amber-100";
    return "bg-rose-50 border-rose-100";
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className={`text-center p-6 rounded-2xl ${getHealthBg(healthScore)} border`}>
        <div className="flex justify-center mb-3">
          {getHealthIcon(healthScore)}
        </div>
        <p className={`text-4xl font-bold ${getHealthColor(healthScore)} mb-1 tracking-tight`}>
          {healthScore}%
        </p>
        <p className="text-sm text-slate-600 font-semibold">{t('stock.overallStockHealth')}</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{t('stock.healthyStock')}</span>
          </div>
          <span className="font-bold text-slate-800">
            {healthMetrics.healthy}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{t('stock.lowStock')}</span>
          </div>
          <span className="font-bold text-slate-800">
            {healthMetrics.warning}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{t('stock.outOfStock')}</span>
          </div>
          <span className="font-bold text-slate-800">
            {healthMetrics.critical}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default opacity-60 hover:opacity-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Package size={18} />
            </div>
            <span className="text-sm font-semibold text-slate-600">{t('stock.noStockRequired')}</span>
          </div>
          <span className="font-bold text-slate-800">
            {healthMetrics.noStockRequired}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockHealthCheck;