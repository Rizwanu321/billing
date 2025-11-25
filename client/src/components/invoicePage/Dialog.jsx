import React from "react";
import { X, User, Phone, MapPin, DollarSign } from "lucide-react";

const Dialog = ({
  open,
  onOpenChange,
  children,
  title = "Dialog",
  type = "default",
  customer = null,
}) => {
  if (!open) return null;

  const renderContent = () => {
    switch (type) {
      case "customer":
        return renderCustomerDetails();
      case "confirmation":
        return renderConfirmationDialog();
      default:
        return children;
    }
  };

  const renderCustomerDetails = () => {
    if (!customer) return null;

    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center mb-3 sm:mb-4">
          <User className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3 text-indigo-600" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Customer Details
          </h3>
        </div>

        <CustomerInfoSection
          icon={<User className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />}
          label="Name"
          value={customer.name || "Not Available"}
        />

        <CustomerInfoSection
          icon={<Phone className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />}
          label="Phone Number"
          value={customer.phoneNumber || "Not Available"}
        />

        <CustomerInfoSection
          icon={<MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />}
          label="Address"
          value={customer.address || "No Address Provided"}
        />

        <CustomerFinancialSection customer={customer} />

        <button
          onClick={() => onOpenChange(false)}
          className="w-full mt-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
        >
          Close
        </button>
      </div>
    );
  };

  const renderConfirmationDialog = () => {
    return (
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold mb-4">{title}</h3>
        {children}
        <div className="flex justify-between mt-6 space-x-3 sm:space-x-4">
          <button
            onClick={() => onOpenChange(false, "cancel")}
            className="flex-1 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={() => onOpenChange(false, "confirm")}
            className="flex-1 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl animate-scaleIn relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none p-1"
        >
          <X className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>

        {renderContent()}
      </div>
    </div>
  );
};

// Reusable Customer Information Section Component
const CustomerInfoSection = ({ icon, label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg flex items-center space-x-3">
    <div className="flex-shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      <p className="text-sm sm:text-base text-gray-900 font-semibold truncate">
        {value}
      </p>
    </div>
  </div>
);

// Customer Financial Section
const CustomerFinancialSection = ({ customer }) => (
  <div className="bg-red-50 p-3 rounded-lg flex items-center space-x-3">
    <DollarSign className="w-4 sm:w-5 h-4 sm:h-5 text-red-600 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs text-red-600 font-medium">Current Due Amount</p>
      <p className="text-sm sm:text-base text-red-700 font-bold">
        ₹{customer.amountDue?.toFixed(2) || "0.00"}
      </p>
    </div>
  </div>
);

export default Dialog;
