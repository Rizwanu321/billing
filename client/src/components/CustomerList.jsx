import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  MapPin,
  Plus,
  Search,
  ChevronRight,
  CreditCard,
  Users,
  Wallet,
} from "lucide-react";
import { fetchCustomers } from "../api/customers";

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers(searchTerm);
      setCustomers(data);
      setError("");
    } catch (err) {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber.includes(searchTerm) ||
      customer.place.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CustomerSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Glassmorphism Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Customers
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {customers.length} total customers
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/customers/new")}
              className="group flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform hover:-translate-y-0.5"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold">Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Bar */}
        <div className="relative group mx-auto max-w-4xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search customers by name, phone, or place..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:shadow-md focus:shadow-lg"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-2">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <CustomerSkeleton />
        ) : filteredCustomers.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No customers found
            </h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              We couldn't find any customers matching "{searchTerm}". Try checking for typos or add a new customer.
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/customers/new")}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus size={18} />
                <span>Add Your First Customer</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer Details
                    </th>
                    <th className="text-left px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="text-left px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="text-right px-8 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Balance Status
                    </th>
                    <th className="text-right px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      onClick={() => navigate(`/customers/${customer._id}/transactions`)}
                      className="group hover:bg-slate-50 transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white transition-transform group-hover:scale-105 ${customer.amountDue > 0
                            ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/20"
                            : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/20"
                            }`}>
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {customer.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">ID: {customer._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-sm text-slate-600">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Phone size={14} />
                          </div>
                          <span className="font-medium">{customer.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin size={16} className="mr-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {customer.place || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end">
                          {customer.amountDue > 0 ? (
                            <div className="group/badge relative">
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-rose-50 text-rose-600 border border-rose-100 shadow-sm transition-all group-hover/badge:shadow-md group-hover/badge:border-rose-200">
                                <span>₹{customer.amountDue.toFixed(2)}</span>
                              </span>
                              <p className="absolute right-0 -bottom-5 text-[10px] font-bold text-rose-400 opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap">Payment Due</p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-teal-50 text-teal-600 border border-teal-100 shadow-sm">
                              <span>₹{Math.abs(customer.amountDue).toFixed(2)}</span>
                              <span className="text-[10px] uppercase tracking-wider text-teal-400 font-extrabold ml-1">Adv</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-100 text-gray-400 shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => navigate(`/customers/${customer._id}/transactions`)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-blue-100 group"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white ${customer.amountDue > 0
                          ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/20"
                          : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/20"
                        }`}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">
                          {customer.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium flex items-center mt-1 bg-gray-50 px-2 py-0.5 rounded-md inline-flex w-fit">
                          <MapPin size={12} className="mr-1" />
                          {customer.place || "No location"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="flex items-center text-sm text-slate-500 font-medium">
                        <Wallet size={18} className="mr-2 text-slate-400" />
                        Balance
                      </div>

                      {customer.amountDue > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          <span>₹{customer.amountDue.toFixed(2)}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <span>₹{Math.abs(customer.amountDue).toFixed(2)}</span>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-extrabold ml-1">Adv</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Phone size={14} className="mr-2" />
                        <span className="text-xs font-semibold">{customer.phoneNumber}</span>
                      </div>
                      <div className="flex items-center text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                        View Details <ChevronRight size={14} className="ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400 font-medium">
                Showing {filteredCustomers.length} of {customers.length} customers
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerList;

