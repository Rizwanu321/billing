import React from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  Filter,
  Plus,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const BillingListHeader = ({
  navigate,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  isDateDropdownOpen,
  setIsDateDropdownOpen,
  isSortDropdownOpen,
  setIsSortDropdownOpen,
  formatDateForAPI,
  formatDateForDisplay,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
}) => {
  const { t } = useTranslation();
  const getDateFilterLabel = (filter) => {
    if (filter === "custom" && fromDate && toDate) {
      return `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(
        toDate
      )}`;
    }

    switch (filter) {
      case "today":
        return t('billingList.today');
      case "yesterday":
        return t('billingList.yesterday');
      case "week":
        return t('billingList.thisWeek');
      case "month":
        return t('billingList.thisMonth');
      default:
        return t('billingList.allTime');
    }
  };

  const handleDateSelect = (filter) => {
    setDateFilter(filter);
    setFromDate(null);
    setToDate(null);
    setIsDateDropdownOpen(false);
  };

  const handleDateRangeChange = (startDate, endDate) => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        setFromDate(endDate);
        setToDate(startDate);
      } else {
        setFromDate(startDate);
        setToDate(endDate);
      }
      setDateFilter("custom");
    } else {
      setFromDate(startDate);
      setToDate(endDate);
    }
  };

  const sortOptions = [
    { value: "date", label: t('billingList.date') },
    { value: "customerName", label: t('billingList.customer') },
    { value: "total", label: t('billingList.amount') },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header - Stacks on mobile, Row on Desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('billingList.invoices')}
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {t('billingList.manageAndTrack')}
            </p>
          </div>
          <button
            onClick={() => navigate("/invoices")}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('billingList.newInvoice')}
          </button>
        </div>

        {/* Desktop Filters Bar */}
        <div className="hidden sm:flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('billingList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border-0 text-slate-900 placeholder-slate-400 focus:ring-0 text-sm font-medium h-10"
            />
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="px-3 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-slate-50 transition-colors text-slate-600 text-sm font-medium"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{getDateFilterLabel(dateFilter)}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden ring-1 ring-black/5">
                <div className="p-2 space-y-0.5">
                  {["all", "today", "yesterday", "week", "month"].map(
                    (filter) => (
                      <button
                        key={filter}
                        className={`w-full px-4 py-2.5 text-left rounded-lg text-sm font-medium transition-colors ${dateFilter === filter
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50"
                          }`}
                        onClick={() => handleDateSelect(filter)}
                      >
                        {getDateFilterLabel(filter)}
                      </button>
                    )
                  )}
                </div>

                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {t('billingList.customRange')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        {t('billingList.from')}
                      </label>
                      <input
                        type="date"
                        value={fromDate ? formatDateForAPI(fromDate) : ""}
                        onChange={(e) =>
                          handleDateRangeChange(e.target.valueAsDate, toDate)
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        {t('billingList.to')}
                      </label>
                      <input
                        type="date"
                        value={toDate ? formatDateForAPI(toDate) : ""}
                        onChange={(e) =>
                          handleDateRangeChange(fromDate, e.target.valueAsDate)
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="px-3 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-slate-50 transition-colors text-slate-600 text-sm font-medium"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 ring-1 ring-black/5 p-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`w-full px-4 py-2.5 text-left rounded-lg text-sm font-medium transition-colors ${sortBy === option.value
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                      }`}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                <div className="h-px bg-slate-100 my-1"></div>
                {/* Sort Order Toggle inside dropdown for compactness */}
                <button
                  className="w-full px-4 py-2.5 text-left rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                >
                  <span>{sortOrder === "asc" ? t('billingList.ascending') : t('billingList.descending')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transform transition-transform ${sortOrder === "asc" ? "rotate-180" : ""
                      }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search and Filter Bar */}
        <div className="sm:hidden flex gap-3">
          {/* Mobile Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
            />
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-none w-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50"
          >
            <div className="relative">
              <Filter className="w-5 h-5 text-slate-600" />
              {dateFilter !== "all" && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white"></span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex items-end justify-center">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Sheet Content */}
          <div className="relative w-full bg-white rounded-t-3xl p-6 min-h-[60vh] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Filter & Sort</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Date Filter */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Time Period
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["all", "today", "yesterday", "week", "month"].map(
                    (filter) => (
                      <button
                        key={filter}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${dateFilter === filter
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        onClick={() => handleDateSelect(filter)}
                      >
                        {getDateFilterLabel(filter)}
                      </button>
                    )
                  )}
                </div>

                {/* Custom Date Inputs */}
                <div className="grid grid-cols-2 gap-4 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">From Date</label>
                    <input
                      type="date"
                      value={fromDate ? formatDateForAPI(fromDate) : ""}
                      onChange={(e) =>
                        handleDateRangeChange(e.target.valueAsDate, toDate)
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">To Date</label>
                    <input
                      type="date"
                      value={toDate ? formatDateForAPI(toDate) : ""}
                      onChange={(e) =>
                        handleDateRangeChange(fromDate, e.target.valueAsDate)
                      }
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Sort By
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full px-4 py-3 text-left rounded-xl border flex justify-between items-center transition-all ${sortBy === option.value
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600"
                        }`}
                      onClick={() => setSortBy(option.value)}
                    >
                      <span className="font-medium">{option.label}</span>
                      {sortBy === option.value && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${sortOrder === "asc"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                      }`}
                    onClick={() => setSortOrder("asc")}
                  >
                    {t('billingList.ascending')}
                  </button>
                  <button
                    className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${sortOrder === "desc"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200"
                      }`}
                    onClick={() => setSortOrder("desc")}
                  >
                    {t('billingList.descending')}
                  </button>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:scale-[0.98]"
              >
                Apply Filters
              </button>
            </div>
          </div >
        </div >
      )}
    </>
  );
};

export default BillingListHeader;
