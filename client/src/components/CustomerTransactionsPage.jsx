// client/src/components/CustomerTransactionsPage.jsx - ENHANCED VERSION
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowDown,
  ArrowUp,
  FileText,
  Phone,
  MapPin,
  Home,
  ArrowLeft,
  X,
  Calendar,
  Receipt,
  Wallet,
  CreditCard,
  TrendingUp,
  IndianRupee,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  Info,
} from "lucide-react";
import {
  fetchCustomerById,
  fetchCustomerTransactions,
  addCustomerPayment,
} from "../api/customers";
import InvoiceDetailModal from "./InvoiceDetailModal";
import PaymentModal from "./PaymentModal";

const CustomerTransactionsPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const { customer, transactions } = await fetchCustomerTransactions(
        customerId
      );
      setCustomer(customer);
      setTransactions(transactions);
      setFilteredTransactions(transactions);
      setError("");
    } catch (error) {
      setError("Error loading customer data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  useEffect(() => {
    // Apply filters
    let filtered = [...transactions];

    if (transactionFilter !== "all") {
      filtered = filtered.filter((t) => t.type === transactionFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactionFilter, transactions]);

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const response = await addCustomerPayment(customerId, paymentData);
      setShowPaymentModal(false);
      setSuccessMessage(response.message || "Payment successful!");
      loadCustomerData();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      throw error;
    }
  };

  const handleViewInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceModal(true);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "purchase":
        return <ArrowUp className="w-4 h-4 text-red-500" />;
      case "payment":
        return <ArrowDown className="w-4 h-4 text-green-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "purchase":
        return "bg-red-50";
      case "payment":
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };

  // Simplified transaction description
  const getTransactionDescription = (transaction) => {
    if (transaction.description) return transaction.description;

    switch (transaction.type) {
      case "purchase":
        return `Purchase via invoice ${transaction.invoiceNumber || ""}`;
      case "payment":
        return `Payment received`;
      default:
        return transaction.type.replace("_", " ");
    }
  };

  // Export transactions to CSV
  const exportTransactions = () => {
    const headers = [
      "Date",
      "Type",
      "Description",
      "Amount",
      "Balance",
    ];
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type.replace("_", " "),
      getTransactionDescription(t),
      t.amount.toFixed(2),
      (t.balanceAfter || 0).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customer.name}-transactions.csv`;
    a.click();
  };

  // No need for net balance calculation - amountDue is already the net amount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Customer not found</p>
          <button
            onClick={() => navigate("/customers/list")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/customers/list")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {customer.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Customer Details & Transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-6 max-w-7xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
            <CheckCircle
              className="text-green-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-600 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Customer Info Card - ENHANCED */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white truncate">
                      {customer.name}
                    </h2>
                    {customer.lastTransactionDate && (
                      <p className="text-blue-100 text-sm mt-1">
                        Last activity:{" "}
                        {new Date(
                          customer.lastTransactionDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center text-blue-50">
                    <Phone size={16} className="mr-3 flex-shrink-0" />
                    <span className="text-sm">{customer.phoneNumber}</span>
                  </div>
                  <div className="flex items-start text-blue-50">
                    <Home size={16} className="mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{customer.address}</span>
                  </div>
                  <div className="flex items-center text-blue-50">
                    <MapPin size={16} className="mr-3 flex-shrink-0" />
                    <span className="text-sm">{customer.place}</span>
                  </div>
                </div>
              </div>

              {/* Balance Card - SIMPLIFIED */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium mb-2">
                        {customer.amountDue > 0 ? "Amount Due" : customer.amountDue < 0 ? "Advance Balance" : "Balance"}
                      </p>
                      <p
                        className={`text-3xl sm:text-4xl font-bold ${customer.amountDue > 0
                          ? "text-red-600"
                          : customer.amountDue < 0
                            ? "text-green-600"
                            : "text-gray-900"
                          }`}
                      >
                        {customer.amountDue < 0 ? "-" : ""}₹{Math.abs(customer.amountDue).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {customer.amountDue > 0
                          ? "Customer owes you"
                          : customer.amountDue < 0
                            ? "Advance payment (you owe customer)"
                            : "All settled"}
                      </p>
                      <div className="flex gap-4 mt-3 text-xs text-gray-600">
                        {customer.totalPurchases > 0 && (
                          <span>Purchases: ₹{customer.totalPurchases.toFixed(2)}</span>
                        )}
                        {customer.totalPayments > 0 && (
                          <span>Payments: ₹{customer.totalPayments.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-full ${customer.amountDue > 0
                        ? "bg-red-100"
                        : customer.amountDue < 0
                          ? "bg-green-100"
                          : "bg-gray-100"
                        }`}
                    >
                      {customer.amountDue > 0 ? (
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      ) : customer.amountDue < 0 ? (
                        <Wallet className="w-8 h-8 text-green-600" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-white text-blue-600 px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-50 transition-colors font-medium shadow-md"
              >
                <Plus size={18} />
                <span>Add Payment</span>
              </button>
            </div>
          </div>

          {/* Simplified Balance Info */}
          <div className="bg-blue-50 px-6 py-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Simple Balance System</p>
              <p className="mt-1">
                Positive balance = Customer owes you | Negative balance = Advance payment | Zero = All settled
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <X className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Transactions Section - ENHANCED */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Transaction History
                </h3>
                <p className="text-sm text-gray-500">
                  {filteredTransactions.length} of {transactions.length}{" "}
                  transaction
                  {transactions.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Filter and Export Options */}
              <div className="flex gap-3">
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="purchase">Purchases</option>
                  <option value="payment">Payments</option>
                </select>

                {transactions.length > 0 && (
                  <button
                    onClick={exportTransactions}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Receipt className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {transactionFilter === "all"
                  ? "No transactions yet"
                  : `No ${transactionFilter.replace("_", " ")} transactions`}
              </h4>
              <p className="text-gray-500">
                {transactionFilter === "all"
                  ? "Transactions will appear here once created"
                  : "Try changing the filter to see other transactions"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - ENHANCED */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`p-1.5 rounded-full ${getTransactionColor(
                                transaction.type
                              )}`}
                            >
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {transaction.type.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 max-w-xs">
                            {getTransactionDescription(transaction)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {transaction.invoiceId ? (
                            <button
                              onClick={() =>
                                handleViewInvoice(
                                  transaction.invoiceId._id ||
                                  transaction.invoiceId
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1.5 group text-sm font-medium"
                            >
                              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span>{transaction.invoiceNumber}</span>
                            </button>
                          ) : transaction.paymentMode ? (
                            <span className="text-sm text-gray-600 capitalize">
                              {transaction.paymentMode}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold`}>
                          <span
                            className={
                              transaction.type === "purchase"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {transaction.type === "purchase" ? "+" : "-"}
                            ₹{transaction.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          <span
                            className={
                              transaction.balanceAfter > 0
                                ? "text-red-600"
                                : transaction.balanceAfter < 0
                                  ? "text-green-600"
                                  : "text-gray-900"
                            }
                          >
                            {transaction.balanceAfter < 0 ? "-" : ""}₹{Math.abs(transaction.balanceAfter || 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card View - ENHANCED */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${getTransactionColor(
                            transaction.type
                          )}`}
                        >
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {transaction.type.replace("_", " ")}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar size={12} className="mr-1" />
                            {new Date(transaction.date).toLocaleDateString()}
                            <span className="mx-1">•</span>
                            {new Date(transaction.date).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${transaction.type === "purchase"
                            ? "text-red-600"
                            : transaction.type === "payment"
                              ? "text-green-600"
                              : transaction.type === "credit_used"
                                ? "text-blue-600"
                                : "text-purple-600"
                            }`}
                        >
                          {transaction.type === "purchase" ||
                            transaction.type === "credit_added"
                            ? "+"
                            : "-"}
                          ₹{transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        {getTransactionDescription(transaction)}
                      </div>

                      {transaction.invoiceId && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Invoice</span>
                          <button
                            onClick={() =>
                              handleViewInvoice(
                                transaction.invoiceId._id ||
                                transaction.invoiceId
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1 text-sm font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{transaction.invoiceNumber}</span>
                          </button>
                        </div>
                      )}

                      {transaction.paymentMode && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Payment Mode
                          </span>
                          <span className="text-sm text-gray-600 capitalize">
                            {transaction.paymentMode}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Balance After</p>
                        <p
                          className={`font-bold ${(transaction.balanceAfter || 0) > 0
                            ? "text-red-600"
                            : (transaction.balanceAfter || 0) < 0
                              ? "text-green-600"
                              : "text-gray-900"
                            }`}
                        >
                          {(transaction.balanceAfter || 0) < 0 ? "-" : ""}₹{Math.abs(transaction.balanceAfter || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium text-gray-700">
                          {(transaction.balanceAfter || 0) > 0 ? "Due" : (transaction.balanceAfter || 0) < 0 ? "Advance" : "Settled"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Summary Statistics - NEW */}
          {transactions.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total Purchases</p>
                  <p className="text-lg font-semibold text-red-600">
                    ₹
                    {transactions
                      .filter((t) => t.type === "purchase")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Payments</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹
                    {transactions
                      .filter((t) => t.type === "payment")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Credit Used</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ₹
                    {transactions
                      .filter((t) => t.type === "credit_used")
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p
                    className={`text-lg font-semibold ${customer.amountDue > 0
                      ? "text-red-600"
                      : customer.amountDue < 0
                        ? "text-green-600"
                        : "text-gray-600"
                      }`}
                  >
                    {customer.amountDue < 0 ? "-" : ""}₹
                    {Math.abs(customer.amountDue).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {customer.amountDue > 0 ? "Due" : customer.amountDue < 0 ? "Advance" : "Settled"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        customer={customer}
        onPaymentSuccess={handlePaymentSubmit}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
};

export default CustomerTransactionsPage;
