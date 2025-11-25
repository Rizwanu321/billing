// components/stock/StockAdjustment.jsx - Complete Professional Version

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Minus,
  RefreshCw,
  Save,
  AlertCircle,
  X,
  ShoppingCart,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import { fetchProducts } from "../../api/products";
import { batchStockAdjustment } from "../../api/stock";
import { toast } from "react-hot-toast";

const StockAdjustment = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Professional adjustment types with proper categorization
  const adjustmentTypes = {
    additions: {
      label: "Stock Additions",
      icon: TrendingUp,
      color: "green",
      types: [
        {
          value: "purchase",
          label: "New Purchase",
          icon: ShoppingCart,
          description: "Stock received from supplier",
          requiresReference: true,
          referenceLabel: "Purchase Order #",
        },
        {
          value: "return_from_customer",
          label: "Customer Return",
          icon: RotateCcw,
          description: "Products returned by customer",
          requiresReference: true,
          referenceLabel: "Return Reference #",
        },
        {
          value: "production",
          label: "Production Output",
          icon: Package,
          description: "Manufactured/produced items",
          requiresReference: false,
        },
        {
          value: "found",
          label: "Found/Recovered",
          icon: CheckCircle,
          description: "Previously missing items found",
          requiresReference: false,
        },
        {
          value: "adjustment_positive",
          label: "Positive Adjustment",
          icon: Plus,
          description: "Inventory count correction (increase)",
          requiresReference: false,
        },
      ],
    },
    removals: {
      label: "Stock Removals",
      icon: TrendingDown,
      color: "red",
      types: [
        {
          value: "damaged",
          label: "Damaged Goods",
          icon: XCircle,
          description: "Products damaged beyond sale",
          requiresReference: false,
        },
        {
          value: "expired",
          label: "Expired Products",
          icon: AlertTriangle,
          description: "Products past expiry date",
          requiresReference: false,
        },
        {
          value: "lost",
          label: "Lost/Missing",
          icon: AlertCircle,
          description: "Items that cannot be located",
          requiresReference: false,
        },
        {
          value: "theft",
          label: "Theft",
          icon: AlertTriangle,
          description: "Stolen merchandise",
          requiresReference: true,
          referenceLabel: "Report #",
        },
        {
          value: "return_to_supplier",
          label: "Return to Supplier",
          icon: Truck,
          description: "Products returned to supplier",
          requiresReference: true,
          referenceLabel: "Return Order #",
        },
        {
          value: "quality_issue",
          label: "Quality Issues",
          icon: XCircle,
          description: "Failed quality control",
          requiresReference: false,
        },
        {
          value: "adjustment_negative",
          label: "Negative Adjustment",
          icon: Minus,
          description: "Inventory count correction (decrease)",
          requiresReference: false,
        },
      ],
    },
  };

  // Predefined reasons for quick selection
  const quickReasons = {
    damaged: [
      "Water damage",
      "Physical damage during handling",
      "Manufacturing defect discovered",
      "Packaging damaged",
    ],
    expired: [
      "Past expiry date",
      "Short dated - removed from sale",
      "Quality deteriorated",
    ],
    lost: [
      "Cannot locate in warehouse",
      "Missing from last inventory count",
      "Misplaced during reorganization",
    ],
    purchase: [
      "Regular stock replenishment",
      "Seasonal stock purchase",
      "New product line addition",
    ],
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data.filter((p) => p.isStockRequired));
    } catch (error) {
      toast.error("Failed to load products");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProductForAdjustment = (product) => {
    if (!selectedProducts.find((p) => p._id === product._id)) {
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          adjustmentQuantity: product.minQuantity || 1,
        },
      ]);
    }
  };

  const updateAdjustment = (productId, field, value) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p._id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const removeProductFromAdjustment = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };

  const getSelectedAdjustmentType = () => {
    if (!adjustmentType) return null;

    for (const category of Object.values(adjustmentTypes)) {
      const found = category.types.find((t) => t.value === adjustmentType);
      if (found) return { ...found, category: category.label };
    }
    return null;
  };

  const handleBulkAdjustment = async () => {
    const selectedType = getSelectedAdjustmentType();

    if (!adjustmentType) {
      toast.error("Please select an adjustment type");
      return;
    }

    if (!adjustmentReason && !customReason) {
      toast.error("Please provide a reason for adjustment");
      return;
    }

    if (selectedType?.requiresReference && !referenceNumber) {
      toast.error(`Please provide ${selectedType.referenceLabel}`);
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      setLoading(true);

      const isRemoval = Object.values(adjustmentTypes.removals.types).some(
        (t) => t.value === adjustmentType
      );

      const adjustments = selectedProducts.map((product) => ({
        productId: product._id,
        type: isRemoval ? "remove" : "add",
        quantity: product.adjustmentQuantity,
        adjustmentType: adjustmentType,
        reason: customReason || adjustmentReason,
        reference: referenceNumber || null,
      }));

      await batchStockAdjustment({
        adjustments,
        reason: customReason || adjustmentReason,
        type: adjustmentType,
        reference: referenceNumber,
      });

      toast.success("Stock adjusted successfully");

      // Reset form
      setSelectedProducts([]);
      setAdjustmentType("");
      setAdjustmentReason("");
      setCustomReason("");
      setReferenceNumber("");
      loadProducts();
    } catch (error) {
      toast.error(error.message || "Failed to adjust stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fadeIn">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
              <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                Stock Adjustment
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                Make professional stock adjustments with proper tracking
              </p>
            </div>
          </div>
        </div>

        {/* Adjustment Type Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 animate-fadeIn">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            Select Adjustment Type
          </h3>

          <div className="space-y-4 sm:space-y-6">
            {Object.entries(adjustmentTypes).map(([key, category]) => (
              <div key={key}>
                <h4 className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  <category.icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-${category.color}-600`}
                  />
                  {category.label}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {category.types.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setAdjustmentType(type.value);
                        setAdjustmentReason("");
                        setReferenceNumber("");
                      }}
                      className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        adjustmentType === type.value
                          ? `border-${category.color}-500 bg-${category.color}-50 shadow-sm`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <type.icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${
                            adjustmentType === type.value
                              ? `text-${category.color}-600`
                              : "text-gray-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1">
                            {type.label}
                          </h5>
                          <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {adjustmentType && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fadeIn">
            {/* Product Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                Select Products
              </h3>

              {/* Search */}
              <div className="relative mb-3 sm:mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Products List */}
              <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.find(
                    (p) => p._id === product._id
                  );

                  return (
                    <div
                      key={product._id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() =>
                        !isSelected && addProductForAdjustment(product)
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>
                              Current: {product.stock} {product.unit}
                            </span>
                            <span>•</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adjustment Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Adjustment Details
              </h3>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 px-4">
                    Select products from the left to adjust stock
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Selected Type Info */}
                  {(() => {
                    const selectedType = getSelectedAdjustmentType();
                    return selectedType ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <selectedType.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-medium text-blue-900">
                              {selectedType.label}
                            </h4>
                            <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
                              {selectedType.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Reference Number if required */}
                  {(() => {
                    const selectedType = getSelectedAdjustmentType();
                    return selectedType?.requiresReference ? (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          {selectedType.referenceLabel}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder={`Enter ${selectedType.referenceLabel.toLowerCase()}`}
                          />
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Selected Products */}
                  <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {selectedProducts.map((product) => {
                      const isRemoval = Object.values(
                        adjustmentTypes.removals.types
                      ).some((t) => t.value === adjustmentType);

                      return (
                        <div
                          key={product._id}
                          className="p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Current: {product.stock} {product.unit}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                removeProductFromAdjustment(product._id)
                              }
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isRemoval ? (
                                <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                              ) : (
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                              )}
                              <span
                                className={`text-sm sm:text-base font-medium ${
                                  isRemoval ? "text-red-600" : "text-green-600"
                                }`}
                              >
                                {isRemoval ? "Remove" : "Add"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="number"
                                value={product.adjustmentQuantity}
                                onChange={(e) =>
                                  updateAdjustment(
                                    product._id,
                                    "adjustmentQuantity",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                min={product.minQuantity || 0.01}
                                step={product.minQuantity || 0.01}
                                className="flex-1 px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 transition-all"
                              />

                              <span className="px-2 sm:px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap">
                                {product.unit}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
                            <span className="text-gray-600">
                              New stock:
                            </span>
                            <span
                              className={`font-bold ${
                                isRemoval
                                  ? product.stock - product.adjustmentQuantity <
                                    0
                                    ? "text-red-600"
                                    : "text-gray-900"
                                  : "text-gray-900"
                              }`}
                            >
                              {isRemoval
                                ? Math.max(
                                    0,
                                    product.stock - product.adjustmentQuantity
                                  )
                                : product.stock +
                                  product.adjustmentQuantity}{" "}
                              {product.unit}
                            </span>
                          </div>

                          {isRemoval &&
                            product.stock - product.adjustmentQuantity < 0 && (
                              <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                                ⚠️ Insufficient stock! Max: {product.stock} {product.unit}
                              </p>
                            )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Reason Selection/Input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Reason for Adjustment{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    {/* Quick Reasons */}
                    {quickReasons[adjustmentType] && (
                      <div className="mb-2 sm:mb-3">
                        <p className="text-xs text-gray-500 mb-1 sm:mb-2">
                          Quick select:
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {quickReasons[adjustmentType].map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                setAdjustmentReason(reason);
                                setCustomReason("");
                              }}
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-all ${
                                adjustmentReason === reason
                                  ? "bg-blue-100 text-blue-700 border border-blue-300 shadow-sm"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <textarea
                      value={customReason}
                      onChange={(e) => {
                        setCustomReason(e.target.value);
                        setAdjustmentReason("");
                      }}
                      rows="3"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                      placeholder={
                        adjustmentReason
                          ? "Or enter a custom reason..."
                          : "Enter reason for adjustment..."
                      }
                    />
                    {adjustmentReason && !customReason && (
                      <p className="text-xs text-blue-600 mt-1">
                        Selected: {adjustmentReason}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 border border-gray-200">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      Adjustment Summary
                    </h4>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900">
                          {getSelectedAdjustmentType()?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Products:</span>
                        <span className="font-medium text-gray-900">
                          {selectedProducts.length} selected
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total items:</span>
                        <span className="font-medium text-gray-900">
                          {selectedProducts.reduce(
                            (sum, p) => sum + p.adjustmentQuantity,
                            0
                          )}{" "}
                          units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
                    <div className="flex gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-yellow-800">
                        <p className="font-medium mb-1">Important Notice</p>
                        <p className="leading-relaxed">
                          This adjustment will be permanently recorded in the
                          stock history with full audit trail including user,
                          timestamp, and reason.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleBulkAdjustment}
                    disabled={
                      loading ||
                      !adjustmentType ||
                      (!adjustmentReason && !customReason) ||
                      selectedProducts.length === 0
                    }
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="hidden sm:inline">
                          Processing Adjustment...
                        </span>
                        <span className="sm:hidden">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">
                          Apply Stock Adjustment
                        </span>
                        <span className="sm:hidden">Apply Adjustment</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAdjustment;
