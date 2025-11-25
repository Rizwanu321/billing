import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Printer,
  Search,
  ChevronDown,
  Calendar,
  X,
} from "lucide-react";
import { fetchInvoices, generatePDF } from "../api/invoices";
import { format } from "date-fns";

const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;
  console.log(invoice.customer);

  // Safely access nested properties with optional chaining and default values
  const customerName = invoice?.customer?.name || "N/A";
  const customerPhone = invoice?.customer?.phone || "N/A";
  const invoiceNumber = invoice?.invoiceNumber || "N/A";
  const invoiceDate = invoice?.date
    ? new Date(invoice.date).toLocaleDateString()
    : "N/A";
  const total =
    typeof invoice?.total === "number" ? invoice.total.toFixed(2) : "0.00";

  // Properly handle items array with type checking and product details
  const items = Array.isArray(invoice?.items)
    ? invoice.items.map((item) => ({
        name: item.product?.name || "Unknown Product",
        quantity: item.quantity || 0,
        price: item.price || 0,
        amount: item.quantity * item.price || 0,
      }))
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invoice Details</h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 p-1 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg">Customer Information</h3>
            <p className="text-gray-600">{customerName}</p>
            <p className="text-gray-600">{customerPhone}</p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg">Invoice Details</h3>
            <p className="text-gray-600">Invoice #{invoiceNumber}</p>
            <p className="text-gray-600">Date: {invoiceDate}</p>
            <p className="font-medium text-lg">Total: ₹{total}</p>
          </div>

          {items.length > 0 && (
            <div>
              <h3 className="font-medium text-lg mb-2">Items</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 bg-gray-100 p-2 rounded font-medium">
                  <span>Item Name</span>
                  <span>Quantity</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Amount</span>
                </div>
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-4 p-2 rounded hover:bg-gray-50"
                  >
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                    <span className="text-right">
                      ₹{(item.price || 0).toFixed(2)}
                    </span>
                    <span className="text-right">
                      ₹{(item.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-4 p-2 font-medium border-t">
                  <span className="col-span-3 text-right">Total:</span>
                  <span className="text-right">₹{total}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => invoice?._id && generatePDF(invoice._id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BillingList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const itemsPerPage = 10;

  const formatDateForAPI = (date) => {
    return date ? format(date, "yyyy-MM-dd") : null;
  };

  const formatDateForDisplay = (date) => {
    return date ? format(date, "MMM dd, yyyy") : "";
  };

  const loadInvoices = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;

      let dateParams = {};
      if (dateFilter === "custom" && fromDate && toDate) {
        dateParams = {
          fromDate: formatDateForAPI(fromDate),
          toDate: formatDateForAPI(toDate),
        };
      } else {
        dateParams = { dateFilter };
      }

      const response = await fetchInvoices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...dateParams,
        sortBy,
        sortOrder,
      });

      const invoiceData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setInvoices(reset ? invoiceData : [...invoices, ...invoiceData]);
      setHasMore(invoiceData.length === itemsPerPage);
      if (!reset) setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error loading invoices:", error);
      setInvoices(reset ? [] : invoices);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(true);
  }, [searchTerm, dateFilter, fromDate, toDate, sortBy, sortOrder]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      loadInvoices();
    }
  };

  const getDateFilterLabel = (filter) => {
    if (filter === "custom" && fromDate && toDate) {
      return `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(
        toDate
      )}`;
    }

    switch (filter) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return "All Time";
    }
  };

  const handleDateSelect = (filter) => {
    setDateFilter(filter);
    setFromDate(null);
    setToDate(null);
    setIsDateDropdownOpen(false);
  };

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        // Swap dates if start date is after end date
        setFromDate(endDate);
        setToDate(startDate);
      } else {
        setFromDate(startDate);
        setToDate(endDate);
      }
      setDateFilter("custom");
    } else {
      setFromDate(startDate);
      setToDate(endDate);
    }
  };

  const handlePrint = async (invoice) => {
    try {
      const pdfBlob = await generatePDF(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">All Billings</h1>
          <button
            onClick={() => navigate("/invoices/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Bill
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="px-4 py-2 border rounded-md inline-flex items-center space-x-2 hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span>{getDateFilterLabel(dateFilter)}</span>
            </button>
            {isDateDropdownOpen && (
              <div className="absolute top-full mt-1 w-[240px] bg-white border rounded-md shadow-lg z-10">
                {["all", "today", "yesterday", "week", "month"].map(
                  (filter) => (
                    <button
                      key={filter}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      onClick={() => handleDateSelect(filter)}
                    >
                      {getDateFilterLabel(filter)}
                    </button>
                  )
                )}
                <div className="p-2 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate ? formatDateForAPI(fromDate) : ""}
                    onChange={(e) =>
                      handleDateRangeChange(e.target.valueAsDate, toDate)
                    }
                    className="w-full mb-2 p-2 border rounded"
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate ? formatDateForAPI(toDate) : ""}
                    onChange={(e) =>
                      handleDateRangeChange(fromDate, e.target.valueAsDate)
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="px-4 py-2 border rounded-md inline-flex items-center space-x-2 hover:bg-gray-50"
            >
              <span>{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
            </button>
            {isSortDropdownOpen && (
              <div className="absolute top-full mt-1 w-[180px] bg-white border rounded-md shadow-lg z-10">
                {[
                  { value: "date", label: "Date" },
                  { value: "customerName", label: "Customer Name" },
                  { value: "total", label: "Amount" },
                ].map((option) => (
                  <button
                    key={option.value}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="p-2 border rounded-md hover:bg-gray-50"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            <ChevronDown
              className={`w-4 h-4 transform ${
                sortOrder === "asc" ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div
          className="h-[calc(100vh-250px)] overflow-y-auto"
          onScroll={handleScroll}
        >
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice._id}
                className="p-4 border rounded-lg shadow-sm bg-white"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {invoice.customer?.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm">
                      Invoice #{invoice.invoiceNumber}
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    ₹{invoice.total.toFixed(2)}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 border rounded-md hover:bg-gray-50 inline-flex items-center space-x-2"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <FileText className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      className="px-3 py-1 border rounded-md hover:bg-gray-50 inline-flex items-center space-x-2"
                      onClick={() => handlePrint(invoice)}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      className="px-3 py-1 border rounded-md hover:bg-gray-50 inline-flex items-center space-x-2"
                      onClick={() => handlePrint(invoice)}
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {loading && <div className="text-center py-4">Loading...</div>}
            {!loading && !hasMore && invoices.length > 0 && (
              <div className="text-center py-4 text-gray-500">
                No more invoices to load
              </div>
            )}
            {!loading && invoices.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No invoices found
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default BillingList;
