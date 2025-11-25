// client/src/api/dashboard.js - UPDATED
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

// Main dashboard data fetch with period support
export const fetchDashboardData = async (params = {}) => {
  try {
    const { period = "month", startDate, endDate } = params;

    const queryParams = {
      period,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };

    console.log("Fetching dashboard with query:", queryParams);

    const response = await axios.get(`${API_URL}/dashboard`, {
      params: queryParams,
      headers: getHeaders(),
    });

    console.log("Dashboard API response:", response.data);

    // Return the data directly - backend already formats it correctly
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch dashboard data"
    );
  }
};

// Sales analytics with period support
export const fetchSalesAnalytics = async (params = {}) => {
  try {
    const { period = "month" } = params;
    const response = await axios.get(`${API_URL}/dashboard/sales-analytics`, {
      params: { period },
      headers: getHeaders(),
    });

    return (
      response.data || {
        comparisonData: {
          totalSales: 0,
          percentChange: 0,
          isPositive: true,
          orderPercentChange: 0,
          isOrderPositive: true,
        },
        periodSales: [],
        salesByCategory: [],
      }
    );
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    return {
      comparisonData: {
        totalSales: 0,
        percentChange: 0,
        isPositive: true,
        orderPercentChange: 0,
        isOrderPositive: true,
      },
      periodSales: [],
      salesByCategory: [],
    };
  }
};

// Customer statistics with period support
export const fetchCustomerStats = async (params = {}) => {
  try {
    const { period = "month" } = params;
    const response = await axios.get(`${API_URL}/customers/stats`, {
      params: { period },
      headers: getHeaders(),
    });

    return (
      response.data || {
        total: 0,
        percentChange: 0,
        isPositive: true,
      }
    );
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return {
      total: 0,
      percentChange: 0,
      isPositive: true,
    };
  }
};

// Stock alerts
export const fetchStockAlerts = async (threshold = 10) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/stock-alerts`, {
      params: { threshold },
      headers: getHeaders(),
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    return [];
  }
};

// Export dashboard data
export const exportDashboardData = async (format, period) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/export`, {
      params: { format, period },
      headers: getHeaders(),
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `dashboard-${period}-${Date.now()}.${format}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { success: true };
  } catch (error) {
    console.error("Error exporting dashboard data:", error);
    throw new Error(error.response?.data?.message || "Failed to export data");
  }
};

export default {
  fetchDashboardData,
  fetchSalesAnalytics,
  fetchCustomerStats,
  fetchStockAlerts,
  exportDashboardData,
};
