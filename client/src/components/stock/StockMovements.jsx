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
  ArrowRight,
  User,
  Clock
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

  const getTypeConfig = (movement) => {
    const type = movement.adjustmentType || movement.type;

    const configs = {
      // Sales & Returns
      sale: { label: "Sale", color: "text-orange-700 bg-orange-50 border-orange-200", icon: <ShoppingCart className="w-4 h-4" /> },
      return_from_customer: { label: "Customer Return", color: "text-purple-700 bg-purple-50 border-purple-200", icon: <RotateCcw className="w-4 h-4" /> },

      // Additions
      purchase: { label: "Purchase", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <Truck className="w-4 h-4" /> },
      production: { label: "Production", color: "text-blue-700 bg-blue-50 border-blue-200", icon: <Package className="w-4 h-4" /> },
      found: { label: "Found", color: "text-green-700 bg-green-50 border-green-200", icon: <CheckCircle className="w-4 h-4" /> },
      adjustment_positive: { label: "Adjustment (+)", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: <Plus className="w-4 h-4" /> },
      initial: { label: "Initial Stock", color: "text-gray-700 bg-gray-50 border-gray-200", icon: <Package className="w-4 h-4" /> },

      // Removals
      damaged: { label: "Damaged", color: "text-red-700 bg-red-50 border-red-200", icon: <XCircle className="w-4 h-4" /> },
      expired: { label: "Expired", color: "text-amber-700 bg-amber-50 border-amber-200", icon: <AlertTriangle className="w-4 h-4" /> },
      lost: { label: "Lost", color: "text-rose-700 bg-rose-50 border-rose-200", icon: <AlertCircle className="w-4 h-4" /> },
      theft: { label: "Theft", color: "text-red-900 bg-red-100 border-red-300", icon: <AlertTriangle className="w-4 h-4" /> },
      return_to_supplier: { label: "Return to Supplier", color: "text-orange-800 bg-orange-100 border-orange-300", icon: <Truck className="w-4 h-4" /> },
      adjustment_negative: { label: "Adjustment (-)", color: "text-slate-700 bg-slate-50 border-slate-200", icon: <Minus className="w-4 h-4" /> },

      // Fallbacks
      addition: { label: "Addition", color: "text-green-700 bg-green-50 border-green-200", icon: <Plus className="w-4 h-4" /> },
      removal: { label: "Removal", color: "text-red-700 bg-red-50 border-red-200", icon: <Minus className="w-4 h-4" /> },
      return: { label: "Return", color: "text-purple-700 bg-purple-50 border-purple-200", icon: <RotateCcw className="w-4 h-4" /> },
      adjustment: { label: "Adjustment", color: "text-blue-700 bg-blue-50 border-blue-200", icon: <RefreshCw className="w-4 h-4" /> },
    };

    return configs[type] || { label: type, color: "text-gray-700 bg-gray-50 border-gray-200", icon: <FileText className="w-4 h-4" /> };
  };

  const formatNumber = (num) => {
    return Number(num).toFixed(2).replace(/\.00$/, '');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
              <p className="text-sm text-gray-500">Track inventory history and audit trail</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={loadMovements}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white transition-all"
            >
              <option value="all">All Types</option>
              <option value="sale">Sales</option>
              <option value="return">Returns</option>
              <option value="additions">Additions</option>
              <option value="removals">Removals</option>
              <option value="adjustments">Adjustments</option>
            </select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholderText="Start Date"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                selectsEnd
                startDate={filters.startDate}
                endDate={filters.endDate}
                minDate={filters.startDate}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholderText="End Date"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm">Loading movements...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No movements found</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Try adjusting your filters or date range to see stock history.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Change</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movements.map((movement) => {
                      const typeConfig = getTypeConfig(movement);
                      return (
                        <tr key={movement._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(movement.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {movement.product?.name || "Unknown Product"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {movement.product?.category?.name || "Uncategorized"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig.color}`}>
                              {typeConfig.icon}
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`text-sm font-bold ${movement.adjustment > 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {movement.adjustment > 0 ? "+" : ""}
                              {formatNumber(movement.adjustment)} {movement.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex flex-col items-end text-sm">
                              <span className="text-gray-900 font-medium">{formatNumber(movement.newStock)} {movement.unit}</span>
                              <span className="text-xs text-gray-400 line-through">{formatNumber(movement.previousStock)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col max-w-[200px]">
                              {movement.reference && (
                                <span className="text-sm font-medium text-gray-900 truncate" title={movement.reference}>
                                  {movement.reference}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 truncate" title={movement.reason || movement.description}>
                                {movement.reason || movement.description || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-500" />
                              </div>
                              <span className="text-sm text-gray-700 max-w-[120px] truncate">
                                {movement.user?.name || "System"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {movements.map((movement) => {
                  const typeConfig = getTypeConfig(movement);
                  return (
                    <div key={movement._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{movement.product?.name}</h4>
                          <p className="text-xs text-gray-500">{movement.product?.category?.name}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${typeConfig.color}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Change</p>
                          <p className={`text-sm font-bold ${movement.adjustment > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {movement.adjustment > 0 ? "+" : ""}
                            {formatNumber(movement.adjustment)} {movement.unit}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">New Stock</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(movement.newStock)} {movement.unit}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(movement.timestamp).toLocaleDateString()}</span>
                        </div>
                        {movement.reference && (
                          <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {movement.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && movements.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                <span className="font-medium">{pagination.total}</span> results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMovements;
