import React from "react";
import {
  X,
  Download,
  Printer,
  IndianRupee,
  Calendar,
  User,
  FileText,
  Package,
} from "lucide-react";
import { generatePDF } from "../../api/invoices";

const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const customerName = invoice?.customer?.name || "Walk-in Customer";
  const customerPhone = invoice?.customer?.phoneNumber || "N/A";
  const customerEmail = invoice?.customer?.email || "N/A";
  const invoiceNumber = invoice?.invoiceNumber || "N/A";
  const invoiceDate = invoice?.date
    ? new Date(invoice.date).toLocaleDateString()
    : "N/A";
  const total =
    typeof invoice?.total === "number" ? invoice.total.toFixed(2) : "0.00";
  const subtotal =
    typeof invoice?.subtotal === "number"
      ? invoice.subtotal.toFixed(2)
      : "0.00";
  const tax =
    typeof invoice?.tax === "number" ? invoice.tax.toFixed(2) : "0.00";

  const items = Array.isArray(invoice?.items)
    ? invoice.items.map((item) => ({
      name: item.product?.name || "Unknown Product",
      quantity: item.quantity || 0,
      unit: item.unit || "piece",
      price: item.price || 0,
      amount: item.subtotal || item.quantity * item.price || 0,
    }))
    : [];

  const handleDownload = async () => {
    try {
      const pdfBlob = await generatePDF(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      // Optionally show a toast notification if you have toast imported
    }
  };

  const handlePrint = async () => {
    try {
      const pdfBlob = await generatePDF(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, "_blank");
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    } catch (error) {
      console.error("Error printing PDF:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              Invoice Details
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
              Reference #{invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3 sm:p-5 space-y-6 sm:space-y-8">
            {/* Header Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Customer Card */}
              <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-100/50">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    Customer Details
                  </h3>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs sm:text-sm text-slate-500">Name</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">{customerName}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs sm:text-sm text-slate-500">Phone</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-900 text-right">{customerPhone}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs sm:text-sm text-slate-500">Email</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-900 text-right truncate max-w-[120px] sm:max-w-[150px]">{customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Info Card */}
              <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-100/50">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                    Invoice Info
                  </h3>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-slate-500">Date</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-900">{invoiceDate}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-slate-500">Payment</span>
                    <span className="text-xs sm:text-sm font-medium text-slate-900 capitalize flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      {invoice.paymentMethod}
                    </span>
                  </div>
                  <div className="w-full h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs sm:text-sm text-slate-500">Status</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${invoice.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : invoice.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                        }`}
                    >
                      {invoice.status || "Paid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Purchased Items</h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{items.length}</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Item Name</th>
                        <th className="px-5 py-3 text-center">Unit Price</th>
                        <th className="px-5 py-3 text-center">Qty / Unit</th>
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-slate-900">{item.name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm text-slate-600">₹{item.price.toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700">
                              {item.quantity} <span className="text-slate-400">×</span> {item.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-sm font-bold text-indigo-900">₹{item.amount.toFixed(2)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-xs text-slate-400">@ ₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 text-sm">₹{item.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex flex-col items-end">
              <div className="w-full sm:w-80 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="text-slate-900 font-semibold">₹{subtotal}</span>
                  </div>
                  {tax !== "0.00" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Tax</span>
                      <span className="text-slate-900 font-semibold">₹{tax}</span>
                    </div>
                  )}
                  <div className="pt-2.5 sm:pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base font-bold text-slate-900">Total</span>
                      <span className="text-lg sm:text-xl font-bold text-indigo-600">₹{total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 p-3 sm:p-5 bg-white flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-50 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Close
          </button>
          <div className="flex gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
