import React, { useState, useEffect } from "react";
import { X, IndianRupee, Calendar, CreditCard, Banknote, FileText, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("cash");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (invoice) {
            setAmount(invoice.dueAmount.toString());
            setDescription(`Payment for Invoice #${invoice.invoiceNumber}`);
        }
    }, [invoice]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (parseFloat(amount) > invoice.dueAmount) {
            // Optional: Warn if paying more than due? 
            // For now, let's allow it but maybe show a warning or just proceed (backend handles it)
            // Backend logic: "Any excess payment reduces the customer's total due"
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Use the customer payments endpoint with invoiceId
            const response = await axios.post(
                `http://localhost:5000/api/customers/${invoice.customer._id}/payments`,
                {
                    amount: parseFloat(amount),
                    paymentMode,
                    description,
                    invoiceId: invoice._id // Targeted payment
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                toast.success(
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">Payment Received!</p>
                        <p className="text-sm">Amount: ₹{parseFloat(amount).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">Invoice #{invoice.invoiceNumber} updated</p>
                    </div>,
                    { icon: "✅" }
                );
                onSuccess(response.data);
                onClose();
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error.response?.data?.message || "Failed to process payment");
        } finally {
            setLoading(false);
        }
    };

    if (!invoice) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <IndianRupee className="w-5 h-5" />
                                Receive Payment
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                Invoice #{invoice.invoiceNumber} • {invoice.customer?.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <span className="text-blue-100 text-sm">Invoice Due</span>
                            <span className="text-2xl font-bold">₹{invoice.dueAmount.toFixed(2)}</span>
                        </div>

                        {invoice.customer?.amountDue > 0 && invoice.customer.amountDue !== invoice.dueAmount && (
                            <div className="bg-blue-500/20 rounded-xl p-3 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-100 text-xs">Customer Total Due</span>
                                    <span className="text-lg font-semibold text-white">₹{invoice.customer.amountDue.toFixed(2)}</span>
                                </div>
                                <p className="text-blue-100 text-xs mt-1">You can pay more to reduce overall balance</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium transition-all"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        {parseFloat(amount) > invoice.dueAmount && (
                            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Overpayment will reduce customer's total outstanding balance
                            </p>
                        )}
                    </div>

                    {/* Payment Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMode("cash")}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${paymentMode === "cash"
                                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Banknote className="w-4 h-4" />
                                <span className="font-medium">Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMode("online")}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${paymentMode === "online"
                                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span className="font-medium">Online/UPI</span>
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Notes (Optional)
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="2"
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all resize-none"
                                placeholder="Add payment notes..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Confirm Payment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
