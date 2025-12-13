import React from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const SearchBar = ({ searchTerm, onSearchChange }) => {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={t('products.searchProductsByNameOrCategory')}
        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-sm sm:text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchTerm && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
