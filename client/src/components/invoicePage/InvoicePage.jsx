import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Dialog from "./Dialog";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceForm from "./InvoiceForm";
import {
  fetchInitialData,
  handleErrorUtil,
  validateInvoiceUtil,
  saveInvoiceUtil,
  printInvoiceUtil,
} from "./InvoiceUtils";

const InvoicePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [taxSettings, setTaxSettings] = useState({
    taxEnabled: false,
    taxRate: 10,
  });

  const initialInvoiceState = {
    customer: { name: "", _id: "" },
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: "draft",
    paymentMethod: "cash",
    dueAmount: 0,
  };

  const [invoice, setInvoice] = useState(initialInvoiceState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, customersData, settingsData] =
        await fetchInitialData();
      setProducts(productsData);
      setCustomers(customersData);

      if (settingsData) {
        setTaxSettings({
          taxEnabled: settingsData.taxEnabled,
          taxRate: settingsData.taxRate || 10,
        });
      }
    } catch (error) {
      handleErrorUtil(error, setError, navigate);
    }
  };

  const handleSaveInvoice = async () => {
    if (!validateInvoiceUtil(invoice, toast)) return;

    try {
      setLoading(true);
      const savedInvoice = await saveInvoiceUtil(
        invoice,
        selectedCustomer,
        toast,
        navigate
      );
      setInvoice(savedInvoice);
      setError(null);
    } catch (error) {
      handleErrorUtil(error, setError, navigate);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    await printInvoiceUtil(invoice, toast);
  };

  const handleNewBilling = () => {
    setInvoice(initialInvoiceState);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6 overflow-visible">
      <div className="max-w-7xl mx-auto overflow-visible">
        <InvoiceHeader onNewBilling={handleNewBilling} />
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg overflow-visible border border-gray-100">
          <InvoiceForm
            invoice={invoice}
            setInvoice={setInvoice}
            products={products}
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            showCustomerDetails={showCustomerDetails}
            setShowCustomerDetails={setShowCustomerDetails}
            taxSettings={taxSettings}
            loading={loading}
            error={error}
            onSave={handleSaveInvoice}
            onPrint={handlePrintInvoice}
          />
        </div>
      </div>

      <Dialog
        open={showCustomerDetails}
        onOpenChange={setShowCustomerDetails}
        type="customer"
        customer={selectedCustomer}
      />
    </div>
  );
};

export default InvoicePage;
