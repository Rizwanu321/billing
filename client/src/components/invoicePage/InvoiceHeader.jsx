import React from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const InvoiceHeader = ({ onNewBilling, taxEnabled }) => {
  const { t } = useTranslation();
  const title = taxEnabled ? t('invoice.taxInvoice') : t('invoice.invoice');
  const buttonText = taxEnabled ? t('invoice.newTaxInvoice') : t('invoice.newInvoice');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-slate-500 mt-1">{t('invoice.manageBillingAndPayments')}</p>
      </div>
      <button
        onClick={onNewBilling}
        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 font-semibold flex items-center justify-center active:scale-95"
      >
        <Plus className="w-5 h-5 mr-2" />
        {buttonText}
      </button>
    </div>
  );
};

export default InvoiceHeader;
