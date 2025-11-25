import React from "react";

// Payment Method Configurations
const PAYMENT_METHODS = {
  CASH: "cash",
  ONLINE: "online",
  DUE: "due",
};

// Payment Method Button Component
const PaymentMethodButton = ({
  method,
  currentMethod,
  icon,
  onClick,
  disabled = false,
  className = "",
}) => {
  // Payment Method Configurations
  const paymentMethodConfig = {
    [PAYMENT_METHODS.CASH]: {
      label: "Cash Payment",
      activeClass: "bg-green-500 text-white",
      inactiveClass: "bg-green-100 text-green-700",
      hoverClass: "hover:bg-green-200",
    },
    [PAYMENT_METHODS.ONLINE]: {
      label: "Online Payment",
      activeClass: "bg-blue-500 text-white",
      inactiveClass: "bg-blue-100 text-blue-700",
      hoverClass: "hover:bg-blue-200",
    },
    [PAYMENT_METHODS.DUE]: {
      label: "Credit Payment",
      activeClass: "bg-red-500 text-white",
      inactiveClass: "bg-red-100 text-red-700",
      hoverClass: "hover:bg-red-200",
    },
  };

  // Get configuration for the current method
  const config =
    paymentMethodConfig[method] || paymentMethodConfig[PAYMENT_METHODS.CASH];

  // Determine button classes
  const buttonClasses = `
    flex 
    items-center 
    justify-center 
    px-4 
    py-2 
    rounded-lg 
    transition-all 
    duration-300 
    ease-in-out 
    transform 
    ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
    ${currentMethod === method ? config.activeClass : config.inactiveClass}
    ${!disabled && config.hoverClass}
    ${className}
  `;

  // Handle Click Event
  const handleClick = () => {
    if (!disabled) {
      onClick(method);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={buttonClasses}
      aria-label={`Select ${config.label}`}
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium text-sm">{config.label}</span>
      </div>
    </button>
  );
};

// Expose Payment Methods
PaymentMethodButton.Methods = PAYMENT_METHODS;

export default PaymentMethodButton;
