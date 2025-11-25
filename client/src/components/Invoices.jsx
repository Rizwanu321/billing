import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Plus,
  Save,
  Trash,
  User,
  X,
  CreditCard,
  IndianRupee,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";

import { fetchProducts, createInvoice, generatePDF } from "../api/invoices";
import {
  fetchCustomers,
  fetchCustomerById,
  addCustomerPurchase,
} from "../api/customers";
import { fetchSettings } from "../api/settings";

// Dialog Component with improved styling
const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
        <div className="flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Main Invoice Page Component
const InvoicePage = () => {
  const navigate = useNavigate();

  // State Management
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [taxSettings, setTaxSettings] = useState({
    taxEnabled: false,
    taxRate: 10,
  });

  // Initial Invoice State
  const initialInvoiceState = {
    customer: {
      name: "",
      _id: "",
    },
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

  // Initial Data Loading
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load Products, Customers, and Tax Settings
  const loadInitialData = async () => {
    try {
      const [productsData, customersData, settingsData] = await Promise.all([
        fetchProducts(),
        fetchCustomers(),
        fetchSettings(),
      ]);

      setProducts(productsData);
      setCustomers(customersData);

      // Set tax settings
      if (settingsData) {
        setTaxSettings({
          taxEnabled: settingsData.taxEnabled,
          taxRate: settingsData.taxRate || 10,
        });
      }
    } catch (error) {
      handleError(error);
    }
  };

  // Error Handling
  const handleError = (error) => {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    setError(errorMessage);
    toast.error(errorMessage);

    if (error.response?.status === 401) {
      navigate("/login");
    }
  };

  // Customer Selection
  const handleCustomerSelect = async (customerId) => {
    try {
      const customer = customers.find((c) => c._id === customerId);
      if (customer) {
        setInvoice((prev) => ({
          ...prev,
          customer: {
            _id: customer._id,
            name: customer.name,
          },
        }));

        const customerDetails = await fetchCustomerById(customerId);
        setSelectedCustomer(customerDetails);
      }
    } catch (error) {
      handleError(error);
    }
  };

  // Item Management
  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product: "", quantity: 1, price: 0, subtotal: 0 },
      ],
    }));
  };

  const removeItem = (index) => {
    setInvoice((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: newItems,
      };
    });
    calculateTotals();
  };

  const handleItemChange = (index, field, value) => {
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      if (field === "product") {
        const product = products.find((p) => p._id === value);
        if (product) {
          newItems[index].price = product.price;
          newItems[index].subtotal = product.price * newItems[index].quantity;
        }
      }

      if (field === "quantity") {
        newItems[index].subtotal = newItems[index].price * (Number(value) || 1);
      }

      return {
        ...prev,
        items: newItems,
      };
    });
    calculateTotals();
  };

  // Totals Calculation
  const calculateTotals = () => {
    setInvoice((prev) => {
      const subtotal = prev.items.reduce((sum, item) => sum + item.subtotal, 0);

      const tax = taxSettings.taxEnabled
        ? subtotal * (taxSettings.taxRate / 100)
        : 0;

      const total = subtotal + tax;

      return {
        ...prev,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    });
  };

  // Invoice Validation
  const validateInvoice = () => {
    if (invoice.items.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }

    const invalidItems = invoice.items.some(
      (item) => !item.product || item.quantity <= 0
    );
    if (invalidItems) {
      toast.error("Please complete all item details");
      return false;
    }

    if (
      invoice.paymentMethod === "due" &&
      (!invoice.customer._id || !selectedCustomer)
    ) {
      toast.error("Please select a customer for due payment");
      return false;
    }

    return true;
  };

  // Save Invoice
  const saveInvoice = async () => {
    if (!validateInvoice()) return;

    try {
      setLoading(true);

      const invoiceData = {
        ...invoice,
        status: "final",
        paymentMethod: invoice.paymentMethod,
        dueAmount: invoice.paymentMethod === "due" ? invoice.total : 0,
        customer: {
          _id: selectedCustomer?._id || invoice.customer._id,
          name: selectedCustomer?.name || invoice.customer.name,
        },
      };

      const savedInvoice = await createInvoice(invoiceData);

      if (invoice.paymentMethod === "due" && savedInvoice.customer._id) {
        await addCustomerPurchase(savedInvoice.customer._id, {
          amount: savedInvoice.total,
          invoiceId: savedInvoice._id,
          invoiceNumber: savedInvoice.invoiceNumber,
        });
      }

      toast.success("Invoice saved successfully");
      setInvoice(savedInvoice);
      setError(null);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Print Invoice
  const printInvoice = async () => {
    if (invoice._id && invoice.status === "final") {
      try {
        const pdfBlob = await generatePDF(invoice._id);
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${invoice._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        handleError(error);
      }
    }
  };

  // Payment Method Handling
  const handlePaymentMethodChange = (method) => {
    setInvoice((prev) => ({
      ...prev,
      paymentMethod: method,
      dueAmount: method === "due" ? prev.total : 0,
    }));
  };

  // Customer Name Handling
  const handleCustomerChange = (e) => {
    const { value } = e.target;
    setInvoice((prev) => ({
      ...prev,
      customer: {
        name: value,
      },
    }));
  };

  // New Billing Reset
  const handleNewBilling = () => {
    setInvoice(initialInvoiceState);
    setSelectedCustomer(null);
  };

  // Payment method icons
  const paymentIcons = {
    cash: <IndianRupee className="w-5 h-5" />,
    online: <CreditCard className="w-5 h-5" />,
    due: <Clock className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Billing</h2>
          <button
            onClick={handleNewBilling}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Billing
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start">
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Customer Name Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Information
              </label>
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                name="name"
                value={invoice.customer.name}
                onChange={handleCustomerChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Payment Method
              </h3>
              <div className="flex flex-wrap gap-4">
                {["cash", "online", "due"].map((method) => (
                  <button
                    key={method}
                    onClick={() => handlePaymentMethodChange(method)}
                    className={`flex items-center px-5 py-3 rounded-lg capitalize font-medium transition-all ${
                      invoice.paymentMethod === method
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {paymentIcons[method]}
                    <span className="ml-2">{method} Payment</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Due Payment Customer Selection */}
            {invoice.paymentMethod === "due" && (
              <div className="mb-8 p-5 bg-indigo-50 rounded-lg border border-indigo-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Select Customer
                </h3>
                <div className="flex gap-4">
                  <select
                    value={invoice.customer._id}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phoneNumber}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowCustomerDetails(true)}
                    disabled={!selectedCustomer}
                    className="px-4 py-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center min-w-12"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Customer Details Dialog */}
            <Dialog
              open={showCustomerDetails}
              onOpenChange={setShowCustomerDetails}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Customer Details
                </h3>
              </div>
              {selectedCustomer && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-semibold text-gray-600 text-sm">Name</p>
                    <p className="text-gray-900 font-medium">
                      {selectedCustomer.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-semibold text-gray-600 text-sm">Phone</p>
                    <p className="text-gray-900 font-medium">
                      {selectedCustomer.phoneNumber}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-semibold text-gray-600 text-sm">
                      Address
                    </p>
                    <p className="text-gray-900 font-medium">
                      {selectedCustomer.address}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="font-semibold text-red-600 text-sm">
                      Current Due Amount
                    </p>
                    <p className="text-red-600 font-bold">
                      ₹{selectedCustomer.amountDue}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCustomerDetails(false)}
                    className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </Dialog>

            {/* Items Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Items</h3>
                <button
                  onClick={addItem}
                  className="flex items-center px-4 py-2 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>

              {invoice.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">
                    No items added. Click "Add Item" to begin.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="bg-gray-100 py-3 px-4 grid grid-cols-12 gap-4 text-gray-700 font-medium">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  {invoice.items.map((item, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-12 gap-4 px-4 py-3 items-center ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <select
                        className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={item.product}
                        onChange={(e) =>
                          handleItemChange(index, "product", e.target.value)
                        }
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} (₹{product.price})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <div className="col-span-2 py-2 text-right font-medium">
                        ₹{item.price.toFixed(2)}
                      </div>
                      <div className="col-span-2 py-2 text-right font-bold">
                        ₹{item.subtotal.toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="col-span-1 text-red-500 hover:text-red-700 flex justify-center"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="space-y-3 text-right">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ₹{invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                {taxSettings.taxEnabled && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Tax ({taxSettings.taxRate}%):
                    </span>
                    <span className="font-medium">
                      ₹{invoice.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>Total:</span>
                  <span className="text-indigo-700">
                    ${invoice.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => navigate("/invoices")}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveInvoice}
                disabled={loading || invoice.items.length === 0}
                className={`flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-md ${
                  (loading || invoice.items.length === 0) &&
                  "opacity-50 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Invoice
              </button>
              <button
                onClick={printInvoice}
                disabled={!invoice._id || invoice.status !== "final"}
                className={`flex items-center px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-md ${
                  (!invoice._id || invoice.status !== "final") &&
                  "opacity-50 cursor-not-allowed"
                }`}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
