// client/src/components/PaymentModal.jsx - NEW
import React, { useState, useEffect } from "react";
import {
  X,
  IndianRupee,
  CreditCard,
  Smartphone,
  Banknote,
  Info,
  AlertCircle,
  CheckCircle,
  Wallet,
} from "lucide-react";

const PaymentModal = ({ isOpen, onClose, customer, onPaymentSuccess }) => {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMode: "cash",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);

  useEffect(() => {
    if (formData.amount && customer) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        calculatePaymentSummary(amount);
      } else {
        setPaymentSummary(null);
      }
    } else {
      setPaymentSummary(null);
    }
  }, [formData.amount, customer]);

  const calculatePaymentSummary = (amount) => {
    const currentDue = customer.amountDue || 0;

    // Simple +/- logic: payment reduces due (can go negative)
    const newDue = currentDue - amount;
    const isAdvance = newDue < 0;
    const advanceAmount = isAdvance ? Math.abs(newDue) : 0;

    setPaymentSummary({
      paymentAmount: amount,
      currentDue,
      newDue,
      isAdvance,
      advanceAmount,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const amount = parseFloat(formData.amount);

    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = "Please enter a valid amount";
    } else if (amount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onPaymentSuccess({
        amount: parseFloat(formData.amount),
        paymentMode: formData.paymentMode,
        description: formData.description,
      });

      // Reset form
      setFormData({
        amount: "",
        paymentMode: "cash",
        description: "",
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const paymentModes = [
    { value: "cash", label: "Cash", icon: Banknote },
    { value: "online", label: "Online", icon: Smartphone },
    { value: "card", label: "Card", icon: CreditCard },
    { value: "other", label: "Other", icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Add Payment
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Record payment for {customer?.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Customer Balance Info */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className={`text-2xl font-bold ${customer?.amountDue > 0 ? "text-red-600" :
                  customer?.amountDue < 0 ? "text-green-600" :
                    "text-gray-600"
                }`}>
                {customer?.amountDue < 0 ? "-" : ""}₹{Math.abs(customer?.amountDue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {customer?.amountDue > 0 ? "Customer owes you" :
                  customer?.amountDue < 0 ? "Advance payment" :
                    "Settled"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.amount
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                    }`}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Payment Summary */}
            {paymentSummary && (
              <div className={`mb-6 rounded-lg p-4 border ${paymentSummary.isAdvance
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
                }`}>
                <div className="flex items-start space-x-3">
                  <Info className={`w-5 h-5 mt-0.5 ${paymentSummary.isAdvance ? "text-green-600" : "text-blue-600"
                    }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${paymentSummary.isAdvance ? "text-green-900" : "text-blue-900"
                      }`}>
                      Payment Summary
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Amount:</span>
                        <span className="font-medium">
                          ₹{paymentSummary.paymentAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Balance:</span>
                        <span className="font-medium text-gray-700">
                          {paymentSummary.currentDue < 0 ? "-" : ""}₹{Math.abs(paymentSummary.currentDue).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-gray-300">
                        <span className="text-gray-600">New Balance:</span>
                        <span
                          className={`font-semibold ${paymentSummary.newDue > 0
                              ? "text-red-600"
                              : paymentSummary.newDue < 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                        >
                          {paymentSummary.newDue < 0 ? "-" : ""}₹{Math.abs(paymentSummary.newDue).toFixed(2)}
                        </span>
                      </div>
                      {paymentSummary.isAdvance && (
                        <div className="mt-2 p-2 bg-green-100 rounded">
                          <p className="text-xs text-green-800 font-medium">
                            ✓ Overpayment of ₹{paymentSummary.advanceAmount.toFixed(2)} will be recorded as advance
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMode: mode.value })
                    }
                    className={`flex items-center justify-center space-x-2 px-4 py-3 border rounded-lg transition-all ${formData.paymentMode === mode.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    <mode.icon className="w-5 h-5" />
                    <span className="font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Add any notes about this payment..."
              />
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.amount}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
