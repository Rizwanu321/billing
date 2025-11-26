import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BarChart2,
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  AlertTriangle,
  Home,
  LogOut,
  UserCircle,
  Activity,
  PieChart,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  collapsed,
  setCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
      single: true,
    },
    {
      icon: Package,
      label: "Products",
      id: "products",
      submenu: [
        { icon: Package, label: "All Products", path: "/products" },
        { icon: BarChart2, label: "Categories", path: "/categories" },
      ],
    },
    {
      icon: FileText,
      label: "Billing",
      id: "billing",
      submenu: [
        { icon: FileText, label: "New Billing", path: "/invoices" },
        { icon: BarChart2, label: "Billing List", path: "/billinglist" },
      ],
    },
    {
      icon: Package,
      label: "Stock Management",
      id: "stock",
      submenu: [
        {
          icon: BarChart2,
          label: "Stock Dashboard",
          path: "/stock/dashboard",
        },
        {
          icon: TrendingUp,
          label: "Stock Movements",
          path: "/stock/movements",
        },
        {
          icon: AlertTriangle,
          label: "Stock Alerts",
          path: "/stock/alerts",
        },
        {
          icon: FileText,
          label: "Stock Reports",
          path: "/stock/reports",
        },
        {
          icon: Settings,
          label: "Stock Adjustment",
          path: "/stock/adjustment",
        },
      ],
    },
    {
      icon: IndianRupee,
      label: "Sales & Revenue",
      id: "revenue",
      submenu: [
        {
          icon: BarChart2,
          label: "Revenue Dashboard",
          path: "/revenue/dashboard",
        },
        {
          icon: FileText,
          label: "Transactions",
          path: "/revenue/transactions",
        },
        {
          icon: ShoppingCart,
          label: "By Category",
          path: "/revenue/by-category",
        },
        {
          icon: Package,
          label: "By Products",
          path: "/revenue/by-products",
        },
        {
          icon: TrendingUp,
          label: "Analytics",
          path: "/revenue/analytics",
        },
        {
          icon: BarChart2,
          label: "Comparison",
          path: "/revenue/comparison",
        },
        {
          icon: RotateCcw,
          label: "Product Returns",
          path: "/revenue/returns",
        },
      ],
    },
    {
      icon: Users,
      label: "Customers",
      id: "customers",
      submenu: [
        { icon: Users, label: "Add Customer", path: "/customers/new" },
        { icon: BarChart2, label: "View Customers", path: "/customers/list" },
        { icon: PieChart, label: "Customer Stats", path: "/customers/stats" }, // NEW
        {
          icon: Activity,
          label: "Recent Activity",
          path: "/customers/activity",
        }, // NEW
      ],
    },
    { icon: Settings, label: "Settings", path: "/settings", single: true },
  ];

  // Auto-expand the active menu
  useEffect(() => {
    const path = location.pathname;
    menuItems.forEach((item) => {
      if (item.submenu) {
        const isActive = item.submenu.some((sub) => path.startsWith(sub.path));
        if (isActive) {
          setExpandedMenu(item.id);
        }
      }
    });
  }, [location.pathname]);

  const toggleSubmenu = (id) => {
    setExpandedMenu(expandedMenu === id ? null : id);
  };

  const handleNavClick = () => {
    // Close mobile sidebar when navigation item is clicked
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
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

  const handleLogout = () => {
    handleNavClick();
    logout();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      {/* User Profile Section - Mobile Only */}
      <div className="lg:hidden border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shadow-md">
            {getUserInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{user?.name}</h3>
            <p className="text-blue-100 text-sm truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id || item.path}>
              {item.single ? (
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <item.icon
                    size={20}
                    className={`${collapsed && !isMobileOpen ? "mx-auto" : "mr-3"
                      } flex-shrink-0`}
                  />
                  {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                </NavLink>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${expandedMenu === item.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <div className="flex items-center min-w-0">
                      <item.icon
                        size={20}
                        className={`${collapsed && !isMobileOpen ? "mx-auto" : "mr-3"
                          } flex-shrink-0`}
                      />
                      {(!collapsed || isMobileOpen) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    {(!collapsed || isMobileOpen) && (
                      <ChevronRight
                        size={16}
                        className={`transform transition-transform duration-200 flex-shrink-0 ml-2 ${expandedMenu === item.id ? "rotate-90" : ""
                          }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {expandedMenu === item.id && (!collapsed || isMobileOpen) && (
                    <div className="mt-1 space-y-1 ml-2">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          onClick={handleNavClick}
                          className={({ isActive }) => `
                            flex items-center pl-9 pr-3 py-2 text-sm rounded-lg transition-all duration-200
                            ${isActive
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          {subItem.icon && (
                            <subItem.icon
                              size={16}
                              className="mr-2 flex-shrink-0"
                            />
                          )}
                          <span className="truncate">{subItem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Section - Fixed at bottom */}
      <div className="border-t border-gray-200 p-3 space-y-1 flex-shrink-0 bg-white">
        <button
          onClick={() => {
            navigate("/profile");
            handleNavClick();
          }}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200"
        >
          <UserCircle
            size={20}
            className={`${collapsed && !isMobileOpen ? "mx-auto" : "mr-3"
              } flex-shrink-0`}
          />
          {(!collapsed || isMobileOpen) && <span>Profile</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
        >
          <LogOut
            size={20}
            className={`${collapsed && !isMobileOpen ? "mx-auto" : "mr-3"
              } flex-shrink-0`}
          />
          {(!collapsed || isMobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          transition-all duration-300 ease-in-out
          bg-white border-r border-gray-200 shadow-sm
        `}
      >
        {/* Desktop Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0 bg-white">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent truncate">
              BillTrack Pro
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          border-r border-gray-200 shadow-2xl
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-white truncate">
            BillTrack Pro
          </h1>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
