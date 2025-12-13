// api/ai.js - AI Features API
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Get auth header
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get sales predictions
export const getSalesPredictions = async (period = "week") => {
    const response = await axios.get(`${API_URL}/ai/sales-predictions`, {
        params: { period },
        headers: getAuthHeader(),
    });
    return response.data;
};

// Get customer insights
export const getCustomerInsights = async () => {
    const response = await axios.get(`${API_URL}/ai/customer-insights`, {
        headers: getAuthHeader(),
    });
    return response.data;
};

// Send natural language query
export const sendAIQuery = async (query) => {
    const response = await axios.post(
        `${API_URL}/ai/query`,
        { query },
        { headers: getAuthHeader() }
    );
    return response.data;
};
