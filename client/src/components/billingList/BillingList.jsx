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
  Filter,
  Plus,
  Eye,
} from "lucide-react";
import { fetchInvoices, generatePDF } from "../../api/invoices";
import { toast } from "react-toastify";
import { format } from "date-fns";
import InvoiceModal from "./InvoiceModal";
import BillingListHeader from "./BillingListHeader";
import BillingListItem from "./BillingListItem";

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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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

  const downloadPdfFile = (pdfBlob, filename) => {
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = async (invoice) => {
    try {
      const pdfBlob = await generatePDF(invoice._id);
      downloadPdfFile(pdfBlob, `invoice-${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Unable to download invoice PDF");
    }
  };

  const getShareText = (invoice) => {
    const amount = invoice.total?.toFixed(2) || invoice.total;
    return `Invoice ${invoice.invoiceNumber} for ${invoice.customer?.name || "customer"}.
Amount: ₹${amount}
Date: ${new Date(invoice.date).toLocaleDateString()}

Thank you for your business!`;
  };

  const shareInvoice = async (invoice, channel) => {
    try {
      const pdfBlob = await generatePDF(invoice._id);
      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      const file = new File([pdfBlob], filename, { type: "application/pdf" });
      const shareData = {
        files: [file],
        title: `Invoice ${invoice.invoiceNumber}`,
        text: getShareText(invoice),
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share(shareData);
        toast.success("Invoice shared successfully");
        return;
      }

      // Fallbacks for desktop browsers
      downloadPdfFile(pdfBlob, filename);

      if (channel === "email") {
        const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
        const body = encodeURIComponent(
          `${getShareText(
            invoice
          )}\n\nInvoice PDF downloaded automatically. Please attach it to this email.`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      } else {
        const message = encodeURIComponent(
          `${getShareText(
            invoice
          )}\n\nInvoice PDF downloaded separately for attachment.`
        );
        window.open(`https://wa.me/?text=${message}`, "_blank");
      }
    } catch (error) {
      console.error("Error sharing invoice:", error);
      toast.error("Unable to share invoice");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-50/50 flex flex-col">
      <div className="flex-none px-4 sm:px-6 lg:px-8 py-6">
        <BillingListHeader
          navigate={navigate}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          isDateDropdownOpen={isDateDropdownOpen}
          setIsDateDropdownOpen={setIsDateDropdownOpen}
          isSortDropdownOpen={isSortDropdownOpen}
          setIsSortDropdownOpen={setIsSortDropdownOpen}
          formatDateForAPI={formatDateForAPI}
          formatDateForDisplay={formatDateForDisplay}
          isMobileFilterOpen={isMobileFilterOpen}
          setIsMobileFilterOpen={setIsMobileFilterOpen}
        />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-6 custom-scrollbar"
        onScroll={handleScroll}
      >
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <BillingListItem
              key={invoice._id}
              invoice={invoice}
              onView={() => setSelectedInvoice(invoice)}
              onDownload={() => handlePrint(invoice)}
              onPrint={() => handlePrint(invoice)}
              onShareEmail={() => shareInvoice(invoice, "email")}
              onShareWhatsApp={() => shareInvoice(invoice, "whatsapp")}
            />
          ))}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* No More Data */}
          {!loading && !hasMore && invoices.length > 0 && (
            <div className="text-center py-8">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">End of List</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && invoices.length === 0 && (
            <div className="h-96 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                No invoices found
              </h3>
              <p className="text-slate-500 mb-6 max-w-xs mx-auto">
                No invoices match your current search or filters. Create a new one to get started.
              </p>
              <button
                onClick={() => navigate("/invoices")}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice
              </button>
            </div>
          )}
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
