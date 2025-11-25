import {
  fetchProducts,
  createInvoice,
  updateInvoice,
  generatePDF,
} from "../../api/invoices";
import { fetchCustomers, fetchCustomerById } from "../../api/customers";
import { fetchSettings } from "../../api/settings";

export const fetchInitialData = async () => {
  return Promise.all([fetchProducts(), fetchCustomers(), fetchSettings()]);
};

export const handleErrorUtil = (error, setError, navigate) => {
  const errorMessage =
    error.response?.data?.message ||
    error.message ||
    "An unexpected error occurred";

  setError(errorMessage);

  if (error.response?.status === 401) {
    navigate("/login");
  }
};

export const saveInvoiceUtil = async (
  invoice,
  selectedCustomer,
  toast,
  navigate
) => {
  const isExistingInvoice = Boolean(invoice._id);
  const invoiceData = {
    ...invoice,
    status: "final",
    customer: {
      _id: selectedCustomer?._id || invoice.customer._id,
      name: selectedCustomer?.name || invoice.customer.name,
    },
  };

  const savedInvoice = isExistingInvoice
    ? await updateInvoice(invoice._id, invoiceData)
    : await createInvoice(invoiceData);

  // Transform the populated invoice back to use product IDs
  // This ensures consistency with the local state structure
  const transformedInvoice = {
    ...savedInvoice,
    items: savedInvoice.items.map((item) => ({
      ...item,
      product: item.product._id || item.product, // Extract ID from populated product
    })),
  };

  toast.success(
    isExistingInvoice
      ? "Invoice updated successfully!"
      : "Invoice saved successfully!"
  );
  return transformedInvoice;
};

export const printInvoiceUtil = async (invoice, toast) => {
  if (invoice._id && invoice.status === "final") {
    try {
      const pdfBlob = await generatePDF(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoice._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  }
};

export const validateInvoiceUtil = (invoice, toast) => {
  if (invoice.items.length === 0) {
    toast.error("Please add at least one item");
    return false;
  }

  const invalidItems = invoice.items.some(
    (item) => !item.product || item.quantity <= 0
  );

  if (invalidItems) {
    toast.error("Please complete all item details");
    return false;
  }

  return true;
};

export const calculateInvoiceTotals = (items, taxSettings) => {
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

export const fetchCustomerDetailsUtil = async (customerId, customers) => {
  try {
    // First, try to find customer in the existing list
    const customerFromList = customers.find((c) => c._id === customerId);

    if (customerFromList) {
      // If full details are needed, you might want to fetch from API
      const fullCustomerDetails = await fetchCustomerById(customerId);
      return fullCustomerDetails;
    }

    return null;
  } catch (error) {
    console.error("Error fetching customer details", error);
    return null;
  }
};
