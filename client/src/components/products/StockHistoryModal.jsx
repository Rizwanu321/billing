//client\src\components\products\StockHistoryModal.jsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  RotateCcw,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const StockHistoryModal = ({
  productId,
  productName,
  productUnit = "piece",
  onClose,
}) => {
  const [stockHistories, setStockHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    sortBy: "timestamp",
    sortOrder: "desc",
    startDate: null,
    endDate: null,
  });

  const fetchStockHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/stock-history/product/${productId}`,
        {
          params: {
            page: pagination.currentPage,
            ...filters,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Stock History API Response:", response.data);
      setStockHistories(response.data.stockHistories);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      console.error("Error fetching stock history:", error);
      if (error.response && error.response.status === 401) {
        console.error("Authentication error:", error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockHistory();
  }, [productId, pagination.currentPage, filters]);

  // Format unit display based on quantity
  const formatUnitDisplay = (unit, quantity) => {
    if (quantity === 1) {
      // Singular form
      return unit;
    }

    // Plural forms for different units
    switch (unit) {
      case "kg":
        return "kgs";
      case "box":
        return "boxes";
      case "piece":
        return "pieces";
      case "dozen":
        return "dozens";
      case "gram":
        return "grams";
      case "liter":
        return "liters";
      case "ml":
        return "ml";
      case "packet":
        return "packets";
      default:
        return unit + "s";
    }
  };

  const renderStockHistoryItem = (history) => {
    console.log("Rendering history item:", history);
    const isAddition = history.adjustment > 0;
    const absAdjustment = Math.abs(history.adjustment);
    const unit = history.unit || productUnit;

    // Get appropriate icon based on type
    const getTypeIcon = () => {
      switch (history.type) {
        case "initial":
          return <Package className="w-4 h-4 text-blue-600" />;
        case "addition":
          return <Plus className="w-4 h-4 text-green-600" />;
        case "removal":
          return <Minus className="w-4 h-4 text-red-600" />;
        case "sale":
          return <ShoppingCart className="w-4 h-4 text-orange-600" />;
        case "return":
          return <RotateCcw className="w-4 h-4 text-purple-600" />;
        default:
          return isAddition ? (
            <ArrowUp className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-600" />
          );
      }
    };

    const getTypeLabel = () => {
      const labels = {
        initial: "Initial Stock",
        addition: "Added",
        removal: "Removed",
        sale: "Sold",
        return: "Returned",
      };
      return labels[history.type] || (isAddition ? "Added" : "Removed");
    };

    return (
      <div
        key={history._id}
        className={`p-4 border-b last:border-b-0 ${
          isAddition ? "bg-green-50" : "bg-red-50"
        } hover:bg-opacity-70 transition-colors`}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon()}
              <p className="font-medium text-gray-800">
                {getTypeLabel()} {absAdjustment}{" "}
                {formatUnitDisplay(unit, absAdjustment)}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              {new Date(history.timestamp).toLocaleString()}
            </p>
            {history.reason && (
              <p className="text-sm text-gray-700 mt-1 font-medium">
                Reason: {history.reason}
              </p>
            )}
            {history.description && (
              <p className="text-sm text-gray-500 mt-1">
                {history.description}
              </p>
            )}
            {history.reference && (
              <p className="text-sm text-blue-600 mt-1">
                Reference: {history.reference}
              </p>
            )}
            {history.user && (
              <p className="text-xs text-gray-500 mt-1">
                By: {history.user.name || history.user.email}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Stock: {history.previousStock}{" "}
              {formatUnitDisplay(unit, history.previousStock)}
              <span className="mx-2">→</span>
              <span className="font-bold text-gray-800">
                {history.newStock} {formatUnitDisplay(unit, history.newStock)}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 md:mx-auto p-6 md:p-8 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Stock History
            </h2>
            {productName && (
              <p className="text-sm text-gray-600 mt-1">
                {productName} ({productUnit})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="flex-1">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) =>
                setFilters((prev) => ({ ...prev, startDate: date }))
              }
              selectsStart
              startDate={filters.startDate}
              endDate={filters.endDate}
              placeholderText="Start Date"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              selected={filters.endDate}
              onChange={(date) =>
                setFilters((prev) => ({ ...prev, endDate: date }))
              }
              selectsEnd
              startDate={filters.startDate}
              endDate={filters.endDate}
              minDate={filters.startDate}
              placeholderText="End Date"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={toggleSortOrder}
            className="flex items-center space-x-1 bg-gray-100 p-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
          >
            {filters.sortOrder === "desc" ? <ArrowDown /> : <ArrowUp />}
            <span className="text-sm">Sort</span>
          </button>
          <button
            onClick={fetchStockHistory}
            className="flex items-center space-x-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : stockHistories.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-2">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">
                No stock history available
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Stock changes will appear here when they occur
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {stockHistories.map(renderStockHistoryItem)}
            </div>
          )}
        </div>

        {stockHistories.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage - 1,
                }))
              }
              className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: prev.currentPage + 1,
                }))
              }
              className="px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockHistoryModal;
