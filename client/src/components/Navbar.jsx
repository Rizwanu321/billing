import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Search,
  LogOut,
  Settings,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = ({ onMenuClick, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
    } else if (action === "profile") {
      navigate("/profile");
    } else if (action === "settings") {
      navigate("/settings");
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Menu button and Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors lg:hidden flex-shrink-0"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo for mobile */}
            <div className="lg:hidden min-w-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent truncate">
                BillTrack Pro
              </h1>
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {notifications}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 sm:gap-3 hover:bg-gray-100 rounded-lg px-2 sm:px-3 py-2 transition-all duration-200"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">
                    {user?.role}
                  </p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 border border-gray-200 divide-y divide-gray-100">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700 text-sm transition-colors"
                      onClick={() => handleMenuItemClick("profile")}
                    >
                      <UserCircle className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                      <span>{t('navbar.viewProfile')}</span>
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-gray-700 text-sm transition-colors"
                      onClick={() => handleMenuItemClick("settings")}
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                      <span>{t('navbar.settingsPreferences')}</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center text-red-600 text-sm transition-colors"
                      onClick={() => handleMenuItemClick("logout")}
                    >
                      <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                      <span>{t('navbar.signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
