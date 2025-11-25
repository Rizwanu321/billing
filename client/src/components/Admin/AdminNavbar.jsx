import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Bell, User, LogOut } from "lucide-react";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuItemClick = (action) => {
    setIsDropdownOpen(false);
    if (action === "logout") {
      logout();
    }
    // Add other actions as needed
  };

  return (
    <div className="h-16 bg-white border-b px-6 flex items-center justify-between">
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Search..."
          className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span>{user?.name}</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                onClick={() => handleMenuItemClick("profile")}
              >
                Profile
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                onClick={() => handleMenuItemClick("settings")}
              >
                Settings
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600"
                onClick={() => handleMenuItemClick("logout")}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
