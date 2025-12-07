// components/revenue/RevenueTransactions.jsx
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Receipt,
  Filter,
  X,
  Calendar,
  AlertCircle,
  Download,
  Info,
  Clock,
  FileText,
  IndianRupee,
  RotateCcw,
  Wallet,
  HandCoins,
} from "lucide-react";
import { fetchRevenueTransactions } from "../../api/revenue";
import toast, { Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Premium StatCard with Glassmorphism & Enhanced Design
const StatCard = ({ icon: Icon, title, value, subtitle, gradient }) => (
  <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 hover:shadow-[0_20px_60px_rgb(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
    <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-5">
        <div className={`p-4 rounded-2xl ${gradient} shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-slate-500 text-xs font-bold tracking-widest uppercase">{title}</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-3">
            <Info className="w-3.5 h-3.5 opacity-60" />
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 right-0 h-1 ${gradient} opacity-60 group-hover:opacity-100 group-hover:h-2 transition-all duration-500`}></div>
  </div>
);

const RevenueTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    startDate: "",
    endDate: "",
    paymentMethod: "all",
    transactionType: "all",
    timePeriod: "all",
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRevenueTransactions(filters);
      console.log("=== FRONTEND RECEIVED ===");
      console.log("Full data:", data);
      console.log("Summary:", data.summary);
      console.log("========================");
      setTransactions(data.transactions || []);
      setPagination(data.pagination);
      setSummary(data.summary);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      toast.error("Failed to load transactions");
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // PDF-specific currency format (Rs. instead of ₹ symbol - jsPDF doesn't support ₹)
  const formatCurrencyForPDF = (value) => {
    const num = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
    return `Rs. ${num}`;
  };

  // Export to PDF function
  const exportToPDF = async () => {
    try {
      setExportLoading(true);
      toast.loading('Generating PDF...', { id: 'pdf-export' });

      // Fetch all transactions for the current filters (without pagination)
      const allFilters = { ...filters, page: 1, limit: 10000 };
      const data = await fetchRevenueTransactions(allFilters);
      const allTransactions = data.transactions || [];
      const summaryData = data.summary || {};

      if (allTransactions.length === 0) {
        toast.error('No transactions to export', { id: 'pdf-export' });
        setExportLoading(false);
        return;
      }

      // Create PDF document (landscape A4)
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      // ========== HEADER ==========
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Revenue Transactions Report', pageWidth / 2, 18, { align: 'center' });

      // Subtitle - filters info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);

      let filterText = '';
      if (filters.timePeriod && filters.timePeriod !== 'all') {
        filterText += `Period: ${filters.timePeriod.charAt(0).toUpperCase() + filters.timePeriod.slice(1)}`;
      }
      if (filters.startDate && filters.endDate) {
        filterText += filterText ? ' | ' : '';
        filterText += `Date: ${filters.startDate} to ${filters.endDate}`;
      }
      if (filters.paymentMethod !== 'all') {
        filterText += filterText ? ' | ' : '';
        filterText += `Payment: ${filters.paymentMethod.toUpperCase()}`;
      }
      if (filters.transactionType !== 'all') {
        filterText += filterText ? ' | ' : '';
        filterText += `Type: ${filters.transactionType.charAt(0).toUpperCase() + filters.transactionType.slice(1)}`;
      }
      if (!filterText) {
        filterText = 'All Transactions';
      }

      doc.text(filterText, pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 30, { align: 'center' });

      // ========== SUMMARY BOX ==========
      const summaryStartY = 36;
      const boxHeight = 18;
      const boxWidth = (pageWidth - margin * 2) / 4;

      // Draw summary boxes
      const summaryItems = [
        { label: 'Gross Revenue', value: formatCurrencyForPDF(summaryData.totalRevenue || 0) },
        { label: 'Total Collected', value: formatCurrencyForPDF(summaryData.totalCollected || 0) },
        { label: 'Net Position', value: formatCurrencyForPDF(summaryData.totalDueRevenue || 0) },
        { label: 'Transactions', value: String(allTransactions.length) }
      ];

      summaryItems.forEach((item, index) => {
        const x = margin + (boxWidth * index);

        // Box background
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, summaryStartY, boxWidth - 2, boxHeight, 2, 2, 'FD');

        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + (boxWidth - 2) / 2, summaryStartY + 6, { align: 'center' });

        // Value
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(item.value, x + (boxWidth - 2) / 2, summaryStartY + 13, { align: 'center' });
      });

      // ========== TABLE ==========
      const tableStartY = summaryStartY + boxHeight + 6;

      // Calculate table width and center it
      const colWidths = [12, 28, 22, 45, 55, 25, 35]; // Column widths
      const totalTableWidth = colWidths.reduce((a, b) => a + b, 0); // 222mm
      const centerMargin = (pageWidth - totalTableWidth) / 2;

      const tableColumn = ['#', 'Date', 'Type', 'Invoice Number', 'Customer Name', 'Payment', 'Amount'];
      const tableRows = allTransactions.map((tx, index) => [
        String(index + 1),
        formatDate(tx.date),
        tx.type === 'sale' ? 'SALE' : 'PAYMENT',
        tx.invoiceNumber || '-',
        tx.customerName || 'Walk-in Customer',
        (tx.paymentMethod || 'N/A').toUpperCase(),
        formatCurrencyForPDF(tx.amount)
      ]);

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
          0: { cellWidth: colWidths[0], halign: 'center' },  // #
          1: { cellWidth: colWidths[1], halign: 'center' },  // Date
          2: { cellWidth: colWidths[2], halign: 'center' },  // Type
          3: { cellWidth: colWidths[3], halign: 'left' },    // Invoice Number
          4: { cellWidth: colWidths[4], halign: 'left' },    // Customer Name
          5: { cellWidth: colWidths[5], halign: 'center' },  // Payment
          6: { cellWidth: colWidths[6], halign: 'right', fontStyle: 'bold' },  // Amount
        },
        margin: { left: centerMargin, right: centerMargin },
        tableWidth: totalTableWidth,
        didDrawPage: (data) => {
          // Footer on each page
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
      const fileName = `transactions_${filters.startDate || 'all'}_to_${filters.endDate || 'all'}.pdf`;
      doc.save(fileName);

      toast.success(`PDF exported successfully! (${allTransactions.length} transactions)`, { id: 'pdf-export' });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    } finally {
      setExportLoading(false);
    }
  };

  const getPaymentBadge = (method) => {
    const styles = {
      cash: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/10" },
      online: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-600/10" },
      card: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-600/10" },
      due: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-600/10" },
      credit: { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-600/10" },
    };
    const style = styles[method] || { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-600/10" };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} ring-1 ${style.ring}`}>{method?.toUpperCase() || "N/A"}</span>;
  };

  const getTypeBadge = (type) => {
    return type === 'sale' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-600/10">SALE</span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 ring-1 ring-green-600/10">PAYMENT</span>
    );
  };

  // Calculate date range based on time period
  const handleTimePeriodChange = (period) => {
    const now = new Date();
    let startDate = "";
    let endDate = "";

    // Helper to format date in local timezone (YYYY-MM-DD)
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (period) {
      case "today":
        startDate = formatDateLocal(now);
        endDate = formatDateLocal(now);
        break;
      case "week":
        // Get current week (Monday to Sunday)
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days; else go back (dayOfWeek - 1) days
        weekStart.setDate(now.getDate() - diffToMonday); // Set to Monday of current week
        startDate = formatDateLocal(weekStart);
        endDate = formatDateLocal(now);
        break;
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = formatDateLocal(monthStart);
        endDate = formatDateLocal(now);
        break;
      case "quarter":
        // Get current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        // Get the last day of the quarter
        const quarterEndMonth = quarter * 3 + 2; // 2, 5, 8, 11
        let quarterEnd = new Date(now.getFullYear(), quarterEndMonth + 1, 0); // Last day of quarter
        // If we're still in the quarter, use today instead
        if (quarterEnd > now) {
          quarterEnd = new Date(now);
        }
        startDate = formatDateLocal(quarterStart);
        endDate = formatDateLocal(quarterEnd);
        break;
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        startDate = formatDateLocal(yearStart);
        endDate = formatDateLocal(now);
        break;
      case "all":
        startDate = "";
        endDate = "";
        break;
      default:
        break;
    }

    setFilters({ ...filters, timePeriod: period, startDate, endDate, page: 1 });
  };

  const clearFilters = () => setFilters({ page: 1, limit: 20, startDate: "", endDate: "", paymentMethod: "all", transactionType: "all", timePeriod: "all" });
  const hasActiveFilters = () => filters.startDate || filters.endDate || filters.paymentMethod !== "all" || filters.transactionType !== "all" || filters.timePeriod !== "all";

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto"><div className="animate-pulse space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <div key={i} className="bg-white/50 h-40 rounded-2xl"></div>)}</div><div className="bg-white/50 rounded-2xl p-6 h-96"></div></div></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to Load</h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <button onClick={fetchTransactions} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium">Try Again</button>
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Revenue Transactions</h1>
              <p className="text-sm text-slate-600">Track and analyze all revenue transactions</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium text-slate-700">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{showFilters ? "Hide" : "Show"} Filters</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={exportLoading || transactions.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{exportLoading ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>

          {hasActiveFilters() && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-800 font-medium">Active filters applied</span>
              <button onClick={clearFilters} className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1">
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}

          {showFilters && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1.5" />
                    Time Period
                  </label>
                  <select value={filters.timePeriod} onChange={(e) => handleTimePeriodChange(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium">
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    Start Date
                  </label>
                  <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, timePeriod: "all", startDate: e.target.value, page: 1 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1.5" />
                    End Date
                  </label>
                  <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, timePeriod: "all", endDate: e.target.value, page: 1 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                  <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value, page: 1 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="all">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="card">Card</option>
                    <option value="due">Due</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Transaction Type</label>
                  <select value={filters.transactionType} onChange={(e) => setFilters({ ...filters, transactionType: e.target.value, page: 1 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                    <option value="all">All Types</option>
                    <option value="sales">Sales Only</option>
                    <option value="payments">Payments Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {summary && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${(summary.returns || 0) > 0 ? 'xl:grid-cols-5' : 'xl:grid-cols-3'
              } gap-4 sm:gap-6`}>
              <StatCard
                icon={IndianRupee}
                title="Gross Revenue"
                value={formatCurrency(summary.totalRevenue || 0)}
                subtitle="Total Sales"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />

              {(summary.returns || 0) > 0 && (
                <StatCard
                  icon={RotateCcw}
                  title="Returns"
                  value={formatCurrency(summary.returns || 0)}
                  subtitle="Product Returns"
                  gradient="bg-gradient-to-br from-red-500 to-red-600"
                />
              )}

              {(summary.returns || 0) > 0 && (
                <StatCard
                  icon={Wallet}
                  title="Net Revenue"
                  value={formatCurrency(summary.netRevenue || 0)}
                  subtitle="Gross - Returns"
                  gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
              )}

              <StatCard
                icon={HandCoins}
                title="Total Collected"
                value={formatCurrency(summary.totalCollected || 0)}
                subtitle="Net Walk-in Sales + Credit Payments"
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              />

              <StatCard
                icon={Clock}
                title="Net Position"
                value={formatCurrency(summary.totalDueRevenue || 0)}
                subtitle={
                  (summary.totalDueRevenue || 0) < 0
                    ? "Advance Received"
                    : (summary.totalDueRevenue || 0) > 0
                      ? "Outstanding Amount"
                      : "Fully Settled"
                }
                gradient={
                  (summary.totalDueRevenue || 0) < 0
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-br from-orange-500 to-orange-600"
                }
              />
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden border border-white/20">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No transactions found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Payment</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{formatDate(tx.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{tx.invoiceNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-900">{tx.customerName || 'Walk-in Customer'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getPaymentBadge(tx.paymentMethod)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeBadge(tx.type)}
                            <span className="text-xs text-slate-500">{formatDate(tx.date)}</span>
                          </div>
                          <p className="text-sm font-semibold text-blue-600 mb-1">{tx.invoiceNumber || '-'}</p>
                          <p className="text-sm text-slate-900 truncate">{tx.customerName || 'Walk-in'}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-slate-900 mb-1">{formatCurrency(tx.amount)}</p>
                          {getPaymentBadge(tx.paymentMethod)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination && pagination.totalItems > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-200 gap-4">
                    <div className="text-sm text-slate-700 text-center sm:text-left">
                      Showing <span className="font-semibold">{(pagination.currentPage - 1) * filters.limit + 1}</span> to{" "}
                      <span className="font-semibold">{Math.min(pagination.currentPage * filters.limit, pagination.totalItems)}</span> of{" "}
                      <span className="font-semibold">{pagination.totalItems}</span> transactions
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={!pagination.hasPreviousPage} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-slate-700">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-sm font-semibold text-slate-900">{pagination.currentPage} / {pagination.totalPages}</span>
                      <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={!pagination.hasNextPage} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-slate-700">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div >
      </div >
    </>
  );
};

export default RevenueTransactions;
