// components/stock/StockMovements.jsx

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Download,
  RefreshCw,
  FileText,
  ShoppingCart,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Truck,
  User,
  Clock,
  ChevronDown,
  Filter,
  ArrowRight,
  Package
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchStockMovements } from "../../api/stock";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";

const StockMovements = () => {
  const { t } = useTranslation();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    type: "all",
    product: "", // Used via search field in UI
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadMovements();
  }, [filters, pagination.page]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await fetchStockMovements({
        ...filters,
        product: filters.search, // Mapping search to product param if needed
        page: pagination.page,
        limit: pagination.limit,
      });
      setMovements(data.movements);
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error("Error loading movements:", error);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data for export based on current filters
  const fetchAllForExport = async () => {
    try {
      const data = await fetchStockMovements({
        ...filters,
        product: filters.search,
        page: 1,
        limit: 10000, // Fetch large batch for export
      });
      return data.movements;
    } catch (error) {
      console.error("Export fetch error:", error);
      throw new Error("Failed to fetch data for export");
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const toastId = toast.loading("Generating PDF report...");

      const exportData = await fetchAllForExport();

      const doc = new jsPDF();

      // -- Professional Header --
      // Brand Color Rectangle (Indigo 600)
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 24, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Stock Movement Report", 14, 16);

      // Generated Date (Right Aligned in Header)
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 16, { align: 'right' });

      // Filter Summary Section
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);

      const startX = 14;
      let currentY = 34;

      doc.setFont("helvetica", "bold");
      doc.text("Report Parameters:", startX, currentY);

      doc.setFont("helvetica", "normal");
      doc.text(`Type: ${filters.type.toUpperCase()}`, startX + 35, currentY);
      doc.text(`Search: ${filters.search ? `"${filters.search}"` : "All Products"}`, startX + 80, currentY);
      doc.text(`Date Range: ${filters.startDate.toLocaleDateString()} - ${filters.endDate.toLocaleDateString()}`, startX + 130, currentY);

      // Table Data Preparation
      const tableColumn = ["Date", "Product", "Type", "Change", "New Stock", "Ref", "User"];
      const tableRows = [];

      exportData.forEach(m => {
        const row = [
          new Date(m.timestamp).toLocaleDateString(),
          m.product?.name || "Unknown",
          m.type.toUpperCase(),
          `${m.adjustment > 0 ? '+' : ''}${Number(m.adjustment).toFixed(2).replace(/\.00$/, '')} ${m.unit}`,
          `${Number(m.newStock).toFixed(2).replace(/\.00$/, '')} ${m.unit}`,
          m.reference || "-",
          m.user?.name || "System"
        ];
        tableRows.push(row);
      });

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 42,
        theme: 'grid',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo 600 header
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Date
          1: { cellWidth: 'auto' }, // Product
          2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }, // Type
          3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }, // Change
          4: { cellWidth: 26, halign: 'right' }, // Stock
          5: { cellWidth: 35 }, // Ref
          6: { cellWidth: 25 }  // User
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: 'middle',
          overflow: 'linebreak',
          lineColor: [230, 230, 230],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate 50 for alternate rows
        },
        didParseCell: function (data) {
          // Color code the 'Change' column in Body
          if (data.section === 'body' && data.column.index === 3) {
            const text = data.cell.raw.toString();
            if (text.startsWith('+')) {
              data.cell.styles.textColor = [16, 185, 129]; // Emerald 500
            } else {
              data.cell.styles.textColor = [225, 29, 72]; // Rose 600
            }
          }
        },
        didDrawPage: function (data) {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Page ${pageCount}`, 196, 290, { align: 'right' });
        }
      });

      doc.save(`stock-movements-${Date.now()}.pdf`);
      toast.success("PDF exported successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const toastId = toast.loading("Generating CSV...");

      const exportData = await fetchAllForExport();

      const headers = ["Date,Time,Product,Category,Type,Authorization Type,Adjustment,Unit,Previous Stock,New Stock,Reference,Description,User"];
      const rows = exportData.map(m => {
        return [
          new Date(m.timestamp).toLocaleDateString(),
          new Date(m.timestamp).toLocaleTimeString(),
          `"${m.product?.name || ""}"`,
          `"${m.product?.category?.name || ""}"`,
          m.type,
          m.adjustmentType || "-",
          Number(m.adjustment).toFixed(2).replace(/\.00$/, ''), // Clean number
          m.unit,
          Number(m.previousStock).toFixed(2).replace(/\.00$/, ''), // Clean number
          Number(m.newStock).toFixed(2).replace(/\.00$/, ''), // Clean number
          `"${m.reference || ""}"`,
          `"${m.description || ""}"`,
          `"${m.user?.name || ""}"`
        ].join(",");
      });

      const csvContent = headers.concat(rows).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock-movements-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeConfig = (movement) => {
    const type = movement.adjustmentType || movement.type;
    const configs = {
      sale: { label: "Sale", color: "text-amber-700 bg-amber-50 border-amber-200", icon: <ShoppingCart size={14} /> },
      return_from_customer: { label: "Return", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: <RotateCcw size={14} /> },
      purchase: { label: "Purchase", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <Truck size={14} /> },
      production: { label: "Production", color: "text-blue-700 bg-blue-50 border-blue-200", icon: <Package size={14} /> },
      found: { label: "Found", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle size={14} /> },
      adjustment_positive: { label: "Adj (+)", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <Plus size={14} /> },
      initial: { label: "Initial", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: <Package size={14} /> },
      damaged: { label: "Damaged", color: "text-rose-700 bg-rose-50 border-rose-200", icon: <XCircle size={14} /> },
      expired: { label: "Expired", color: "text-orange-700 bg-orange-50 border-orange-200", icon: <AlertTriangle size={14} /> },
      lost: { label: "Lost", color: "text-rose-700 bg-rose-50 border-rose-200", icon: <AlertCircle size={14} /> },
      theft: { label: "Theft", color: "text-rose-900 bg-rose-100 border-rose-300", icon: <AlertTriangle size={14} /> },
      return_to_supplier: { label: "Rtn Supplier", color: "text-orange-800 bg-orange-100 border-orange-300", icon: <Truck size={14} /> },
      adjustment_negative: { label: "Adj (-)", color: "text-slate-700 bg-slate-50 border-slate-200", icon: <Minus size={14} /> },
      addition: { label: "Addition", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <Plus size={14} /> },
      removal: { label: "Removal", color: "text-rose-700 bg-rose-50 border-rose-200", icon: <Minus size={14} /> },
    };
    return configs[type] || { label: type, color: "text-slate-700 bg-slate-50 border-slate-200", icon: <FileText size={14} /> };
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 sm:px-8 py-4 mb-8">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('stock.stockMovements')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('stock.auditTrailAndInventoryHistory')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadMovements}
              disabled={loading}
              className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-70"
              >
                {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={18} />}
                <span>{t('stock.export')}</span>
                <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileText size={16} className="text-rose-500" /> PDF Report
                  </button>
                  <div className="h-px bg-slate-50" />
                  <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-500" /> CSV Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('stock.searchProducts')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none"
              >
                <option value="all">{t('stock.allTypes')}</option>
                <option value="sale">Sales</option>
                <option value="return">Returns</option>
                <option value="additions">Additions</option>
                <option value="removals">Removals</option>
                <option value="adjustments">Adjustments</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                dateFormat="MMM d, yyyy"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                selectsEnd
                startDate={filters.startDate}
                endDate={filters.endDate}
                minDate={filters.startDate}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                dateFormat="MMM d, yyyy"
              />
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading && movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Loading history...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="p-6 bg-slate-50 rounded-full mb-4">
                <Package className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No movements found</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Try adjusting your filters or date range to see stock history.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('stock.dateTime')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('revenue.product')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('stock.type')}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('stock.change')}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('stock.stock')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('stock.reference')}</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('stock.user')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((movement) => {
                      const typeConfig = getTypeConfig(movement);
                      return (
                        <tr key={movement._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">
                                {new Date(movement.timestamp).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                <Clock size={10} />
                                {new Date(movement.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {movement.product?.name || "Unknown Product"}
                              </span>
                              <span className="text-xs text-slate-500 font-medium bg-slate-100 w-fit px-1.5 py-0.5 rounded mt-0.5">
                                {movement.product?.category?.name || "Uncategorized"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${typeConfig.color}`}>
                              {typeConfig.icon}
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={`text-sm font-bold ${movement.adjustment > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {movement.adjustment > 0 ? "+" : ""}
                              {Number(movement.adjustment).toFixed(2).replace(/\.00$/, '')} <span className="text-xs opacity-70">{movement.unit}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-slate-800 font-bold text-sm">
                                {Number(movement.newStock).toFixed(2).replace(/\.00$/, '')}
                              </span>
                              <span className="text-xs text-slate-400 font-medium line-through">
                                {Number(movement.previousStock).toFixed(2).replace(/\.00$/, '')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col max-w-[180px]">
                              {movement.reference && (
                                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit mb-1 truncate" title={movement.reference}>
                                  {movement.reference}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 truncate font-medium" title={movement.reason || movement.description}>
                                {movement.reason || movement.description || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
                                <User size={12} />
                              </div>
                              <span className="text-xs font-bold text-slate-600 truncate max-w-[100px]">{movement.user?.name || "System"}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {movements.map((movement) => {
                  const typeConfig = getTypeConfig(movement);
                  return (
                    <div key={movement._id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-0.5">{movement.product?.name}</h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {movement.product?.category?.name}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${typeConfig.color}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Change</p>
                          <p className={`text-sm font-bold ${movement.adjustment > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {movement.adjustment > 0 ? "+" : ""}
                            {Number(movement.adjustment).toFixed(2).replace(/\.00$/, '')} {movement.unit}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">New Stock</p>
                          <p className="text-sm font-bold text-slate-800">
                            {Number(movement.newStock).toFixed(2).replace(/\.00$/, '')} {movement.unit}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock size={12} />
                          <span>{new Date(movement.timestamp).toLocaleDateString()}</span>
                        </div>
                        {movement.reference && (
                          <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {movement.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && movements.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600 font-medium">
                {t('stock.showing')} <span className="font-bold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> {t('stock.to')}{" "}
                <span className="font-bold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                <span className="font-bold text-slate-900">{pagination.total}</span> {t('stock.results')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMovements;
