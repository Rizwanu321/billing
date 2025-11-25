// components/dashboards/EarningsDashboard.jsx
import React, { useState, useEffect } from "react";
import { fetchEarningsData } from "../../api/dashboard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";
import {
  Calendar,
  ArrowUp,
  ArrowDown,
  IndianRupee,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const EarningsDashboard = () => {
  const [earningsData, setEarningsData] = useState({
    monthlyEarnings: [],
    quarterlyComparison: [],
    expenseBreakdown: [],
    profitMargins: [],
    yearlyData: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      yearOverYearGrowth: 0,
      isGrowthPositive: true,
    },
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, [selectedYear]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchEarningsData(selectedYear);
      setEarningsData(data);
    } catch (error) {
      console.error("Error loading earnings data:", error);
      // Set mock data for demo purposes
      setEarningsData({
        monthlyEarnings: [
          { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
          { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
          { month: "Mar", revenue: 48000, expenses: 31000, profit: 17000 },
          { month: "Apr", revenue: 61000, expenses: 39000, profit: 22000 },
          { month: "May", revenue: 55000, expenses: 34000, profit: 21000 },
          { month: "Jun", revenue: 67000, expenses: 41000, profit: 26000 },
          { month: "Jul", revenue: 72000, expenses: 43000, profit: 29000 },
          { month: "Aug", revenue: 69000, expenses: 40000, profit: 29000 },
          { month: "Sep", revenue: 71000, expenses: 42000, profit: 29000 },
          { month: "Oct", revenue: 84000, expenses: 49000, profit: 35000 },
          { month: "Nov", revenue: 96000, expenses: 51000, profit: 45000 },
          { month: "Dec", revenue: 110000, expenses: 62000, profit: 48000 },
        ],
        quarterlyComparison: [
          {
            quarter: "Q1",
            currentYearProfit: 47000,
            previousYearProfit: 39000,
            percentChange: 20.5,
          },
          {
            quarter: "Q2",
            currentYearProfit: 69000,
            previousYearProfit: 54000,
            percentChange: 27.8,
          },
          {
            quarter: "Q3",
            currentYearProfit: 87000,
            previousYearProfit: 73000,
            percentChange: 19.2,
          },
          {
            quarter: "Q4",
            currentYearProfit: 128000,
            previousYearProfit: 98000,
            percentChange: 30.6,
          },
        ],
        expenseBreakdown: [
          { category: "Operations", amount: 175000 },
          { category: "Marketing", amount: 95000 },
          { category: "Inventory", amount: 142000 },
          { category: "Salaries", amount: 203000 },
          { category: "Rent", amount: 68000 },
          { category: "Other", amount: 47000 },
        ],
        profitMargins: [
          { month: "Jan", margin: 28.9 },
          { month: "Feb", margin: 32.7 },
          { month: "Mar", margin: 35.4 },
          { month: "Apr", margin: 36.1 },
          { month: "May", margin: 38.2 },
          { month: "Jun", margin: 38.8 },
          { month: "Jul", margin: 40.3 },
          { month: "Aug", margin: 42.0 },
          { month: "Sep", margin: 40.8 },
          { month: "Oct", margin: 41.7 },
          { month: "Nov", margin: 46.9 },
          { month: "Dec", margin: 43.6 },
        ],
        yearlyData: {
          totalRevenue: 830000,
          totalExpenses: 499000,
          netProfit: 331000,
          profitMargin: 39.9,
          yearOverYearGrowth: 24.8,
          isGrowthPositive: true,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 5; i <= currentYear; i++) {
    yearOptions.push(i);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Earnings Dashboard</h1>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div className="ml-2 p-2 bg-white rounded-md border border-gray-300">
            <Calendar size={20} className="text-gray-600" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                TOTAL REVENUE
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {currencyFormatter.format(earningsData.yearlyData.totalRevenue)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <IndianRupee size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="text-green-500" size={16} />
            <span className="text-green-500 font-medium ml-1">12.5%</span>
            <span className="text-gray-500 text-sm ml-1">vs last year</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                TOTAL EXPENSES
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {currencyFormatter.format(
                  earningsData.yearlyData.totalExpenses
                )}
              </h3>
            </div>
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="text-amber-500" size={16} />
            <span className="text-amber-500 font-medium ml-1">8.3%</span>
            <span className="text-gray-500 text-sm ml-1">vs last year</span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                NET PROFIT
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {currencyFormatter.format(earningsData.yearlyData.netProfit)}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {earningsData.yearlyData.isGrowthPositive ? (
              <>
                <ArrowUp className="text-green-500" size={16} />
                <span className="text-green-500 font-medium ml-1">
                  {earningsData.yearlyData.yearOverYearGrowth}%
                </span>
              </>
            ) : (
              <>
                <ArrowDown className="text-red-500" size={16} />
                <span className="text-red-500 font-medium ml-1">
                  {Math.abs(earningsData.yearlyData.yearOverYearGrowth)}%
                </span>
              </>
            )}
            <span className="text-gray-500 text-sm ml-1">vs last year</span>
          </div>
        </div>

        {/* Profit Margin Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                PROFIT MARGIN
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {earningsData.yearlyData.profitMargin}%
              </h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUp className="text-green-500" size={16} />
            <span className="text-green-500 font-medium ml-1">2.8%</span>
            <span className="text-gray-500 text-sm ml-1">vs last year</span>
          </div>
        </div>
      </div>

      {/* Revenue, Expenses, and Profit Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          Monthly Earnings Breakdown
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={earningsData.monthlyEarnings}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(value) =>
                  currencyFormatter.format(value).replace(/INR/g, "")
                }
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <Tooltip
                formatter={(value, name) => [
                  currencyFormatter.format(value),
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Legend iconType="circle" verticalAlign="top" height={36} />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill="#4ADE80"
                name="Revenue"
                barSize={20}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="expenses"
                fill="#F87171"
                name="Expenses"
                barSize={20}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="profit"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Profit"
                dot={{ r: 4, strokeWidth: 2, fill: "white" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Quarterly Comparison */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Quarterly Profit Comparison
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={earningsData.quarterlyComparison}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={20}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    currencyFormatter.format(value).replace(/INR/g, "")
                  }
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    currencyFormatter.format(value),
                    name === "currentYearProfit"
                      ? `Current Year (${selectedYear})`
                      : `Previous Year (${selectedYear - 1})`,
                  ]}
                  cursor={{ fill: "rgba(79, 70, 229, 0.1)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  labelFormatter={(label) => `Quarter: ${label}`}
                />
                <Legend
                  iconType="circle"
                  verticalAlign="top"
                  height={36}
                  formatter={(value) =>
                    value === "currentYearProfit"
                      ? `Current Year (${selectedYear})`
                      : `Previous Year (${selectedYear - 1})`
                  }
                />
                <Bar
                  dataKey="previousYearProfit"
                  fill="#94A3B8"
                  name="previousYearProfit"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="currentYearProfit"
                  fill="#3B82F6"
                  name="currentYearProfit"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Margin Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            Profit Margin Trend
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={earningsData.profitMargins}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, (dataMax) => Math.ceil(dataMax * 1.1)]}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${value.toFixed(1)}%`,
                    "Profit Margin",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="margin"
                  stroke="#10B981"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
                {/* Add target line at 40% */}
                <svg>
                  <defs>
                    <linearGradient
                      id="colorMargin"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </svg>
                <Area
                  type="monotone"
                  dataKey="margin"
                  stroke="none"
                  fillOpacity={1}
                  fill="url(#colorMargin)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-800">
          Expense Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={earningsData.expenseBreakdown}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                  barSize={20}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) =>
                      currencyFormatter.format(value).replace(/INR/g, "")
                    }
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e0e0e0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e0e0e0" }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      currencyFormatter.format(value),
                      "Amount",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="amount" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h3 className="text-base font-semibold text-gray-700 mb-4">
              Top Expenses
            </h3>
            {earningsData.expenseBreakdown
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 3)
              .map((expense, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700 font-medium">
                      {expense.category}
                    </span>
                    <span className="text-gray-900 font-bold">
                      {currencyFormatter.format(expense.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (expense.amount /
                            earningsData.yearlyData.totalExpenses) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(
                      (expense.amount / earningsData.yearlyData.totalExpenses) *
                      100
                    ).toFixed(1)}
                    % of total expenses
                  </p>
                </div>
              ))}

            <div className="mt-4">
              <a
                href="#"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                View all expenses
                <ChevronRight size={16} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;
