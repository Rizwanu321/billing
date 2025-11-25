import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createCustomer = async (customerData) => {
  try {
    const response = await axios.post(`${API_URL}/customers`, customerData, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const fetchCustomers = async (searchTerm = "") => {
  try {
    const response = await axios.get(`${API_URL}/customers`, {
      params: { search: searchTerm },
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

export const fetchCustomerById = async (customerId) => {
  try {
    const response = await axios.get(`${API_URL}/customers/${customerId}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw error;
  }
};

export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await axios.put(
      `${API_URL}/customers/${customerId}`,
      customerData,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    const response = await axios.delete(`${API_URL}/customers/${customerId}`, {
      headers: getHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

// Add these functions to api/customers.js

export const fetchCustomerTransactions = async (customerId) => {
  try {
    const response = await axios.get(
      `${API_URL}/customers/${customerId}/transactions`,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
    throw error;
  }
};

export const addCustomerPayment = async (customerId, paymentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/customers/${customerId}/payments`,
      paymentData,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding customer payment:", error);
    throw error;
  }
};
export const addCustomerPurchase = async (customerId, purchaseData) => {
  try {
    const response = await axios.post(
      `${API_URL}/customers/${customerId}/purchases`,
      purchaseData,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding customer purchase:", error);
    throw error;
  }
};
