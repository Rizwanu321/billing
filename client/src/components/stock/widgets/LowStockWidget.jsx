// components/stock/widgets/LowStockWidget.jsx
import React from "react";
import { AlertTriangle, Package, ChefHat } from "lucide-react";

const LowStockWidget = ({ products }) => {
  const lowStockProducts = products
    .filter((p) => p.isStockRequired && p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="w-full">
      {lowStockProducts.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <p className="text-slate-800 font-bold">Stock Levels Healthy</p>
          <p className="text-sm text-slate-500 mt-1">All products have sufficient stock</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {lowStockProducts.map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 truncate uppercase tracking-wider">
                    {product.category?.name || "Uncategorized"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-amber-600">
                  {product.stock} <span className="text-[10px] text-amber-400 font-medium uppercase">{product.unit || 'Units'}</span>
                </p>
                <div className="w-full bg-slate-100 h-1 mt-1 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((product.stock / 10) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LowStockWidget;