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
    ? "Save Invoice"
    : hasChanges
    ? "Save Changes"
    : "Edit Invoice";
  const isActionDisabled =
    loading ||
    (!isExistingInvoice && invoice.items.length === 0) ||
    (isExistingInvoice && hasChanges && invoice.items.length === 0);

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
    }));
    setInvoice((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
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
      <div className="mb-6 sm:mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Information
        </label>
        <input
          type="text"
          placeholder="Customer Name (Optional)"
          value={invoice.customer.name}
          onChange={(e) => {
            markAsDirty();
            setInvoice((prev) => ({
              ...prev,
              customer: { name: e.target.value },
            }));
          }}
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
          Payment Method
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {["cash", "online", "due"].map((method) => (
            <button
              key={method}
              onClick={() => handlePaymentMethodChange(method)}
              className={`flex items-center justify-center px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg capitalize font-medium transition-all text-sm sm:text-base ${
                invoice.paymentMethod === method
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {paymentIcons[method]}
              <span className="ml-2">{method} Payment</span>
            </button>
          ))}
        </div>
      </div>

      {/* Due Payment Customer Selection */}
      {invoice.paymentMethod === "due" && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-indigo-50 rounded-lg border border-indigo-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
            Select Customer
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
                placeholder="Search Customer"
              />
            </div>
            <button
              onClick={() => setShowCustomerDetails(true)}
              disabled={!selectedCustomer}
              className="px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center h-[42px]"
            >
              <User className="w-5 h-5 text-gray-600" />
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
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
          <div className="flex justify-between">
            <span className="text-gray-600"> Items:</span>
            {localInvoice.items.length > 0 && (
              <span className="font-medium">{totalItems}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              ₹{localInvoice.subtotal.toFixed(2)}
            </span>
          </div>
          {taxSettings.taxEnabled && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                Tax ({taxSettings.taxRate}%):
              </span>
              <span className="font-medium">
                ₹{localInvoice.tax.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span className="text-indigo-700">
              ₹{localInvoice.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
        <button
          onClick={handlePrimaryAction}
          disabled={isActionDisabled}
          className={`w-full sm:w-auto flex items-center justify-center px-4 sm:px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-md text-sm sm:text-base ${
            isActionDisabled && "opacity-50 cursor-not-allowed"
          }`}
        >
          {primaryButtonLabel === "Edit Invoice" ? (
            <Edit3 className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {primaryButtonLabel}
        </button>
        <button
          onClick={onPrint}
          disabled={!invoice._id || invoice.status !== "final"}
          className={`w-full sm:w-auto flex items-center justify-center px-4 sm:px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-md text-sm sm:text-base ${
            (!invoice._id || invoice.status !== "final") &&
            "opacity-50 cursor-not-allowed"
          }`}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default InvoiceForm;
