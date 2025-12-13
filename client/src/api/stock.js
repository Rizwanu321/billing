// api/stock.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const fetchStockAnalytics = async () => {
  try {
    const response = await axios.get(`${API_URL}/stock/analytics`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock analytics:", error);
    throw error;
  }
};

// Fetch stock movements with filters
export const fetchStockMovements = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/stock/movements`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    throw error;
  }
};

// Export stock movements
export const exportStockMovements = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/stock/movements/export`, {
      params,
      headers: getHeaders(),
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting stock movements:", error);
    throw error;
  }
};

// Fetch stock alerts
export const fetchStockAlerts = async () => {
  try {
    const response = await axios.get(`${API_URL}/stock/alerts`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    throw error;
  }
};

// Fetch alert settings
export const fetchAlertSettings = async () => {
  try {
    const response = await axios.get(`${API_URL}/stock/alerts/settings`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching alert settings:", error);
    throw error;
  }
};

// Update alert settings
export const updateAlertSettings = async (settings) => {
  try {
    const response = await axios.put(
      `${API_URL}/stock/alerts/settings`,
      settings,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating alert settings:", error);
    throw error;
  }
};

// Fetch stock report data
export const fetchStockReportData = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/stock/reports/data`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching report data:", error);
    throw error;
  }
};

// Generate stock report
export const generateStockReport = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/stock/reports/generate`, {
      params,
      headers: getHeaders(),
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};

// Batch stock adjustment
export const batchStockAdjustment = async (data) => {
  try {
    const response = await axios.post(
      `${API_URL}/stock/batch-adjustment`,
      data,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in batch adjustment:", error);
    throw new Error(
      error.response?.data?.message || "Failed to process batch adjustment"
    );
  }
};
