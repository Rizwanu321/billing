import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

const ProductAutocomplete = ({
  products,
  value,
  onChange,
  placeholder = "Search products...",
}) => {
  const [inputValue, setInputValue] = useState(value?.name || "");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Update input value when selected product changes
  useEffect(() => {
    setInputValue(value?.name || "");
  }, [value]);

  // Handle input change
  const handleInputChange = (e) => {
    const searchTerm = e.target.value;
    setInputValue(searchTerm);

    // Filter products based on input
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setShowDropdown(true);

    // Reset selected product if input changes
    onChange(null);
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    setInputValue(product.name);
    onChange(product);
    setShowDropdown(false);
  };

  // Clear selection
  const handleClear = () => {
    setInputValue("");
    onChange(null);
    setFilteredProducts(products);
  };

  // Determine dropdown position
  useEffect(() => {
    const checkDropdownPosition = () => {
      if (!containerRef.current || !inputRef.current) return;

      const inputRect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;
      const dropdownHeight = 240; // Approximate height of dropdown

      // If not enough space below, try to show above
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    };

    if (showDropdown) {
      checkDropdownPosition();
    }
  }, [showDropdown]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format unit display
  const formatUnitDisplay = (unit, stock) => {
    if (stock === 1) {
      return unit;
    }

    switch (unit) {
      case "kg":
        return "kgs";
      case "box":
        return "boxes";
      case "piece":
        return "pieces";
      default:
        return unit + "s";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
          <Search className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="
            w-full 
            pl-9 sm:pl-10 
            pr-9 sm:pr-10 
            py-2 sm:py-2.5 
            text-sm sm:text-base
            border 
            border-gray-300 
            rounded-lg 
            focus:outline-none 
            focus:ring-2 
            focus:ring-indigo-500 
            focus:border-transparent
            transition-all
            duration-300
          "
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center"
            type="button"
          >
            <X className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {showDropdown && filteredProducts.length > 0 && (
        <div
          style={{
            zIndex: 9999,
            position: "absolute",
            maxHeight: "240px",
            overflowY: "auto",
          }}
          className={`
            w-full 
            bg-white 
            border 
            border-gray-300 
            rounded-lg 
            shadow-lg 
            animate-dropdown
            ${
              dropdownPosition === "top"
                ? "bottom-full mb-1 origin-bottom"
                : "mt-1 origin-top"
            }
          `}
        >
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => handleProductSelect(product)}
              className="
                px-3 sm:px-4 
                py-2.5 sm:py-3
                hover:bg-gray-100 
                cursor-pointer 
                transition-colors
                duration-200
                border-b border-gray-100 last:border-b-0
              "
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                <div className="flex-1">
                  <span className="font-medium text-sm sm:text-base block">
                    {product.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mt-0.5">
                    <span>₹{product.price.toFixed(2)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-xs font-medium bg-purple-100 text-purple-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                      {product.unit || "piece"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full inline-block ${
                      !product.isStockRequired
                        ? "bg-gray-100 text-gray-600"
                        : product.stock > 10
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {!product.isStockRequired
                      ? "No Stock"
                      : `${product.stock} ${formatUnitDisplay(
                          product.unit || "piece",
                          product.stock
                        )}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductAutocomplete;
