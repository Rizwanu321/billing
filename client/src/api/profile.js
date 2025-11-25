// client/src/api/profile.js
import api from "../utils/api";

export const updateProfile = async (profileData) => {
  try {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await api.put("/users/change-password", passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadProfilePicture = async (formData) => {
  try {
    const response = await api.post("/users/profile-picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
