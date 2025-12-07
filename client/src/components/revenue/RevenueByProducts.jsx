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
  Wallet,
  HandCoins,
  Calendar,
  ChevronDown,
  Activity,
  Infinity,
  PieChart as PieChartIcon,
  TrendingUp as TrendIcon,
  RotateCcw,
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [selectedPeriod, setSelectedPeriod] = useState("month");
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
    returnsFilter: "all", // all, withReturns, withoutReturns
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

  // Debug: Log when summary changes
  useEffect(() => {
    console.log("Summary state updated:", summary);
  }, [summary]);

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
            <div className="flex justify-between gap-4 border-t border-gray-200 pt-1 mt-1">
              <span className="text-gray-600 font-medium">Gross Revenue:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(data.revenue)}
              </span>
            </div>
            {data.returnValue > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-red-600">Returns:</span>
                <span className="font-medium text-red-700">
                  -{formatCurrency(data.returnValue)}
                </span>
              </div>
            )}
            {data.returnValue > 0 && (
              <div className="flex justify-between gap-4 border-t border-emerald-200 pt-1 mt-1">
                <span className="text-emerald-600 font-semibold">Net Revenue:</span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(
                    data.netRevenue !== undefined
                      ? data.netRevenue
                      : data.revenue - (data.returnValue || 0)
                  )}
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
      console.log("Summary from API:", data.summary);

      // Backend now handles all filtering, so we directly use the data
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
      returnsFilter: "all",
    });
    setProductSearchTerm("");
    setSelectedProduct(null);
    setSelectedPeriod("month");
  };


  const hasActiveFilters = () => {
    return (
      filters.categoryId !== "all" ||
      filters.productId !== "all" ||
      filters.minRevenue ||
      filters.maxRevenue ||
      filters.returnsFilter !== "all"
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

  // Time period filter configuration (excluding custom)
  const PREDEFINED_RANGES = [
    { label: "Today", value: "today", icon: Calendar },
    { label: "Week", value: "week", icon: Activity },
    { label: "Month", value: "month", icon: BarChart3 },
    { label: "Quarter", value: "quarter", icon: TrendIcon },
    { label: "Year", value: "year", icon: PieChartIcon },
    { label: "All Time", value: "all", icon: Infinity },
  ];

  // Handle time period changes
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const today = new Date();
    let startDate, endDate;

    today.setHours(0, 0, 0, 0);

    switch (period) {
      case "today":
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case "week":
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - diffToMonday);
        endDate = new Date(today);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case "quarter":
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        const quarterEndMonth = currentQuarter * 3 + 2;
        endDate = new Date(today.getFullYear(), quarterEndMonth + 1, 0);
        if (endDate > today) {
          endDate = new Date(today);
        }
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
      case "all":
        startDate = null;
        endDate = new Date(today);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
    }

    const formatDate = (date) => {
      if (!date) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setFilters((prev) => ({
      ...prev,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    }));
  };


  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center text-sm font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"
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
    const hasReturns = summary?.totalReturns > 0;

    const headers = [
      "Product",
      "Category",
      "Gross Revenue",
      ...(hasReturns ? ["Returns (Value)", "Net Revenue"] : []),
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
      ...(hasReturns ? [
        (product.returnValue || 0).toFixed(2),
        (product.netRevenue || 0).toFixed(2),
      ] : []),
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
    a.download = `product-revenue-${new Date().toISOString().split("T")[0]
      }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // PDF-specific currency format (Rs. instead of ₹ symbol)
  const formatCurrencyForPDF = (value) => {
    const num = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
    return `Rs. ${num}`;
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (productData.length === 0) return;

    try {
      // Create PDF document (landscape A4)
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const hasReturns = summary?.totalReturns > 0;

      // ========== HEADER ==========
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Product Revenue Report', pageWidth / 2, 18, { align: 'center' });

      // Subtitle - filters info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);

      let filterText = '';
      if (filters.startDate && filters.endDate) {
        filterText = `Period: ${filters.startDate} to ${filters.endDate}`;
      }
      if (filters.categoryId !== 'all') {
        const category = categories.find(c => c._id === filters.categoryId);
        filterText += filterText ? ' | ' : '';
        filterText += `Category: ${category?.name || 'Selected'}`;
      }
      if (filters.productId !== 'all') {
        filterText += filterText ? ' | ' : '';
        filterText += `Product: ${selectedProduct?.name || 'Selected'}`;
      }
      if (!filterText) {
        filterText = 'All Products';
      }

      doc.text(filterText, pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 30, { align: 'center' });

      // ========== SUMMARY BOX ==========
      const summaryStartY = 36;
      const boxHeight = 18;
      const numBoxes = hasReturns ? 5 : 3;
      const boxWidth = (pageWidth - margin * 2) / numBoxes;

      const summaryItems = [
        { label: 'Gross Revenue', value: formatCurrencyForPDF(summary?.totalRevenue || 0) },
        ...(hasReturns ? [
          { label: 'Returns', value: formatCurrencyForPDF(summary?.totalReturns || 0) },
          { label: 'Net Revenue', value: formatCurrencyForPDF(summary?.netRevenue || 0) },
        ] : []),
        { label: 'Total Collected', value: formatCurrencyForPDF(summary?.totalCollected || 0) },
        { label: 'Net Position', value: formatCurrencyForPDF(summary?.totalDueRevenue || 0) },
      ];

      summaryItems.forEach((item, index) => {
        const x = margin + (boxWidth * index);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, summaryStartY, boxWidth - 2, boxHeight, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + (boxWidth - 2) / 2, summaryStartY + 6, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(item.value, x + (boxWidth - 2) / 2, summaryStartY + 13, { align: 'center' });
      });

      // ========== TABLE ==========
      const tableStartY = summaryStartY + boxHeight + 6;

      // Simplified columns for PDF
      const tableColumn = ['#', 'Product', 'Category', 'Gross Revenue', 'Received', 'Due', 'Qty', 'Performance'];
      const tableRows = productData.map((product, index) => [
        String(index + 1),
        product.productName.length > 25 ? product.productName.substring(0, 22) + '...' : product.productName,
        product.categoryName.length > 15 ? product.categoryName.substring(0, 12) + '...' : product.categoryName,
        formatCurrencyForPDF(product.totalRevenue),
        formatCurrencyForPDF(product.actualReceived),
        formatCurrencyForPDF(product.dueAmount),
        String(product.totalQuantity),
        product.totalRevenue > (summary?.avgRevenuePerProduct || 0) * 1.5
          ? 'High'
          : product.totalRevenue < (summary?.avgRevenuePerProduct || 0) * 0.5
            ? 'Low'
            : 'Avg',
      ]);

      // Calculate table width and center it
      const colWidths = [10, 55, 35, 35, 35, 30, 20, 22];
      const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
      const centerMargin = (pageWidth - totalTableWidth) / 2;

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: tableStartY,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [51, 65, 85],
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: colWidths[0], halign: 'center' },
          1: { cellWidth: colWidths[1], halign: 'left' },
          2: { cellWidth: colWidths[2], halign: 'left' },
          3: { cellWidth: colWidths[3], halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: colWidths[4], halign: 'right' },
          5: { cellWidth: colWidths[5], halign: 'right' },
          6: { cellWidth: colWidths[6], halign: 'center' },
          7: { cellWidth: colWidths[7], halign: 'center' },
        },
        margin: { left: centerMargin, right: centerMargin },
        tableWidth: totalTableWidth,
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
          );
        },
      });

      // Save PDF
      const fileName = `product-revenue-${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
    }
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
                onClick={exportToPDF}
                disabled={productData.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
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

          {/* Time Period Selector */}
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
            <div className="overflow-x-auto">
              <div className="flex sm:grid sm:grid-cols-6 gap-1 min-w-max sm:min-w-0">
                {PREDEFINED_RANGES.map((range) => {
                  const Icon = range.icon;
                  const isSelected = selectedPeriod === range.value;
                  return (
                    <button
                      key={range.value}
                      onClick={() => handlePeriodChange(range.value)}
                      className={`
                        flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm whitespace-nowrap
                        ${isSelected
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <Icon
                        className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-slate-400"
                          }`}
                      />
                      <span>{range.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        {summary && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${summary.totalReturns > 0 ? 'xl:grid-cols-5' : 'xl:grid-cols-3'
            } gap-4 sm:gap-6 mb-8`}>
            <StatCard
              icon={IndianRupee}
              title="Gross Revenue"
              value={formatCurrency(summary.totalRevenue || 0)}
              subtitle="Total Sales"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />

            {summary.totalReturns > 0 && (
              <StatCard
                icon={RotateCcw}
                title="Returns"
                value={formatCurrency(summary.totalReturns || 0)}
                subtitle="Product Returns"
                color="bg-gradient-to-br from-red-500 to-red-600"
              />
            )}

            {summary.totalReturns > 0 && (
              <StatCard
                icon={Wallet}
                title="Net Revenue"
                value={formatCurrency(summary.netRevenue || 0)}
                subtitle="Gross - Returns"
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
            )}

            <StatCard
              icon={HandCoins}
              title="Total Collected"
              value={formatCurrency(summary.totalCollected || 0)}
              subtitle="Cash + Online + Due Payments"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />

            <StatCard
              icon={Clock}
              title="Net Position"
              value={formatCurrency(summary.totalDueRevenue || summary.totalDue || 0)}
              subtitle={
                (summary.totalDueRevenue || 0) < 0
                  ? "Advance Received"
                  : (summary.totalDueRevenue || 0) > 0
                    ? "Outstanding Amount"
                    : "Fully Settled"
              }
              color={
                (summary.totalDueRevenue || 0) < 0
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-br from-orange-500 to-orange-600"
              }
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
                {summary.totalReturns > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Returns Impact:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(summary.totalReturns)}
                      </span>
                    </div>
                  </div>
                )}
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
                    <Legend />
                    <Bar
                      dataKey="netRevenue"
                      stackId="a"
                      fill="#10b981"
                      name="Net Revenue"
                    />
                    {summary.totalReturns > 0 && (
                      <Bar
                        dataKey="returnValue"
                        stackId="a"
                        fill="#ef4444"
                        name="Returns"
                      />
                    )}
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
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${summary.totalReturns > 0 ? "lg:grid-cols-3" : ""
                } gap-6`}
            >
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
                    <span className="text-sm text-green-600">Received</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(summary.actualReceived)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-orange-600">Due</span>
                    <span className="font-medium text-orange-700">
                      {formatCurrency(summary.totalDue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-300 pt-2">
                    <span className="text-sm font-medium text-gray-600">Gross Revenue</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(summary.totalRevenue)}
                    </span>
                  </div>
                  {summary.totalReturns > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-red-600">Returns</span>
                      <span className="font-medium text-red-700">
                        -{formatCurrency(summary.totalReturns)}
                      </span>
                    </div>
                  )}
                  {summary.totalReturns > 0 && (
                    <div className="flex justify-between items-center border-t border-emerald-300 pt-2">
                      <span className="text-sm font-semibold text-emerald-700">Net Revenue</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(summary.netRevenue)}
                      </span>
                    </div>
                  )}
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

              {/* Net Position */}
              <div className={`p-4 rounded-lg border ${(summary.totalDueRevenue || 0) < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className={`w-5 h-5 ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                  <h4 className="font-semibold text-gray-900">
                    Net Position
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className={`font-medium ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {formatCurrency(summary.totalDueRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="font-medium text-gray-900">
                      {(summary.totalDueRevenue || 0) < 0 ? 'Advance' : 'Outstanding'}
                    </span>
                  </div>
                  <div className={`pt-2 border-t ${(summary.totalDueRevenue || 0) < 0 ? 'border-emerald-200' : 'border-orange-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">
                        Products
                      </span>
                      <span className={`text-lg font-bold ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {productData.filter((p) => p.dueAmount > 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Returns Impact - Added */}
              {summary.totalReturns > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <RotateCcw className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-gray-900">
                      Returns Impact
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Returns
                      </span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(summary.totalReturns)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        % of Revenue
                      </span>
                      <span className="font-medium text-gray-900">
                        {summary.totalRevenue > 0
                          ? `${(
                            (summary.totalReturns / summary.totalRevenue) *
                            100
                          ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-red-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">
                          Products
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          {productData.filter((p) => p.returnValue > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Revenue Trend Chart - Dynamic based on selected period */}
        {revenueTrend.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Revenue Trend - Top 5 Products
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    // Determine period description based on selected period
                    const periodDescriptions = {
                      today: "Today's hourly performance with payment status",
                      week: "This week's daily performance with payment status",
                      month: "This month's daily performance with payment status",
                      quarter: "This quarter's weekly performance with payment status",
                      year: "This year's monthly performance with payment status",
                      all: "All-time monthly performance with payment status",
                    };
                    return periodDescriptions[selectedPeriod] || "Performance trend with payment status";
                  })()}
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
                {summary.totalReturns > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-600">Returns</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grouped Bar Chart for time-based trend visualization */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={(() => {
                  // Transform data: Group by date, with products as separate bars
                  const dateGroups = {};
                  revenueTrend.forEach(item => {
                    if (!dateGroups[item.date]) {
                      dateGroups[item.date] = { date: item.date };
                    }
                    // Use product name as key for this date's data
                    const productKey = item.productName.substring(0, 20); // Truncate for legend
                    dateGroups[item.date][`${productKey}_revenue`] = item.revenue;
                    dateGroups[item.date][`${productKey}_received`] = item.actualReceived;
                    dateGroups[item.date][`${productKey}_due`] = item.dueAmount;
                    if (item.returnValue > 0) {
                      dateGroups[item.date][`${productKey}_returns`] = item.returnValue;
                    }
                  });
                  return Object.values(dateGroups);
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900 mb-2">{label}</p>
                          <div className="space-y-1 text-xs">
                            {payload.map((entry, index) => (
                              <div key={index} className="flex justify-between gap-3">
                                <span style={{ color: entry.color }}>{entry.name}:</span>
                                <span className="font-medium">{formatCurrency(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {/* Generate bars dynamically based on unique products */}
                {Array.from(new Set(revenueTrend.map(item => item.productName))).map((productName, idx) => {
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                  const productKey = productName.substring(0, 20);
                  return (
                    <Bar
                      key={productKey}
                      dataKey={`${productKey}_revenue`}
                      fill={colors[idx % colors.length]}
                      name={`${productName} (Revenue)`}
                    />
                  );
                })}
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
                      <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                        <span className="text-gray-600 font-medium">Gross Revenue:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      {item.returnValue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Returns:</span>
                          <span className="font-medium text-red-700">
                            -{formatCurrency(item.returnValue)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-emerald-200 pt-1 mt-1">
                        <span className="text-emerald-600 font-semibold">
                          Net Revenue:
                        </span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(item.netRevenue)}
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
        {/* Advanced Filters Section */}
        {showFilters && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300 relative z-20">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible">
              {/* Filter Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Advanced Filters
                    </h3>
                    <p className="text-xs text-gray-500">
                      Refine your revenue analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                >
                  <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                  Reset Filters
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Group 1: Time Period */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-medium ml-1">
                          From
                        </span>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-medium ml-1">
                          To
                        </span>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Product & Category */}
                  <div className="space-y-3 relative z-30">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      Product & Category
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={filters.categoryId}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              categoryId: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer pr-10 transition-all"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      {/* Custom Product Search Dropdown */}
                      <div
                        className="relative"
                        ref={productDropdownRef}
                      >
                        <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          <input
                            type="text"
                            value={productSearchTerm}
                            onChange={handleProductSearchChange}
                            onFocus={() => setShowProductDropdown(true)}
                            placeholder="Search product..."
                            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                          />
                          {selectedProduct && (
                            <button
                              onClick={clearProductSelection}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown Menu */}
                        {showProductDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                            {filteredProductsList.length > 0 ? (
                              <div className="p-1">
                                <button
                                  onClick={() => {
                                    clearProductSelection();
                                    setShowProductDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-600 transition-colors mb-1"
                                >
                                  All Products ({filteredProductsList.length})
                                </button>
                                {filteredProductsList.map((product) => {
                                  const categoryName =
                                    product.category?.name ||
                                    categories.find(
                                      (c) => c._id === product.category
                                    )?.name ||
                                    "Uncategorized";

                                  return (
                                    <button
                                      key={product._id}
                                      onClick={() =>
                                        handleProductSelect(product)
                                      }
                                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5 ${selectedProduct?._id === product._id
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="truncate mr-2">
                                          {product.name}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                          {categoryName}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-6 text-center">
                                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">
                                  No products found
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Financials */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5" />
                      Revenue Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={filters.minRevenue}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              minRevenue: e.target.value,
                            }))
                          }
                          placeholder="Min"
                          className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={filters.maxRevenue}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              maxRevenue: e.target.value,
                            }))
                          }
                          placeholder="Max"
                          className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group 4: Analysis */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analysis
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <select
                          value={filters.returnsFilter}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              returnsFilter: e.target.value,
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none appearance-none cursor-pointer pr-10 ${filters.returnsFilter !== "all"
                            ? "bg-red-50 border-red-200 text-red-700 font-medium"
                            : "bg-gray-50 border-gray-200 text-gray-700 focus:bg-white focus:border-blue-500"
                            }`}
                        >
                          <option value="all">All Products</option>
                          <option value="withReturns">With Returns Only</option>
                          <option value="withoutReturns">
                            Without Returns Only
                          </option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={filters.sortBy}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                sortBy: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none appearance-none cursor-pointer pr-10"
                          >
                            <option value="totalRevenue">Revenue</option>
                            <option value="totalQuantity">Quantity</option>
                            <option value="avgPrice">Avg Price</option>
                            <option value="productName">Name</option>
                            <option value="profitMargin">Profit Margin</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              sortOrder:
                                prev.sortOrder === "desc" ? "asc" : "desc",
                            }))
                          }
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all duration-200 text-gray-600"
                          title={
                            filters.sortOrder === "desc"
                              ? "Descending"
                              : "Ascending"
                          }
                        >
                          {filters.sortOrder === "desc" ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters() && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                      Active Filters:
                    </span>

                    {filters.categoryId !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                        Category:{" "}
                        {categories.find((c) => c._id === filters.categoryId)
                          ?.name}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              categoryId: "all",
                            }))
                          }
                          className="hover:text-blue-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {filters.productId !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-100">
                        Product: {selectedProduct?.name}
                        <button
                          onClick={clearProductSelection}
                          className="hover:text-emerald-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {filters.minRevenue && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-md text-xs font-medium border border-violet-100">
                        Min: ₹{filters.minRevenue}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, minRevenue: "" }))
                          }
                          className="hover:text-violet-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {filters.maxRevenue && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-md text-xs font-medium border border-violet-100">
                        Max: ₹{filters.maxRevenue}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, maxRevenue: "" }))
                          }
                          className="hover:text-violet-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {filters.returnsFilter !== "all" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium border border-red-100">
                        Returns:{" "}
                        {filters.returnsFilter === "withReturns"
                          ? "With Returns"
                          : "Without Returns"}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              returnsFilter: "all",
                            }))
                          }
                          className="hover:text-red-900 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                ? `Showing ${productData.length} product${productData.length !== 1 ? "s" : ""
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
                        Gross Revenue
                      </th>
                      {summary?.totalReturns > 0 && (
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Returns
                        </th>
                      )}
                      {summary?.totalReturns > 0 && (
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Net Revenue
                        </th>
                      )}
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
                          colSpan="10"
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
                            {summary?.totalReturns > 0 && (
                              <td className="py-3 px-4 text-right">
                                {product.returnValue > 0 ? (
                                  <div>
                                    <p className="text-red-600 font-medium">
                                      {formatCurrency(product.returnValue)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {product.returnQuantity.toFixed(2)} qty
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}
                            {summary?.totalReturns > 0 && (
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {formatCurrency(product.netRevenue)}
                              </td>
                            )}
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
                            <td className="py-3 px-4 text-center">
                              {/* Performance Badge Only */}
                              {getPerformanceBadge(
                                product.totalRevenue,
                                summary?.avgRevenuePerProduct || 0
                              )}
                            </td>

                            {/* Payment Status Column */}
                            <td className="py-3 px-4">
                              <div className="space-y-2">
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
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
                                <div className="flex gap-2 text-xs justify-center">
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
                  {/* Transaction Summary - Below Table */}
                  {productData.length > 0 && summary && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h3>
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${summary.totalReturns > 0 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4'} gap-4 sm:gap-6`}>
                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <IndianRupee className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-700 text-sm">Total Revenue</h4>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(summary.totalRevenue || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            From {summary.totalProducts || 0} product{(summary.totalProducts || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {summary.totalReturns > 0 && (
                          <div className="bg-white rounded-xl shadow-md p-5 border border-red-100 bg-red-50">
                            <div className="flex items-center gap-2 mb-3">
                              <RotateCcw className="w-5 h-5 text-red-600" />
                              <h4 className="font-semibold text-gray-700 text-sm">Returns</h4>
                            </div>
                            <p className="text-2xl font-bold text-red-600 mb-1">
                              {formatCurrency(summary.totalReturns || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {productData.filter((p) => p.returnValue > 0).length} product{productData.filter((p) => p.returnValue > 0).length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}

                        {summary.totalReturns > 0 && (
                          <div className="bg-white rounded-xl shadow-md p-5 border border-emerald-100 bg-emerald-50">
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp className="w-5 h-5 text-emerald-600" />
                              <h4 className="font-semibold text-gray-700 text-sm">Net Revenue</h4>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700 mb-1">
                              {formatCurrency(summary.netRevenue || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Gross - Returns
                            </p>
                          </div>
                        )}

                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Wallet className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-gray-700 text-sm">Total Collected</h4>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(summary.totalCollected || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {summary.collectionRate?.toFixed(1) || '0.0'}% collected
                          </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <HandCoins className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-semibold text-gray-700 text-sm">Due Payments</h4>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(summary.duePayments || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {summary.paymentCount || 0} payment{(summary.paymentCount || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className={`rounded-xl shadow-md p-5 border ${(summary.totalDueRevenue || 0) < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className={`w-5 h-5 ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                            <h4 className={`font-semibold text-sm ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-800' : 'text-gray-700'}`}>Net Position</h4>
                          </div>
                          <p className={`text-2xl font-bold mb-1 ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {formatCurrency(summary.totalDueRevenue || 0)}
                          </p>
                          <p className={`text-xs ${(summary.totalDueRevenue || 0) < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {(summary.totalDueRevenue || 0) < 0 ? 'Advance Received' : 'Outstanding Amount'}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-700 text-sm">Total Quantity</h4>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">
                            {summary.totalQuantitySold?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {summary.totalTransactions || 0} transaction{(summary.totalTransactions || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Summary Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
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
        {
          productData.length > 0 && (
            <div className={`mt-8 grid grid-cols-1 sm:grid-cols-2 ${summary?.totalReturns > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
              {/* Best Seller (Net Revenue) */}
              {(() => {
                const bestSeller = [...productData].sort(
                  (a, b) => b.netRevenue - a.netRevenue
                )[0];
                return (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Best Seller (Net)
                      </h4>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {bestSeller?.productName}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatCurrency(bestSeller?.netRevenue)}
                    </p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>Gross: {formatCurrency(bestSeller?.totalRevenue)}</p>
                      {summary?.totalReturns > 0 && (
                        <p>Returns: {formatCurrency(bestSeller?.returnValue)}</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Most Returned - Only show when returns exist */}
              {summary?.totalReturns > 0 && (() => {
                const mostReturned = [...productData].sort(
                  (a, b) => b.returnValue - a.returnValue
                )[0];
                return mostReturned && mostReturned.returnValue > 0 ? (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <RotateCcw className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-gray-900 text-sm">
                        Most Returned
                      </h4>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {mostReturned?.productName}
                    </p>
                    <p className="text-sm text-red-600 mb-2">
                      {formatCurrency(mostReturned?.returnValue)}
                    </p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>{mostReturned?.returnQuantity} units returned</p>
                      <p>{mostReturned?.returnCount} return txns</p>
                    </div>
                  </div>
                ) : null;
              })()}

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
                        {mostPopular?.totalQuantity.toFixed(2)} units sold
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )
        }
      </div >
    </div >
  );
};

export default RevenueByProducts;
