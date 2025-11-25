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
  const getDateFilterLabel = (filter) => {
    if (filter === "custom" && fromDate && toDate) {
      return `${formatDateForDisplay(fromDate)} - ${formatDateForDisplay(
        toDate
      )}`;
    }

    switch (filter) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return "All Time";
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
    { value: "date", label: "Date" },
    { value: "customerName", label: "Customer" },
    { value: "total", label: "Amount" },
  ];

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Billing List
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your invoices
            </p>
          </div>
          <button
            onClick={() => navigate("/invoices")}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg inline-flex items-center gap-2 hover:bg-gray-50 transition-colors bg-white"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {getDateFilterLabel(dateFilter)}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-2">
                  {["all", "today", "yesterday", "week", "month"].map(
                    (filter) => (
                      <button
                        key={filter}
                        className={`w-full px-4 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-colors ${
                          dateFilter === filter
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => handleDateSelect(filter)}
                      >
                        {getDateFilterLabel(filter)}
                      </button>
                    )
                  )}
                </div>

                <div className="border-t border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Custom Range
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        value={fromDate ? formatDateForAPI(fromDate) : ""}
                        onChange={(e) =>
                          handleDateRangeChange(e.target.valueAsDate, toDate)
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        value={toDate ? formatDateForAPI(toDate) : ""}
                        onChange={(e) =>
                          handleDateRangeChange(fromDate, e.target.valueAsDate)
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2.5 border border-gray-300 rounded-lg inline-flex items-center gap-2 hover:bg-gray-50 transition-colors bg-white"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                Sort: {sortOptions.find((o) => o.value === sortBy)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      sortBy === option.value
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Order */}
          <button
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
          >
            <ChevronDown
              className={`w-4 h-4 text-gray-600 transform transition-transform ${
                sortOrder === "asc" ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Search and Filter */}
        <div className="sm:hidden space-y-3">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg inline-flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors bg-white"
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Filters</span>
            <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
              {dateFilter !== "all" ? "1" : "0"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden">
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Date Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Date Range
              </h3>
              <div className="space-y-2">
                {["all", "today", "yesterday", "week", "month"].map(
                  (filter) => (
                    <button
                      key={filter}
                      className={`w-full px-4 py-3 text-left rounded-lg border ${
                        dateFilter === filter
                          ? "bg-blue-50 border-blue-300 text-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        handleDateSelect(filter);
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      {getDateFilterLabel(filter)}
                    </button>
                  )
                )}
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Custom Range
                </h4>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={fromDate ? formatDateForAPI(fromDate) : ""}
                    onChange={(e) =>
                      handleDateRangeChange(e.target.valueAsDate, toDate)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={toDate ? formatDateForAPI(toDate) : ""}
                    onChange={(e) =>
                      handleDateRangeChange(fromDate, e.target.valueAsDate)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Sort By
              </h3>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`w-full px-4 py-3 text-left rounded-lg border ${
                      sortBy === option.value
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Order */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Sort Order
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`px-4 py-3 rounded-lg border ${
                    sortOrder === "asc"
                      ? "bg-blue-50 border-blue-300 text-blue-600"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSortOrder("asc")}
                >
                  Ascending
                </button>
                <button
                  className={`px-4 py-3 rounded-lg border ${
                    sortOrder === "desc"
                      ? "bg-blue-50 border-blue-300 text-blue-600"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setSortOrder("desc")}
                >
                  Descending
                </button>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingListHeader;
