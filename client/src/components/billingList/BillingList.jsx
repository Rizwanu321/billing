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
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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

        <div
          className="mt-6 h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] overflow-y-auto rounded-lg"
          onScroll={handleScroll}
        >
          <div className="space-y-3 sm:space-y-4">
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
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* No More Data */}
            {!loading && !hasMore && invoices.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No more invoices to load</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && invoices.length === 0 && (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No invoices found
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first invoice to get started
                </p>
                <button
                  onClick={() => navigate("/invoices")}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
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
    </div>
  );
};

export default BillingList;
