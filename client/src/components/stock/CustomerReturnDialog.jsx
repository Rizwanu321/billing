// components/stock/CustomerReturnDialog.jsx - Professional Customer Return Handler
import React, { useState, useEffect } from "react";
import {
    X,
    Search,
    User,
    FileText,
    Package,
    IndianRupee,
    AlertCircle,
    CheckCircle,
    Calendar,
    ShoppingBag,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const CustomerReturnDialog = ({ isOpen, onClose, selectedProducts, onSuccess, initialReference }) => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Select Customer, 2: Select Invoice (optional), 3: Confirm

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
            if (initialReference) {
                handleInitialReference(initialReference);
            }
        }
    }, [isOpen, initialReference]);

    const handleInitialReference = async (ref) => {
        try {
            const token = localStorage.getItem("token");
            // Search for invoice globally
            const response = await axios.get(
                `http://localhost:5000/api/invoices?search=${ref}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const invoices = response.data.data;
            const matchedInvoice = invoices.find(inv =>
                inv.invoiceNumber.toLowerCase() === ref.toLowerCase()
            );

            if (matchedInvoice) {
                // Check if it's a walk-in invoice (no customer linked)
                if (!matchedInvoice.customer || !matchedInvoice.customer._id) {
                    toast.error(
                        <div className="flex flex-col gap-1">
                            <p className="font-semibold">Walk-in Invoice Detected</p>
                            <p className="text-sm">Invoice {matchedInvoice.invoiceNumber} is for a walk-in customer.</p>
                            <p className="text-xs">Please close this dialog and use the "Walk-in Customer Return" flow (uncheck "Link to Customer").</p>
                        </div>,
                        { duration: 6000, icon: "⚠️" }
                    );
                    return;
                }

                // Found invoice and it has a customer
                // Fetch full customer details
                const customerRes = await axios.get(
                    `http://localhost:5000/api/customers/${matchedInvoice.customer._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const customer = customerRes.data;
                if (customer) {
                    setSelectedCustomer(customer);
                    setSelectedInvoice(matchedInvoice);
                    // Filter the list to show ONLY this customer
                    setCustomers([customer]);
                    setSearchTerm(customer.name);
                    toast.success(`Invoice matched to ${customer.name}`);
                }
            }
        } catch (error) {
            console.error("Error searching invoice:", error);
        }
    };

    useEffect(() => {
        if (selectedCustomer) {
            loadCustomerInvoices();
        }
    }, [selectedCustomer]);

    const loadCustomers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/customers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Show ALL customers, but sort those with dues to the top
            const sortedCustomers = response.data.sort((a, b) => {
                // Sort by amountDue descending (higher dues first)
                return b.amountDue - a.amountDue;
            });
            setCustomers(sortedCustomers);
        } catch (error) {
            toast.error("Failed to load customers");
        }
    };

    const loadCustomerInvoices = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:5000/api/invoices?customerId=${selectedCustomer._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            // Filter to show only final/paid invoices
            const validInvoices = response.data.filter(
                (inv) => inv.status === "final" || inv.status === "paid"
            );
            setCustomerInvoices(validInvoices);

            // Auto-select invoice if it matches initialReference AND not already selected
            if (initialReference && !selectedInvoice) {
                const matchedInvoice = validInvoices.find(inv =>
                    inv.invoiceNumber.toLowerCase() === initialReference.toLowerCase() ||
                    initialReference.toLowerCase().includes(inv.invoiceNumber.toLowerCase())
                );
                if (matchedInvoice) {
                    setSelectedInvoice(matchedInvoice);
                    // Don't toast here if we already toasted in global search
                }
            }
        } catch (error) {
            console.error("Failed to load invoices:", error);
            setCustomerInvoices([]);
        }
    };

    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phoneNumber.includes(searchTerm)
    );

    const calculateReturnTotal = () => {
        return selectedProducts.reduce(
            (sum, product) => sum + (product.adjustmentQuantity * product.price),
            0
        );
    };

    const calculateReturnTax = () => {
        if (selectedInvoice && selectedInvoice.tax > 0) {
            const invoiceSubtotal = selectedInvoice.subtotal;
            const taxRate = (selectedInvoice.tax / invoiceSubtotal) * 100;
            return (calculateReturnTotal() * taxRate) / 100;
        }
        return 0;
    };

    const getTotalWithTax = () => {
        return calculateReturnTotal() + calculateReturnTax();
    };

    // Validate products against selected invoice
    const getInvoiceValidation = () => {
        if (!selectedInvoice || !selectedInvoice.items) {
            return { isValid: true, warnings: [], errors: [] };
        }

        const warnings = [];
        const errors = [];

        selectedProducts.forEach(returnProduct => {
            // Find matching product in invoice
            const invoiceItem = selectedInvoice.items.find(
                item => item.product._id === returnProduct._id ||
                    item.product === returnProduct._id
            );

            if (!invoiceItem) {
                errors.push({
                    product: returnProduct.name,
                    message: `${returnProduct.name} was not in invoice ${selectedInvoice.invoiceNumber}`
                });
            } else {
                // Check if return quantity exceeds purchased quantity
                if (returnProduct.adjustmentQuantity > invoiceItem.quantity) {
                    errors.push({
                        product: returnProduct.name,
                        message: `Cannot return ${returnProduct.adjustmentQuantity} ${returnProduct.unit} of ${returnProduct.name}. Invoice only had ${invoiceItem.quantity} ${invoiceItem.unit}.`
                    });
                } else if (returnProduct.adjustmentQuantity === invoiceItem.quantity) {
                    warnings.push({
                        product: returnProduct.name,
                        message: `Full quantity of ${returnProduct.name} is being returned (${invoiceItem.quantity} ${invoiceItem.unit})`
                    });
                }
            }
        });

        return {
            isValid: errors.length === 0,
            warnings,
            errors
        };
    };

    const handleConfirm = () => {
        const returnData = {
            customer: selectedCustomer,
            invoice: selectedInvoice,
            products: selectedProducts,
            subtotal: calculateReturnTotal(),
            tax: calculateReturnTax(),
            total: getTotalWithTax(),
        };
        onSuccess(returnData);
        handleClose();
    };

    const handleClose = () => {
        setSelectedCustomer(null);
        setSelectedInvoice(null);
        setCustomerInvoices([]);
        setSearchTerm("");
        setStep(1);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">Customer Return</h2>
                            <p className="text-sm text-blue-100 mt-0.5">
                                Select customer to process return and adjust balance
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-300 text-gray-600"
                                    }`}
                            >
                                1
                            </div>
                            <span className="text-sm font-medium">Select Customer</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-300 text-gray-600"
                                    }`}
                            >
                                2
                            </div>
                            <span className="text-sm font-medium">Confirm Return</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>

                                <p className="text-sm text-gray-600 mb-3">
                                    {filteredCustomers.length === 1 && searchTerm
                                        ? "Customer matched from invoice reference"
                                        : "Search for a customer to process their return"}
                                </p>

                                {/* Search - Only show when there are multiple visible customers OR when actively searching */}
                                {(filteredCustomers.length > 1 || (searchTerm && filteredCustomers.length > 0)) && (
                                    <div className="relative mb-4">

                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm("")}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                title="Clear search"
                                            >
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Customer List */}
                                <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="text-center py-12">
                                            <User className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No customers found</p>
                                            <p className="text-sm text-gray-400 mt-2">
                                                {searchTerm ? "Try a different search term" : "No customers available"}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredCustomers.map((customer) => (
                                            <button
                                                key={customer._id}
                                                onClick={() => {
                                                    // Always go to Confirm (Step 2)
                                                    setSelectedCustomer(customer);

                                                    // If we have a pre-selected invoice (from reference), keep it.
                                                    // Otherwise, clear it (unless we want to auto-select later).
                                                    if (!selectedInvoice || selectedInvoice.customer._id !== customer._id) {
                                                        setSelectedInvoice(null);
                                                    }

                                                    setStep(2);
                                                }}
                                                className={`w-full p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${selectedCustomer?._id === customer._id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-900">{customer.name}</p>
                                                        <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {customer.place}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1 text-red-600 font-semibold">
                                                                <IndianRupee className="w-4 h-4" />
                                                                <span>{customer.amountDue.toFixed(2)}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">Current Due</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-xs text-blue-700 font-medium mb-2">CUSTOMER</p>
                                    <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                                    <p className="text-sm text-gray-600">{selectedCustomer.phoneNumber}</p>
                                    <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-600">Current Due</p>
                                            <div className="flex items-center gap-1 text-red-600 font-semibold">
                                                <IndianRupee className="w-4 h-4" />
                                                <span>{selectedCustomer.amountDue.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        {/* Only show "After Return" if no errors */}
                                        {(!selectedInvoice || getInvoiceValidation().errors.length === 0) && (
                                            <div>
                                                <p className="text-xs text-gray-600">After Return</p>
                                                <div className="flex items-center gap-1 text-green-600 font-semibold">
                                                    <IndianRupee className="w-4 h-4" />
                                                    <span>{Math.max(0, selectedCustomer.amountDue - getTotalWithTax()).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                    <p className="text-xs text-purple-700 font-medium mb-2">INVOICE</p>
                                    {selectedInvoice ? (
                                        <>
                                            <p className="font-semibold text-gray-900">
                                                {selectedInvoice.invoiceNumber}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(selectedInvoice.date).toLocaleDateString()}
                                            </p>
                                            <div className="mt-2 pt-2 border-t border-purple-200">
                                                <p className="text-xs text-gray-600">Invoice Total</p>
                                                <div className="flex items-center gap-1 font-semibold">
                                                    <IndianRupee className="w-4 h-4" />
                                                    <span>{selectedInvoice.total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No invoice linked</p>
                                    )}
                                </div>
                            </div>

                            {/* Invoice Validation - Show errors and warnings AT TOP */}
                            {selectedInvoice && (() => {
                                const validation = getInvoiceValidation();

                                if (validation.errors.length > 0 || validation.warnings.length > 0) {
                                    return (
                                        <div className="space-y-2">
                                            {/* Errors */}
                                            {validation.errors.length > 0 && (
                                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
                                                    <div className="flex gap-3">
                                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-red-900 mb-2">Invoice Validation Errors</p>
                                                            <ul className="space-y-1 text-sm text-red-700">
                                                                {validation.errors.map((error, index) => (
                                                                    <li key={index} className="flex items-start gap-2">
                                                                        <span className="text-red-500 mt-0.5">•</span>
                                                                        <span>{error.message}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <p className="text-xs text-red-600 mt-2 font-medium">
                                                                ⚠️ Cannot proceed with these errors. Please adjust the return quantities or deselect the invoice.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Warnings */}
                                            {validation.warnings.length > 0 && validation.errors.length === 0 && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                                    <div className="flex gap-3">
                                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-yellow-900 mb-2">Validation Warnings</p>
                                                            <ul className="space-y-1 text-sm text-yellow-700">
                                                                {validation.warnings.map((warning, index) => (
                                                                    <li key={index} className="flex items-start gap-2">
                                                                        <span className="text-yellow-500 mt-0.5">•</span>
                                                                        <span>{warning.message}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Return Products */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Return Items ({selectedProducts.length})
                                </h3>
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="max-h-60 overflow-y-auto">
                                        {selectedProducts.map((product, index) => {
                                            // Check if this specific product has an error
                                            const validation = selectedInvoice ? getInvoiceValidation() : { errors: [] };
                                            const hasError = validation.errors.some(e => e.product === product.name);

                                            return (
                                                <div
                                                    key={product._id}
                                                    className={`p-4 ${index !== 0 ? "border-t" : ""} border-gray-200 ${hasError ? "bg-red-50" : ""}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className={`font-medium ${hasError ? "text-red-700" : "text-gray-900"}`}>
                                                                {product.name}
                                                                {hasError && <span className="text-xs text-red-600 ml-2 font-bold">(INVALID)</span>}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {product.adjustmentQuantity} {product.unit} × ₹
                                                                {product.price.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-gray-900">
                                                                ₹{(product.adjustmentQuantity * product.price).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Summary */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Return Summary</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">₹{calculateReturnTotal().toFixed(2)}</span>
                                    </div>
                                    {selectedInvoice && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                Tax
                                                {selectedInvoice.tax > 0 && (
                                                    <span className="text-xs text-blue-600 ml-1">
                                                        ({((selectedInvoice.tax / selectedInvoice.subtotal) * 100).toFixed(1)}% rate)
                                                    </span>
                                                )}:
                                            </span>
                                            <span className="font-medium">₹{calculateReturnTax().toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                                        <span className="font-semibold text-gray-900">Total Return:</span>
                                        <div className="flex items-center gap-1 font-bold text-lg text-blue-600">
                                            <IndianRupee className="w-5 h-5" />
                                            <span>{getTotalWithTax().toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Due Adjustment Info - ONLY SHOW IF NO ERRORS */}
                            {selectedCustomer.amountDue > 0 && (!selectedInvoice || getInvoiceValidation().errors.length === 0) && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-green-900">Due Adjustment</p>
                                            <p className="text-sm text-green-700 mt-1">
                                                This return amount (₹{getTotalWithTax().toFixed(2)}) will be deducted from the customer's due balance.
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-sm">
                                                <span className="text-green-700">New Due:</span>
                                                <span className="font-semibold text-green-900">
                                                    ₹{Math.max(0, selectedCustomer.amountDue - getTotalWithTax()).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t bg-gray-50 p-4 sm:p-6 flex justify-between gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        >
                            Back
                        </button>
                    )}
                    <div className="flex-1"></div>
                    <button
                        onClick={handleClose}
                        className="px-4 sm:px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    {step === 2 && (() => { // Changed from step === 3
                        const validation = selectedInvoice ? getInvoiceValidation() : { isValid: true, errors: [] };
                        const hasErrors = validation.errors.length > 0;

                        return (
                            <button
                                onClick={handleConfirm}
                                disabled={loading || hasErrors}
                                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg flex items-center gap-2"
                                title={hasErrors ? "Fix validation errors to proceed" : "Confirm return"}
                            >
                                <CheckCircle className="w-5 h-5" />
                                Confirm Return
                            </button>
                        );
                    })()}
                </div>
            </div>
        </div >
    );
};

export default CustomerReturnDialog;
