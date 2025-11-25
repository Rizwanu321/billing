// components/dashboards/SalesAnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import { fetchSalesAnalytics } from "../../api/dashboard";
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";

const SalesAnalyticsDashboard = () => {
  const [salesData, setSalesData] = useState({
    periodSales: [],
    salesByCategory: [],
    salesTrend: [],
    topSalesPeriods: [],
    comparisonData: {
      totalSales: 0,
      percentChange: 0,
      isPositive: true,
    },
  });
  const [period, setPeriod] = useState("monthly");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSalesData();
  }, [period]);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSalesAnalytics(period);
      setSalesData(data);
    } catch (error) {
      console.error("Error loading sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  });

  const COLORS = [
    "#4F46E5",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
  ];

  // Mock data for the initial render
  const mockData = {
    periodSales: [
      { period: "Jan", sales: 12500 },
      { period: "Feb", sales: 14200 },
      { period: "Mar", sales: 15800 },
      { period: "Apr", sales: 13900 },
      { period: "May", sales: 18700 },
      { period: "Jun", sales: 21500 },
      { period: "Jul", sales: 19800 },
      { period: "Aug", sales: 22400 },
      { period: "Sep", sales: 25700 },
      { period: "Oct", sales: 24300 },
      { period: "Nov", sales: 27900 },
      { period: "Dec", sales: 32400 },
    ],
    salesByCategory: [
      { name: "Electronics", value: 35 },
      { name: "Clothing", value: 25 },
      { name: "Food", value: 15 },
      { name: "Furniture", value: 10 },
      { name: "Books", value: 8 },
      { name: "Other", value: 7 },
    ],
    salesTrend: [
      { date: "2023 Q1", current: 42500, previous: 38900 },
      { date: "2023 Q2", current: 54100, previous: 45600 },
      { date: "2023 Q3", current: 67900, previous: 58700 },
      { date: "2023 Q4", current: 84600, previous: 73200 },
    ],
    topSalesPeriods: [
      { period: "December", sales: 32400, percentOfTotal: 15 },
      { period: "November", sales: 27900, percentOfTotal: 12 },
      { period: "September", sales: 25700, percentOfTotal: 11 },
    ],
    comparisonData: {
      totalSales: 249200,
      percentChange: 18.4,
      isPositive: true,
    },
  };

  // Use mock data if real data is not loaded yet
  const displayData = isLoading ? mockData : salesData;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPeriod("daily")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              period === "daily"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              period === "weekly"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              period === "monthly"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              period === "yearly"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <h2 className="text-xl font-semibold mb-2">Sales Overview</h2>
            <p className="text-blue-100 mb-4">
              {period === "yearly"
                ? "Yearly comparison of sales figures"
                : period === "monthly"
                ? "Monthly sales analysis across the year"
                : period === "weekly"
                ? "Weekly sales trends for current quarter"
                : "Daily sales activity for the current month"}
            </p>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-blue-200 text-sm mb-1">Total Sales</p>
                <p className="text-3xl font-bold">
                  {currencyFormatter.format(
                    displayData.comparisonData.totalSales
                  )}
                </p>
              </div>
              <div className="h-12 border-l border-blue-400"></div>
              <div>
                <p className="text-blue-200 text-sm mb-1">
                  vs Previous {period.charAt(0).toUpperCase() + period.slice(1)}
                </p>
                <div className="flex items-center">
                  {displayData.comparisonData.isPositive ? (
                    <ArrowUp className="text-green-300" size={20} />
                  ) : (
                    <ArrowDown className="text-red-300" size={20} />
                  )}
                  <span className="text-2xl font-bold ml-1">
                    {displayData.comparisonData.percentChange}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-medium mb-2">Top Periods</h3>
            {displayData.topSalesPeriods.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center mb-2"
              >
                <span className="text-blue-100">{item.period}</span>
                <div className="flex items-center">
                  <span className="font-semibold">
                    {currencyFormatter.format(item.sales)}
                  </span>
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full ml-2">
                    {item.percentOfTotal}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales by Period Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Sales by {period.charAt(0).toUpperCase() + period.slice(1)}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayData.periodSales}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={24}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    currencyFormatter.format(value).replace(".00", "")
                  }
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip
                  formatter={(value) => [
                    currencyFormatter.format(value),
                    "Sales",
                  ]}
                  cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Sales Distribution by Category
          </h2>
          <div className="h-80 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData.salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={1}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {displayData.salesByCategory.map((entry, index) => (
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

      {/* Sales Trend Comparison */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          Sales Trend - Current vs Previous Period
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayData.salesTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis
                tickFormatter={(value) =>
                  currencyFormatter.format(value).replace(".00", "")
                }
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <Tooltip
                formatter={(value) => [
                  currencyFormatter.format(value),
                  "Sales",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#94A3B8"
                fill="#F1F5F9"
                name="Previous Period"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#4F46E5"
                fill="#EEF2FF"
                name="Current Period"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* More Insights */}
      <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Peak Sales Day
            </h3>
            <p className="text-2xl font-bold text-blue-600">Friday</p>
            <p className="text-sm text-gray-500 mt-1">
              Sales are typically 24% higher on Fridays
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Average Order Value
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {currencyFormatter.format(128.45)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-green-600">↑ 5.3%</span> compared to last
              period
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Conversion Rate
            </h3>
            <p className="text-2xl font-bold text-blue-600">4.8%</p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-green-600">↑ 0.6%</span> compared to last
              period
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsDashboard;
