import React, { useState } from "react";
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
  ArrowUp,
  ArrowDown,
  ChevronRight,
  DollarSign,
  TrendingDown,
  Loader2,
  ShieldCheck,
  Filter
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
      name: "Stock Summary",
      description: "Overview of current stock levels and values",
      icon: BarChart3,
      color: "indigo",
    },
    {
      id: "movement",
      name: "Movement Analysis",
      description: "Detailed analysis of stock movements",
      icon: Activity,
      color: "emerald",
    },
    {
      id: "valuation",
      name: "Stock Valuation",
      description: "Complete stock valuation by category",
      icon: TrendingUp,
      color: "violet",
    },
    {
      id: "lowstock",
      name: "Low Stock",
      description: "Products below reorder level",
      icon: AlertTriangle,
      color: "rose",
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

      const extension = format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv";
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

  const StatCard = ({ icon: Icon, label, value, colorType }) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      green: "bg-emerald-50 text-emerald-600 border-emerald-100",
      orange: "bg-amber-50 text-amber-600 border-amber-100",
      red: "bg-rose-50 text-rose-600 border-rose-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };
    const activeColor = colors[colorType] || colors.blue;

    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-xl border ${activeColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const SortableHeader = ({ label, sortKey, sortConfig, onSort, align = "left" }) => {
    const textAlign = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
    return (
      <th
        className={`px-6 py-4 ${textAlign} text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none`}
        onClick={() => onSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
          {label}
          {sortConfig.key === sortKey && (
            sortConfig.direction === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
          )}
        </div>
      </th>
    );
  };

  const StockStatusBadge = ({ stock }) => {
    if (stock === 0) return <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">Out of Stock</span>;
    if (stock <= 5) return <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">Critical</span>;
    if (stock <= 10) return <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Low Stock</span>;
    return <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">In Stock</span>;
  };

  const SummaryReportTable = ({ data }) => {
    const products = data.products || [];
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50/75 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">No data found</td></tr>
              ) : (
                products.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.category}</td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-slate-700">{Number(p.stock).toFixed(2).replace(/\.00$/, '')} <span className="text-xs font-normal text-slate-400">{p.unit}</span></td>
                    <td className="px-6 py-4 text-sm text-right text-slate-600">₹{p.price?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-slate-800">₹{p.totalValue?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center"><StockStatusBadge stock={p.stock} /></td>
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
    const movements = sortData(data.movements || [], sortConfig.key, sortConfig.direction);
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50/75 border-b border-slate-200">
            <tr>
              <SortableHeader label="Product" sortKey="productName" sortConfig={sortConfig} onSort={handleSort} />
              <SortableHeader label="Total Added" sortKey="totalIn" sortConfig={sortConfig} onSort={handleSort} align="center" />
              <SortableHeader label="Total Removed" sortKey="totalOut" sortConfig={sortConfig} onSort={handleSort} align="center" />
              <SortableHeader label="Net Change" sortKey="netChange" sortConfig={sortConfig} onSort={handleSort} align="center" />
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {movements.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">No movements found</td></tr>
            ) : (
              movements.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{m.productName || "Unknown"}</td>
                  <td className="px-6 py-4 text-center"><span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md text-xs">+{Number(m.totalIn).toFixed(2).replace(/\.00$/, '')}</span></td>
                  <td className="px-6 py-4 text-center"><span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md text-xs">-{Number(m.totalOut).toFixed(2).replace(/\.00$/, '')}</span></td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${m.netChange > 0 ? 'text-emerald-600' : m.netChange < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {m.netChange > 0 ? '+' : ''}{Number(m.netChange).toFixed(2).replace(/\.00$/, '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {m.netChange > 0 ? <span className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600"><TrendingUp size={14} /> Rising</span> :
                      m.netChange < 0 ? <span className="flex items-center justify-center gap-1 text-xs font-bold text-rose-600"><TrendingDown size={14} /> Falling</span> :
                        <span className="text-xs text-slate-400 font-medium">No Change</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const LowStockReportTable = ({ data, sortConfig, handleSort, sortData }) => {
    const products = sortData(data.lowStockProducts || [], sortConfig.key, sortConfig.direction);
    const outOfStock = products.filter((p) => p.currentStock === 0);
    const criticalStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= 5);
    const lowStock = products.filter((p) => p.currentStock > 5);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Summary Cards */}
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
            <h5 className="font-bold text-rose-800 mb-1 flex items-center gap-2"><AlertTriangle size={18} /> Out of Stock</h5>
            <p className="text-3xl font-bold text-rose-600">{outOfStock.length}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <h5 className="font-bold text-amber-800 mb-1 flex items-center gap-2"><AlertTriangle size={18} /> Critical</h5>
            <p className="text-3xl font-bold text-amber-600">{criticalStock.length}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
            <h5 className="font-bold text-yellow-800 mb-1 flex items-center gap-2"><AlertTriangle size={18} /> Low Stock</h5>
            <p className="text-3xl font-bold text-yellow-600">{lowStock.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50/75 border-b border-slate-200">
              <tr>
                <SortableHeader label="Product" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Category" sortKey="category" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Stock" sortKey="currentStock" sortConfig={sortConfig} onSort={handleSort} align="center" />
                <SortableHeader label="Value" sortKey="value" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">No low stock items</td></tr>
              ) : (
                products.map((p, i) => (
                  <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${p.currentStock === 0 ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.category}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{Number(p.currentStock).toFixed(2).replace(/\.00$/, '')} <span className="text-xs font-normal text-slate-400">{p.unit}</span></td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">₹{p.value?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {p.currentStock === 0 ? <span className="text-xs font-bold text-rose-600">ORDER NOW</span> :
                        p.currentStock <= 5 ? <span className="text-xs font-bold text-amber-600">ORDER SOON</span> :
                          <span className="text-xs font-bold text-yellow-600">MONITOR</span>}
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

  const ValuationReportTable = ({ data }) => {
    const categories = data.categoryValuation || [];
    const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-bold text-slate-800">{cat.name}</h5>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold">
                  {((cat.totalValue / totalValue) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">₹{cat.totalValue.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-1">{cat.totalItems} products</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {categories.map((cat, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h6 className="font-bold text-slate-700">{cat.name} Breakdown</h6>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {cat.products?.map((p, j) => (
                      <tr key={j} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                        <td className="px-6 py-3 text-center text-sm text-slate-600">{Number(p.stock).toFixed(2).replace(/\.00$/, '')} {p.unit}</td>
                        <td className="px-6 py-3 text-right text-sm text-slate-600">₹{p.price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-right text-sm font-bold text-slate-800">₹{p.value.toFixed(2)}</td>
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

  const ReportPreview = () => {
    if (!reportData || !showPreview) return null;
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mt-8 overflow-hidden animate-fadeIn">
        <div className="bg-slate-50/50 px-6 sm:px-8 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Eye className="text-indigo-600" size={20} /> Report Preview</h3>
          <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600"><EyeOff size={20} /></button>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Package} label="Total Products" value={reportData.totalProducts} colorType="blue" />
            <StatCard icon={DollarSign} label="Total Value" value={`₹${reportData.totalValue?.toFixed(2)}`} colorType="green" />
            <StatCard icon={AlertTriangle} label="Low Stock" value={reportData.lowStockCount} colorType="orange" />
            <StatCard icon={ShieldCheck} label="Out of Stock" value={reportData.outOfStockCount} colorType="red" />
          </div>

          {reportType === "summary" && <SummaryReportTable data={reportData} />}
          {reportType === "movement" && <MovementReportTable data={reportData} sortConfig={sortConfig} handleSort={handleSort} sortData={sortData} />}
          {reportType === "lowstock" && <LowStockReportTable data={reportData} sortConfig={sortConfig} handleSort={handleSort} sortData={sortData} />}
          {reportType === "valuation" && <ValuationReportTable data={reportData} />}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-8 py-4 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="text-indigo-600" size={28} />
              Stock Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-10">Generate comprehensive inventory analytics</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
        {/* Report Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => { setReportType(type.id); setReportData(null); setShowPreview(false); }}
              className={`p-6 rounded-2xl border-2 text-left transition-all group ${reportType === type.id
                ? `border-${type.color}-500 bg-white shadow-md ring-4 ring-${type.color}-500/10`
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${reportType === type.id ? `bg-${type.color}-100 text-${type.color}-600` : "bg-slate-100 text-slate-500"}`}>
                  <type.icon size={24} />
                </div>
                {reportType === type.id && <div className={`w-3 h-3 rounded-full bg-${type.color}-500`} />}
              </div>
              <h3 className={`font-bold text-lg mb-1 ${reportType === type.id ? "text-slate-800" : "text-slate-600"}`}>{type.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{type.description}</p>
            </button>
          ))}
        </div>

        {/* Parameters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-fadeIn">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Filter size={20} className="text-slate-400" /> Report Parameters</h3>
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <DatePicker
                    selected={dateRange.startDate}
                    onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 outline-none transition-all"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <DatePicker
                    selected={dateRange.endDate}
                    onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                    minDate={dateRange.startDate}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 outline-none transition-all"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full lg:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <BarChart3 size={20} />}
              Generate Report
            </button>
          </div>

          {/* Check download options */}
          {reportData && showPreview && (
            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-bold text-slate-700">Export Results</p>
                <p className="text-sm text-slate-400">Download report in your preferred format</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleDownloadReport("pdf")}
                  disabled={downloadingFormat === "pdf"}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all disabled:opacity-70"
                >
                  {downloadingFormat === "pdf" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} PDF Report
                </button>
                <button
                  onClick={() => handleDownloadReport("csv")}
                  disabled={downloadingFormat === "csv"}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-70"
                >
                  {downloadingFormat === "csv" ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />} CSV Export
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Content */}
        <ReportPreview />
      </div>
    </div>
  );
};

export default StockReports;
