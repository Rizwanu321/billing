import React from "react";
import { Plus } from "lucide-react";

const InvoiceHeader = ({ onNewBilling }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Billing</h2>
      <button
        onClick={onNewBilling}
        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium flex items-center justify-center"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Billing
      </button>
    </div>
  );
};

export default InvoiceHeader;
