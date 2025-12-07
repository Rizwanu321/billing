import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Activity,
  Wallet,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Undo2,
  Receipt,
  Target
} from "lucide-react";
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
} from "recharts";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import api from "../utils/api";

const CustomerStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [refreshing, setRefreshing] = useState(false);

  // Initial load - calculate default dates
  useEffect(() => {
    calculateDateRange("month");
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchStats();
    }
  }, [dateRange]);

  const calculateDateRange = (selectedPeriod) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (selectedPeriod) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        // Monday-based week Logic (Till Now)
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday...
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - diffToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "quarter":
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "all":
        startDate = new Date("2000-01-01"); // Far past date
        endDate.setHours(23, 59, 59, 999);
        break;
      case "custom":
        setShowCustomRange(true);
        return; // Don't set dateRange yet, wait for user input
      default: // Month default
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate.setHours(23, 59, 59, 999);
    }

    if (selectedPeriod !== "custom") {
      setShowCustomRange(false);
      setPeriod(selectedPeriod);
      setDateRange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } else {
      setPeriod(selectedPeriod);
    }
  };

  const handlePeriodChange = (e) => {
    calculateDateRange(e.target.value);
  };

  const applyCustomRange = () => {
    if (customDates.start && customDates.end) {
      const startDate = new Date(customDates.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customDates.end);
      endDate.setHours(23, 59, 59, 999);

      setDateRange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const strStartDate = dateRange.startDate;
      const strEndDate = dateRange.endDate;

      const response = await api.get(`/customers/stats`, {
        params: {
          period, // Keep for legacy fallback
          startDate: strStartDate,
          endDate: strEndDate
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const exportTransactionsPDF = () => {
    const transactions = stats?.recentTransactions || [];
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('Customer Activity Report', margin, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      const dateText = `Generated: ${new Date().toLocaleString()}`;
      const dateTextWidth = doc.getTextWidth(dateText);
      doc.text(dateText, pageWidth - margin - dateTextWidth, 22); // Right align

      // Divider Line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, 28, pageWidth - margin, 28);

      // Table
      const tableColumn = ["Date", "Customer", "Type", "Description", "Amount"];
      const tableRows = transactions.map(tx => {
        const isPayment = tx.type === "payment";
        const isReturn = isPayment && tx.paymentMode === 'return';
        const type = isReturn ? "Return" : isPayment ? "Payment" : "Purchase";

        // Clean up description text - remove artifacts like '1' or symbols appearing before price
        let cleanDescription = tx.description || "-";
        cleanDescription = cleanDescription
          .replace(/₹/g, 'Rs. ')
          .replace(/'/g, 'Rs. ')
          // Fix specific "1 " artifact if it appears before a number at the start of value
          .replace(/Payment of 1 /gi, 'Payment of Rs. ')
          .replace(/Due: 1 /gi, 'Due: Rs. ');

        return [
          new Date(tx.date).toLocaleDateString(),
          tx.customerId?.name || "Unknown",
          type,
          cleanDescription,
          `Rs. ${Number(tx.amount).toFixed(2)}`
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: 'middle',
          overflow: 'linebreak',
          lineColor: [240, 240, 240]
        },
        headStyles: {
          fillColor: [15, 23, 42], // Slate-900 to match UI
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 35 }, // Customer
          2: { cellWidth: 20 }, // Type
          3: { cellWidth: 'auto' }, // Description - auto width
          4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' } // Amount
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50
        }
      });

      doc.save('customer-activity.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatCurrencyFull = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Colors for charts
  const COLORS = {
    due: "#ef4444",    // red-500
    credit: "#10b981", // emerald-500
    sales: "#3b82f6",  // blue-500
    returns: "#f59e0b",// amber-500
    payments: "#8b5cf6", // violet-500
    settled: "#94a3b8" // slate-400
  };

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  // data for charts
  const balanceDistributionData = [
    { name: "Customers with Due", value: stats.dues.count, color: COLORS.due },
    { name: "Customers with Credit", value: stats.credits.count, color: COLORS.credit },
    { name: "Settled Customers", value: Math.max(0, stats.customers.total - stats.dues.count - stats.credits.count), color: COLORS.settled },
  ].filter(d => d.value > 0);

  const periodActivityData = [
    { name: "Sales", amount: stats.sales?.total || 0, color: COLORS.sales },
    { name: "Collected", amount: stats.payments?.total || 0, color: COLORS.payments },
    { name: "Returns", amount: stats.returns?.total || 0, color: COLORS.returns },
  ];

  // --- Calculations for Due Management ---
  // Backend now calculates dueSalesAmount from Invoice data
  const salesBreakdown = stats.sales?.breakdown || {};

  // Get gross credit sales directly from backend calculation
  const grossCreditSales = salesBreakdown.dueSalesAmount || 0;

  // For returns, assume all returns are credit returns for simplicity
  const creditReturns = stats.returns?.total || 0;
  const netCreditSales = Math.max(0, grossCreditSales - creditReturns);

  const totalCollected = stats.payments?.total || 0;
  // Outstanding from THIS PERIOD's sales? 
  // "Still Pending" = Net Credit Sales - Dues Collected?
  // Wait, Dues Collected can be for PAST sales.
  // "Dues Management" usually tracks TOTAL dues or PERIOD flow.
  // User text: "Still Outstanding (Yet to receive)" in context of "Due Sales (Period)".
  // This implies: Of the sales made *this period*, how much is still pending?
  // We generally can't know this without linking payments to specific invoices.
  // However, "Dues Collected (Period)" is usually *any* collection this period.
  // If we compare Period Credit Sales vs Period Collections, it gives a "Net Flow" (Net Position).
  // Positive Net Position = We gave more credit than we collected (Debt growing).
  // Negative Net Position = We collected more than we gave (Debt shrinking).

  const netPosition = netCreditSales - totalCollected;
  const collectionEfficiency = netCreditSales > 0 ? (totalCollected / netCreditSales) * 100 : 0;


  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/10 rounded-xl">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Customer Analytics
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Financial health & activity overview
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              {showCustomRange && (
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <input
                    type="date"
                    value={customDates.start}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-white border-0 text-sm rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={customDates.end}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-white border-0 text-sm rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                  <button
                    onClick={applyCustomRange}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              )}

              <select
                value={period}
                onChange={handlePeriodChange}
                className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:bg-gray-50"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw
                  size={20}
                  className={`${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics Grid - Credit Sales Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gross Credit Sales */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 ring-4 ring-white shadow-sm transition-transform group-hover:scale-110 duration-300">
                <CreditCard className="w-6 h-6" />
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                Before Returns
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Gross Credit Sales</p>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrencyFull(grossCreditSales)}</h3>
              <p className="text-xs font-medium text-gray-400 mt-2">
                Total credit sales before deducting returns
              </p>
              {stats.sales?.total > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">% of Total Sales</span>
                    <span className="text-sm font-bold text-blue-600">
                      {((grossCreditSales / stats.sales.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Net Credit Sales */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-white shadow-sm transition-transform group-hover:scale-110 duration-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                After Returns
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Net Credit Sales</p>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrencyFull(netCreditSales)}</h3>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Gross</span>
                  <span className="font-medium">{formatCurrencyFull(grossCreditSales)}</span>
                </div>
                <div className="flex justify-between text-xs text-rose-500">
                  <span>- Returns</span>
                  <span>{formatCurrencyFull(creditReturns)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Position */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ring-4 ring-white shadow-sm transition-transform group-hover:scale-110 duration-300 ${netPosition > 0 ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                <Target className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${netPosition > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                {netPosition > 0 ? 'To Receive' : 'Settled'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Net Position</p>
              <h3 className={`text-3xl font-bold tracking-tight ${netPosition > 0 ? 'text-orange-600' : 'text-emerald-600'
                }`}>
                {netPosition > 0 ? '+' : ''}{formatCurrencyFull(netPosition)}
              </h3>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Net Credit Sales</span>
                  <span className="font-medium">{formatCurrencyFull(netCreditSales)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-500">
                  <span>- Payments</span>
                  <span>{formatCurrencyFull(totalCollected)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <StatCard
            title="Period Returns"
            value={formatCurrency(stats.returns?.total)}
            subtitle={`${stats.returns?.count} returns processed`}
            icon={Undo2}
            color="amber"
          />
          <StatCard
            title="Total Receivables"
            value={formatCurrency(stats.dues.totalDue)}
            subtitle={`${stats.dues.count} customers owe`}
            icon={AlertCircle}
            color="rose"
            trend={stats.customers.isPositive ? "up" : "down"}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Distribution */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-gray-400" />
              Customer Distribution
            </h3>
            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={balanceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {balanceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Customers`, 'Count']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">{stats.customers.total}</p>
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Activity: Sales, Collections & Returns ({period})
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={periodActivityData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
                            <p className="text-sm font-semibold text-gray-700">{data.name}</p>
                            <p className="text-lg font-bold" style={{ color: data.color }}>
                              {formatCurrencyFull(data.amount)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={40}>
                    {periodActivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Due Management Section - Efficiency & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Due Management Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Receipt className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">Due Management</h3>
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-600">Dues Collected</span>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrencyFull(totalCollected)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(collectionEfficiency, 100)}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Collection Efficiency</span>
                  <span>{collectionEfficiency.toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-600">Pending (Period)</span>
                  <span className="text-lg font-bold text-rose-600">{formatCurrencyFull(Math.max(0, netPosition))}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Uncollected amount from sales made in this period.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Recent Transactions
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                Last 10 Activities
              </span>
              <button
                onClick={exportTransactionsPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentTransactions?.map((transaction) => {
                  const isPayment = transaction.type === "payment";
                  const isReturn = isPayment && transaction.paymentMode === 'return';
                  const isPurchase = transaction.type === "purchase";

                  return (
                    <tr key={transaction._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${isPurchase ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                            isReturn ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                              'bg-gradient-to-br from-emerald-500 to-teal-600'
                            }`}>
                            {transaction.customerId?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1">
                            {transaction.customerId?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${isReturn
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : isPayment
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                          {isReturn ? "Return" : isPayment ? "Payment" : "Purchase"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell max-w-[250px]">
                        <div className="flex flex-col">
                          <p className="text-sm text-gray-700 truncate font-medium" title={transaction.description}>
                            {transaction.description ? transaction.description.replace(/₹/g, 'Rs. ').replace(/'/g, 'Rs. ') : "-"}
                          </p>
                          {transaction.invoiceNumber && (
                            <span className="text-xs text-gray-400 font-mono mt-0.5">
                              {transaction.invoiceNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <span className="text-sm text-gray-500 font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${isPurchase
                          ? "text-gray-900"
                          : isReturn
                            ? "text-amber-600"
                            : "text-emerald-600"
                          }`}>
                          {isPurchase ? "+" : "-"}{formatCurrencyFull(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorStyles = {
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  };

  const trendColor = trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50";
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorStyles[color]} ring-4 ring-white shadow-sm transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <p className="text-xs font-medium text-gray-400 mt-2 flex items-center gap-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50/50 p-8 space-y-8">
    <div className="flex justify-between items-center mb-8">
      <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-white rounded-3xl p-6 shadow-sm animate-pulse">
          <div className="h-10 w-10 bg-gray-100 rounded-xl mb-4"></div>
          <div className="h-4 w-24 bg-gray-100 rounded mb-2"></div>
          <div className="h-8 w-32 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-80">
      <div className="bg-white rounded-3xl shadow-sm animate-pulse"></div>
      <div className="md:col-span-2 bg-white rounded-3xl shadow-sm animate-pulse"></div>
    </div>
  </div>
);

export default CustomerStats;
