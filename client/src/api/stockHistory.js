// api/stockHistory.js
import api from "../utils/api";

export const fetchStockHistory = async (productId, params = {}) => {
  try {
    const response = await api.get(`/stock-history/product/${productId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock history:", error);
    throw error;
  }
};

export const fetchStockHistorySummary = async (productId) => {
  try {
    const response = await api.get(
      `/stock-history/product/${productId}/summary`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching stock history summary:", error);
    throw error;
  }
};
