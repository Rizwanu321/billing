import React from "react";
import {
  Plus,
  Minus,
  X,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

const StockAdjustmentModal = ({
  currentProduct,
  stockAdjustment,
  setStockAdjustment,
  onSubmit,
  onClose,
  error,
  isLoading,
}) => {
  const formatUnitDisplay = (unit, quantity) => {
    if (quantity === 1) return unit;
    switch (unit) {
      case "kg":
        return "kgs";
      case "box":
        return "boxes";
      case "piece":
        return "pieces";
      default:
        return unit + "s";
    }
  };

  const unit = currentProduct?.unit || "piece";
  const minStep = currentProduct?.minQuantity || 0.01;
  const currentStock = currentProduct?.stock || 0;
  const newStock =
    stockAdjustment.type === "add"
      ? currentStock + parseFloat(stockAdjustment.quantity || 0)
      : currentStock - parseFloat(stockAdjustment.quantity || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Adjust Stock</h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {currentProduct?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Current Stock Display */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                Current Stock
              </span>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {currentStock} {formatUnitDisplay(unit, currentStock)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentStock === 0
                    ? "bg-red-500"
                    : currentStock <= 10
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(
                    (currentStock / Math.max(currentStock, 100)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit}>
            {/* Adjustment Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setStockAdjustment({ ...stockAdjustment, type: "add" })
                  }
                  className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                    stockAdjustment.type === "add"
                      ? "bg-green-100 text-green-700 border-2 border-green-500 shadow-md"
                      : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      stockAdjustment.type === "add"
                        ? "bg-green-200"
                        : "bg-gray-200"
                    }`}
                  >
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">Add Stock</span>
                  <TrendingUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStockAdjustment({ ...stockAdjustment, type: "remove" })
                  }
                  className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                    stockAdjustment.type === "remove"
                      ? "bg-red-100 text-red-700 border-2 border-red-500 shadow-md"
                      : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      stockAdjustment.type === "remove"
                        ? "bg-red-200"
                        : "bg-gray-200"
                    }`}
                  >
                    <Minus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">Remove Stock</span>
                  <TrendingDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity ({unit})
              </label>
              <input
                type="number"
                value={stockAdjustment.quantity}
                onChange={(e) =>
                  setStockAdjustment({
                    ...stockAdjustment,
                    quantity: e.target.value,
                  })
                }
                min={minStep}
                step={minStep}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold transition-all duration-200"
                placeholder={`Enter quantity in ${unit}`}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Minimum step: {minStep} {unit}
              </p>
            </div>

            {/* Preview */}
            {stockAdjustment.quantity > 0 && (
              <div
                className={`mb-6 p-4 rounded-xl border-2 ${
                  stockAdjustment.type === "add"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    New Stock Level
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{currentStock}</span>
                    <span className="text-gray-400">→</span>
                    <span
                      className={`text-xl font-bold ${
                        stockAdjustment.type === "add"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {newStock.toFixed(2)} {formatUnitDisplay(unit, newStock)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  stockAdjustment.type === "add"
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `${stockAdjustment.type === "add" ? "Add" : "Remove"} Stock`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
