import api from "../utils/api";

export const fetchSettings = async () => {
  try {
    const response = await api.get("/settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching settings", error);
    throw error;
  }
};

export const updateSettings = async (settingsData) => {
  try {
    const response = await api.post("/settings", settingsData);
    return response.data;
  } catch (error) {
    console.error("Error updating settings", error);
    throw error;
  }
};
