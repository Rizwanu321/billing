// components/revenue/RevenueByProducts.jsx

import React, { useState, useEffect, useRef, Fragment } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  IndianRupee,
  ShoppingCart,
  BarChart3,
  Download,
  Filter,
  X,
  RefreshCw,
  Search,
  Clock,
  CreditCard,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchRevenueByProducts } from "../../api/revenue";
import api from "../../utils/api";

const RevenueByProducts = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [productData, setProductData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [performanceBreakdown, setPerformanceBreakdown] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const productDropdownRef = useRef(null);
  const isInitialMount = useRef(true); // Track initial mount

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    categoryId: "all",
    productId: "all",
    sortBy: "totalRevenue",
    sortOrder: "desc",
    minRevenue: "",
    maxRevenue: "",
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      await Promise.all([fetchCategories(), fetchProducts()]);
      setInitialLoading(false);
      isInitialMount.current = false;
      // After initial data is loaded, fetch revenue data
      await fetchData();
    };
    initializeData();
  }, []);

  // Fetch revenue data when filters change (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount.current && !initialLoading) {
      console.log("Filter changed, fetching data with:", filters);
      fetchData();
    }
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      console.log("Categories loaded:", response.data);
      setCategories(response.data || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      return [];
    }
  };

  // Add this before the return statement in RevenueByProducts component
  const EnhancedChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(data.revenue)}
              </span>
            </div>
            {data.actualReceived !== undefined && (
              <div className="flex justify-between gap-4">
                <span className="text-green-600">Received:</span>
                <span className="font-medium text-green-700">
                  {formatCurrency(data.actualReceived)}
                </span>
              </div>
            )}
            {data.dueAmount > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-orange-600">Due:</span>
                <span className="font-medium text-orange-700">
                  {formatCurrency(data.dueAmount)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      console.log("Products loaded:", response.data);
      setProducts(response.data || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Fetching revenue data with filters:", filters);
      const data = await fetchRevenueByProducts(filters);
      console.log("Revenue data received:", data);

      setProductData(data.products || []);
      setSummary(
        data.summary || {
          totalProducts: 0,
          totalRevenue: 0,
          totalQuantitySold: 0,
          totalTransactions: 0,
          avgRevenuePerProduct: 0,
          totalTax: 0,
        }
      );
      setPerformanceBreakdown(
        data.performanceBreakdown || {
          highPerformers: 0,
          averagePerformers: 0,
          lowPerformers: 0,
        }
      );
      setRevenueTrend(data.revenueTrend || []);
    } catch (error) {
      console.error("Error fetching product revenue:", error);
      setProductData([]);
      setSummary({
        totalProducts: 0,
        totalRevenue: 0,
        totalQuantitySold: 0,
        totalTransactions: 0,
        avgRevenuePerProduct: 0,
        totalTax: 0,
      });
      setPerformanceBreakdown({
        highPerformers: 0,
        averagePerformers: 0,
        lowPerformers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      categoryId: "all",
      productId: "all",
      sortBy: "totalRevenue",
      sortOrder: "desc",
      minRevenue: "",
      maxRevenue: "",
    });
    setProductSearchTerm("");
    setSelectedProduct(null);
  };

  const hasActiveFilters = () => {
    return (
      filters.categoryId !== "all" ||
      filters.productId !== "all" ||
      filters.minRevenue ||
      filters.maxRevenue
    );
  };

  const getPerformanceBadge = (revenue, avgRevenue) => {
    if (!avgRevenue || avgRevenue === 0) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
          N/A
        </span>
      );
    }
    if (revenue > avgRevenue * 1.5) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          High Performer
        </span>
      );
    } else if (revenue < avgRevenue * 0.5) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Low Performer
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
        Average
      </span>
    );
  };

  // Filter products by category and search term
  const filteredProductsList = products.filter((product) => {
    const productCategoryId = product.category?._id || product.category;

    const matchesCategory =
      filters.categoryId === "all" || productCategoryId === filters.categoryId;

    const matchesSearch =
      productSearchTerm === "" ||
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductSearchTerm(product.name);
    setFilters((prev) => ({ ...prev, productId: product._id }));
    setShowProductDropdown(false);
  };

  // Handle product search input change
  const handleProductSearchChange = (e) => {
    const value = e.target.value;
    setProductSearchTerm(value);
    setShowProductDropdown(true);

    if (value === "") {
      setSelectedProduct(null);
      setFilters((prev) => ({ ...prev, productId: "all" }));
    }
  };

  // Clear product selection
  const clearProductSelection = () => {
    setProductSearchTerm("");
    setSelectedProduct(null);
    setFilters((prev) => ({ ...prev, productId: "all" }));
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center text-sm font-medium ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  // Add this function before the return statement
  const exportToCSV = () => {
    const headers = [
      "Product",
      "Category",
      "Total Revenue",
      "Received",
      "Credit Used",
      "Pending Due",
      "Quantity Sold",
      "Avg Price",
      "Transactions",
      "Invoices",
      "Tax",
      "Received %",
      "Due %",
      "Performance",
    ];

    const csvData = productData.map((product) => [
      product.productName,
      product.categoryName,
      product.totalRevenue.toFixed(2),
      product.actualReceived.toFixed(2),
      product.creditUsed.toFixed(2),
      product.dueAmount.toFixed(2),
      product.totalQuantity.toFixed(2),
      product.avgPrice.toFixed(2),
      product.transactionCount,
      product.invoiceCount,
      product.totalTax.toFixed(2),
      product.receivedPercentage.toFixed(2),
      product.duePercentage.toFixed(2),
      product.totalRevenue > (summary?.avgRevenuePerProduct || 0) * 1.5
        ? "High"
        : product.totalRevenue < (summary?.avgRevenuePerProduct || 0) * 0.5
        ? "Low"
        : "Average",
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-revenue-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Revenue by Products
              </h1>
              <p className="text-gray-600 mt-1">
                Analyze product-wise revenue and performance
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </button>
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={exportToCSV}
                disabled={productData.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Active Filters Badge */}
          {hasActiveFilters() && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
              <span className="text-sm text-blue-800 font-medium">
                Active filters applied
              </span>
              <button
                onClick={clearFilters}
                className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            <StatCard
              icon={IndianRupee}
              title="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              subtitle={
                summary.totalProducts > 0
                  ? `From ${summary.totalProducts} product${
                      summary.totalProducts !== 1 ? "s" : ""
                    }`
                  : "No products"
              }
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />

            <StatCard
              icon={TrendingUp}
              title="Actual Received"
              value={formatCurrency(summary.actualReceived)}
              subtitle={`${summary.collectionRate.toFixed(1)}% collection rate`}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />

            <StatCard
              icon={CreditCard}
              title="Credit Used"
              value={formatCurrency(summary.totalCreditUsed)}
              subtitle={
                summary.totalRevenue > 0
                  ? `${(
                      (summary.totalCreditUsed / summary.totalRevenue) *
                      100
                    ).toFixed(1)}% of revenue`
                  : "0%"
              }
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />

            <StatCard
              icon={Clock}
              title="Pending Dues"
              value={formatCurrency(summary.totalDue)}
              subtitle={
                summary.totalRevenue > 0
                  ? `${(
                      (summary.totalDue / summary.totalRevenue) *
                      100
                    ).toFixed(1)}% pending`
                  : "0%"
              }
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />

            <StatCard
              icon={Package}
              title="Products"
              value={summary.totalProducts}
              subtitle={`${summary.totalQuantitySold.toFixed(2)} units sold`}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
          </div>
        )}

        {/* Performance Breakdown */}
        {performanceBreakdown && summary && summary.totalProducts > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance Distribution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        High Performers
                      </p>
                      <p className="text-sm text-gray-600">
                        Above 150% of average
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">
                      {performanceBreakdown.highPerformers}
                    </span>
                    <p className="text-xs text-gray-500">
                      {summary.totalProducts > 0
                        ? `${(
                            (performanceBreakdown.highPerformers /
                              summary.totalProducts) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Average Performers
                      </p>
                      <p className="text-sm text-gray-600">
                        50% - 150% of average
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">
                      {performanceBreakdown.averagePerformers}
                    </span>
                    <p className="text-xs text-gray-500">
                      {summary.totalProducts > 0
                        ? `${(
                            (performanceBreakdown.averagePerformers /
                              summary.totalProducts) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        Low Performers
                      </p>
                      <p className="text-sm text-gray-600">
                        Below 50% of average
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-600">
                      {performanceBreakdown.lowPerformers}
                    </span>
                    <p className="text-xs text-gray-500">
                      {summary.totalProducts > 0
                        ? `${(
                            (performanceBreakdown.lowPerformers /
                              summary.totalProducts) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 5 Products Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top 5 Products by Revenue
              </h3>
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="productName"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Status Overview - Add after Performance Breakdown */}
        {productData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Status Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Collection Rate */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">
                    Collection Rate
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Received</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(summary.actualReceived)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Rate
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {summary.collectionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Usage */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">Credit Usage</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Credit Applied
                    </span>
                    <span className="font-medium text-indigo-600">
                      {formatCurrency(summary.totalCreditUsed)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">% of Revenue</span>
                    <span className="font-medium text-gray-900">
                      {summary.totalRevenue > 0
                        ? `${(
                            (summary.totalCreditUsed / summary.totalRevenue) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Products
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        {productData.filter((p) => p.creditUsed > 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outstanding Dues */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">
                    Outstanding Dues
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Due</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrency(summary.totalDue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">% of Revenue</span>
                    <span className="font-medium text-gray-900">
                      {summary.totalRevenue > 0
                        ? `${(
                            (summary.totalDue / summary.totalRevenue) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-orange-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Products
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {productData.filter((p) => p.dueAmount > 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Trend Chart - Fixed */}
        {revenueTrend.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Revenue Trend - Top 5 Products
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Last 6 months performance with payment status
                </p>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">Total Revenue</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Received</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-gray-600">Due</span>
                </div>
              </div>
            </div>

            {/* Bar Chart instead of Line Chart for better visualization */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="productName"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<EnhancedChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Total Revenue" />
                <Bar dataKey="actualReceived" fill="#10b981" name="Received" />
                <Bar dataKey="dueAmount" fill="#f59e0b" name="Due Amount" />
              </BarChart>
            </ResponsiveContainer>

            {/* Trend Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Payment Status Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {revenueTrend.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900 truncate flex-1">
                        {item.productName}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {item.date}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Received:</span>
                        <span className="font-medium text-green-700">
                          {formatCurrency(item.actualReceived)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-600">Due:</span>
                        <span className="font-medium text-orange-700">
                          {formatCurrency(item.dueAmount)}
                        </span>
                      </div>
                      <div className="pt-1 mt-1 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Collection:</span>
                          <span className="font-medium text-blue-600">
                            {item.revenue > 0
                              ? `${(
                                  (item.actualReceived / item.revenue) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter - FIXED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => {
                    const selectedCategoryId = e.target.value;
                    console.log("Category changed to:", selectedCategoryId);

                    setFilters((prev) => ({
                      ...prev,
                      categoryId: selectedCategoryId,
                      productId: "all",
                    }));

                    setProductSearchTerm("");
                    setSelectedProduct(null);
                    setShowProductDropdown(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Selected:{" "}
                  {filters.categoryId === "all"
                    ? "All Categories"
                    : categories.find((c) => c._id === filters.categoryId)
                        ?.name || filters.categoryId}
                </p>
              </div>

              {/* Product Search */}
              <div className="relative" ref={productDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={handleProductSearchChange}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedProduct && (
                    <button
                      onClick={clearProductSelection}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showProductDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProductsList.length > 0 ? (
                      <div className="p-2">
                        <button
                          onClick={() => {
                            clearProductSelection();
                            setShowProductDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                        >
                          All Products ({filteredProductsList.length})
                        </button>
                        {filteredProductsList.map((product) => {
                          const categoryName =
                            product.category?.name ||
                            categories.find((c) => c._id === product.category)
                              ?.name ||
                            "Uncategorized";

                          return (
                            <button
                              key={product._id}
                              onClick={() => handleProductSelect(product)}
                              className={`w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg text-sm ${
                                selectedProduct?._id === product._id
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{product.name}</span>
                                <span className="text-xs text-gray-500">
                                  {categoryName}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {productSearchTerm
                          ? `No products found matching "${productSearchTerm}"`
                          : filters.categoryId !== "all"
                          ? "No products in selected category"
                          : "No products available"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Revenue Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Revenue (₹)
                </label>
                <input
                  type="number"
                  value={filters.minRevenue}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minRevenue: e.target.value,
                    }))
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Revenue (₹)
                </label>
                <input
                  type="number"
                  value={filters.maxRevenue}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxRevenue: e.target.value,
                    }))
                  }
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="totalRevenue">Revenue</option>
                    <option value="totalQuantity">Quantity</option>
                    <option value="avgPrice">Avg Price</option>
                    <option value="productName">Name</option>
                    <option value="profitMargin">Profit Margin</option>
                  </select>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={`Sort ${
                      filters.sortOrder === "desc" ? "Ascending" : "Descending"
                    }`}
                  >
                    {filters.sortOrder === "desc" ? "↓" : "↑"}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Active filters:</span>{" "}
                {filters.categoryId !== "all" && (
                  <span className="inline-block mr-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    Category:{" "}
                    {categories.find((c) => c._id === filters.categoryId)?.name}
                  </span>
                )}
                {filters.productId !== "all" && (
                  <span className="inline-block mr-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    Product: {selectedProduct?.name}
                  </span>
                )}
                {filters.minRevenue && (
                  <span className="inline-block mr-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    Min: ₹{filters.minRevenue}
                  </span>
                )}
                {filters.maxRevenue && (
                  <span className="inline-block mr-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    Max: ₹{filters.maxRevenue}
                  </span>
                )}
                {!hasActiveFilters() && (
                  <span className="text-gray-500">None</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Product Revenue Details
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {productData.length > 0
                ? `Showing ${productData.length} product${
                    productData.length !== 1 ? "s" : ""
                  }`
                : "No products found"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading revenue data...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Revenue
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Quantity Sold
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Avg Price
                      </th>

                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Transactions
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Performance
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="py-12 text-center text-gray-500"
                        >
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-lg font-medium">
                            No products found
                          </p>
                          <p className="text-sm mt-1">
                            {hasActiveFilters()
                              ? "Try adjusting your filters or date range"
                              : "No revenue data available for the selected period"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      productData.map((product, index) => (
                        <React.Fragment key={product.productId}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {product.productName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {product.invoiceCount} invoice
                                  {product.invoiceCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                {product.categoryName || "Uncategorized"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(product.totalRevenue)}
                                </p>
                                <div className="text-xs space-y-0.5">
                                  <p className="text-green-600">
                                    Received:{" "}
                                    {formatCurrency(product.actualReceived)}
                                  </p>
                                  {product.creditUsed > 0 && (
                                    <p className="text-indigo-600">
                                      Credit:{" "}
                                      {formatCurrency(product.creditUsed)}
                                    </p>
                                  )}
                                  {product.dueAmount > 0 && (
                                    <p className="text-orange-600">
                                      Due: {formatCurrency(product.dueAmount)}
                                    </p>
                                  )}
                                  <p className="text-gray-500">
                                    Tax: {formatCurrency(product.totalTax)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900 font-medium">
                              {product.totalQuantity.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-900">
                              {formatCurrency(product.avgPrice)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                {product.transactionCount}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {/* Payment Status Progress Bar */}
                              <div className="space-y-1">
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div className="h-full flex">
                                    <div
                                      className="bg-green-500"
                                      style={{
                                        width: `${product.receivedPercentage}%`,
                                      }}
                                    ></div>
                                    {product.creditUsed > 0 && (
                                      <div
                                        className="bg-indigo-500"
                                        style={{
                                          width: `${product.creditPercentage}%`,
                                        }}
                                      ></div>
                                    )}
                                    {product.dueAmount > 0 && (
                                      <div
                                        className="bg-orange-500"
                                        style={{
                                          width: `${product.duePercentage}%`,
                                        }}
                                      ></div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 text-xs justify-center">
                                  <span className="text-green-600 font-medium">
                                    {product.receivedPercentage.toFixed(0)}%
                                  </span>
                                  {product.dueAmount > 0 && (
                                    <span className="text-orange-600 font-medium">
                                      {product.duePercentage.toFixed(0)}% due
                                    </span>
                                  )}
                                </div>
                                {getPerformanceBadge(
                                  product.totalRevenue,
                                  summary?.avgRevenuePerProduct || 0
                                )}
                              </div>
                            </td>

                            {/* In table body, add after Performance column */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div className="h-full flex">
                                    <div
                                      className="bg-green-500"
                                      style={{
                                        width: `${product.receivedPercentage}%`,
                                      }}
                                      title={`Received: ${formatCurrency(
                                        product.actualReceived
                                      )}`}
                                    ></div>
                                    {product.creditUsed > 0 && (
                                      <div
                                        className="bg-indigo-500"
                                        style={{
                                          width: `${product.creditPercentage}%`,
                                        }}
                                        title={`Credit: ${formatCurrency(
                                          product.creditUsed
                                        )}`}
                                      ></div>
                                    )}
                                    {product.dueAmount > 0 && (
                                      <div
                                        className="bg-orange-500"
                                        style={{
                                          width: `${product.duePercentage}%`,
                                        }}
                                        title={`Due: ${formatCurrency(
                                          product.dueAmount
                                        )}`}
                                      ></div>
                                    )}
                                  </div>
                                </div>

                                {/* Status Text */}
                                <div className="flex gap-2 text-xs">
                                  <span className="text-green-600 font-medium">
                                    ✓ {product.receivedPercentage.toFixed(1)}%
                                  </span>
                                  {product.creditUsed > 0 && (
                                    <span className="text-indigo-600 font-medium">
                                      💳 {product.creditPercentage.toFixed(1)}%
                                    </span>
                                  )}
                                  {product.dueAmount > 0 && (
                                    <span className="text-orange-600 font-medium">
                                      ⏱ {product.duePercentage.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary */}
              {productData.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600 mb-1">Total Revenue</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {formatCurrency(
                          productData.reduce(
                            (sum, p) => sum + p.totalRevenue,
                            0
                          )
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        From {productData.length} products
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-700 mb-1">Received</p>
                      <p className="font-bold text-green-800 text-lg">
                        {formatCurrency(
                          productData.reduce(
                            (sum, p) => sum + p.actualReceived,
                            0
                          )
                        )}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {productData.reduce(
                          (sum, p) => sum + p.totalRevenue,
                          0
                        ) > 0
                          ? `${(
                              (productData.reduce(
                                (sum, p) => sum + p.actualReceived,
                                0
                              ) /
                                productData.reduce(
                                  (sum, p) => sum + p.totalRevenue,
                                  0
                                )) *
                              100
                            ).toFixed(1)}% collected`
                          : "0%"}
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-indigo-700 mb-1">Credit Used</p>
                      <p className="font-bold text-indigo-800 text-lg">
                        {formatCurrency(
                          productData.reduce(
                            (sum, p) => sum + (p.creditUsed || 0),
                            0
                          )
                        )}
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {productData.filter((p) => p.creditUsed > 0).length}{" "}
                        products
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-orange-700 mb-1">Pending Dues</p>
                      <p className="font-bold text-orange-800 text-lg">
                        {formatCurrency(
                          productData.reduce(
                            (sum, p) => sum + (p.dueAmount || 0),
                            0
                          )
                        )}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {productData.filter((p) => p.dueAmount > 0).length}{" "}
                        products
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-purple-700 mb-1">Total Quantity</p>
                      <p className="font-bold text-purple-800 text-lg">
                        {productData
                          .reduce((sum, p) => sum + p.totalQuantity, 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {productData.reduce(
                          (sum, p) => sum + p.transactionCount,
                          0
                        )}{" "}
                        transactions
                      </p>
                    </div>
                  </div>

                  {/* Additional Summary Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Avg Revenue/Product:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(
                            productData.reduce(
                              (sum, p) => sum + p.totalRevenue,
                              0
                            ) / productData.length
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Avg Quantity/Product:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {(
                            productData.reduce(
                              (sum, p) => sum + p.totalQuantity,
                              0
                            ) / productData.length
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Invoices:</span>
                        <span className="font-semibold text-gray-900">
                          {productData.reduce(
                            (sum, p) => sum + p.invoiceCount,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tax:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(
                            productData.reduce((sum, p) => sum + p.totalTax, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Product Insights - Enhanced */}
        {productData.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Best Selling Product */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900 text-sm">
                  Best Seller
                </h4>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1 truncate">
                {productData[0]?.productName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                {formatCurrency(productData[0]?.totalRevenue)}
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  ✓ {formatCurrency(productData[0]?.actualReceived)} received
                </p>
                {productData[0]?.dueAmount > 0 && (
                  <p className="text-orange-600">
                    ⏱ {formatCurrency(productData[0]?.dueAmount)} due
                  </p>
                )}
                <p>
                  {productData[0]?.totalQuantity.toFixed(2)} units •{" "}
                  {productData[0]?.transactionCount} txns
                </p>
              </div>
            </div>

            {/* Best Collection Rate */}
            {(() => {
              const bestCollection = [...productData].sort(
                (a, b) => b.receivedPercentage - a.receivedPercentage
              )[0];
              return (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Best Collection
                    </h4>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {bestCollection?.productName}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {bestCollection?.receivedPercentage.toFixed(1)}% collected
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      ✓ {formatCurrency(bestCollection?.actualReceived)}{" "}
                      received
                    </p>
                    <p>
                      Revenue: {formatCurrency(bestCollection?.totalRevenue)}
                    </p>
                    <p>{bestCollection?.transactionCount} transactions</p>
                  </div>
                </div>
              );
            })()}

            {/* Most Popular (Most Transactions) */}
            {(() => {
              const mostPopular = [...productData].sort(
                (a, b) => b.transactionCount - a.transactionCount
              )[0];
              return (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Most Popular
                    </h4>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {mostPopular?.productName}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {mostPopular?.transactionCount} transactions
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Revenue: {formatCurrency(mostPopular?.totalRevenue)}</p>
                    <p>
                      ✓ {mostPopular?.receivedPercentage.toFixed(1)}% collected
                    </p>
                    <p>{mostPopular?.totalQuantity.toFixed(2)} units sold</p>
                  </div>
                </div>
              );
            })()}

            {/* Highest Pending Dues */}
            {(() => {
              const highestDue = [...productData]
                .filter((p) => p.dueAmount > 0)
                .sort((a, b) => b.dueAmount - a.dueAmount)[0];

              return highestDue ? (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Highest Pending
                    </h4>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {highestDue?.productName}
                  </p>
                  <p className="text-sm text-orange-600 mb-2">
                    {formatCurrency(highestDue?.dueAmount)} pending
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Total: {formatCurrency(highestDue?.totalRevenue)}</p>
                    <p>⏱ {highestDue?.duePercentage.toFixed(1)}% pending</p>
                    <p>{highestDue?.transactionCount} transactions</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Payment Status
                    </h4>
                  </div>
                  <p className="text-lg font-bold text-green-600 mb-1">
                    Excellent!
                  </p>
                  <p className="text-sm text-gray-600">
                    No pending dues across all products
                  </p>
                  <div className="mt-3 text-xs text-green-700">
                    <p>✓ 100% collection rate</p>
                    <p>All payments received</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueByProducts;
