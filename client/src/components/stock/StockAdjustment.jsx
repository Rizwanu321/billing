// components/stock/StockAdjustment.jsx - Complete Professional Version

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Minus,
  RefreshCw,
  Save,
  AlertCircle,
  X,
  ShoppingCart,
  Truck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import { fetchProducts } from "../../api/products";
import { batchStockAdjustment } from "../../api/stock";
import { fetchInvoices } from "../../api/invoices";
import { toast } from "react-hot-toast";
import CustomerReturnDialog from "./CustomerReturnDialog";

const StockAdjustment = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showCustomerReturnDialog, setShowCustomerReturnDialog] = useState(false);
  const [customerReturnData, setCustomerReturnData] = useState(null);
  const [linkToDueCustomer, setLinkToDueCustomer] = useState(false);
  const [refundMethod, setRefundMethod] = useState("cash"); // How the refund was given
  const [activeTab, setActiveTab] = useState("additions");

  // Professional adjustment types with proper categorization
  const adjustmentTypes = {
    additions: {
      label: "Stock Additions",
      icon: TrendingUp,
      color: "green",
      types: [
        {
          value: "purchase",
          label: "New Purchase",
          icon: ShoppingCart,
          description: "Stock received from supplier",
          requiresReference: true,
          referenceLabel: "Purchase Order #",
        },
        {
          value: "return_from_customer",
          label: "Customer Return",
          icon: RotateCcw,
          description: "Products returned by customer",
          requiresReference: true,
          referenceLabel: "Return Reference #",
        },
        {
          value: "production",
          label: "Production Output",
          icon: Package,
          description: "Manufactured/produced items",
          requiresReference: false,
        },
        {
          value: "found",
          label: "Found/Recovered",
          icon: CheckCircle,
          description: "Previously missing items found",
          requiresReference: false,
        },
        {
          value: "adjustment_positive",
          label: "Positive Adjustment",
          icon: Plus,
          description: "Inventory count correction (increase)",
          requiresReference: false,
        },
      ],
    },
    removals: {
      label: "Stock Removals",
      icon: TrendingDown,
      color: "red",
      types: [
        {
          value: "damaged",
          label: "Damaged Goods",
          icon: XCircle,
          description: "Products damaged beyond sale",
          requiresReference: false,
        },
        {
          value: "expired",
          label: "Expired Products",
          icon: AlertTriangle,
          description: "Products past expiry date",
          requiresReference: false,
        },
        {
          value: "lost",
          label: "Lost/Missing",
          icon: AlertCircle,
          description: "Items that cannot be located",
          requiresReference: false,
        },
        {
          value: "theft",
          label: "Theft",
          icon: AlertTriangle,
          description: "Stolen merchandise",
          requiresReference: true,
          referenceLabel: "Report #",
        },
        {
          value: "return_to_supplier",
          label: "Return to Supplier",
          icon: Truck,
          description: "Products returned to supplier",
          requiresReference: true,
          referenceLabel: "Return Order #",
        },
        {
          value: "quality_issue",
          label: "Quality Issues",
          icon: XCircle,
          description: "Failed quality control",
          requiresReference: false,
        },
        {
          value: "adjustment_negative",
          label: "Negative Adjustment",
          icon: Minus,
          description: "Inventory count correction (decrease)",
          requiresReference: false,
        },
      ],
    },
  };

  // Predefined reasons for quick selection
  const quickReasons = {
    damaged: [
      "Water damage",
      "Physical damage during handling",
      "Manufacturing defect discovered",
      "Packaging damaged",
    ],
    expired: [
      "Past expiry date",
      "Short dated - removed from sale",
      "Quality deteriorated",
    ],
    lost: [
      "Cannot locate in warehouse",
      "Missing from last inventory count",
      "Misplaced during reorganization",
    ],
    purchase: [
      "Regular stock replenishment",
      "Seasonal stock purchase",
      "New product line addition",
    ],
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data); // Show all products, not just stock-required ones
    } catch (error) {
      toast.error("Failed to load products");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addProductForAdjustment = (product) => {
    if (!selectedProducts.find((p) => p._id === product._id)) {
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          adjustmentQuantity: product.minQuantity || 1,
        },
      ]);
    }
  };

  const updateAdjustment = (productId, field, value) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p._id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const removeProductFromAdjustment = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };

  const getSelectedAdjustmentType = () => {
    if (!adjustmentType) return null;

    for (const category of Object.values(adjustmentTypes)) {
      const found = category.types.find((t) => t.value === adjustmentType);
      if (found) return { ...found, category: category.label };
    }
    return null;
  };

  const handleBulkAdjustment = async () => {
    const selectedType = getSelectedAdjustmentType();

    if (!adjustmentType) {
      toast.error("Please select an adjustment type");
      return;
    }

    // If it's a customer return AND linkToDueCustomer is enabled but no customer selected yet
    if (adjustmentType === "return_from_customer" && linkToDueCustomer && !customerReturnData) {
      if (selectedProducts.length === 0) {
        toast.error("Please select at least one product");
        return;
      }

      // Pre-validate invoice if reference number is provided
      if (referenceNumber) {
        const loadingToast = toast.loading("Validating invoice...");
        try {
          const response = await fetchInvoices({ search: referenceNumber });
          const invoices = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];

          const matchedInvoice = invoices.find(inv =>
            inv.invoiceNumber.toLowerCase() === referenceNumber.toLowerCase()
          );

          if (!matchedInvoice) {
            toast.dismiss(loadingToast);
            toast.error(`Invoice ${referenceNumber} not found`);
            return;
          }

          // Check if it's a walk-in invoice
          if (!matchedInvoice.customer || !matchedInvoice.customer._id) {
            toast.dismiss(loadingToast);
            toast.error(
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Walk-in Invoice Detected</p>
                <p className="text-sm">Invoice {matchedInvoice.invoiceNumber} is for a walk-in customer.</p>
                <p className="text-xs">Please uncheck "Link to Customer" to process this return.</p>
              </div>,
              { duration: 6000, icon: "⚠️" }
            );
            return; // STOP: Do not open dialog
          }

          // Invoice is valid and belongs to a customer -> Open dialog
          toast.dismiss(loadingToast);
          setShowCustomerReturnDialog(true);
          return;

        } catch (error) {
          toast.dismiss(loadingToast);
          console.error("Error validating invoice:", error);
          toast.error("Failed to validate invoice");
          return;
        }
      }

      // No reference number provided, just open dialog
      setShowCustomerReturnDialog(true);
      return;
    }

    // If it's a walk-in customer return (no customer link), require invoice number
    if (adjustmentType === "return_from_customer" && !linkToDueCustomer) {
      if (!referenceNumber) {
        toast.error("Please enter an invoice number for validation");
        return;
      }
      if (selectedProducts.length === 0) {
        toast.error("Please select at least one product");
        return;
      }
    }

    if (!adjustmentReason && !customReason) {
      toast.error("Please provide a reason for adjustment");
      return;
    }

    if (selectedType?.requiresReference && !referenceNumber && linkToDueCustomer) {
      toast.error(`Please provide ${selectedType.referenceLabel}`);
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      setLoading(true);

      // Professional Loading Toast
      const loadingToastId = toast.loading(
        adjustmentType === "return_from_customer" && !linkToDueCustomer
          ? "Processing walk-in customer return..."
          : adjustmentType === "return_from_customer" && linkToDueCustomer
            ? "Processing customer return..."
            : "Processing stock adjustment...",
        {
          icon: "⏳"
        }
      );

      const isRemoval = Object.values(adjustmentTypes.removals.types).some(
        (t) => t.value === adjustmentType
      );

      const adjustments = selectedProducts.map((product) => ({
        productId: product._id,
        type: isRemoval ? "remove" : "add",
        quantity: product.adjustmentQuantity,
        adjustmentType: adjustmentType,
        reason: customReason || adjustmentReason,
        reference: referenceNumber || null,
      }));

      const adjustmentPayload = {
        adjustments,
        reason: customReason || adjustmentReason,
        type: adjustmentType,
        reference: referenceNumber,
      };

      // Add customer return data if available AND linkToDueCustomer is enabled
      if (adjustmentType === "return_from_customer" && linkToDueCustomer && customerReturnData) {
        adjustmentPayload.customer = customerReturnData.customer;
        adjustmentPayload.invoice = customerReturnData.invoice;
        adjustmentPayload.returnTotal = customerReturnData.total;
        adjustmentPayload.returnTax = customerReturnData.tax;
        adjustmentPayload.returnSubtotal = customerReturnData.subtotal;
      }

      // Add refund method for walk-in customer returns
      if (adjustmentType === "return_from_customer" && !linkToDueCustomer && refundMethod) {
        adjustmentPayload.refundMethod = refundMethod;
      }

      const response = await batchStockAdjustment(adjustmentPayload);

      // Dismiss loading toast
      toast.dismiss(loadingToastId);

      // Professional Success Messages
      if (response.customerReturn) {
        // Customer-linked return success
        const { customer, returnAmount, invoice } = response.customerReturn;
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Customer Return Processed!</p>
            <p className="text-sm">Customer: {customer.name}</p>
            <p className="text-sm">Credit Amount: ₹{returnAmount.toFixed(2)}</p>
            {invoice && <p className="text-xs text-gray-600">Invoice: {invoice.invoiceNumber}</p>}
          </div>,
          {
            duration: 6000,
            icon: "✅"
          }
        );
      } else if (adjustmentType === "return_from_customer" && referenceNumber) {
        // Walk-in return success
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Walk-in Return Processed!</p>
            <p className="text-sm">Invoice: {referenceNumber}</p>
            <p className="text-sm">{selectedProducts.length} product(s) returned</p>
          </div>,
          {
            duration: 5000,
            icon: "✅"
          }
        );
      } else {
        // General adjustment success
        const selectedType = getSelectedAdjustmentType();
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Stock Adjusted Successfully!</p>
            <p className="text-sm">Type: {selectedType?.label || "Stock Adjustment"}</p>
            <p className="text-sm">{selectedProducts.length} product(s) updated</p>
          </div>,
          {
            duration: 4000,
            icon: "✅"
          }
        );
      }

      // Reset form
      setSelectedProducts([]);
      setAdjustmentType("");
      setAdjustmentReason("");
      setCustomReason("");
      setReferenceNumber("");
      setCustomerReturnData(null);
      setLinkToDueCustomer(false);
      setRefundMethod("cash"); // Reset to default
      loadProducts();
    } catch (error) {
      // Professional Error Messages
      const errorMessage = error.message || "Failed to process adjustment";

      // Check for specific error types
      if (errorMessage.includes("Invoice") && errorMessage.includes("not found")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Invoice Not Found</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          {
            duration: 5000,
            icon: "❌"
          }
        );
      } else if (errorMessage.includes("was not found in invoice")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Product Validation Failed</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          {
            duration: 6000,
            icon: "⚠️"
          }
        );
      } else if (errorMessage.includes("Cannot return") || errorMessage.includes("only had")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Quantity Exceeded</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          {
            duration: 6000,
            icon: "⚠️"
          }
        );
      } else if (errorMessage.includes("Insufficient stock")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Insufficient Stock</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          {
            duration: 5000,
            icon: "⚠️"
          }
        );
      } else {
        // Generic error
        toast.error(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Adjustment Failed</p>
            <p className="text-sm">{errorMessage}</p>
          </div>,
          {
            duration: 5000,
            icon: "❌"
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 lg:px-8 py-4 mb-6 sm:mb-8 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
          <div className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-black/5">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Stock Adjustment</h1>
            <p className="text-sm text-slate-500 font-medium">Manage and track inventory changes</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Adjustment Type Selection */}
        {/* Adjustment Type Selection - Professional Tabs & Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-fadeIn">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 backdrop-blur-sm">
            {[
              { id: 'additions', label: 'Stock Additions', icon: TrendingUp, color: 'emerald' },
              { id: 'removals', label: 'Stock Removals', icon: TrendingDown, color: 'rose' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const ColorIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setAdjustmentType('');
                    setAdjustmentReason('');
                    setReferenceNumber('');
                  }}
                  className={`
                    flex-1 py-4 px-4 flex items-center justify-center gap-2.5 text-sm sm:text-base font-semibold transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                    ${isActive
                      ? 'bg-white text-slate-900 shadow-[0_-1px_2px_rgba(0,0,0,0.02)]'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }
                  `}
                >
                  <ColorIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? `text-${tab.color}-600` : 'text-slate-400'}`} />
                  {tab.label}
                  {isActive && (
                    <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-${tab.color}-500 transition-all`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-6 bg-white">
            {/* Dynamic Content based on Active Tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {adjustmentTypes[activeTab].types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setAdjustmentType(type.value);
                    setAdjustmentReason("");
                    setReferenceNumber("");
                  }}
                  className={`
                      group relative p-4 rounded-xl border transition-all duration-200 text-left hover:shadow-md
                      ${adjustmentType === type.value
                      ? `border-${adjustmentTypes[activeTab].color === 'green' ? 'emerald' : 'rose'}-500 bg-${adjustmentTypes[activeTab].color === 'green' ? 'emerald' : 'rose'}-50 shadow-sm ring-1 ring-${adjustmentTypes[activeTab].color === 'green' ? 'emerald' : 'rose'}-500/20`
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }
                    `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                        p-2 rounded-lg flex-shrink-0 transition-colors
                        ${adjustmentType === type.value
                        ? `bg-white text-${adjustmentTypes[activeTab].color === 'green' ? 'emerald' : 'rose'}-600 shadow-sm`
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-sm"
                      }
                      `}>
                      <type.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className={`font-semibold text-sm sm:text-base mb-1 ${adjustmentType === type.value ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                        {type.label}
                      </h5>
                      <p className={`text-xs sm:text-sm line-clamp-2 ${adjustmentType === type.value ? 'text-slate-600' : 'text-slate-500'}`}>
                        {type.description}
                      </p>
                    </div>

                    {adjustmentType === type.value && (
                      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-${adjustmentTypes[activeTab].color === 'green' ? 'emerald' : 'rose'}-500`} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {adjustmentType && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fadeIn">
            {/* Product Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                Select Products
              </h3>

              {/* Search */}
              <div className="relative mb-3 sm:mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm outline-none"
                />
              </div>

              {/* Products List */}
              <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.find(
                    (p) => p._id === product._id
                  );

                  return (
                    <div
                      key={product._id}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                        ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      onClick={() =>
                        !isSelected && addProductForAdjustment(product)
                      }
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base mb-1 truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                            <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                              {product.stock} {product.unit}
                            </span>
                            <span className="truncate text-slate-400">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="bg-blue-500 rounded-full p-1 text-white shadow-sm">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-slate-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adjustment Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Adjustment Details
              </h3>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 px-4">
                    Select products from the left to adjust stock
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Selected Type Info */}
                  {(() => {
                    const selectedType = getSelectedAdjustmentType();
                    return selectedType ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <selectedType.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-medium text-blue-900">
                              {selectedType.label}
                            </h4>
                            <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
                              {selectedType.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Link to Due Customer Toggle - Only for Customer Returns */}
                  {adjustmentType === "return_from_customer" && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex items-center h-6 shrink-0">
                          <input
                            type="checkbox"
                            checked={linkToDueCustomer}
                            onChange={(e) => {
                              setLinkToDueCustomer(e.target.checked);
                              if (!e.target.checked) {
                                setCustomerReturnData(null);
                              }
                            }}
                            className="w-5 h-5 min-h-[20px] min-w-[20px] rounded border-2 border-purple-400 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer transition-all shrink-0 aspect-square"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                              Link to Due Customer
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${linkToDueCustomer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {linkToDueCustomer ? 'Enabled' : 'Optional'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                            Enable this to link the return to a customer and reduce their due balance.
                            {linkToDueCustomer && " You'll be able to select the customer and optionally link to an invoice for tax calculation."}
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Walk-in Customer Return (No Customer Link) - Invoice Validation Only */}
                  {adjustmentType === "return_from_customer" && !linkToDueCustomer && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            Walk-in Customer Return
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            For returns without linking to a customer account. Enter the invoice number to validate products and quantities.
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Invoice Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all"
                            placeholder="Enter invoice number (e.g., INV-001)"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Products will be validated against this invoice to ensure they exist and quantities don't exceed the invoice.
                        </p>
                      </div>

                      {/* Refund Method Selector */}
                      <div className="mt-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Refund Method <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'cash', label: 'Cash', icon: '💵' },
                            { value: 'card', label: 'Card', icon: '💳' },
                            { value: 'online', label: 'Online', icon: '📱' },
                            { value: 'other', label: 'Other', icon: '🔄' }
                          ].map((method) => (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => setRefundMethod(method.value)}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${refundMethod === method.value
                                ? 'border-amber-500 bg-amber-50 text-amber-900'
                                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{method.icon}</span>
                                <span>{method.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          How did you refund the money to the customer?
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reference Number if required - Hide for walk-in customer returns as they have their own field */}
                  {(() => {
                    const selectedType = getSelectedAdjustmentType();
                    // Don't show if it's a walk-in customer return (handled by dedicated walk-in field)
                    const isWalkInReturn = adjustmentType === "return_from_customer" && !linkToDueCustomer;

                    return selectedType?.requiresReference && !isWalkInReturn ? (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          {selectedType.referenceLabel}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder={`Enter ${selectedType.referenceLabel.toLowerCase()}`}
                          />
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Selected Products */}
                  <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {selectedProducts.map((product) => {
                      const isRemoval = Object.values(
                        adjustmentTypes.removals.types
                      ).some((t) => t.value === adjustmentType);

                      return (
                        <div
                          key={product._id}
                          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group"
                        >
                          {/* Item Header */}
                          <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">{product.name}</p>
                              <p className="text-xs text-slate-500">Current Stock: {product.stock} {product.unit}</p>
                            </div>
                            <button
                              onClick={() => removeProductFromAdjustment(product._id)}
                              className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-rose-50"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Adjustment Input */}
                          <div className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${isRemoval ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isRemoval ? <Minus size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                                {isRemoval ? "REMOVE" : "ADD"}
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={product.adjustmentQuantity}
                                  onChange={(e) => updateAdjustment(product._id, "adjustmentQuantity", parseFloat(e.target.value) || 0)}
                                  min={product.minQuantity || 0.01}
                                  step={product.minQuantity || 0.01}
                                  className="w-full pl-3 pr-12 py-1.5 text-sm font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-right"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                                  {product.unit}
                                </span>
                              </div>
                            </div>

                            {/* Result Preview */}
                            <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-50 pt-2">
                              <span className="text-slate-500">Resulting Stock:</span>
                              <span className={`font-mono font-bold ${(isRemoval && (product.stock - product.adjustmentQuantity < 0))
                                ? 'text-rose-600'
                                : 'text-slate-700'
                                }`}>
                                {isRemoval
                                  ? Math.max(0, Number((product.stock - product.adjustmentQuantity).toFixed(2)))
                                  : Number((product.stock + product.adjustmentQuantity).toFixed(2))
                                } {product.unit}
                              </span>
                            </div>

                            {isRemoval && (product.stock - product.adjustmentQuantity < 0) && (
                              <div className="mt-2 text-xs bg-rose-50 text-rose-600 p-2 rounded flex items-center gap-1.5">
                                <AlertCircle size={12} />
                                <span>Exceeds available stock!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reason Selection/Input */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Reason for Adjustment{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    {/* Quick Reasons */}
                    {quickReasons[adjustmentType] && (
                      <div className="mb-2 sm:mb-3">
                        <p className="text-xs text-gray-500 mb-1 sm:mb-2">
                          Quick select:
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {quickReasons[adjustmentType].map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                setAdjustmentReason(reason);
                                setCustomReason("");
                              }}
                              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-all ${adjustmentReason === reason
                                ? "bg-blue-100 text-blue-700 border border-blue-300 shadow-sm"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <textarea
                      value={customReason}
                      onChange={(e) => {
                        setCustomReason(e.target.value);
                        setAdjustmentReason("");
                      }}
                      rows="3"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                      placeholder={
                        adjustmentReason
                          ? "Or enter a custom reason..."
                          : "Enter reason for adjustment..."
                      }
                    />
                    {adjustmentReason && !customReason && (
                      <p className="text-xs text-blue-600 mt-1">
                        Selected: {adjustmentReason}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-slate-500" />
                      Adjustment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200 border-dashed">
                        <span className="text-slate-500">Adjustment Type</span>
                        <span className="font-medium text-slate-900">
                          {getSelectedAdjustmentType()?.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200 border-dashed">
                        <span className="text-slate-500">Selected Products</span>
                        <span className="font-medium text-slate-900">
                          {selectedProducts.length} items
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 pt-2">
                        <span className="text-slate-500">Total Quantity Change</span>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                          {selectedProducts.reduce(
                            (sum, p) => sum + p.adjustmentQuantity,
                            0
                          ).toFixed(2)} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Return Info */}
                  {adjustmentType === "return_from_customer" && linkToDueCustomer && customerReturnData && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 mb-1">
                            Customer Return Details
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Customer:</span>
                              <span className="font-medium text-green-900">
                                {customerReturnData.customer.name}
                              </span>
                            </div>
                            {customerReturnData.invoice && (
                              <div className="flex justify-between">
                                <span className="text-green-700">Invoice:</span>
                                <span className="font-medium text-green-900">
                                  {customerReturnData.invoice.invoiceNumber}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-green-700">Return Amount:</span>
                              <span className="font-semibold text-green-900">
                                ₹{customerReturnData.total.toFixed(2)}
                              </span>
                            </div>
                            {customerReturnData.tax > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-green-600">
                                  (incl. Tax: ₹{customerReturnData.tax.toFixed(2)})
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setCustomerReturnData(null);
                              setShowCustomerReturnDialog(true);
                            }}
                            className="mt-2 text-xs text-green-700 hover:text-green-800 font-medium"
                          >
                            Change Customer/Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
                    <div className="flex gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-yellow-800">
                        <p className="font-medium mb-1">Important Notice</p>
                        <p className="leading-relaxed">
                          This adjustment will be permanently recorded in the
                          stock history with full audit trail including user,
                          timestamp, and reason.
                          {adjustmentType === "return_from_customer" && linkToDueCustomer && customerReturnData && (
                            <span className="block mt-1 font-medium">
                              Customer transaction will also be created and due balance will be updated.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleBulkAdjustment}
                    disabled={
                      loading ||
                      !adjustmentType ||
                      (!adjustmentReason && !customReason) ||
                      selectedProducts.length === 0
                    }
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span className="hidden sm:inline">
                          Processing Adjustment...
                        </span>
                        <span className="sm:hidden">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">
                          {adjustmentType === "return_from_customer" && linkToDueCustomer && !customerReturnData
                            ? "Select Customer to Continue"
                            : "Apply Stock Adjustment"}
                        </span>
                        <span className="sm:hidden">
                          {adjustmentType === "return_from_customer" && linkToDueCustomer && !customerReturnData
                            ? "Select Customer"
                            : "Apply Adjustment"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Return Dialog */}
        <CustomerReturnDialog
          isOpen={showCustomerReturnDialog}
          onClose={() => setShowCustomerReturnDialog(false)}
          selectedProducts={selectedProducts}
          onSuccess={(returnData) => setCustomerReturnData(returnData)}
          initialReference={referenceNumber}
        />
      </div>
    </div>
  );
};

export default StockAdjustment;
