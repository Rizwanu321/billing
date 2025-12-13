import React from "react";
import {
  Package,
  Clock,
  Edit2,
  Trash2,
  MoreVertical,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ProductList = ({
  products,
  onEdit,
  onStockAdjust,
  onDelete,
  onStockHistory,
  viewMode = "grid",
}) => {
  const { t } = useTranslation();
  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductListItem
            key={product._id}
            product={product}
            onEdit={() => onEdit(product)}
            onStockAdjust={() => onStockAdjust(product)}
            onDelete={() => onDelete(product._id)}
            onStockHistory={() => onStockHistory(product)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onEdit={() => onEdit(product)}
          onStockAdjust={() => onStockAdjust(product)}
          onDelete={() => onDelete(product._id)}
          onStockHistory={() => onStockHistory(product)}
        />
      ))}
    </div>
  );
};

const ProductCard = ({
  product,
  onEdit,
  onStockAdjust,
  onDelete,
  onStockHistory,
}) => {
  const { t } = useTranslation();
  const getCategoryName = () => {
    if (!product.category) return "Uncategorized";
    return product.category.name || "Uncategorized";
  };

  const formatUnitDisplay = (unit, stock) => {
    if (stock === 1) return unit;
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

  const getStockStatus = () => {
    if (!product.isStockRequired) {
      return {
        className: "bg-gray-100 text-gray-700 border-gray-200",
        text: t('products.noStockTracking'),
        icon: null,
      };
    }

    const stockDisplay = `${Number(product.stock).toFixed(2)} ${formatUnitDisplay(
      product.unit,
      product.stock
    )}`;

    if (product.stock === 0) {
      return {
        className: "bg-red-100 text-red-700 border-red-200",
        text: t('products.outOfStock'),
        icon: <TrendingDown className="w-3 h-3" />,
      };
    }

    if (product.stock <= 10) {
      return {
        className: "bg-amber-100 text-amber-700 border-amber-200",
        text: `${t('products.low')}: ${stockDisplay}`,
        icon: <TrendingDown className="w-3 h-3" />,
      };
    }

    return {
      className: "bg-green-100 text-green-700 border-green-200",
      text: `${t('products.stock')}: ${stockDisplay}`,
      icon: <TrendingUp className="w-3 h-3" />,
    };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* Card Header with gradient */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate mb-1">
              {product.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                {getCategoryName()}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                {product.unit}
              </span>
            </div>
          </div>
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {t('products.pricePer')} {product.unit}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              ₹{Number(product.price).toFixed(2)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${stockStatus.className}`}
          >
            {stockStatus.icon}
            {stockStatus.text}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {product.isStockRequired && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>{t('products.stockLevel')}</span>
              <span className="font-medium">
                {Number(product.stock).toFixed(2)} / {Math.max(product.stock, 100)} {product.unit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${product.stock === 0
                  ? "bg-red-500"
                  : product.stock <= 10
                    ? "bg-amber-500"
                    : "bg-green-500"
                  }`}
                style={{
                  width: `${Math.min(
                    (product.stock / Math.max(product.stock, 100)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4 mr-1.5" />
              {t('products.edit')}
            </button>
            <button
              className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium shadow-sm hover:shadow"
              onClick={(e) => {
                e.preventDefault();
                if (
                  window.confirm(
                    "Are you sure you want to delete this product?"
                  )
                ) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t('products.delete')}
            </button>
          </div>

          {product.isStockRequired && (
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium border border-gray-200"
                onClick={onStockAdjust}
                title="Adjust Stock"
              >
                <Package className="h-4 w-4 mr-1.5" />
                {t('products.stock')}
              </button>
              <button
                className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium border border-gray-200"
                onClick={onStockHistory}
                title="Stock History"
              >
                <Clock className="h-4 w-4 mr-1.5" />
                {t('products.history')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductListItem = ({
  product,
  onEdit,
  onStockAdjust,
  onDelete,
  onStockHistory,
}) => {
  const { t } = useTranslation();
  const getCategoryName = () => {
    if (!product.category) return "Uncategorized";
    return product.category.name || "Uncategorized";
  };

  const formatUnitDisplay = (unit, stock) => {
    if (stock === 1) return unit;
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

  const getStockStatus = () => {
    if (!product.isStockRequired) {
      return {
        className: "bg-gray-100 text-gray-700",
        text: t('products.noStockTracking'),
      };
    }

    const stockDisplay = `${Number(product.stock).toFixed(2)} ${formatUnitDisplay(
      product.unit,
      product.stock
    )}`;

    if (product.stock === 0) {
      return {
        className: "bg-red-100 text-red-700",
        text: t('products.outOfStock'),
      };
    }

    if (product.stock <= 10) {
      return {
        className: "bg-amber-100 text-amber-700",
        text: `${t('products.low')}: ${stockDisplay}`,
      };
    }

    return {
      className: "bg-green-100 text-green-700",
      text: `${t('products.stock')}: ${stockDisplay}`,
    };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 p-4 sm:p-5 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                {product.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                  {getCategoryName()}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                  {product.unit}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${stockStatus.className}`}
                >
                  {stockStatus.text}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                ₹{Number(product.price).toFixed(2)}/{product.unit}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:ml-4">
          <button
            className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            onClick={onEdit}
          >
            <Edit2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('products.edit')}</span>
          </button>
          {product.isStockRequired && (
            <>
              <button
                className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                onClick={onStockAdjust}
              >
                <Package className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{t('products.stock')}</span>
              </button>
              <button
                className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                onClick={onStockHistory}
              >
                <Clock className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{t('products.history')}</span>
              </button>
            </>
          )}
          <button
            className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            onClick={(e) => {
              e.preventDefault();
              if (
                window.confirm("Are you sure you want to delete this product?")
              ) {
                onDelete();
              }
            }}
          >
            <Trash2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t('products.delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
