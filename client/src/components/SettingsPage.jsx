import React, { useState, useEffect } from "react";
import { Settings, Save, Building2, Calculator, DollarSign, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api";

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    taxEnabled: false,
    taxRate: 10,
    currency: "USD",
    businessName: "",
    businessAddress: "",
    businessPhone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings");
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error("Error fetching settings");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/settings", settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                  Settings
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                  Manage your business configuration
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Business Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      Business Information
                    </h2>
                    <p className="text-xs sm:text-sm text-purple-100 mt-0.5">
                      Your company details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Business Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={settings.businessName}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter your business name"
                  />
                </div>

                {/* Business Address */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    Business Address
                  </label>
                  <textarea
                    name="businessAddress"
                    value={settings.businessAddress}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none bg-gray-50 hover:bg-white"
                    placeholder="Enter your complete business address"
                  />
                </div>

                {/* Business Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone className="w-4 h-4 text-purple-500" />
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    name="businessPhone"
                    value={settings.businessPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DollarSign className="w-4 h-4 text-purple-500" />
                    Currency
                  </label>
                  <div className="relative">
                    <select
                      name="currency"
                      value={settings.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Configuration Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      Tax Configuration
                    </h2>
                    <p className="text-xs sm:text-sm text-green-100 mt-0.5">
                      Manage tax settings
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Tax Enable Toggle */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-5 border border-green-100">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex items-center h-6">
                      <input
                        type="checkbox"
                        id="taxEnabled"
                        name="taxEnabled"
                        checked={settings.taxEnabled}
                        onChange={handleInputChange}
                        className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 focus:ring-2 focus:ring-green-500 border-gray-300 rounded-md cursor-pointer transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="taxEnabled"
                        className="text-sm sm:text-base font-semibold text-gray-900 cursor-pointer flex items-center gap-2"
                      >
                        Enable Tax Calculation
                        {settings.taxEnabled && (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        )}
                      </label>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Automatically calculate tax on invoices
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tax Rate Input - Animated */}
                <div className={`space-y-2 transition-all duration-300 ${settings.taxEnabled
                    ? 'opacity-100 max-h-32'
                    : 'opacity-50 max-h-32 pointer-events-none'
                  }`}>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calculator className="w-4 h-4 text-green-500" />
                    Tax Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="taxRate"
                      value={settings.taxRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={!settings.taxEnabled}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                      <span className="text-gray-500 text-sm sm:text-base font-medium">%</span>
                    </div>
                  </div>
                  {settings.taxEnabled && (
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Tax will be applied to all new invoices
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                        Tax Information
                      </h4>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        The tax rate will be automatically applied to all invoice calculations. You can override this on individual invoices if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn sticky bottom-4 sm:bottom-6 z-10">
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex bg-blue-100 p-2 rounded-lg">
                    <Save className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      Ready to save changes?
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Your settings will be updated immediately
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-500/50 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 transform"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  {loading ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;