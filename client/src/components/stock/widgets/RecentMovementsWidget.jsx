// components/stock/widgets/RecentMovementsWidget.jsx
import React from "react";
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
} from "lucide-react";

const RecentMovementsWidget = ({ movements = [] }) => {
  const recentMovements = movements.slice(0, 5);

  const getMovementIcon = (movement) => {
    // Check for specific adjustment types first
    if (movement.adjustmentType) {
      const iconMap = {
        // Additions
        purchase: <ShoppingCart className="w-4 h-4 text-green-600" />,
        return_from_customer: <RotateCcw className="w-4 h-4 text-blue-600" />,
        production: <Package className="w-4 h-4 text-green-600" />,
        found: <CheckCircle className="w-4 h-4 text-green-600" />,
        adjustment_positive: <Plus className="w-4 h-4 text-green-600" />,
        // Removals
        damaged: <XCircle className="w-4 h-4 text-red-600" />,
        expired: <AlertTriangle className="w-4 h-4 text-orange-600" />,
        lost: <AlertCircle className="w-4 h-4 text-red-600" />,
        theft: <AlertTriangle className="w-4 h-4 text-red-800" />,
        return_to_supplier: <Truck className="w-4 h-4 text-orange-600" />,
        quality_issue: <XCircle className="w-4 h-4 text-red-600" />,
        adjustment_negative: <Minus className="w-4 h-4 text-red-600" />,
        // Sales
        sale: <ShoppingCart className="w-4 h-4 text-orange-600" />,
        initial: <Package className="w-4 h-4 text-blue-600" />,
      };
      return iconMap[movement.adjustmentType] || getDefaultIcon(movement);
    }

    return getDefaultIcon(movement);
  };

  const getDefaultIcon = (movement) => {
    // Check by type
    switch (movement.type) {
      case "initial":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "addition":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "removal":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "sale":
        return <ShoppingCart className="w-4 h-4 text-orange-600" />;
      case "return":
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      case "adjustment":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        // Fallback based on adjustment value
        return movement.adjustment > 0 ? (
          <TrendingUp className="w-4 h-4 text-green-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-600" />
        );
    }
  };

  const getMovementDescription = (movement) => {
    // Map of adjustment types to user-friendly descriptions
    const descriptions = {
      // Additions
      purchase: "Purchased",
      return_from_customer: "Customer Return",
      production: "Produced",
      found: "Found/Recovered",
      adjustment_positive: "Positive Adjustment",
      // Removals
      damaged: "Removed (Damaged)",
      expired: "Removed (Expired)",
      lost: "Lost/Missing",
      theft: "Theft Reported",
      return_to_supplier: "Returned to Supplier",
      quality_issue: "Removed (Quality Issue)",
      adjustment_negative: "Negative Adjustment",
      // Sales and others
      sale: "Sold",
      initial: "Initial Stock",
    };

    if (movement.adjustmentType && descriptions[movement.adjustmentType]) {
      return descriptions[movement.adjustmentType];
    }

    // Fallback to type-based descriptions
    switch (movement.type) {
      case "initial":
        return "Initial Stock";
      case "addition":
        return "Added";
      case "removal":
        return "Removed";
      case "sale":
        return "Sold";
      case "return":
        return "Returned";
      case "adjustment":
        return movement.adjustment > 0
          ? "Adjusted (Added)"
          : "Adjusted (Removed)";
      default:
        return movement.adjustment > 0 ? "Added" : "Removed";
    }
  };

  const getMovementColor = (movement) => {
    // Determine background color based on movement type
    if (movement.adjustmentType) {
      const colorMap = {
        // Positive movements - green shades
        purchase: "bg-green-50",
        return_from_customer: "bg-blue-50",
        production: "bg-green-50",
        found: "bg-green-50",
        adjustment_positive: "bg-green-50",
        // Negative movements - red/orange shades
        damaged: "bg-red-50",
        expired: "bg-orange-50",
        lost: "bg-red-50",
        theft: "bg-red-100",
        return_to_supplier: "bg-orange-50",
        quality_issue: "bg-red-50",
        adjustment_negative: "bg-red-50",
        // Neutral
        sale: "bg-orange-50",
        initial: "bg-blue-50",
      };
      return colorMap[movement.adjustmentType] || "hover:bg-gray-50";
    }

    // Fallback based on adjustment value
    return movement.adjustment > 0 ? "bg-green-50" : "bg-red-50";
  };

  const formatDate = (date) => {
    const now = new Date();
    const moveDate = new Date(date);
    const diffInHours = (now - moveDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return moveDate.toLocaleDateString();
    }
  };

  const formatQuantity = (movement) => {
    const quantity = Math.abs(movement.adjustment);
    const unit = movement.unit || "units";

    // Format unit properly (singular/plural)
    const formatUnit = (unit, qty) => {
      if (qty === 1) return unit;

      switch (unit) {
        case "piece":
          return "pieces";
        case "box":
          return "boxes";
        case "kg":
          return "kg";
        case "gram":
          return "grams";
        case "liter":
          return "liters";
        case "ml":
          return "ml";
        case "packet":
          return "packets";
        case "dozen":
          return "dozens";
        default:
          return unit + "s";
      }
    };

    return `${quantity} ${formatUnit(unit, quantity)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Activity className="w-5 h-5 text-blue-600" />
      </div>

      {recentMovements.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent stock movements</p>
          <p className="text-xs text-gray-400 mt-1">
            Stock changes will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentMovements.map((movement) => (
            <div
              key={movement._id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${getMovementColor(
                movement
              )}`}
            >
              <div className="mt-1">{getMovementIcon(movement)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {movement.product?.name || "Unknown Product"}
                </p>
                <p className="text-sm text-gray-700">
                  {getMovementDescription(movement)} {formatQuantity(movement)}
                </p>
                {movement.reference && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ref: {movement.reference}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(movement.timestamp)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-gray-900">
                  {movement.newStock} {movement.unit || "units"}
                </p>
                <p className="text-xs text-gray-500">Current stock</p>
                {movement.adjustment > 0 ? (
                  <p className="text-xs text-green-600 font-medium">
                    +{movement.adjustment}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 font-medium">
                    {movement.adjustment}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {recentMovements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href="/stock/movements"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
          >
            View all movements
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default RecentMovementsWidget;
