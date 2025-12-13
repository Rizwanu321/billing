// components/stock/widgets/RecentMovementsWidget.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  RotateCcw,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Truck,
  AlertCircle,
  Plus,
  Minus,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom"; // Assuming router usage

const RecentMovementsWidget = ({ movements = [] }) => {
  const { t } = useTranslation();
  const recentMovements = movements.slice(0, 5);

  const getMovementIcon = (movement) => {
    if (movement.adjustmentType) {
      const iconMap = {
        purchase: <ShoppingCart className="w-4 h-4 text-emerald-600" />,
        return_from_customer: <RotateCcw className="w-4 h-4 text-indigo-600" />,
        production: <Package className="w-4 h-4 text-emerald-600" />,
        found: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        adjustment_positive: <Plus className="w-4 h-4 text-emerald-600" />,
        damaged: <XCircle className="w-4 h-4 text-rose-600" />,
        expired: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        lost: <AlertCircle className="w-4 h-4 text-rose-600" />,
        theft: <AlertTriangle className="w-4 h-4 text-rose-800" />,
        return_to_supplier: <Truck className="w-4 h-4 text-amber-600" />,
        quality_issue: <XCircle className="w-4 h-4 text-rose-600" />,
        adjustment_negative: <Minus className="w-4 h-4 text-rose-600" />,
        sale: <ShoppingCart className="w-4 h-4 text-amber-600" />,
        initial: <Package className="w-4 h-4 text-indigo-600" />,
      };
      return iconMap[movement.adjustmentType] || getDefaultIcon(movement);
    }
    return getDefaultIcon(movement);
  };

  const getDefaultIcon = (movement) => {
    switch (movement.type) {
      case "initial": return <Package className="w-4 h-4 text-indigo-600" />;
      case "addition": return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case "removal": return <TrendingDown className="w-4 h-4 text-rose-600" />;
      case "sale": return <ShoppingCart className="w-4 h-4 text-amber-600" />;
      case "return": return <RotateCcw className="w-4 h-4 text-indigo-600" />;
      case "adjustment": return <RefreshCw className="w-4 h-4 text-indigo-600" />;
      default: return movement.adjustment > 0 ?
        <TrendingUp className="w-4 h-4 text-emerald-600" /> :
        <TrendingDown className="w-4 h-4 text-rose-600" />;
    }
  };

  const getMovementDescription = (movement) => {
    const descriptions = {
      purchase: t('stock.purchased'),
      return_from_customer: "Customer Return",
      production: "Produced",
      found: "Found",
      adjustment_positive: "Adjustment (+)",
      damaged: "Damaged",
      expired: "Expired",
      lost: "Lost",
      theft: "Theft",
      return_to_supplier: "Return to Supplier",
      quality_issue: "Quality Issue",
      adjustment_negative: "Adjustment (-)",
      sale: "Sold",
      initial: "Initial Stock",
    };
    return descriptions[movement.adjustmentType] || (movement.adjustment > 0 ? t('stock.added') : t('stock.removed'));
  };

  const getMovementColor = (movement) => {
    // Simplifying backgrounds for cleaner UI
    return "bg-slate-50";
  };

  const formatDate = (date) => {
    const now = new Date();
    const moveDate = new Date(date);
    const diffInHours = (now - moveDate) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return moveDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full">
      {recentMovements.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center">
          <Activity className="w-12 h-12 text-slate-200 mb-3" strokeWidth={1.5} />
          <p className="text-slate-500 font-medium">No recent activity</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {recentMovements.map((movement) => (
            <div
              key={movement._id}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${movement.adjustment > 0 ? "bg-emerald-50" : movement.type === 'sale' ? "bg-amber-50" : "bg-rose-50"
                }`}>
                {getMovementIcon(movement)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {movement.product?.name || "Unknown Product"}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full whitespace-nowrap ml-2">
                    {formatDate(movement.timestamp)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    {getMovementDescription(movement)}
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    {Math.abs(movement.adjustment)} {movement.unit || "units"}
                  </p>

                  <span className={`text-xs font-bold ${movement.adjustment > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}>
                    {movement.adjustment > 0 ? "+" : ""}{movement.adjustment}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentMovements.length > 0 && (
        <div className="p-4 border-t border-slate-50 bg-slate-50/30">
          <Link to="/inventory/movements" className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide py-1">
            {t('stock.viewAllMovements')} <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentMovementsWidget;
