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
      await generatePDF(invoice._id);
    } catch (error) {
      console.error("Error downloading PDF:", error);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Invoice Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Invoice #{invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Invoice Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">
                    Customer Information
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium text-gray-900">
                      {customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium text-gray-900">
                      {customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium text-gray-900 truncate ml-2">
                      {customerEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">
                    Invoice Information
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice #:</span>
                    <span className="font-medium text-gray-900">
                      {invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">
                      {invoiceDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {invoice.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {invoice.status || "Paid"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Items</h3>
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-500">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            ₹{item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            ₹{item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 space-y-2">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {item.quantity} {item.unit} × ₹{item.price.toFixed(2)}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">₹{subtotal}</span>
                </div>
                {tax !== "0.00" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">₹{tax}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
