// components/dashboards/StockDashboard.jsx
import React, { useState, useEffect } from "react";
import { fetchStockOverview, fetchStockAlerts } from "../../api/dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Package,
  TrendingDown,
  Search,
  RefreshCw,
} from "lucide-react";

const StockDashboard = () => {
  const [stockData, setStockData] = useState({
    overview: {
      totalProducts: 0,
      productsInStock: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      averageStockLevel: 0,
      stockTurnoverRate: 0,
    },
    stockDistribution: [],
    stockMovement: [],
    categoryBreakdown: [],
    topSellingProducts: [],
    lowStockItems: [],
  });
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadStockData();
  }, [lowStockThreshold]);

  const loadStockData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchStockOverview();
      const alerts = await fetchStockAlerts(lowStockThreshold);

      setStockData({
        ...data,
        lowStockItems: alerts,
      });
    } catch (error) {
      console.error("Error loading stock data:", error);

      // Set mock data for demo purposes
      setStockData({
        overview: {
          totalProducts: 248,
          productsInStock: 231,
          lowStockProducts: 17,
          outOfStockProducts: 5,
          averageStockLevel: 42,
          stockTurnoverRate: 4.2,
        },
        stockDistribution: [
          { range: "0", count: 5 },
          { range: "1-10", count: 17 },
          { range: "11-20", count: 29 },
          { range: "21-50", count: 84 },
          { range: "51-100", count: 76 },
          { range: ">100", count: 37 },
        ],
        stockMovement: [
          { day: "Mon", incoming: 45, outgoing: 38 },
          { day: "Tue", incoming: 52, outgoing: 43 },
          { day: "Wed", incoming: 38, outgoing: 52 },
          { day: "Thu", incoming: 67, outgoing: 49 },
          { day: "Fri", incoming: 83, outgoing: 75 },
          { day: "Sat", incoming: 65, outgoing: 70 },
          { day: "Sun", incoming: 27, outgoing: 18 },
        ],
        categoryBreakdown: [
          { name: "Electronics", value: 32 },
          { name: "Clothing", value: 21 },
          { name: "Home Goods", value: 18 },
          { name: "Food", value: 15 },
          { name: "Accessories", value: 9 },
          { name: "Other", value: 5 },
        ],
        topSellingProducts: [
          { name: "Smartphone XYZ", stock: 27, turnover: 5.8 },
          { name: "Wireless Earbuds", stock: 43, turnover: 5.2 },
          { name: "Laptop Model A", stock: 18, turnover: 4.9 },
          { name: "HD Monitor", stock: 32, turnover: 4.6 },
          { name: "Bluetooth Speaker", stock: 51, turnover: 4.3 },
        ],
        lowStockItems: [
          { _id: "1", name: "Laptop Model A", stock: 3, threshold: 10 },
          { _id: "2", name: "Smart Watch", stock: 5, threshold: 10 },
          { _id: "3", name: "Headphones", stock: 8, threshold: 15 },
          { _id: "4", name: "USB Cable", stock: 9, threshold: 20 },
          { _id: "5", name: "Power Bank", stock: 6, threshold: 10 },
          { _id: "6", name: "Phone Case", stock: 7, threshold: 15 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = [
    "#4F46E5",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];

  // Filter low stock items based on search
  const filteredLowStockItems = stockData.lowStockItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockLevelClass = (stock, threshold) => {
    if (stock === 0) return "bg-red-50 text-red-800 border-red-200";
    if (stock <= threshold * 0.3)
      return "bg-red-50 text-red-800 border-red-200";
    if (stock <= threshold * 0.6)
      return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-yellow-50 text-yellow-800 border-yellow-200";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stock Monitoring</h1>
        <button
          onClick={loadStockData}
          className="flex items-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Package size={20} />
            </div>
            <div className="ml-3">
              <p className="text-gray-500 text-xs font-medium mb-1">
                TOTAL PRODUCTS
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                {stockData.overview.totalProducts}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <div className="ml-3">
              <p className="text-gray-500 text-xs font-medium mb-1">IN STOCK</p>
              <h3 className="text-xl font-bold text-gray-800">
                {stockData.overview.productsInStock}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div className="ml-3">
              <p className="text-gray-500 text-xs font-medium mb-1">
                LOW STOCK
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                {stockData.overview.lowStockProducts}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <TrendingDown size={20} />
            </div>
            <div className="ml-3">
              <p className="text-gray-500 text-xs font-medium mb-1">
                OUT OF STOCK
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                {stockData.overview.outOfStockProducts}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-gray-500 text-xs font-medium mb-1">
                AVG STOCK LEVEL
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                {stockData.overview.averageStockLevel}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-gray-500 text-xs font-medium mb-1">
                TURNOVER RATE
              </p>
              <h3 className="text-xl font-bold text-gray-800">
                {stockData.overview.stockTurnoverRate.toFixed(1)}x
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Stock Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockData.stockDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={36}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip
                  formatter={(value) => [`${value} products`, "Count"]}
                  cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                  {stockData.stockDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Movement */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Weekly Stock Movement
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stockData.stockMovement}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip
                  formatter={(value) => [`${value} units`, ""]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend iconType="circle" verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="incoming"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Items Received"
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="outgoing"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  name="Items Sold"
                  dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Category Breakdown
          </h2>
          <div className="h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={1}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {stockData.categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, "Percentage"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          Top Products by Turnover Rate
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Product Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Current Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Turnover Rate
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockData.topSellingProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.stock} units
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.turnover.toFixed(1)}x
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.stock <= 5
                          ? "bg-red-100 text-red-800"
                          : product.stock <= 15
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {product.stock <= 5
                        ? "Low Stock"
                        : product.stock <= 15
                        ? "Moderate"
                        : "Good"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Low Stock Alerts</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-600 mr-2">
                Threshold:
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filteredLowStockItems.length > 0 ? (
            filteredLowStockItems.map((item) => (
              <div
                key={item._id}
                className={`rounded-lg p-4 border transition-all duration-200 ${getStockLevelClass(
                  item.stock,
                  item.threshold || lowStockThreshold
                )}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-medium text-base truncate">
                      {item.name}
                    </h3>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-semibold">
                        Current Stock: {item.stock}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.stock === 0
                            ? "bg-red-500"
                            : item.stock <=
                              (item.threshold || lowStockThreshold) * 0.3
                            ? "bg-red-500"
                            : item.stock <=
                              (item.threshold || lowStockThreshold) * 0.6
                            ? "bg-amber-500"
                            : "bg-yellow-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (item.stock /
                              (item.threshold || lowStockThreshold)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      item.stock === 0
                        ? "bg-red-200 text-red-600"
                        : item.stock <=
                          (item.threshold || lowStockThreshold) * 0.3
                        ? "bg-red-200 text-red-600"
                        : item.stock <=
                          (item.threshold || lowStockThreshold) * 0.6
                        ? "bg-amber-200 text-amber-600"
                        : "bg-yellow-200 text-yellow-600"
                    }`}
                  >
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="font-medium">
                  {searchTerm
                    ? "No matching products found"
                    : "All products are well-stocked!"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
