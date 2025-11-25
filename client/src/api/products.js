// api/products.js
import api from "../utils/api";

export const fetchProducts = async () => {
  try {
    const response = await api.get("/products");
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await api.post("/products", productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProductStock = async (id, adjustment, reason = "") => {
  try {
    const numericAdjustment = Number(adjustment);

    if (isNaN(numericAdjustment)) {
      throw new Error("Invalid adjustment value");
    }

    const response = await api.post(`/products/${id}/stock`, {
      adjustment: numericAdjustment,
      reason: reason,
    });

    return response.data;
  } catch (error) {
    console.error("Stock Adjustment API Error:", error);
    throw new Error(error.response?.data?.message || "Failed to adjust stock");
  }
};
