// components/stock/StockMovements.jsx

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  Download,
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText,
  ShoppingCart,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Truck,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchStockMovements, exportStockMovements } from "../../api/stock";
import { toast } from "react-hot-toast";

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    type: "all",
    product: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    loadMovements();
  }, [filters, pagination.page]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await fetchStockMovements({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setMovements(data.movements);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error("Error loading movements:", error);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportStockMovements(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock-movements-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting movements:", error);
      toast.error("Failed to export report");
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case "initial":
        return "bg-blue-50 border-blue-200";
      case "addition":
        return "bg-green-50 border-green-200";
      case "removal":
        return "bg-red-50 border-red-200";
      case "sale":
        return "bg-orange-50 border-orange-200";
      case "return":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTypeLabel = (movement) => {
    // If we have a specific adjustment type, use that
    if (movement.adjustmentType) {
      const labels = {
        // Additions
        purchase: "Purchase",
        return_from_customer: "Customer Return",
        production: "Production Output",
        found: "Found/Recovered",
        adjustment_positive: "Positive Adjustment",
        // Removals
        damaged: "Damaged Goods",
        expired: "Expired Products",
        lost: "Lost/Missing",
        theft: "Theft",
        return_to_supplier: "Return to Supplier",
        quality_issue: "Quality Issue",
        adjustment_negative: "Negative Adjustment",
        // Sales
        sale: "Sale",
        initial: "Initial Stock",
      };
      return labels[movement.adjustmentType] || movement.type;
    }

    // Fallback to type
    const typeLabels = {
      initial: "Initial Stock",
      addition: "Stock Added",
      removal: "Stock Removed",
      sale: "Sale",
      return: "Return",
      adjustment: "Adjustment",
    };
    return typeLabels[movement.type] || movement.type;
  };

  // Update the icon function to handle adjustment types
  const getMovementIcon = (movement) => {
    if (movement.adjustmentType) {
      const icons = {
        purchase: <ShoppingCart className="w-5 h-5 text-green-600" />,
        return_from_customer: <RotateCcw className="w-5 h-5 text-blue-600" />,
        production: <Package className="w-5 h-5 text-green-600" />,
        found: <CheckCircle className="w-5 h-5 text-green-600" />,
        damaged: <XCircle className="w-5 h-5 text-red-600" />,
        expired: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        lost: <AlertCircle className="w-5 h-5 text-red-600" />,
        theft: <AlertTriangle className="w-5 h-5 text-red-800" />,
        return_to_supplier: <Truck className="w-5 h-5 text-orange-600" />,
        quality_issue: <XCircle className="w-5 h-5 text-red-600" />,
        sale: <ShoppingCart className="w-5 h-5 text-orange-600" />,
      };
      return icons[movement.adjustmentType] || getDefaultIcon(movement.type);
    }
    return getDefaultIcon(movement.type);
  };

  const getDefaultIcon = (type) => {
    switch (type) {
      case "initial":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "addition":
        return <Plus className="w-5 h-5 text-green-600" />;
      case "removal":
        return <Minus className="w-5 h-5 text-red-600" />;
      case "sale":
        return <ShoppingCart className="w-5 h-5 text-orange-600" />;
      case "return":
        return <RotateCcw className="w-5 h-5 text-purple-600" />;
      case "adjustment":
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
                <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                  Stock Movements
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                  Track all stock additions, removals, sales, and adjustments
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={loadMovements}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow-md text-sm sm:text-base font-medium"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base font-medium"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
            >
            <option value="all">All Movement Types</option>
            <option value="initial">Initial Stock</option>
            <option value="additions">All Additions</option>
            <option value="removals">All Removals</option>
            <option value="sale">Sales Only</option>
            <option value="return">Returns Only</option>
            <option value="adjustments">Manual Adjustments</option>
          </select>

            {/* Date Range */}
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              selectsStart
              startDate={filters.startDate}
              endDate={filters.endDate}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholderText="Start Date"
            />
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              selectsEnd
              startDate={filters.startDate}
              endDate={filters.endDate}
              minDate={filters.startDate}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholderText="End Date"
            />
          </div>
        </div>

        {/* Movements List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading movements...</p>
              </div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center p-12">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No stock movements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Before
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference / Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr
                    key={movement._id}
                    className={`hover:bg-gray-50 ${getMovementColor(
                      movement.type
                    )}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">
                          {new Date(movement.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {movement.product?.name || "Unknown Product"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {movement.product?.category?.name || "Uncategorized"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {getTypeLabel(movement.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-bold ${
                          movement.adjustment > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {movement.adjustment > 0 ? "+" : ""}
                        {Math.abs(movement.adjustment)} {movement.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.previousStock} {movement.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {movement.newStock} {movement.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        {movement.reference && (
                          <p className="font-medium">{movement.reference}</p>
                        )}
                        {movement.reason && (
                          <p className="text-xs text-gray-600">
                            {movement.reason}
                          </p>
                        )}
                        {movement.description && !movement.reason && (
                          <p className="text-xs text-gray-600">
                            {movement.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.user?.name || "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

          {/* Pagination */}
          {!loading && movements.length > 0 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                <p className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  of {pagination.total} movements
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 bg-white border border-gray-200 rounded-xl">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMovements;
