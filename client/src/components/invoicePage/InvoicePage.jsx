import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Dialog from "./Dialog";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceForm from "./InvoiceForm";
import PaymentModal from "../PaymentModal";
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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
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

    const refreshCustomerData = async (customerId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5000/api/customers/${customerId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                    cache: "no-store",
                }
            );

            if (response.ok) {
                const updatedCustomer = await response.json();
                setSelectedCustomer(updatedCustomer);
                return updatedCustomer;
            }
        } catch (error) {
            console.error("Error refreshing customer data:", error);
        }
        return null;
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

            // Refresh customer data after saving if customer exists
            if (savedInvoice.customer?._id) {
                await refreshCustomerData(savedInvoice.customer._id);
            }
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

    const handlePaymentSuccess = async (paymentData) => {
        if (!selectedCustomer?._id) {
            toast.error("No customer selected");
            return;
        }

        try {
            // Call the API to record the payment
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5000/api/customers/${selectedCustomer._id}/payments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(paymentData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to record payment");
            }

            const result = await response.json();
            toast.success(result.message || "Payment recorded successfully!");
            setShowPaymentModal(false);

            // Refresh customer data after payment
            await refreshCustomerData(selectedCustomer._id);

            // Refresh invoice data to get updated dueAmount for PDF generation
            if (invoice._id) {
                try {
                    const invoiceResponse = await fetch(
                        `http://localhost:5000/api/invoices/${invoice._id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Cache-Control": "no-cache",
                                Pragma: "no-cache",
                            },
                            cache: "no-store",
                        }
                    );

                    if (invoiceResponse.ok) {
                        const updatedInvoice = await invoiceResponse.json();
                        const transformedInvoice = {
                            ...updatedInvoice,
                            items: updatedInvoice.items.map((item) => ({
                                ...item,
                                product: item.product._id || item.product,
                            })),
                        };
                        setInvoice(transformedInvoice);
                    }
                } catch (error) {
                    console.error("Error refreshing invoice data:", error);
                }
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error.message || "Error processing payment");
        }
    };

    // Expose function to open payment modal from child component
    useEffect(() => {
        window.openPaymentModal = async () => {
            if (selectedCustomer?._id) {
                await refreshCustomerData(selectedCustomer._id);
                setShowPaymentModal(true);
            }
        };
        return () => {
            delete window.openPaymentModal;
        };
    }, [selectedCustomer]);

    return (
        <div className="min-h-screen bg-slate-50 p-2 sm:p-6 lg:p-8 overflow-visible">
            <div className="max-w-7xl mx-auto overflow-visible space-y-6">
                <InvoiceHeader
                    onNewBilling={handleNewBilling}
                    taxEnabled={taxSettings.taxEnabled}
                />
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-visible ring-1 ring-black/5">
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

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                customer={selectedCustomer}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default InvoicePage;
