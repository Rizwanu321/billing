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
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  Info,
  Clock,
  Search,
  CreditCard,
  TrendingUp
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
  const [searchTerm, setSearchTerm] = useState("");

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
    // Apply filters which now includes search
    let filtered = [...transactions];

    if (transactionFilter !== "all") {
      filtered = filtered.filter((t) => t.type === transactionFilter);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.description && t.description.toLowerCase().includes(lowerSearch)) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(lowerSearch)) ||
        (t.amount.toString().includes(lowerSearch))
      );
    }

    setFilteredTransactions(filtered);
  }, [transactionFilter, transactions, searchTerm]);

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
        return <ArrowUp className="w-5 h-5 text-red-500" />;
      case "payment":
        return <ArrowDown className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "purchase":
        return "bg-red-50 border-red-100 text-red-700";
      case "payment":
        return "bg-green-50 border-green-100 text-green-700";
      default:
        return "bg-blue-50 border-blue-100 text-blue-700";
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

  const TransactionSkeleton = () => (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="h-20 bg-gray-100 rounded-2xl animate-pulse mb-8"></div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
      </div>

      {/* List Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4 py-4 border-b border-gray-50 last:border-0">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse"></div>
            </div>
            <div className="w-20 h-8 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          <TransactionSkeleton />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Customer Not Found</h3>
          <p className="text-gray-500 mb-6">The customer you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => navigate("/customers/list")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Glassmorphism Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/customers/list")}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:-translate-x-1"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {customer.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {customer.phoneNumber}
                  </span>
                  {customer.place && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {customer.place}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="hidden sm:flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
            >
              <Plus size={18} />
              <span>New Payment</span>
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="sm:hidden p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 active:bg-blue-700"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center space-x-3 text-green-700 shadow-sm animate-fade-in-down">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* Customer Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card - Dynamic Gradient */}
          <div className={`col-span-1 lg:col-span-2 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden group transition-all duration-300 ${customer.amountDue > 0
            ? "bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200"
            : customer.amountDue < 0
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200"
              : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200"
            }`}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
              <Wallet className="h-32 w-32 sm:h-48 sm:w-48 text-white" strokeWidth={1.5} />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full text-white">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-white/80 font-medium text-lg mb-1">Current Balance</p>
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    ₹{Math.abs(customer.amountDue).toFixed(2)}
                  </h2>
                  <div className="mt-3 inline-flex items-center">
                    {customer.amountDue > 0 ? (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20 flex items-center gap-2 shadow-sm">
                        <AlertCircle size={14} /> Customer Owes You
                      </span>
                    ) : customer.amountDue < 0 ? (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20 flex items-center gap-2 shadow-sm">
                        <CheckCircle size={14} /> Advance Balance
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20 flex items-center gap-2 shadow-sm">
                        <CheckCircle size={14} /> All Settled
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <TrendingUp size={32} className="text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="p-4 bg-black/10 backdrop-blur-sm rounded-2xl border border-white/5 hover:bg-black/20 transition-colors">
                  <p className="text-white/70 text-sm mb-1">Total Purchases</p>
                  <p className="text-xl font-bold flex items-center gap-2">
                    <ArrowUp size={16} className="text-white/60" />
                    ₹{customer.totalPurchases?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-4 bg-black/10 backdrop-blur-sm rounded-2xl border border-white/5 hover:bg-black/20 transition-colors">
                  <p className="text-white/70 text-sm mb-1">Total Payments</p>
                  <p className="text-xl font-bold flex items-center gap-2">
                    <ArrowDown size={16} className="text-white/60" />
                    ₹{customer.totalPayments?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions / Stats Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white/90 mb-1">Account details</h3>
              <p className="text-slate-400 text-sm">Contact & Location</p>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone size={18} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Phone Number</p>
                  <p className="font-semibold text-white tracking-wide">{customer.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group hover:bg-white/5 p-3 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <MapPin size={18} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Location</p>
                  <p className="font-semibold text-white">{customer.place || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Controls Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-900">History</h3>
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTransactionFilter("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${transactionFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTransactionFilter("purchase")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${transactionFilter === "purchase" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Purchases
                </button>
                <button
                  onClick={() => setTransactionFilter("payment")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${transactionFilter === "payment" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Payments
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative group flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-gray-50 border-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              {transactions.length > 0 && (
                <button
                  onClick={exportTransactions}
                  className="flex items-center justify-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                  title="Export CSV"
                >
                  <Download size={18} />
                </button>
              )}
            </div>

            {/* Mobile Filter Tabs */}
            <div className="flex sm:hidden overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:pb-0 gap-2 no-scrollbar">
              {['all', 'purchase', 'payment'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTransactionFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${transactionFilter === f
                    ? "bg-slate-900 text-white"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table / List */}
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-10 h-10 text-gray-300" />
              </div>
              <h4 className="text-gray-900 font-medium mb-1">No transactions found</h4>
              <p className="text-gray-500 text-sm">
                {searchTerm ? "Try different search terms" : "This customer hasn't made any transactions yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date & Time</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Description</th>
                      <th className="px-6 py-4 font-semibold text-center">Reference</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((transaction) => {
                      const txColor = getTransactionColor(transaction.type);
                      return (
                        <tr
                          key={transaction._id}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{new Date(transaction.date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${txColor.replace('text-', 'border-').split(' ')[1]} ${txColor}`}>
                              {transaction.type.replace("_", " ")}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                            {getTransactionDescription(transaction)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {transaction.invoiceId ? (
                              <button
                                onClick={() => handleViewInvoice(transaction.invoiceId._id || transaction.invoiceId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold"
                              >
                                <FileText size={12} />
                                {transaction.invoiceNumber}
                              </button>
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${transaction.type === 'purchase' || transaction.type === 'credit_added' ? 'text-red-500' : 'text-green-600'
                            }`}>
                            {transaction.type === 'purchase' || transaction.type === 'credit_added' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-semibold ${transaction.balanceAfter > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                              {transaction.balanceAfter < 0 && '-'}₹{Math.abs(transaction.balanceAfter || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet List View */}
              <div className="lg:hidden">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction._id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${transaction.type === 'purchase' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize text-sm">{transaction.type.replace("_", " ")}</p>
                          <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className={`font-bold text-base ${transaction.type === 'purchase' || transaction.type === 'credit_added' ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {transaction.type === 'purchase' || transaction.type === 'credit_added' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="pl-[3.25rem]">
                      <p className="text-sm text-gray-600 mb-2">{getTransactionDescription(transaction)}</p>
                      <div className="flex items-center justify-between text-xs">
                        {transaction.invoiceId ? (
                          <button
                            onClick={() => handleViewInvoice(transaction.invoiceId._id || transaction.invoiceId)}
                            className="flex items-center gap-1 text-blue-600 font-medium"
                          >
                            <FileText size={12} /> Invoice #{transaction.invoiceNumber}
                          </button>
                        ) : <span></span>}

                        <span className="text-gray-500">
                          Bal: <span className={transaction.balanceAfter > 0 ? "font-semibold text-gray-900" : "font-semibold text-green-600"}>
                            {transaction.balanceAfter < 0 && '-'}₹{Math.abs(transaction.balanceAfter || 0).toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
