import React, { useState, useEffect, useRef } from "react";
import {
  Printer,
  Save,
  User,
  Plus,
  Trash,
  IndianRupee,
  CreditCard,
  Clock,
  Package,
  ShoppingCart,
  Edit3,
} from "lucide-react";
import { toast } from "react-toastify";
import Dialog from "./Dialog";
import InvoiceItemsSection from "./InvoiceItemsSection";
import { fetchCustomerById } from "../../api/customers";
import CustomerAutocomplete from "./CustomerAutocomplet";
import { useTranslation } from "react-i18next";

const InvoiceForm = ({
  invoice,
  setInvoice: setInvoiceProp,
  products,
  customers,
  selectedCustomer,
  setSelectedCustomer,
  setShowCustomerDetails,
  showCustomerDetails,
  taxSettings,
  loading,
  error,
  onSave,
  onPrint,
}) => {
  const { t } = useTranslation();
  const [localInvoice, setLocalInvoice] = useState(invoice);
  const [hasChanges, setHasChanges] = useState(false);
  const internalUpdateRef = useRef(false);

  const setInvoice = (updater) => {
    internalUpdateRef.current = true;
    if (typeof updater === "function") {
      setInvoiceProp((prev) => updater(prev));
    } else {
      setInvoiceProp(updater);
    }
  };

  useEffect(() => {
    setLocalInvoice(invoice);
    if (internalUpdateRef.current) {
      internalUpdateRef.current = false;
      return;
    }
    setHasChanges(false);
  }, [invoice]);

  const markAsDirty = () => {
    if (!hasChanges) {
      setHasChanges(true);
    }
  };

  const isExistingInvoice = Boolean(invoice._id);
  const primaryButtonLabel = !isExistingInvoice
    ? t('invoice.saveInvoice')
    : hasChanges
      ? t('invoice.saveChanges')
      : t('invoice.editInvoice');
  const isActionDisabled =
    loading ||
    (!isExistingInvoice && invoice.items.length === 0) ||
    (isExistingInvoice && hasChanges && invoice.items.length === 0);

  console.log("Primary Button Debug:", {
    isExistingInvoice,
    hasChanges,
    primaryButtonLabel,
    isActionDisabled,
    invoiceId: invoice._id,
    itemsCount: invoice.items.length
  });

  const handlePrimaryAction = () => {
    if (isExistingInvoice && !hasChanges) {
      setHasChanges(true);
      toast.info("Edit the invoice details and click Save Changes.");
      return;
    }
    onSave();
  };

  const paymentIcons = {
    cash: <IndianRupee className="w-4 sm:w-5 h-4 sm:h-5" />,
    online: <CreditCard className="w-4 sm:w-5 h-4 sm:h-5" />,
    due: <Clock className="w-4 sm:w-5 h-4 sm:h-5" />,
  };

  // Calculate total items and total quantity
  const getTotalItemsInfo = () => {
    const totalItems = localInvoice.items.length;
    const totalQuantity = localInvoice.items.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0
    );
    return { totalItems, totalQuantity };
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = taxSettings.taxEnabled
      ? subtotal * (taxSettings.taxRate / 100)
      : 0;
    const total = subtotal + tax;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  const handlePaymentMethodChange = (method) => {
    markAsDirty();
    setInvoice((prev) => ({
      ...prev,
      paymentMethod: method,
      dueAmount: method === "due" ? prev.total : 0,
    }));
  };

  const handleCustomerSelect = async (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      try {
        const fullCustomerDetails = await fetchCustomerById(customerId);

        setInvoice((prev) => ({
          ...prev,
          customer: {
            _id: customer._id,
            name: customer.name,
          },
        }));

        setSelectedCustomer(fullCustomerDetails);
        markAsDirty();
      } catch (error) {
        console.error("Error fetching customer details", error);
        toast.error("Failed to fetch customer details");
      }
    }
  };

  const updateInvoiceItems = (newItems, totals) => {
    setLocalInvoice((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
      // Update dueAmount if payment method is 'due'
      dueAmount: prev.paymentMethod === "due" ? totals.total : prev.dueAmount,
    }));
    setInvoice((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
      // Update dueAmount if payment method is 'due'
      dueAmount: prev.paymentMethod === "due" ? totals.total : prev.dueAmount,
    }));
    markAsDirty();
  };

  const { totalItems, totalQuantity } = getTotalItemsInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-visible">
      {/* Error Handling */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Customer Name Input */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {t('invoice.customerInformation')}
        </label>
        <input
          type="text"
          placeholder={t('invoice.customerNameOptional')}
          value={invoice.customer.name}
          onChange={(e) => {
            markAsDirty();
            setInvoice((prev) => ({
              ...prev,
              customer: { name: e.target.value },
            }));
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
        />
      </div>

      {/* Payment Method Selection */}
      <div className="mb-8">
        <h3 className="text-base font-bold text-slate-900 mb-3">
          {t('invoice.paymentMethod')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["cash", "online", "due"].map((method) => (
            <button
              key={method}
              onClick={() => handlePaymentMethodChange(method)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl capitalize font-semibold transition-all border-2 ${invoice.paymentMethod === method
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <span className={`mr-2 ${invoice.paymentMethod === method ? "text-indigo-100" : "text-slate-400"}`}>
                {paymentIcons[method]}
              </span>
              <span>{t(`invoice.${method}Payment`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Due Payment Customer Selection */}
      {invoice.paymentMethod === "due" && (
        <div className="mb-8 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
          <h3 className="text-base font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('invoice.selectCustomerForDuePayment')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <CustomerAutocomplete
                customers={customers}
                value={customers.find((c) => c._id === invoice.customer._id)}
                onChange={(customer) => {
                  if (customer) {
                    handleCustomerSelect(customer._id);
                  } else {
                    setInvoice((prev) => ({
                      ...prev,
                      customer: { name: "", _id: "" },
                    }));
                    setSelectedCustomer(null);
                    markAsDirty();
                  }
                }}
                placeholder={t('invoice.searchCustomer')}
                className="w-full bg-white rounded-xl border-0 ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowCustomerDetails(true)}
              disabled={!selectedCustomer}
              className="px-5 py-3 bg-white rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white transition-colors flex items-center justify-center shadow-sm"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={showCustomerDetails}
        onOpenChange={setShowCustomerDetails}
        type="customer"
        customer={selectedCustomer}
      />

      <InvoiceItemsSection
        localInvoice={localInvoice}
        products={products}
        calculateTotals={calculateTotals}
        updateInvoiceItems={updateInvoiceItems}
      />

      {/* Totals Section */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-slate-600 text-sm">
            <span className="font-medium">{t('invoice.totalItems')}</span>
            {localInvoice.items.length > 0 && (
              <span className="font-bold bg-white px-2 py-1 rounded border border-slate-200">{totalItems}</span>
            )}
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">{t('invoice.subtotal')}</span>
            <span className="font-semibold text-slate-900">
              ₹{localInvoice.subtotal.toFixed(2)}
            </span>
          </div>
          {taxSettings.taxEnabled && (
            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span className="font-medium">
                {t('invoice.tax')} ({taxSettings.taxRate}%)
              </span>
              <span className="font-semibold text-slate-900">
                ₹{localInvoice.tax.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-200">
            <span className="text-lg font-bold text-slate-900">{t('invoice.totalAmount')}</span>
            <span className="text-2xl font-bold text-indigo-600">
              ₹{localInvoice.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-end border-t border-slate-100 pt-6">
        <button
          onClick={handlePrimaryAction}
          disabled={isActionDisabled}
          className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] ${isActionDisabled && "opacity-50 cursor-not-allowed shadow-none"
            }`}
        >
          {primaryButtonLabel === "Edit Invoice" ? (
            <Edit3 className="w-5 h-5 mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {primaryButtonLabel}
        </button>

        {/* Receive Payment Button - Only show for saved due invoices */}
        {(() => {
          const showButton = invoice._id &&
            invoice.paymentMethod === "due" &&
            invoice.customer?._id &&
            invoice.dueAmount > 0;

          return showButton ? (
            <button
              onClick={() => {
                if (window.openPaymentModal) {
                  window.openPaymentModal();
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
            >
              <IndianRupee className="w-5 h-5 mr-2" />
              {t('invoice.receivePayment')}
            </button>
          ) : null;
        })()}

        <button
          onClick={onPrint}
          disabled={!invoice._id || invoice.status !== "final"}
          className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 font-bold transition-all shadow-lg shadow-slate-200 active:scale-[0.98] ${(!invoice._id || invoice.status !== "final") &&
            "opacity-50 cursor-not-allowed shadow-none"
            }`}
        >
          <Printer className="w-5 h-5 mr-2" />
          {t('invoice.printInvoice')}
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;
