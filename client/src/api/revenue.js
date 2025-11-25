// client/src/api/revenue.js
import axios from "axios";
import api from "../utils/api";

const API_URL = process.env.REACT_APP_API_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Get revenue summary
const buildQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(typeof value === "number" && Number.isNaN(value))
    ) {
      queryParams.append(key, value);
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const fetchRevenueSummary = async (params = {}) => {
  try {
    const response = await api.get(
      `/revenue/summary${buildQueryString({
        startDate: params.startDate,
        endDate: params.endDate,
        revenueType: params.revenueType,
        period: params.period,
      })}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue summary:", error);
    throw error;
  }
};

// Get payment collections summary
export const fetchPaymentsSummary = async (params = {}) => {
  try {
    const response = await api.get(
      `/revenue/payments-summary${buildQueryString({
        startDate: params.startDate,
        endDate: params.endDate,
        period: params.period,
      })}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching payments summary:", error);
    throw error;
  }
};

// Get revenue transactions
export const fetchRevenueTransactions = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/transactions`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue transactions:", error);
    throw error;
  }
};

// Get revenue by category
export const fetchRevenueByCategory = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/by-category`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching category revenue:", error);
    throw error;
  }
};

// Get revenue analytics
export const fetchRevenueAnalytics = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/analytics`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    throw error;
  }
};

// Get revenue comparison
export const fetchRevenueComparison = async (params) => {
  try {
    const response = await api.get("/revenue/comparison", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue comparison:", error);
    throw error;
  }
};

// Generate revenue PDF
export const generateRevenuePDF = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/revenue/generate-pdf`, data, {
      headers: getHeaders(),
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Export revenue as CSV
export const exportRevenueCSV = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/revenue/export-csv`, data, {
      headers: getHeaders(),
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting CSV:", error);
    throw error;
  }
};

// Get revenue trends
export const fetchRevenueTrends = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/trends`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    throw error;
  }
};

// Get revenue by products
export const fetchRevenueByProducts = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/by-products`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching product revenue:", error);
    throw error;
  }
};

// Get product comparison
export const fetchProductComparison = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/revenue/products/comparison`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching product comparison:", error);
    throw error;
  }
};
