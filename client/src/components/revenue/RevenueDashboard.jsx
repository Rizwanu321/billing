// components/revenue/RevenueDashboard.jsx - FULLY PROFESSIONAL VERSION

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileText,
  Target,
  Download,
  CreditCard,
  Users,
  RefreshCw,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard as CardIcon,
  Clock,
  HandCoins,
  Zap,
  Filter,
  Eye,
  RotateCcw,
  Percent,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp as TrendIcon,
  X,
  Menu,
  Infinity,
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
  ComposedChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  fetchRevenueSummary,
  fetchPaymentsSummary,
  generateRevenuePDF,
} from "../../api/revenue";
import toast, { Toaster } from "react-hot-toast";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-6 max-w-[1600px] mx-auto">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-48 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>
    </div>

    {/* Net Revenue Analysis Skeleton (3 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={`net-${i}`}
          className="bg-white p-6 rounded-2xl border border-slate-100 h-48 flex flex-col justify-between"
        >
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-10 w-40 bg-slate-200 rounded"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>

    {/* Key Metrics Skeleton (3 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={`key-${i}`}
          className="bg-white p-6 rounded-2xl border border-slate-100 h-32 flex flex-col justify-center gap-3"
        >
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-8 w-32 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 h-96"></div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 h-96"></div>
    </div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
    <div className="bg-red-50 p-6 rounded-full mb-6 animate-in fade-in zoom-in duration-300">
      <AlertTriangle className="w-12 h-12 text-red-500" />
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">
      Failed to load dashboard
    </h3>
    <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
      {error ||
        "Something went wrong while fetching the data. Please try again."}
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 font-medium group"
    >
      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
      <span>Try Again</span>
    </button>
  </div>
);

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [revenueType, setRevenueType] = useState("all");
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(firstDayOfMonth),
      endDate: formatDate(today),
    };
  });
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChart, setSelectedChart] = useState("trend");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const COLORS = {
    cash: "#10b981",
    online: "#3b82f6",
    card: "#8b5cf6",
    due: "#f59e0b",
  };

  const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  useEffect(() => {
    fetchAllData();
  }, [dateRange, revenueType, selectedPeriod]);

  const fetchAllData = async () => {
    if ((!dateRange.startDate || !dateRange.endDate) && selectedPeriod !== "all") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add minimum delay to prevent flickering and show loading state
      const minDelay = new Promise((resolve) => setTimeout(resolve, 800));

      const [revenue, payments] = await Promise.all([
        fetchRevenueSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: selectedPeriod,
          revenueType,
        }),
        fetchPaymentsSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: selectedPeriod,
        }),
        minDelay, // Ensure loading state is visible for at least 800ms
      ]);

      setRevenueData(revenue);
      setPaymentsData(payments);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      setError(err.message || "Failed to load revenue data");
      setLoading(false);
      toast.error("Failed to update dashboard");
    }
  };

  // PDF-specific currency format (Rs. instead of ₹ symbol)
  const formatCurrencyForPDF = (value) => {
    const num = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
    return `Rs. ${num}`;
  };

  const handleExport = async () => {
    if (!revenueData || !enhancedMetrics) {
      toast.error("No data available to export");
      return;
    }

    try {
      setExportLoading(true);
      toast.loading('Generating PDF...', { id: 'pdf-export' });

      // Create PDF document (landscape A4)
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      // ========== HEADER ==========
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Revenue Dashboard Report', pageWidth / 2, 18, { align: 'center' });

      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const periodLabel = selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);
      doc.text(`Period: ${periodLabel} (${dateRange.startDate} to ${dateRange.endDate})`, pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, 30, { align: 'center' });

      // ========== SUMMARY BOXES (First Row) ==========
      const summaryStartY = 38;
      const boxHeight = 20;
      const hasReturns = enhancedMetrics.returns > 0;
      const numBoxes = hasReturns ? 5 : 3;
      const boxWidth = (pageWidth - margin * 2) / numBoxes;

      // Calculate Net Position (Gross Outstanding - Credit Adjustments)
      const netPosition = enhancedMetrics.totalOutstanding - enhancedMetrics.totalDueReductions;

      const summaryItems = [
        { label: 'Gross Revenue', value: formatCurrencyForPDF(enhancedMetrics.totalRevenue) },
        ...(hasReturns ? [
          { label: 'Returns', value: formatCurrencyForPDF(enhancedMetrics.returns) },
          { label: 'Net Revenue', value: formatCurrencyForPDF(enhancedMetrics.netRevenue) },
        ] : []),
        { label: 'Total Collected', value: formatCurrencyForPDF(enhancedMetrics.totalCollected) },
        { label: 'Net Position', value: formatCurrencyForPDF(netPosition) },
      ];

      summaryItems.forEach((item, index) => {
        const x = margin + (boxWidth * index);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, summaryStartY, boxWidth - 2, boxHeight, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + (boxWidth - 2) / 2, summaryStartY + 7, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(item.value, x + (boxWidth - 2) / 2, summaryStartY + 15, { align: 'center' });
      });

      // ========== BREAKDOWN SECTION ==========
      const breakdownY = summaryStartY + boxHeight + 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Revenue Breakdown', margin, breakdownY);

      // Payment breakdown table - use net values matching dashboard
      const breakdownData = [
        ['Category', 'Amount', 'Percentage'],
        ['Instant Sales (Cash/Online/Card)', formatCurrencyForPDF(enhancedMetrics.instantCollection), `${enhancedMetrics.instantPaymentRate?.toFixed(1) || 0}%`],
        ['Due Sales (Gross)', formatCurrencyForPDF(enhancedMetrics.dueSalesAmount), `${enhancedMetrics.dueSalesRate?.toFixed(1) || 0}%`],
        ['Due Payments Received', formatCurrencyForPDF(enhancedMetrics.duePaymentsReceived), '-'],
        ['Still Pending (Net)', formatCurrencyForPDF(netPosition), '-'],
      ];

      if (hasReturns) {
        breakdownData.push(['Cash Refunds (Walk-in)', formatCurrencyForPDF(enhancedMetrics.totalRefunds), '-']);
        breakdownData.push(['Credit Adjustments (Due)', formatCurrencyForPDF(enhancedMetrics.totalDueReductions), '-']);
      }

      const tableWidth = 180;
      const leftTableMargin = (pageWidth - tableWidth) / 2;

      autoTable(doc, {
        head: [breakdownData[0]],
        body: breakdownData.slice(1),
        startY: breakdownY + 4,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { cellWidth: 90, halign: 'left' },
          1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 40, halign: 'center' },
        },
        margin: { left: leftTableMargin, right: leftTableMargin },
        tableWidth: tableWidth,
      });

      // ========== PAYMENT METHODS (if available) ==========
      if (moneyCollectionData && moneyCollectionData.length > 0) {
        const paymentY = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Payment Method Breakdown', margin, paymentY);

        const paymentData = moneyCollectionData.map(item => [
          item.mode.charAt(0).toUpperCase() + item.mode.slice(1),
          formatCurrencyForPDF(item.instantAmount),
          formatCurrencyForPDF(item.duePaymentAmount),
          formatCurrencyForPDF(item.refundAmount),
          formatCurrencyForPDF(item.total),
        ]);

        autoTable(doc, {
          head: [['Method', 'Instant Sales', 'Due Payments', 'Refunds', 'Net Total']],
          body: paymentData,
          startY: paymentY + 4,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          bodyStyles: {
            textColor: [51, 65, 85],
          },
          columnStyles: {
            0: { cellWidth: 30, halign: 'left' },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
          },
          margin: { left: leftTableMargin - 2.5, right: leftTableMargin - 2.5 },
          tableWidth: tableWidth + 5,
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Page 1', pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

      // Save PDF
      const fileName = `revenue-dashboard-${dateRange.startDate}_to_${dateRange.endDate}.pdf`;
      doc.save(fileName);

      toast.success('PDF exported successfully!', { id: 'pdf-export' });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate report. Please try again.", { id: 'pdf-export' });
    } finally {
      setExportLoading(false);
    }
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
        // Get current week (Monday to Sunday)
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days; else go back (dayOfWeek - 1) days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - diffToMonday); // Set to Monday of current week
        endDate = new Date(today); // Today
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case "quarter":
        // Get current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        // Get the last day of the quarter
        const quarterEndMonth = currentQuarter * 3 + 2; // 2, 5, 8, 11
        endDate = new Date(today.getFullYear(), quarterEndMonth + 1, 0); // Last day of quarter
        // If we're still in the quarter, use today instead
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
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setDateRange({
      startDate: startDate ? formatDate(startDate) : "",
      endDate: formatDate(endDate),
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const [breakdownView, setBreakdownView] = useState("sales"); // 'sales' or 'money'

  const enhancedMetrics = useMemo(() => {
    if (!revenueData || !paymentsData) return null;

    const totalRevenue = revenueData.summary.totalRevenue || 0;
    const actualReceived = revenueData.summary.actualReceivedRevenue || 0;
    const totalDue = revenueData.summary.totalDueRevenue || 0;
    const paymentsReceived = revenueData.summary.paymentsReceived || 0;

    // Calculate instant payments from new sales
    const instantPayments = actualReceived - paymentsReceived;

    // Get due sales amount from comprehensive breakdown (includes all dues, not just payment method = "due")
    const dueSalesAmount =
      revenueData.comprehensiveBreakdown?.sales.components.dueSales.amount || 0;

    // PERIOD-BASED: Due Sales - Dues Collected = Still Outstanding
    const totalOutstanding =
      revenueData.duesSummary.periodBased?.stillOutstanding || 0;

    // Instant Sales - Cash + Online + Card ONLY (excludes partial payments on due invoices)
    const instantSalesOnly =
      revenueData.comprehensiveBreakdown?.sales.components.instantSales
        .amount || 0;

    // Total money received at invoice time (includes partials on due invoices)
    const totalInitialCollection = instantPayments;

    // Returns
    const returns = revenueData.summary.returns || 0;
    const returnsCount = revenueData.summary.returnsCount || 0;
    const netRevenue = revenueData.summary.netRevenue || totalRevenue - returns;

    // Calculate total CASH refunds given to walk-in customers (actual money out)
    const totalRefunds = revenueData.refundsByMode
      ? Object.values(revenueData.refundsByMode).reduce(
        (sum, val) => sum + val,
        0
      )
      : 0;

    // Calculate total DUE REDUCTIONS for due customers (credit adjustments, not cash out)
    const totalDueReductions = revenueData.dueReductionsByMode
      ? Object.values(revenueData.dueReductionsByMode).reduce(
        (sum, val) => sum + val,
        0
      )
      : 0;

    return {
      totalRevenue, // Gross Revenue
      netRevenue, // Net Revenue (Gross - Returns)
      returns,
      returnsCount,
      totalRefunds, // Total CASH refunded to walk-in customers
      totalDueReductions, // Total credited back to due customer accounts (not cash)
      totalActualReturns: returns, // Total value of all returns (walk-in + due)
      totalCollected: actualReceived - totalRefunds, // Net money in hand (after CASH refunds only)
      collectionRate:
        totalRevenue > 0
          ? ((actualReceived - paymentsReceived) / totalRevenue) * 100
          : 0,
      instantPaymentRate:
        totalRevenue > 0 ? (instantSalesOnly / totalRevenue) * 100 : 0,
      dueSalesRate:
        totalRevenue > 0 ? (dueSalesAmount / totalRevenue) * 100 : 0,
      averageTransactionValue: revenueData.summary.averageOrderValue || 0,
      paymentEfficiency: paymentsData.summary.efficiency || {
        duesClearanceRate: 0,
        creditAdditionRate: 0,
      },
      // PERIOD-BASED: Net Position = Still Outstanding
      netReceivables: revenueData.duesSummary.periodBased?.netReceivables || 0,
      instantPayments,
      dueSalesAmount,
      duePaymentsReceived: paymentsReceived,
      totalOutstanding,
      instantCollection: instantSalesOnly, // Cash + Online + Card ONLY
      totalInitialCollection, // All initial collection (for internal use)
      newSalesCollected: instantPayments,
      oldDuesCollected: paymentsReceived,
    };
  }, [revenueData, paymentsData]);

  // Calculate Money Collection Breakdown (Cash vs Online vs Card)
  const moneyCollectionData = useMemo(() => {
    if (!revenueData || !revenueData.paymentBreakdown) return [];

    const modes = ["cash", "online", "card", "other"];
    const totalMoneyIn = enhancedMetrics?.totalCollected || 1;

    return modes
      .map((mode) => {
        // 1. Instant Sales via this mode
        // Find the payment method in breakdown
        const instantSale = revenueData.paymentBreakdown.find(
          (p) => p._id === mode
        );
        // For 'cash'/'online'/'card' methods, actualReceived is the amount collected at sale time
        const instantAmount = instantSale ? instantSale.actualReceived || 0 : 0;

        // 2. Due Payments via this mode
        // Use the paymentsByMode data from backend
        const duePaymentAmount = revenueData.paymentsByMode
          ? revenueData.paymentsByMode[mode] || 0
          : 0;

        // 3. Refunds via this mode
        const refundAmount = revenueData.refundsByMode
          ? revenueData.refundsByMode[mode] || 0
          : 0;

        const total = instantAmount + duePaymentAmount - refundAmount;

        return {
          mode,
          instantAmount,
          duePaymentAmount,
          refundAmount,
          total,
          percentage: (total / totalMoneyIn) * 100,
        };
      })
      .filter((d) => d.total > 0 || d.refundAmount > 0)
      .sort((a, b) => b.total - a.total);
  }, [revenueData, enhancedMetrics]);

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: HandCoins,
      online: Smartphone,
      card: CardIcon,
      due: Clock,
      other: Wallet,
    };
    return icons[method] || CreditCard;
  };
  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: "Cash",
      online: "Online",
      card: "Card",
      due: "Due/Credit",
      other: "Other",
    };
    return labels[method] || method.charAt(0).toUpperCase() + method.slice(1);
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color,
    info,
    onClick,
  }) => (
    <div
      className={`group relative bg-white rounded-2xl p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${onClick ? "cursor-pointer" : ""
        }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg ring-4 ring-white`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${trend >= 0
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
              }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1 tracking-wide uppercase">
          {title}
        </h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            {subtitle}
          </p>
        )}
      </div>
      {info && (
        <div className="mt-4 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-300" />
            <span className="line-clamp-1">{info}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm mb-2">
            {new Date(label).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-xs flex justify-between gap-4"
              style={{ color: entry.color }}
            >
              <span>{entry.name}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </p>
          ))}
          {data.refunds > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs flex justify-between gap-4 text-rose-600">
                <span>Refunds:</span>
                <span className="font-medium">
                  -{formatCurrency(data.refunds)}
                </span>
              </p>
              <p className="text-xs flex justify-between gap-4 text-gray-500 mt-0.5">
                <span>Gross Collected:</span>
                <span className="font-medium">
                  {formatCurrency(data.grossReceived)}
                </span>
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const PREDEFINED_RANGES = [
    { label: "Today", value: "today", icon: Calendar },
    { label: "Week", value: "week", icon: Activity },
    { label: "Month", value: "month", icon: BarChart3 },
    { label: "Quarter", value: "quarter", icon: TrendIcon },
    { label: "Year", value: "year", icon: PieChartIcon },
    { label: "All Time", value: "all", icon: Infinity },
    { label: "Custom", value: "custom", icon: Filter },
  ];

  const renderChart = () => {
    if (!revenueData || !revenueData.revenueByDate) return null;

    const data = revenueData.revenueByDate.map((rev) => {
      const payment = paymentsData.dailyPayments.find((p) => p._id === rev._id);
      return {
        date: rev._id,
        revenue: rev.revenue,
        received:
          rev.netCollected !== undefined
            ? rev.netCollected
            : rev.actualReceived, // Use net collected
        grossReceived: rev.actualReceived, // Keep gross for tooltip
        refunds: rev.refunds || 0, // Add refunds for tooltip
        due: rev.dueAmount,
        payments: payment?.totalPayments || 0,
        duesCleared: payment?.duesCleared || 0,
      };
    });

    if (selectedChart === "comparison") {
      return (
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
          <Bar
            dataKey="revenue"
            name="Total Sales"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="received"
            name="Collected"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      );
    }

    // Default: Trend (Composed Chart)
    return (
      <ComposedChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f1f5f9"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Total Sales"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Bar
          dataKey="received"
          name="Instant Revenue"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
          maxBarSize={30}
        />
        <Line
          type="monotone"
          dataKey="due"
          name="Outstanding"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
        />
      </ComposedChart>
    );
  };

  if (loading && !revenueData) {
    return (
      <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8 font-sans">
        <Toaster position="top-right" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8 font-sans">
        <Toaster position="top-right" />
        <ErrorDisplay error={error} onRetry={fetchAllData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              Revenue Dashboard
            </h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">
              Comprehensive analysis of your business performance
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md text-sm font-medium text-slate-700"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"
                  }`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExport}
              disabled={exportLoading || !revenueData}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{exportLoading ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
          <div className="overflow-x-auto">
            <div className="flex sm:grid sm:grid-cols-6 gap-1 min-w-max sm:min-w-0">
              {PREDEFINED_RANGES.map((range) => {
                const Icon = range.icon;
                const isSelected = selectedPeriod === range.value;
                return (
                  <button
                    key={range.value}
                    onClick={() =>
                      range.value !== "custom"
                        ? handlePeriodChange(range.value)
                        : setSelectedPeriod("custom")
                    }
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

        {/* Custom Date Range */}
        {selectedPeriod === "custom" && (
          <div className="mt-4 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAllData}
                  className="w-full px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {revenueData && paymentsData && enhancedMetrics && (
        <>
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Key Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={IndianRupee}
                title="Gross Revenue"
                value={formatCurrency(enhancedMetrics.totalRevenue)}
                subtitle="Total Sales Value"
                trend={parseFloat(revenueData?.growth?.percentage || 0)}
                color="bg-violet-500"
              />

              <StatCard
                icon={Target}
                title="Net Revenue"
                value={formatCurrency(enhancedMetrics.netRevenue)}
                subtitle="Gross - Returns"
                trend={parseFloat(revenueData?.growth?.percentage || 0)}
                color="bg-blue-500"
              />

              <StatCard
                icon={RotateCcw}
                title="Total Returns"
                value={formatCurrency(enhancedMetrics.returns)}
                subtitle={`${enhancedMetrics.returnsCount} return transactions`}
                info="All returns (walk-in + due customer)"
                trend={0}
                color="bg-rose-500"
              />

              <StatCard
                icon={Banknote}
                title="Cash Refunds"
                value={formatCurrency(enhancedMetrics.totalRefunds)}
                subtitle="Walk-in Returns"
                info={`${revenueData.returnsBreakdown?.fromWalkInCustomers?.count || 0} walk-in customer returns (money out)`}
                trend={0}
                color="bg-orange-500"
              />

              <StatCard
                icon={Receipt}
                title="Credit Adjustments"
                value={formatCurrency(enhancedMetrics.totalDueReductions)}
                subtitle="Due Customer Returns"
                info={`${revenueData.returnsBreakdown?.fromDueCustomers?.count || 0} returns from credit customers (no cash out)`}
                trend={0}
                color="bg-amber-500"
              />

              <StatCard
                icon={Wallet}
                title="Total Collected"
                value={formatCurrency(enhancedMetrics.totalCollected)}
                subtitle="Net Cash In Hand"
                info={`Net Walk-in Sales ${formatCurrency(enhancedMetrics.instantCollection - enhancedMetrics.totalRefunds)} + Credit Payments ${formatCurrency(enhancedMetrics.duePaymentsReceived)}`}
                trend={parseFloat(
                  paymentsData?.growth?.collection?.percentage || 0
                )}
                color="bg-emerald-500"
              />

              {/* Gross Walk-in Sales - Show only if there are refunds */}
              {enhancedMetrics?.totalRefunds > 0 && (
                <StatCard
                  icon={Zap}
                  title="Gross Walk-in Sales"
                  value={formatCurrency(enhancedMetrics.instantCollection)}
                  subtitle="Before Refunds"
                  info="Total value of instant sales before deducting refunds"
                  trend={parseFloat(revenueData?.growth?.percentage || 0)}
                  color="bg-indigo-400"
                />
              )}

              <StatCard
                icon={Zap}
                title={enhancedMetrics?.totalRefunds > 0 ? "Net Walk-in Sales" : "Walk-in Sales"}
                value={enhancedMetrics?.totalRefunds > 0
                  ? formatCurrency(enhancedMetrics.instantCollection - enhancedMetrics.totalRefunds)
                  : formatCurrency(enhancedMetrics.instantCollection)}
                subtitle={enhancedMetrics?.totalRefunds > 0 ? "After Refunds" : "Gross Sales Value"}
                info={enhancedMetrics?.totalRefunds > 0
                  ? `Gross ${formatCurrency(enhancedMetrics.instantCollection)} - Returns ${formatCurrency(enhancedMetrics.totalRefunds)}`
                  : "Total value of instant sales (before refunds)"}
                trend={parseFloat(revenueData?.growth?.percentage || 0)} // Using revenue growth as proxy
                color="bg-indigo-500"
              />

              {/* Gross Credit Sales - Show only if there are adjustments */}
              {enhancedMetrics?.totalDueReductions > 0 && (
                <StatCard
                  icon={Clock}
                  title="Gross Credit Sales"
                  value={formatCurrency(enhancedMetrics.dueSalesAmount)}
                  subtitle="Before Returns"
                  info="Total credit sales before deducting returns"
                  trend={parseFloat(revenueData?.growth?.percentage || 0)}
                  color="bg-orange-400"
                />
              )}

              <StatCard
                icon={Clock}
                title={enhancedMetrics?.totalDueReductions > 0 ? "Net Credit Sales" : "Credit Sales"}
                value={enhancedMetrics?.totalDueReductions > 0
                  ? formatCurrency(enhancedMetrics.dueSalesAmount - enhancedMetrics.totalDueReductions)
                  : formatCurrency(enhancedMetrics.dueSalesAmount)}
                subtitle={enhancedMetrics?.totalDueReductions > 0 ? "After Returns" : "Sold on Credit"}
                info={enhancedMetrics?.totalDueReductions > 0
                  ? `Gross ${formatCurrency(enhancedMetrics.dueSalesAmount)} - Returns ${formatCurrency(enhancedMetrics.totalDueReductions)}`
                  : "Sales to registered customers with credit terms"}
                trend={parseFloat(revenueData?.growth?.percentage || 0)}
                color="bg-orange-500"
              />

              <StatCard
                icon={HandCoins}
                title="Credit Payments"
                value={formatCurrency(enhancedMetrics.duePaymentsReceived)}
                subtitle="Received on Credit"
                info={`${paymentsData?.summary?.paymentCount || 0} payment${paymentsData?.summary?.paymentCount !== 1 ? "s" : ""
                  } collected`}
                trend={parseFloat(
                  paymentsData?.growth?.duesCleared?.percentage || 0
                )}
                color="bg-teal-500"
              />

              {/* Credit Used StatCard Removed */}

              <StatCard
                icon={Target}
                title="Net Position"
                value={
                  // Calculate net receivables accounting for credit adjustments
                  (() => {
                    const netReceivables = (revenueData.duesSummary.periodBased?.stillOutstanding || 0) - (enhancedMetrics?.totalDueReductions || 0);
                    return netReceivables > 0
                      ? `+${formatCurrency(netReceivables)}`
                      : formatCurrency(netReceivables);
                  })()
                }
                subtitle={
                  (() => {
                    const netReceivables = (revenueData.duesSummary.periodBased?.stillOutstanding || 0) - (enhancedMetrics?.totalDueReductions || 0);
                    return netReceivables > 0
                      ? "To Receive"
                      : netReceivables < 0
                        ? "Advance Received"
                        : "Settled";
                  })()
                }
                color={
                  (() => {
                    const netReceivables = (revenueData.duesSummary.periodBased?.stillOutstanding || 0) - (enhancedMetrics?.totalDueReductions || 0);
                    return netReceivables > 0
                      ? "bg-orange-500"
                      : netReceivables < 0
                        ? "bg-green-500"
                        : "bg-slate-500";
                  })()
                }
                info={
                  (() => {
                    const netReceivables = (revenueData.duesSummary.periodBased?.stillOutstanding || 0) - (enhancedMetrics?.totalDueReductions || 0);
                    // Calculate Net Credit Sales (Due Sales - Returns)
                    const netCreditSales = (enhancedMetrics?.dueSalesAmount || 0) - (enhancedMetrics?.totalDueReductions || 0);
                    const paymentsCollected = enhancedMetrics?.duePaymentsReceived || 0;

                    return `Net Credit Sales ${formatCurrency(netCreditSales)} - Payments ${formatCurrency(paymentsCollected)}`;
                  })()
                }
              />
            </div>
          </div>

          {/* Net Revenue Analysis Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-indigo-600" />
                  Net Revenue Analysis
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Breakdown of Gross Revenue, Returns, and final Net Revenue
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-600">Return Rate:</span>
                <span
                  className={`${enhancedMetrics.returns > 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                    }`}
                >
                  {(
                    (enhancedMetrics.returns /
                      (enhancedMetrics.totalRevenue || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Gross Revenue */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-sm text-slate-500 mb-1">Gross Revenue</div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(enhancedMetrics.totalRevenue)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Total Invoiced Amount
                </div>
              </div>

              {/* Returns */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                <div className="text-sm text-rose-600 mb-1 flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4" /> Returns & Refunds
                </div>
                <div className="text-2xl font-bold text-rose-700">
                  -{formatCurrency(enhancedMetrics.returns)}
                </div>
                <div className="text-xs text-rose-500 mt-1">
                  {enhancedMetrics.returnsCount} items returned
                </div>
              </div>

              {/* Net Revenue */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="text-sm text-indigo-600 mb-1 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Net Revenue
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {formatCurrency(enhancedMetrics.netRevenue)}
                </div>
                <div className="text-xs text-indigo-500 mt-1">
                  Actual Realized Revenue
                </div>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{
                  width: `${100 -
                    (enhancedMetrics.returns /
                      (enhancedMetrics.totalRevenue || 1)) *
                    100
                    }%`,
                }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{
                  width: `${(enhancedMetrics.returns /
                    (enhancedMetrics.totalRevenue || 1)) *
                    100
                    }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                Net Revenue (
                {(
                  100 -
                  (enhancedMetrics.returns /
                    (enhancedMetrics.totalRevenue || 1)) *
                  100
                ).toFixed(1)}
                %)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                Returns (
                {(
                  (enhancedMetrics.returns /
                    (enhancedMetrics.totalRevenue || 1)) *
                  100
                ).toFixed(1)}
                %)
              </div>
            </div>
          </div>

          {/* Collection Efficiency Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 mb-8">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                  <Percent className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    Collection Performance
                  </h3>
                  <p className="text-indigo-100 text-sm font-medium opacity-90">
                    Tracking your payment efficiency for this period
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-12">
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(enhancedMetrics.totalCollected)}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">
                    Total Collected
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(
                      enhancedMetrics.dueSalesAmount - (enhancedMetrics.totalDueReductions || 0)
                    )}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">
                    Sold on Credit
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(enhancedMetrics.duePaymentsReceived)}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">
                    Dues Collected
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-tight">
                    {(() => {
                      const value =
                        (revenueData.duesSummary.periodBased?.stillOutstanding || 0) -
                        (enhancedMetrics?.totalDueReductions || 0);
                      return formatCurrency(value);
                    })()}
                  </p>
                  <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mt-1">
                    {(() => {
                      const value =
                        (revenueData.duesSummary.periodBased?.stillOutstanding || 0) -
                        (enhancedMetrics?.totalDueReductions || 0);
                      if (value > 0) return "Still Pending";
                      if (value < 0) return "Overpaid";
                      return "Settled";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COMPREHENSIVE REVENUE BREAKDOWN - Professional & User-Friendly */}
          {revenueData.comprehensiveBreakdown && (
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Breakdown Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Sales Breakdown
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    {revenueData.comprehensiveBreakdown.sales.count} invoices
                  </span>
                </div>

                <div className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-600 font-medium">
                      Gross Sales (Period)
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(
                        revenueData.comprehensiveBreakdown.sales.total
                      )}
                    </p>
                  </div>

                  {/* Show returns if any */}
                  {enhancedMetrics?.returns > 0 && (
                    <>
                      <div className="flex items-center justify-between py-2 border-t border-slate-200">
                        <p className="text-sm text-rose-600 font-medium">
                          Less: Returns & Refunds
                        </p>
                        <p className="text-lg font-semibold text-rose-600">
                          -{formatCurrency(enhancedMetrics.returns)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t-2 border-blue-200 mt-2">
                        <p className="text-sm text-blue-700 font-bold">
                          Net Sales (Period)
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(
                            revenueData.comprehensiveBreakdown.sales.total - enhancedMetrics.returns
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  {/* If no returns, show a simple message */}
                  {!enhancedMetrics?.returns && (
                    <p className="text-xs text-slate-500 mt-2">
                      No returns in this period
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Instant Sales */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-emerald-900">
                          Instant Sales
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {revenueData.comprehensiveBreakdown.sales.components.instantSales.percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                    <p className={`${enhancedMetrics?.totalRefunds > 0 ? "text-lg font-semibold text-emerald-600/70" : "text-2xl font-bold text-emerald-700"} mb-1`}>
                      {formatCurrency(
                        revenueData.comprehensiveBreakdown.sales.components
                          .instantSales.amount
                      )}
                    </p>

                    {/* Show cash refunds if any */}
                    {enhancedMetrics?.totalRefunds > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs mt-2 pb-2 border-b border-emerald-100">
                          <span className="text-rose-600">Returned Items</span>
                          <span className="font-medium text-rose-600">
                            -{formatCurrency(enhancedMetrics.totalRefunds)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-1">
                          <span className="text-emerald-800 font-bold">Net Instant Sales</span>
                          <span className="text-2xl font-bold text-emerald-800">
                            {formatCurrency(
                              revenueData.comprehensiveBreakdown.sales.components.instantSales.amount -
                              enhancedMetrics.totalRefunds
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-3">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{
                          width: `${revenueData.comprehensiveBreakdown.sales.components.instantSales.percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Due Sales */}
                  <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <h3 className="text-sm font-semibold text-orange-900">
                          Due Sales
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        {revenueData.comprehensiveBreakdown.sales.components.dueSales.percentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                    <p className={`${enhancedMetrics?.totalDueReductions > 0 ? "text-lg font-semibold text-orange-600/70" : "text-2xl font-bold text-orange-700"} mb-1`}>
                      {formatCurrency(
                        revenueData.comprehensiveBreakdown.sales.components
                          .dueSales.amount
                      )}
                    </p>

                    {/* Show credit adjustments if any */}
                    {enhancedMetrics?.totalDueReductions > 0 && (
                      <>
                        <div className="flex items-center justify-between text-xs mt-2 pb-2 border-b border-orange-100">
                          <span className="text-amber-600">Returned Items (Credit)</span>
                          <span className="font-medium text-amber-600">
                            -{formatCurrency(enhancedMetrics.totalDueReductions)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-1">
                          <span className="text-orange-800 font-bold">Net Due Sales</span>
                          <span className="text-2xl font-bold text-orange-800">
                            {formatCurrency(
                              revenueData.comprehensiveBreakdown.sales.components.dueSales.amount -
                              enhancedMetrics.totalDueReductions
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="w-full bg-orange-100 rounded-full h-1.5 mt-3 mb-3">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{
                          width: `${revenueData.comprehensiveBreakdown.sales.components.dueSales.percentage}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-orange-100">
                      <span className="text-slate-500">
                        Collected:{" "}
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(
                            revenueData.comprehensiveBreakdown.sales.components
                              .dueSales.collectedSoFar
                          )}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        Outstanding:{" "}
                        <span className="font-medium text-orange-600">
                          {formatCurrency(
                            // Net Outstanding = Gross Outstanding - Credit Adjustments
                            revenueData.comprehensiveBreakdown.sales.components.dueSales.currentOutstanding -
                            (enhancedMetrics?.totalDueReductions || 0)
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Money Collection Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Money Collection
                  </h2>
                </div>

                <div className="mb-6 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700 font-medium mb-1">
                    Total Money In (Period)
                  </p>
                  <p className="text-3xl font-bold text-emerald-900 tracking-tight">
                    {formatCurrency(
                      revenueData.comprehensiveBreakdown.collection
                        .totalMoneyIn - (enhancedMetrics?.totalRefunds || 0)
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    (Net Walk-in Sales: {formatCurrency(revenueData.comprehensiveBreakdown.collection.components.instantCollection.amount - (enhancedMetrics?.totalRefunds || 0))} + Credit Payments: {formatCurrency(revenueData.comprehensiveBreakdown.collection.components.duePayments?.amount || 0)})
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Instant Collection */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Instant Collection
                      </p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(
                          revenueData.comprehensiveBreakdown.collection
                            .components.instantCollection.amount -
                          (enhancedMetrics?.totalRefunds || 0)
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        {(() => {
                          const netTotal =
                            revenueData.comprehensiveBreakdown.collection
                              .totalMoneyIn -
                            (enhancedMetrics?.totalRefunds || 0);
                          const netInstant =
                            revenueData.comprehensiveBreakdown.collection
                              .components.instantCollection.amount -
                            (enhancedMetrics?.totalRefunds || 0);
                          return netTotal > 0
                            ? ((netInstant / netTotal) * 100).toFixed(1)
                            : 0;
                        })()}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Due Payments */}
                  {revenueData.comprehensiveBreakdown.collection.components
                    .duePayments && (
                      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            Due Payments
                          </p>
                          <p className="text-xl font-bold text-slate-900">
                            {formatCurrency(
                              revenueData.comprehensiveBreakdown.collection
                                .components.duePayments.amount
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            {(() => {
                              const netTotal =
                                revenueData.comprehensiveBreakdown.collection
                                  .totalMoneyIn -
                                (enhancedMetrics?.totalRefunds || 0);
                              const duePayments =
                                revenueData.comprehensiveBreakdown.collection
                                  .components.duePayments.amount;
                              return netTotal > 0
                                ? ((duePayments / netTotal) * 100).toFixed(1)
                                : 0;
                            })()}
                            %
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Performance Metrics Mini-Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100">
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">
                        Collection Rate
                      </p>
                      <p
                        className={`text-lg font-bold ${revenueData.comprehensiveBreakdown.performance
                          .collectionRate >= 80
                          ? "text-emerald-600"
                          : "text-orange-600"
                          }`}
                      >
                        {revenueData.comprehensiveBreakdown.performance.collectionRate.toFixed(
                          0
                        )}
                        %
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-1">
                        Dues Recovery
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {revenueData.comprehensiveBreakdown.performance.duesCollectionEfficiency.toFixed(
                          0
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUE & CREDIT MANAGEMENT SECTION */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Due Management
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* DUE MANAGEMENT PANEL */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-900">
                      Dues Management
                    </h3>
                    <p className="text-sm text-orange-700/80 font-medium">
                      Money you need to receive from customers
                    </p>
                  </div>
                </div>

                {/* What are Dues? */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-100">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        What are Dues?
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Dues represent sales made on credit where customers
                        haven't paid yet. This is money you will receive in the
                        future when customers make payments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dues Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Left: Due Sales Breakdown */}
                  <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-3">
                      Due Sales (Period)
                    </p>

                    {/* Gross Due Sales */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Gross Due Sales</span>
                      <span className="text-lg font-bold text-slate-900">
                        {formatCurrency(
                          revenueData.duesSummary.periodBased.creditSales || 0
                        )}
                      </span>
                    </div>

                    {/* Returned Items (Credit) */}
                    {enhancedMetrics?.totalDueReductions > 0 && (
                      <>
                        <div className="flex items-center justify-between py-2 border-t border-slate-100">
                          <span className="text-sm text-amber-600">Less: Returned Items</span>
                          <span className="text-base font-semibold text-amber-600">
                            -{formatCurrency(enhancedMetrics.totalDueReductions)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t-2 border-orange-200">
                          <span className="text-sm text-orange-700 font-bold">Net Due Sales</span>
                          <span className="text-xl font-bold text-orange-700">
                            {formatCurrency(
                              (revenueData.duesSummary.periodBased.creditSales || 0) -
                              (enhancedMetrics.totalDueReductions || 0)
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <p className="text-xs text-slate-400 font-medium mt-3">
                      {revenueData.duesSummary.periodBased.invoicesWithDue || 0} invoices
                    </p>
                  </div>

                  {/* Right: Collection Status */}
                  <div className="space-y-4">
                    {/* Dues Collected */}
                    <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                      <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">
                        Dues Collected (Period)
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mb-1">
                        {formatCurrency(
                          revenueData.duesSummary.periodBased.duesCollected || 0
                        )}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {paymentsData?.summary?.paymentCount || 0} payments
                      </p>
                    </div>

                    {/* Still Outstanding */}
                    <div className="bg-white rounded-xl p-5 border border-red-100 shadow-sm">
                      <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-2">
                        Still Outstanding
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mb-1">
                        {formatCurrency(
                          (revenueData.duesSummary.periodBased.stillOutstanding || 0) -
                          (enhancedMetrics?.totalDueReductions || 0)
                        )}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Yet to receive
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collection Efficiency Bar */}
                <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-slate-700">
                      Collection Efficiency
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {revenueData.duesSummary.periodBased.creditSales > 0
                        ? (
                          (revenueData.duesSummary.periodBased.duesCollected /
                            revenueData.duesSummary.periodBased.creditSales) *
                          100
                        ).toFixed(1)
                        : "0"}
                      %
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${revenueData.duesSummary.periodBased.creditSales > 0
                          ? Math.min(
                            100,
                            (revenueData.duesSummary.periodBased
                              .duesCollected /
                              revenueData.duesSummary.periodBased
                                .creditSales) *
                            100
                          )
                          : 0
                          }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Percentage of due sales collected in this period
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts Section - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Payment Methods Analysis */}
            {/* Sales & Collection Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  {breakdownView === "sales"
                    ? "Sales by Type"
                    : "Money Collected"}
                </h3>

                {/* View Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setBreakdownView("sales")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${breakdownView === "sales"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Sales
                  </button>
                  <button
                    onClick={() => setBreakdownView("money")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${breakdownView === "money"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Money In
                  </button>
                </div>
              </div>

              {breakdownView === "sales" ? (
                /* Sales Breakdown (Original View) */
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {revenueData.paymentBreakdown.map((method) => {
                    const Icon = getPaymentMethodIcon(method._id);
                    const percentage =
                      method.total > 0
                        ? revenueData.summary.totalRevenue > 0
                          ? (method.total / revenueData.summary.totalRevenue) *
                          100
                          : 0
                        : 0;

                    // Get the current outstanding for this payment method
                    // For 'due' method, subtract credit adjustments (returns)
                    const stillPending = method._id === 'due'
                      ? (method.currentDue || 0) - (revenueData.dueReductionsByMode?.[method._id] || 0)
                      : (method.currentDue || 0);

                    return (
                      <div
                        key={method._id}
                        className="group p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                        style={{
                          borderColor: `${COLORS[method._id] || "#94a3b8"}30`,
                          backgroundColor: `${COLORS[method._id] || "#94a3b8"
                            }05`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2.5 rounded-lg shadow-sm"
                              style={{
                                backgroundColor:
                                  COLORS[method._id] || "#94a3b8",
                              }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                {getPaymentMethodLabel(method._id)}
                                {method.isOutstandingOnly && (
                                  <span className="ml-2 text-xs text-orange-600 font-normal">
                                    (Old Dues)
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {method.count > 0
                                  ? `${method.count} transactions`
                                  : method.paymentsReceived > 0
                                    ? "Payments on old dues"
                                    : "No activity"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {method.total > 0 ? (
                              <p
                                className="text-xl font-bold"
                                style={{
                                  color: COLORS[method._id] || "#64748b",
                                }}
                              >
                                {percentage.toFixed(1)}%
                              </p>
                            ) : (
                              <p className="text-sm text-slate-400">N/A</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {method.total > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-xs">
                                Gross Sales
                              </span>
                              <span className="font-semibold text-slate-600">
                                {formatCurrency(method.total)}
                              </span>
                            </div>
                          )}

                          {/* Cash Refunds */}
                          {revenueData.refundsByMode?.[method._id] > 0 && (
                            <div className="flex justify-between items-center text-rose-600 text-xs">
                              <span>Less Cash Refunds</span>
                              <span>
                                -{formatCurrency(revenueData.refundsByMode[method._id])}
                              </span>
                            </div>
                          )}

                          {/* Credit Adjustments */}
                          {revenueData.dueReductionsByMode?.[method._id] > 0 && (
                            <div className="flex justify-between items-center text-amber-600 text-xs">
                              <span>Less Credit Adjustments</span>
                              <span>
                                -{formatCurrency(revenueData.dueReductionsByMode[method._id])}
                              </span>
                            </div>
                          )}

                          {/* Net Sales - Only show if there are deductions */}
                          {(revenueData.refundsByMode?.[method._id] > 0 || revenueData.dueReductionsByMode?.[method._id] > 0) && (
                            <div className="flex justify-between items-center py-1 border-b border-slate-100 mb-1">
                              <span className="text-slate-700 text-xs font-bold">
                                Net Sales
                              </span>
                              <span className="font-bold text-slate-800 text-sm">
                                {formatCurrency(
                                  method.total -
                                  (revenueData.refundsByMode?.[method._id] || 0) -
                                  (revenueData.dueReductionsByMode?.[method._id] || 0)
                                )}
                              </span>
                            </div>
                          )}

                          {method.paymentsReceived > 0 && (
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-slate-500 text-xs">
                                Payments Received
                              </span>
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(method.paymentsReceived)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-xs">
                              Total Collected
                            </span>
                            <span className="font-bold text-emerald-600">
                              {(() => {
                                const collected = method.actualReceived || 0;
                                const refund =
                                  revenueData.refundsByMode?.[method._id] || 0;
                                const net = collected - refund;
                                return formatCurrency(net);
                              })()}
                            </span>
                          </div>

                          {stillPending > 0 && (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                              <span className="text-slate-600 text-xs font-bold">
                                Total Outstanding
                              </span>
                              <span className="font-bold text-orange-600">
                                {formatCurrency(stillPending)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {method.total > 0 && (
                          <div className="mt-3">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    COLORS[method._id] || "#94a3b8",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Money Collection Breakdown (New View) */
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {moneyCollectionData.length > 0 ? (
                    moneyCollectionData.map((item) => {
                      const Icon = getPaymentMethodIcon(item.mode);
                      return (
                        <div
                          key={item.mode}
                          className="group p-4 rounded-xl border transition-all duration-200 hover:shadow-md"
                          style={{
                            borderColor: `${COLORS[item.mode] || "#94a3b8"}30`,
                            backgroundColor: `${COLORS[item.mode] || "#94a3b8"
                              }05`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2.5 rounded-lg shadow-sm"
                                style={{
                                  backgroundColor:
                                    COLORS[item.mode] || "#94a3b8",
                                }}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {getPaymentMethodLabel(item.mode)}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Total Collected
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-xl font-bold"
                                style={{
                                  color: COLORS[item.mode] || "#64748b",
                                }}
                              >
                                {item.percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 text-xs">
                                From Instant Sales
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(item.instantAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-600 text-xs">
                                From Credit Payments
                              </span>
                              <span className="font-bold text-emerald-600">
                                {formatCurrency(item.duePaymentAmount)}
                              </span>
                            </div>
                            {item.refundAmount > 0 && (
                              <div className="flex justify-between items-center text-rose-600">
                                <span className="text-xs">Less Refunds</span>
                                <span className="font-bold">
                                  -{formatCurrency(item.refundAmount)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                              <span className="text-slate-600 text-xs font-bold">
                                Net In Hand
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(item.total)}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${item.percentage}%`,
                                  backgroundColor:
                                    COLORS[item.mode] || "#94a3b8",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No money collected in this period
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RETURNS BREAKDOWN SECTION */}
            {revenueData?.returnsBreakdown && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-rose-600" />
                      Returns Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Understanding how returns impact your cash flow
                    </p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Total Returns */}
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-5 border border-rose-100">
                    <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mb-2">
                      Total Returns
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(revenueData.returnsBreakdown.total)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {revenueData.returnsBreakdown.count} return transactions
                    </p>
                  </div>

                  {/* Cash Refunds (Walk-in) */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">
                      Cash Refunds
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(
                        revenueData.returnsBreakdown.fromWalkInCustomers.total
                      )}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {revenueData.returnsBreakdown.fromWalkInCustomers.count}{" "}
                      walk-in returns (money out)
                    </p>
                  </div>

                  {/* Credit Adjustments (Due Customers) */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">
                      Credit Adjustments
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(
                        revenueData.returnsBreakdown.fromDueCustomers.total
                      )}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {revenueData.returnsBreakdown.fromDueCustomers.count} due
                      customer returns (no cash out)
                    </p>
                  </div>
                </div>

                {/* Explanation Box */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                        Understanding Return Types
                      </h4>
                      <div className="space-y-1.5 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-orange-700">
                            Cash Refunds:
                          </span>{" "}
                          Money refunded to walk-in customers who returned
                          products. This reduces your "Total Collected" amount.
                        </p>
                        <p>
                          <span className="font-semibold text-blue-700">
                            Credit Adjustments:
                          </span>{" "}
                          Returns from customers with credit accounts. No money
                          was refunded - instead, their outstanding balance was
                          reduced. This does NOT affect "Total Collected".
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cash Refunds Detail */}
                  {revenueData.refundsByMode &&
                    Object.keys(revenueData.refundsByMode).length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-orange-600" />
                          Cash Refunds by Method
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(revenueData.refundsByMode).map(
                            ([mode, amount]) => {
                              const Icon = getPaymentMethodIcon(mode);
                              const totalRefunds = Object.values(
                                revenueData.refundsByMode
                              ).reduce((sum, val) => sum + val, 0);
                              const percentage =
                                totalRefunds > 0
                                  ? (amount / totalRefunds) * 100
                                  : 0;

                              return (
                                <div
                                  key={mode}
                                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {getPaymentMethodLabel(mode)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {percentage.toFixed(1)}% of refunds
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-orange-700">
                                    {formatCurrency(amount)}
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                  {/* Credit Adjustments Detail */}
                  {revenueData.dueReductionsByMode &&
                    Object.keys(revenueData.dueReductionsByMode).length >
                    0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-blue-600" />
                          Credit Adjustments by Method
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(revenueData.dueReductionsByMode).map(
                            ([mode, amount]) => {
                              const Icon = getPaymentMethodIcon(mode);
                              const totalReductions = Object.values(
                                revenueData.dueReductionsByMode
                              ).reduce((sum, val) => sum + val, 0);
                              const percentage =
                                totalReductions > 0
                                  ? (amount / totalReductions) * 100
                                  : 0;

                              return (
                                <div
                                  key={mode}
                                  className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900">
                                        {getPaymentMethodLabel(mode)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {percentage.toFixed(1)}% of adjustments
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-blue-700">
                                    {formatCurrency(amount)}
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* TAX BREAKDOWN SECTION */}
            {revenueData?.taxDetails && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-600" />
                      Tax Breakdown
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tax collected and refunded in this period
                    </p>
                  </div>
                </div>

                {/* Tax Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Tax Collected */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-2">
                      Tax Collected
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(revenueData.taxDetails.totalTaxCollected || 0)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      From all sales in period
                    </p>
                  </div>

                  {/* Tax Refunded */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">
                      Tax Refunded
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(revenueData.taxDetails.totalTaxRefunded || 0)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      On product returns
                    </p>
                  </div>

                  {/* Net Tax */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">
                      Net Tax Liability
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      {formatCurrency(
                        (revenueData.taxDetails.totalTaxCollected || 0) -
                        (revenueData.taxDetails.totalTaxRefunded || 0)
                      )}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      After refunds
                    </p>
                  </div>
                </div>

                {/* Tax Explanation */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                        Understanding Tax
                      </h4>
                      <div className="space-y-1.5 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-emerald-700">
                            Tax Collected:
                          </span>{" "}
                          Total tax amount collected from customers on sales made in this period.
                        </p>
                        <p>
                          <span className="font-semibold text-orange-700">
                            Tax Refunded:
                          </span>{" "}
                          Tax amount refunded to customers when products were returned.
                        </p>
                        <p>
                          <span className="font-semibold text-blue-700">
                            Net Tax Liability:
                          </span>{" "}
                          The actual tax amount you need to remit to authorities (Tax Collected - Tax Refunded).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Trends Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Revenue Trends
                </h3>
                <select
                  value={selectedChart}
                  onChange={(e) => setSelectedChart(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="trend">Trend</option>
                  <option value="comparison">Comparison</option>
                </select>
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Paying Customers - Mobile Optimized */}
          {paymentsData.topPayingCustomers &&
            paymentsData.topPayingCustomers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Top Paying Customers
                </h3>

                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider"
                            >
                              Customer
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                            >
                              Total Paid
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                            >
                              Transactions
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider"
                            >
                              Last Payment
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {paymentsData.topPayingCustomers.map(
                            (customer, idx) => (
                              <tr
                                key={customer._id}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200">
                                      {idx + 1}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-bold text-slate-900">
                                        {customer.customerName}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {customer.customerPhone || "No phone"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="text-sm font-bold text-slate-900">
                                    {formatCurrency(customer.totalPaid)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="text-sm text-slate-600 font-medium">
                                    {customer.paymentCount}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <div className="text-sm text-slate-500">
                                    {/* We don't have lastPayment date in the aggregation, so we'll omit or use a placeholder if needed, but for now I'll just show 'Recent' or remove the column content if data missing */}
                                    Recent
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Insights & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Key Insights */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-indigo-100 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-indigo-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Key Insights
              </h3>
              <div className="space-y-4">
                {/* Revenue Growth Insight */}
                <div className="flex gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                  <div
                    className={`p-3 rounded-xl h-fit ${revenueData.summary.growth >= 0
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                      }`}
                  >
                    {revenueData.summary.growth >= 0 ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Revenue Trajectory
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Revenue is{" "}
                      <span
                        className={`font-bold ${revenueData.summary.growth >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                          }`}
                      >
                        {revenueData.summary.growth >= 0 ? "up" : "down"} by{" "}
                        {Math.abs(revenueData.summary.growth).toFixed(1)}%
                      </span>{" "}
                      compared to the previous period.
                      {revenueData.summary.growth >= 0
                        ? " Great job! Keep up the momentum."
                        : " Consider running a promotion to boost sales."}
                    </p>
                  </div>
                </div>

                {/* Collection Efficiency Insight */}
                {revenueData.comprehensiveBreakdown && (
                  <div className="flex gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-indigo-100">
                    <div className="p-3 rounded-xl h-fit bg-blue-100 text-blue-600">
                      <HandCoins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">
                        Collection Efficiency
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        You've collected{" "}
                        <span className="font-bold text-blue-600">
                          {(() => {
                            const totalRevenue =
                              revenueData.summary.totalRevenue || 1;
                            const actualReceived =
                              revenueData.summary.actualReceivedRevenue || 0;
                            const totalRefunds =
                              enhancedMetrics?.totalRefunds || 0;
                            const netCollected = actualReceived - totalRefunds;
                            const efficiency =
                              (netCollected / totalRevenue) * 100;
                            return efficiency.toFixed(1);
                          })()}
                          %
                        </span>{" "}
                        of the total revenue generated in this period
                        {enhancedMetrics?.totalRefunds > 0 && (
                          <span className="text-rose-600">
                            {" "}
                            (after deducting ₹
                            {enhancedMetrics.totalRefunds.toFixed(2)} in
                            refunds)
                          </span>
                        )}
                        .
                        {(() => {
                          const totalRevenue =
                            revenueData.summary.totalRevenue || 1;
                          const actualReceived =
                            revenueData.summary.actualReceivedRevenue || 0;
                          const totalRefunds =
                            enhancedMetrics?.totalRefunds || 0;
                          const netCollected = actualReceived - totalRefunds;
                          const efficiency =
                            (netCollected / totalRevenue) * 100;
                          return efficiency < 80
                            ? " Focus on following up with customers who have outstanding dues."
                            : " Your collection process is working well.";
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recommended Actions
              </h3>
              <div className="space-y-4">
                {revenueData.duesSummary.periodBased.stillOutstanding > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Follow up on Dues
                        </h4>
                        <p className="text-xs text-slate-500">
                          Recover{" "}
                          {formatCurrency(
                            revenueData.duesSummary.periodBased.stillOutstanding
                          )}{" "}
                          pending
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Analyze Top Sellers
                      </h4>
                      <p className="text-xs text-slate-500">
                        Review your best performing items
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !revenueData && (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <IndianRupee className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Revenue Data
            </h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              There's no revenue data available for the selected period.
            </p>
            <button
              onClick={fetchAllData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && revenueData && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Updating revenue data...</p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }

        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Horizontal scroll for mobile */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
        }
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        /* Animation for fade in */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .recharts-surface {
            font-size: 10px;
          }
          .recharts-cartesian-axis-tick {
            font-size: 9px;
          }
          .recharts-legend-wrapper {
            font-size: 10px;
          }
        }

        /* Ensure touch targets are at least 44x44 on mobile */
        @media (max-width: 640px) {
          button {
            min-height: 44px;
          }
        }

        /* Better contrast for small text */
        .text-xs {
          letter-spacing: 0.025em;
        }

        /* Improve tap targets on mobile */
        @media (pointer: coarse) {
          .group {
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueDashboard;
