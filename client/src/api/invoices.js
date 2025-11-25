import api from "../utils/api";

// api/invoices.js

export const fetchInvoices = async (params) => {
  try {
    // Convert dates to ISO strings if they exist
    const queryParams = {
      ...params,
      fromDate: params.fromDate
        ? new Date(params.fromDate).toISOString()
        : undefined,
      toDate: params.toDate ? new Date(params.toDate).toISOString() : undefined,
    };

    const response = await api.get("/invoices", {
      params: queryParams,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const createInvoice = async (invoiceData) => {
  const response = await api.post("/invoices", invoiceData);
  return response.data;
};

export const updateInvoice = async (invoiceId, invoiceData) => {
  const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
  return response.data;
};

export const generatePDF = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

export const fetchProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};
