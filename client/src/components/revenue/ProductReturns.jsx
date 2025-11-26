// components/revenue/ProductReturns.jsx

import React, { useState, useEffect, useRef } from "react";
import {
    RotateCcw,
    TrendingDown,
    Package,
    IndianRupee,
    Download,
    Filter,
    X,
    RefreshCw,
    Search,
    Calendar,
    Activity,
    BarChart3,
    TrendingUp as TrendIcon,
    PieChart as PieChartIcon,
    Infinity,
    AlertCircle,
    Clock,
    Tag,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { fetchProductReturns } from "../../api/revenue";
import api from "../../utils/api";

const ProductReturns = () => {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [returnsData, setReturnsData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState("month");
    const [searchTerm, setSearchTerm] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const productDropdownRef = useRef(null);
    const isInitialMount = useRef(true);

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        categoryId: "all",
        productId: "all",
        sortBy: "returnValue",
        sortOrder: "desc",
    });

    const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

    // Time period filter configuration
    const PREDEFINED_RANGES = [
        { label: "Today", value: "today", icon: Calendar },
        { label: "Week", value: "week", icon: Activity },
        { label: "Month", value: "month", icon: BarChart3 },
        { label: "Quarter", value: "quarter", icon: TrendIcon },
        { label: "Year", value: "year", icon: PieChartIcon },
        { label: "All Time", value: "all", icon: Infinity },
    ];

    // Initial data load
    useEffect(() => {
        const initializeData = async () => {
            setInitialLoading(true);
            await Promise.all([fetchCategories(), fetchProducts()]);
            setInitialLoading(false);
            isInitialMount.current = false;
            await fetchData();
        };
        initializeData();
    }, []);

    // Fetch data when filters change
    useEffect(() => {
        if (!isInitialMount.current && !initialLoading) {
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
            setCategories(response.data || []);
            return response.data;
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
            return [];
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get("/products");
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
            const data = await fetchProductReturns(filters);
            setReturnsData(data.products || []);
            setSummary(data.summary || {});
            setCategoryBreakdown(data.categoryBreakdown || []);
            setTrendData(data.trend || []);
        } catch (error) {
            console.error("Error fetching returns data:", error);
            setReturnsData([]);
            setSummary({});
            setCategoryBreakdown([]);
            setTrendData([]);
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

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

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

    const clearFilters = () => {
        setFilters({
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString()
                .split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
            categoryId: "all",
            productId: "all",
            sortBy: "returnValue",
            sortOrder: "desc",
        });
        setSearchTerm("");
        setSelectedProduct(null);
        setSelectedPeriod("month");
    };

    const hasActiveFilters = () => {
        return (
            filters.categoryId !== "all" ||
            filters.productId !== "all"
        );
    };

    // Filter products by category and search term
    const filteredProductsList = products.filter((product) => {
        const productCategoryId = product.category?._id || product.category;
        const matchesCategory =
            filters.categoryId === "all" || productCategoryId === filters.categoryId;
        const matchesSearch =
            searchTerm === "" ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSearchTerm(product.name);
        setFilters((prev) => ({ ...prev, productId: product._id }));
        setShowProductDropdown(false);
    };

    const handleProductSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowProductDropdown(true);
        if (value === "") {
            setSelectedProduct(null);
            setFilters((prev) => ({ ...prev, productId: "all" }));
        }
    };

    const clearProductSelection = () => {
        setSearchTerm("");
        setSelectedProduct(null);
        setFilters((prev) => ({ ...prev, productId: "all" }));
    };

    const exportToCSV = () => {
        const headers = [
            "Product",
            "Category",
            "Return Quantity",
            "Return Value",
            "Return Count",
            "Last Return Date",
            "Avg Return Qty",
        ];

        const csvData = returnsData.map((item) => [
            item.productName,
            item.categoryName,
            item.returnQuantity.toFixed(2),
            item.returnValue.toFixed(2),
            item.returnCount,
            formatDate(item.lastReturnDate),
            item.avgReturnQuantity.toFixed(2),
        ]);

        const csv = [
            headers.join(","),
            ...csvData.map((row) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `product-returns-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color, badge }) => (
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {badge && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                        {badge}
                    </span>
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading returns data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-8 h-8 text-orange-600" />
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Product Returns
                                </h1>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Track and analyze product returns and refunds
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
                                disabled={returnsData.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Badge */}
                    {hasActiveFilters() && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200 mt-4">
                            <span className="text-sm text-orange-800 font-medium">
                                Active filters applied
                            </span>
                            <button
                                onClick={clearFilters}
                                className="ml-auto text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1"
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
                                                    ? "bg-orange-600 text-white shadow-md"
                                                    : "text-slate-600 hover:bg-orange-50 hover:text-orange-900"
                                                }
                      `}
                                        >
                                            <Icon
                                                className={`w-4 h-4 ${isSelected ? "text-white" : "text-orange-400"
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

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                        <StatCard
                            icon={IndianRupee}
                            title="Total Return Value"
                            value={formatCurrency(summary.totalReturnValue || 0)}
                            subtitle={`${summary.totalReturnCount || 0} transactions`}
                            color="bg-gradient-to-br from-orange-500 to-orange-600"
                        />

                        <StatCard
                            icon={Package}
                            title="Return Quantity"
                            value={(summary.totalReturnQuantity || 0).toFixed(2)}
                            subtitle={`${summary.uniqueProductCount || 0} unique products`}
                            color="bg-gradient-to-br from-red-500 to-red-600"
                        />

                        <StatCard
                            icon={TrendingDown}
                            title="Return Rate"
                            value={`${(summary.returnRate || 0).toFixed(2)}%`}
                            subtitle="Of total sales"
                            color="bg-gradient-to-br from-amber-500 to-amber-600"
                            badge={(summary.returnRate || 0) > 5 ? "High" : "Normal"}
                        />

                        <StatCard
                            icon={Tag}
                            title="Avg Return Value"
                            value={formatCurrency(summary.avgReturnValue || 0)}
                            subtitle="Per transaction"
                            color="bg-gradient-to-br from-yellow-500 to-yellow-600"
                        />

                        <StatCard
                            icon={AlertCircle}
                            title="Most Returned"
                            value={
                                summary.mostReturnedProduct
                                    ? summary.mostReturnedProduct.name.substring(0, 15) +
                                    (summary.mostReturnedProduct.name.length > 15 ? "..." : "")
                                    : "N/A"
                            }
                            subtitle={
                                summary.mostReturnedProduct
                                    ? `${summary.mostReturnedProduct.returnCount} returns`
                                    : "No returns yet"
                            }
                            color="bg-gradient-to-br from-rose-500 to-rose-600"
                        />
                    </div>
                )}

                {/* Charts Section */}
                {(trendData.length > 0 || categoryBreakdown.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Returns Trend Chart */}
                        {trendData.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Returns Trend
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                name === "returnValue"
                                                    ? formatCurrency(value)
                                                    : value,
                                                name === "returnValue"
                                                    ? "Return Value"
                                                    : name === "returnQuantity"
                                                        ? "Return Quantity"
                                                        : "Return Count",
                                            ]}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="returnValue"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            name="Return Value"
                                            dot={{ fill: "#f97316" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Category Breakdown */}
                        {categoryBreakdown.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Returns by Category
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={categoryBreakdown.slice(0, 5)}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => entry.categoryName}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="returnValue"
                                        >
                                            {categoryBreakdown.slice(0, 5).map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Top Returned Products Chart */}
                {returnsData.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Top 10 Returned Products
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={returnsData.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tick={{ fontSize: 12 }} />
                                <YAxis
                                    dataKey="productName"
                                    type="category"
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar
                                    dataKey="returnValue"
                                    fill="#f97316"
                                    name="Return Value"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Filters
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={filters.categoryId}
                                    onChange={(e) =>
                                        setFilters({ ...filters, categoryId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Search */}
                            <div className="relative" ref={productDropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleProductSearchChange}
                                        onFocus={() => setShowProductDropdown(true)}
                                        placeholder="Search products..."
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {selectedProduct ? (
                                            <button
                                                onClick={clearProductSelection}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <Search className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                                {showProductDropdown && filteredProductsList.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredProductsList.map((product) => (
                                            <button
                                                key={product._id}
                                                onClick={() => handleProductSelect(product)}
                                                className="w-full text-left px-4 py-2 hover:bg-orange-50 transition-colors"
                                            >
                                                <div className="font-medium">{product.name}</div>
                                                {product.sku && (
                                                    <div className="text-sm text-gray-500">
                                                        SKU: {product.sku}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) =>
                                        setFilters({ ...filters, sortBy: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="returnValue">Return Value</option>
                                    <option value="returnQuantity">Return Quantity</option>
                                    <option value="returnCount">Return Count</option>
                                    <option value="lastReturnDate">Last Return Date</option>
                                    <option value="productName">Product Name</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Returns Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Returns Details
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Return Qty
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Return Value
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Return Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Return
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : returnsData.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <RotateCcw className="w-12 h-12 text-gray-400" />
                                                <p className="text-gray-500">
                                                    No returns found for the selected period
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    returnsData.map((item) => (
                                        <tr
                                            key={item._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.productName}
                                                        </div>
                                                        {item.productSku && (
                                                            <div className="text-sm text-gray-500">
                                                                SKU: {item.productSku}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                    {item.categoryName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                {item.returnQuantity.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                {formatCurrency(item.returnValue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {item.returnCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(item.lastReturnDate)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductReturns;
