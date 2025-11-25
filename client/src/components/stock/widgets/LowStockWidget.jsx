// components/stock/widgets/LowStockWidget.jsx
import React from "react";
import { AlertTriangle, Package } from "lucide-react";

const LowStockWidget = ({ products }) => {
  const lowStockProducts = products
    .filter((p) => p.isStockRequired && p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Low Stock Alert</h3>
        <div className="bg-orange-100 p-2 rounded-lg">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
          <p className="text-sm sm:text-base text-gray-500">All products have sufficient stock</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {lowStockProducts.map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 hover:shadow-md transition-all"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{product.name}</p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {product.category?.name || "Uncategorized"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm sm:text-base text-orange-600">
                  {product.stock} {product.unit}
                </p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LowStockWidget;