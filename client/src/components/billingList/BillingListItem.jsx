import React from "react";
import {
  FileText,
  Download,
  Printer,
  Eye,
  MoreVertical,
  IndianRupee,
  Calendar,
  User,
  Mail,
} from "lucide-react";

const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 3C9.382 3 4 8.383 4 15.002c0 2.625.828 5.06 2.242 7.046L4.5 28.5l6.622-1.711A11.91 11.91 0 0 0 16 27c6.618 0 12-5.382 12-11.998C28 8.382 22.618 3 16 3Zm0 2c5.54 0 10 4.458 10 9.998 0 5.539-4.46 10-10 10a9.9 9.9 0 0 1-4.955-1.336l-.352-.211-3.92 1.013 1.047-3.837-.23-.349A9.875 9.875 0 0 1 6 15.002C6 9.458 10.46 5 16 5Zm-4.007 4.5c-.266 0-.686.098-1.044.492-.357.394-1.373 1.34-1.373 3.269 0 1.928 1.404 3.794 1.6 4.058.196.264 2.583 4.12 6.368 5.612 3.149 1.239 3.785.991 4.468.929.683-.062 2.203-.901 2.515-1.773.312-.872.312-1.618.22-1.773-.091-.155-.357-.248-.747-.434-.39-.186-2.306-1.138-2.664-1.266-.357-.128-.616-.186-.875.186-.259.372-1.003 1.266-1.231 1.525-.227.258-.454.29-.844.105-.39-.186-1.644-.605-3.133-1.93-1.158-1.033-1.937-2.311-2.165-2.684-.227-.372-.024-.573.17-.757.174-.17.39-.443.586-.664.195-.22.26-.372.39-.619.129-.248.064-.465-.032-.651-.096-.186-.843-2.026-1.19-2.772-.312-.671-.636-.687-.903-.692Z"
      fill="currentColor"
    />
  </svg>
);

const BillingListItem = ({
  invoice,
  onView,
  onDownload,
  onPrint,
  onShareEmail,
  onShareWhatsApp,
}) => {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return "💵";
      case "online":
        return "💳";
      case "due":
        return "⏱️";
      default:
        return "💰";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Mobile Layout */}
      <div className="sm:hidden p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">
                #{invoice.invoiceNumber}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status || "Paid"}
              </span>
            </div>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              {invoice.customer?.name || "Walk-in Customer"}
            </p>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(invoice.date).toLocaleDateString()}
            </span>
            <span>{getPaymentMethodIcon(invoice.paymentMethod)}</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            ₹{invoice.total.toFixed(2)}
          </div>
        </div>

        {/* Mobile Actions Menu */}
        {showMobileMenu && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            <button
              onClick={() => {
                onView();
                setShowMobileMenu(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => {
                onDownload();
                setShowMobileMenu(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => {
                onPrint();
                setShowMobileMenu(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            <button
              onClick={() => {
                onShareEmail();
                setShowMobileMenu(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Share via Email
            </button>
            <button
              onClick={() => {
                onShareWhatsApp();
                setShowMobileMenu(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg flex items-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              Share via WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="hidden sm:block">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 lg:gap-8 flex-1">
              {/* Invoice Info */}
              <div className="min-w-[120px]">
                <p className="text-sm text-gray-500">Invoice</p>
                <p className="font-semibold text-gray-900">
                  #{invoice.invoiceNumber}
                </p>
              </div>

              {/* Customer Info */}
              <div className="flex-1 min-w-[150px]">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">
                  {invoice.customer?.name || "Walk-in Customer"}
                </p>
              </div>

              {/* Date */}
              <div className="hidden lg:block min-w-[100px]">
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-gray-900">
                  {new Date(invoice.date).toLocaleDateString()}
                </p>
              </div>

              {/* Payment Method */}
              <div className="hidden xl:block">
                <p className="text-sm text-gray-500">Payment</p>
                <div className="flex items-center gap-2">
                  <span>{getPaymentMethodIcon(invoice.paymentMethod)}</span>
                  <span className="text-gray-900 capitalize">
                    {invoice.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status || "Paid"}
                </span>
              </div>

              {/* Amount */}
              <div className="text-right min-w-[100px]">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{invoice.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={onView}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="View"
              >
                <Eye className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              </button>
              <button
                onClick={onDownload}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Download"
              >
                <Download className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              </button>
              <button
                onClick={onPrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Print"
              >
                <Printer className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              </button>
              <button
                onClick={onShareEmail}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Share via Email"
              >
                <Mail className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              </button>
              <button
                onClick={onShareWhatsApp}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Share via WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingListItem;
