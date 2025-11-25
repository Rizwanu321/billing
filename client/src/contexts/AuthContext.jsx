// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, getProfile } from "../api/auth";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        setInitializing(false);
        return;
      }

      // Verify token is valid by fetching user profile
      await loadUser();
    } catch (error) {
      console.error("Auth initialization error:", error);
      // Clear invalid token
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await getProfile();
      console.log("Loaded user data:", userData); // Debug log

      // Ensure all fields are properly set
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || "",
        location: userData.location || "",
        profilePicture: userData.profilePicture || "",
        role: userData.role,
        canLogin: userData.canLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });

      return userData;
    } catch (error) {
      console.error("Load user error:", error);
      // Only remove token if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setUser(null);
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);

      // Set user with all fields
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        location: data.user.location || "",
        profilePicture: data.user.profilePicture || "",
        role: data.user.role,
        canLogin: data.user.canLogin,
        createdAt: data.user.createdAt,
        updatedAt: data.user.updatedAt,
      });

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  // Show loading screen during initial auth check
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-4 border-gray-200 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>
          <p className="mt-4 text-sm md:text-base text-gray-600 font-medium">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
