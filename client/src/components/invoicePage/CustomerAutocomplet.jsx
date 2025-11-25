import React, { useState, useRef, useEffect } from "react";
import { Search, X, User } from "lucide-react";

const CustomerAutocomplete = ({
  customers,
  value,
  onChange,
  placeholder = "Search customers...",
}) => {
  const [inputValue, setInputValue] = useState(value?.name || "");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Handle input change
  const handleInputChange = (e) => {
    const searchTerm = e.target.value;
    setInputValue(searchTerm);

    // Filter customers based on input
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
    setShowDropdown(true);

    // Reset selected customer if input changes
    onChange(null);
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setInputValue(customer.name);
    onChange(customer);
    setShowDropdown(false);
  };

  // Clear selection
  const handleClear = () => {
    setInputValue("");
    onChange(null);
    setFilteredCustomers(customers);
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
          <User className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
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

      {showDropdown && filteredCustomers.length > 0 && (
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
          {filteredCustomers.map((customer) => (
            <div
              key={customer._id}
              onClick={() => handleCustomerSelect(customer)}
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <div className="flex-1">
                  <span className="font-medium text-sm sm:text-base block">
                    {customer.name}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {customer.phoneNumber}
                  </span>
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">
                  {customer.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerAutocomplete;
