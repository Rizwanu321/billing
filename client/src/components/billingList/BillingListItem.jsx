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
import { useTranslation } from "react-i18next";

const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
  const { t } = useTranslation();
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
    <div className="bg-white rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all duration-200 group">
      {/* Mobile Layout */}
      <div className="sm:hidden p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">
              #{invoice.invoiceNumber}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              {new Date(invoice.date).toLocaleDateString()}
            </span>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
              invoice.status
            )}`}
          >
            {t(`invoiceDetail.${invoice.status || 'paid'}`)}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {invoice.customer?.name || t('billingList.walkInCustomer')}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {getPaymentMethodIcon(invoice.paymentMethod)} <span className="capitalize">{t(`invoiceDetail.${invoice.paymentMethod}`)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-0.5">{t('billingList.amount')}</p>
            <p className="text-base font-bold text-slate-900">
              ₹{invoice.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Mobile Actions Ribbon */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
          <button
            onClick={onView}
            className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1"></div>
          <button
            onClick={onShareWhatsApp}
            className="flex-1 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center justify-center gap-1.5"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" /> Share
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1"></div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="px-4 py-2 text-slate-400 hover:text-slate-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {showMobileMenu && (
          <div className="mt-3 bg-slate-50 rounded-xl p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
            <button onClick={() => { onDownload(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <Download className="w-4 h-4 text-slate-400" /> Download PDF
            </button>
            <button onClick={() => { onPrint(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <Printer className="w-4 h-4 text-slate-400" /> Print
            </button>
            <button onClick={() => { onShareEmail(); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <Mail className="w-4 h-4 text-slate-400" /> Email
            </button>
          </div>
        )}
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="hidden sm:block">
        <div className="p-5 grid grid-cols-12 gap-4 items-center">
          {/* Invoice # (2 cols) */}
          <div className="col-span-2">
            <p className="text-xs text-slate-400 font-medium mb-0.5">{t('billingList.invoice')}</p>
            <p className="text-sm font-bold text-slate-900">#{invoice.invoiceNumber}</p>
          </div>

          {/* Customer (3 cols) */}
          <div className="col-span-3">
            <p className="text-xs text-slate-400 font-medium mb-0.5">{t('billingList.customer')}</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {invoice.customer?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate pr-2">
                {invoice.customer?.name || t('billingList.walkInCustomer')}
              </p>
            </div>
          </div>

          {/* Date (2 cols) */}
          <div className="col-span-2">
            <p className="text-xs text-slate-400 font-medium mb-0.5">{t('billingList.date')}</p>
            <div className="flex items-center gap-1.5 text-sm text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(invoice.date).toLocaleDateString()}
            </div>
          </div>

          {/* Status & Method (2 cols) */}
          <div className="col-span-2">
            <p className="text-xs text-slate-400 font-medium mb-0.5">{t('billingList.status')}</p>
            <div className="flex flex-col items-start gap-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {t(`invoiceDetail.${invoice.status || 'paid'}`)}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 capitalize">
                {getPaymentMethodIcon(invoice.paymentMethod)} {t(`invoiceDetail.${invoice.paymentMethod}`)}
              </div>
            </div>
          </div>

          {/* Amount (2 cols) */}
          <div className="col-span-2 text-right pr-4">
            <p className="text-xs text-slate-400 font-medium mb-0.5">{t('billingList.amount')}</p>
            <p className="text-base font-bold text-slate-900">₹{invoice.total.toFixed(2)}</p>
          </div>

          {/* Actions (1 col) */}
          <div className="col-span-1 flex justify-end">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onView} className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors" title="View">
                <Eye className="w-4 h-4" />
              </button>
              <div className="relative group/menu">
                <button className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {/* Hover Menu */}
                <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 hidden group-hover/menu:block z-10 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={onDownload} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <Download className="w-4 h-4 text-slate-400" /> Download
                  </button>
                  <button onClick={onShareWhatsApp} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4" /> Share WhatsApp
                  </button>
                  <button onClick={onPrint} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                    <Printer className="w-4 h-4 text-slate-400" /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingListItem;
