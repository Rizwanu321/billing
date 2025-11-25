// components/stock/StockReports.jsx - Complete with Professional Report Preview

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Filter,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { generateStockReport, fetchStockReportData } from "../../api/stock";
import { toast } from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";

const StockReports = () => {
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const reportTypes = [
    {
      id: "summary",
      name: "Stock Summary Report",
      description: "Overview of current stock levels and values",
      icon: BarChart3,
      color: "blue",
    },
    {
      id: "movement",
      name: "Movement Analysis",
      description: "Detailed analysis of stock movements",
      icon: Activity,
      color: "green",
    },
    {
      id: "valuation",
      name: "Stock Valuation Report",
      description: "Complete stock valuation by category",
      icon: TrendingUp,
      color: "purple",
    },
    {
      id: "lowstock",
      name: "Low Stock Report",
      description: "Products below reorder level",
      icon: AlertTriangle,
      color: "red",
    },
  ];

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const data = await fetchStockReportData({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setReportData(data);
      setShowPreview(true);
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format) => {
    try {
      setDownloadingFormat(format);
      const blob = await generateStockReport({
        type: reportType,
        format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const extension =
        format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv";
      link.setAttribute(
        "download",
        `stock-report-${reportType}-${Date.now()}.${extension}`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortData = (data, key, direction) => {
    if (!key) return data;

    return [...data].sort((a, b) => {
      const aValue = key.split(".").reduce((obj, k) => obj?.[k], a);
      const bValue = key.split(".").reduce((obj, k) => obj?.[k], b);

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const ReportPreview = () => {
    if (!reportData || !showPreview) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm mt-6 overflow-hidden animate-fadeIn">
        {/* Preview Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Report Preview
              </h3>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <EyeOff className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Stats - Common for all reports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Package}
              label="Total Products"
              value={reportData.totalProducts}
              color="bg-blue-500"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              icon={DollarSign}
              label="Total Stock Value"
              value={`₹${reportData.totalValue?.toFixed(2)}`}
              color="bg-green-500"
              iconBg="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              icon={AlertTriangle}
              label="Low Stock Items"
              value={reportData.lowStockCount}
              color="bg-orange-500"
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
            />
            <StatCard
              icon={Package}
              label="Out of Stock"
              value={reportData.outOfStockCount}
              color="bg-red-500"
              iconBg="bg-red-100"
              iconColor="text-red-600"
            />
          </div>

          {/* Report Type Specific Content */}
          {reportType === "summary" && <SummaryReportTable data={reportData} />}
          {reportType === "movement" && (
            <MovementReportTable
              data={reportData}
              sortConfig={sortConfig}
              handleSort={handleSort}
              sortData={sortData}
            />
          )}
          {reportType === "lowstock" && (
            <LowStockReportTable
              data={reportData}
              sortConfig={sortConfig}
              handleSort={handleSort}
              sortData={sortData}
            />
          )}
          {reportType === "valuation" && (
            <ValuationReportTable data={reportData} />
          )}
        </div>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );

  const SummaryReportTable = ({ data }) => {
    // Mock products data for demonstration - in real scenario, this would come from the API
    const products = data.products || [];

    return (
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-600" />
          All Products Summary
        </h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {product.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{product.price?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      ₹{product.totalValue?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StockStatusBadge stock={product.stock} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const MovementReportTable = ({ data, sortConfig, handleSort, sortData }) => {
    const movements = sortData(
      data.movements || [],
      sortConfig.key,
      sortConfig.direction
    );

    return (
      <div>
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          Stock Movement Analysis
        </h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader
                  label="Product Name"
                  sortKey="productName"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Total Added"
                  sortKey="totalIn"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="center"
                />
                <SortableHeader
                  label="Total Removed"
                  sortKey="totalOut"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="center"
                />
                <SortableHeader
                  label="Net Change"
                  sortKey="netChange"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="center"
                />
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No stock movements found for the selected period
                  </td>
                </tr>
              ) : (
                movements.map((movement, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {movement.productName || "Unknown Product"}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        <ArrowUp className="w-4 h-4" />
                        {movement.totalIn || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                        <ArrowDown className="w-4 h-4" />
                        {movement.totalOut || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          movement.netChange >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {movement.netChange > 0 && "+"}
                        {movement.netChange || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <MovementTrendIndicator change={movement.netChange} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const LowStockReportTable = ({ data, sortConfig, handleSort, sortData }) => {
    const products = sortData(
      data.lowStockProducts || [],
      sortConfig.key,
      sortConfig.direction
    );

    // Group products by status
    const outOfStock = products.filter((p) => p.currentStock === 0);
    const criticalStock = products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= 5
    );
    const lowStock = products.filter(
      (p) => p.currentStock > 5 && p.currentStock <= 10
    );

    return (
      <div className="space-y-6">
        {/* Critical Alerts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="font-semibold text-red-800 mb-1">Out of Stock</h5>
            <p className="text-2xl font-bold text-red-600">
              {outOfStock.length}
            </p>
            <p className="text-sm text-red-600">Immediate attention required</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h5 className="font-semibold text-orange-800 mb-1">
              Critical Level
            </h5>
            <p className="text-2xl font-bold text-orange-600">
              {criticalStock.length}
            </p>
            <p className="text-sm text-orange-600">Order soon</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-semibold text-yellow-800 mb-1">Low Stock</h5>
            <p className="text-2xl font-bold text-yellow-600">
              {lowStock.length}
            </p>
            <p className="text-sm text-yellow-600">Monitor closely</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Low Stock Products Detail
          </h4>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader
                    label="Product Name"
                    sortKey="name"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Category"
                    sortKey="category"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Current Stock"
                    sortKey="currentStock"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    align="center"
                  />
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <SortableHeader
                    label="Stock Value"
                    sortKey="value"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    align="right"
                  />
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action Required
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No low stock products found
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 transition-colors ${
                        product.currentStock === 0
                          ? "bg-red-50"
                          : product.currentStock <= 5
                          ? "bg-orange-50"
                          : "bg-yellow-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold">
                        <span
                          className={
                            product.currentStock === 0
                              ? "text-red-600"
                              : product.currentStock <= 5
                              ? "text-orange-600"
                              : "text-yellow-600"
                          }
                        >
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {product.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ₹{product.value?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StockStatusBadge stock={product.currentStock} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ActionRequiredBadge stock={product.currentStock} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const ValuationReportTable = ({ data }) => {
    const categories = data.categoryValuation || [];
    const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);

    return (
      <div className="space-y-6">
        {/* Category Summary Cards */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Stock Valuation by Category
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-semibold text-gray-900">
                    {category.name}
                  </h5>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {((category.totalValue / totalValue) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  ₹{category.totalValue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  {category.totalItems} products
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500">
                    Average value per product
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{(category.totalValue / category.totalItems).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div>
          <h5 className="font-medium text-gray-900 mb-3">
            Detailed Product Breakdown
          </h5>
          {categories.map((category, catIndex) => (
            <div key={catIndex} className="mb-6">
              <div className="bg-gray-50 px-4 py-2 rounded-t-lg border border-gray-200">
                <h6 className="font-medium text-gray-900">{category.name}</h6>
              </div>
              <div className="overflow-x-auto border-x border-b border-gray-200 rounded-b-lg">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Stock
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Unit
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                        Unit Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                        Total Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {category.products?.map((product, prodIndex) => (
                      <tr key={prodIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-center text-gray-600">
                          {product.stock}
                        </td>
                        <td className="px-4 py-2 text-sm text-center text-gray-600">
                          {product.unit}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600">
                          ₹{product.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                          ₹{product.value.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SortableHeader = ({
    label,
    sortKey,
    sortConfig,
    onSort,
    align = "left",
  }) => {
    const textAlign =
      align === "center"
        ? "text-center"
        : align === "right"
        ? "text-right"
        : "text-left";
    return (
      <th
        className={`px-4 py-3 ${textAlign} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100`}
        onClick={() => onSort(sortKey)}
      >
        <div
          className={`flex items-center gap-1 ${
            align === "center"
              ? "justify-center"
              : align === "right"
              ? "justify-end"
              : ""
          }`}
        >
          {label}
          {sortConfig.key === sortKey &&
            (sortConfig.direction === "asc" ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            ))}
        </div>
      </th>
    );
  };

  const StockStatusBadge = ({ stock }) => {
    if (stock === 0) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (stock <= 5) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          Critical
        </span>
      );
    } else if (stock <= 10) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          In Stock
        </span>
      );
    }
  };

  const ActionRequiredBadge = ({ stock }) => {
    if (stock === 0) {
      return <span className="text-xs font-bold text-red-600">Order Now!</span>;
    } else if (stock <= 5) {
      return (
        <span className="text-xs font-bold text-orange-600">Order Soon</span>
      );
    } else {
      return <span className="text-xs text-gray-500">Monitor</span>;
    }
  };

  const MovementTrendIndicator = ({ change }) => {
    if (change > 0) {
      return (
        <div className="inline-flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-medium">Rising</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="inline-flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-medium">Falling</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1 text-gray-500">
          <span className="text-xs">No Change</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8 animate-fadeIn">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                Stock Reports
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                Generate comprehensive stock reports and analytics
              </p>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 animate-fadeIn">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Select Report Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setReportType(type.id);
                  setReportData(null);
                  setShowPreview(false);
                }}
                className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  reportType === type.id
                    ? `border-${type.color}-500 bg-${type.color}-50 shadow-sm`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      reportType === type.id
                        ? `bg-${type.color}-100`
                        : "bg-gray-100"
                    }`}
                  >
                    <type.icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        reportType === type.id
                          ? `text-${type.color}-600`
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1">{type.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                  {reportType === type.id && (
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-1 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range and Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 animate-fadeIn">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Report Parameters</h3>
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Start Date
                </label>
                <DatePicker
                  selected={dateRange.startDate}
                  onChange={(date) =>
                    setDateRange({ ...dateRange, startDate: date })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select start date"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  End Date
                </label>
                <DatePicker
                  selected={dateRange.endDate}
                  onChange={(date) =>
                    setDateRange({ ...dateRange, endDate: date })
                  }
                  minDate={dateRange.startDate}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select end date"
                />
              </div>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 transform flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 h-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Generate Report</span>
                  <span className="sm:hidden">Generate</span>
                </>
              )}
            </button>
          </div>

          {/* Download Options */}
          {reportData && showPreview && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Download Report:
                  </p>
                  <p className="text-xs text-gray-500">
                    Export your report in your preferred format
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownloadReport("pdf")}
                    disabled={downloadingFormat === "pdf"}
                    className="group flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                    {downloadingFormat === "pdf" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    PDF Report
                  </button>
                  <button
                    onClick={() => handleDownloadReport("csv")}
                    disabled={downloadingFormat === "csv"}
                    className="group flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                    {downloadingFormat === "csv" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    CSV Export
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <ReportPreview />
      </div>
    </div>
  );
};

export default StockReports;
