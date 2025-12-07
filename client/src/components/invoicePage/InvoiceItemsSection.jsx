import React from "react";
import { Plus, Trash, Package, DollarSign, ShoppingCart } from "lucide-react";
import ProductAutocomplete from "./ProductAutocomplete";

const InvoiceItemsSection = ({
  localInvoice,
  products,
  calculateTotals,
  updateInvoiceItems,
}) => {
  const handleAddItem = () => {
    const newItems = [
      ...localInvoice.items,
      {
        product: "",
        quantity: 1,
        unit: "piece",
        price: 0,
        subtotal: 0,
      },
    ];

    const totals = calculateTotals(newItems);
    updateInvoiceItems(newItems, totals);
  };

  const handleRemoveItem = (indexToRemove) => {
    const newItems = localInvoice.items.filter(
      (_, index) => index !== indexToRemove
    );
    const totals = calculateTotals(newItems);
    updateInvoiceItems(newItems, totals);
  };

  const handleItemChange = (index, product) => {
    const newItems = [...localInvoice.items];

    if (product) {
      newItems[index] = {
        product: product._id,
        quantity: newItems[index]?.quantity || 1,
        unit: product.unit || "piece",
        price: product.price || 0,
        subtotal: (product.price || 0) * (newItems[index]?.quantity || 1),
      };
    } else {
      newItems[index] = {
        product: "",
        quantity: 1,
        unit: "piece",
        price: 0,
        subtotal: 0,
      };
    }

    const totals = calculateTotals(newItems);
    updateInvoiceItems(newItems, totals);
  };

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...localInvoice.items];
    const productId =
      typeof newItems[index].product === "object"
        ? newItems[index].product._id
        : newItems[index].product;
    const selectedProduct = products.find((p) => p._id === productId);

    if (selectedProduct) {
      const numericQuantity = parseFloat(quantity);
      const minQuantity = selectedProduct.minQuantity || 0.01;
      const validQuantity = Math.max(minQuantity, numericQuantity);

      newItems[index] = {
        ...newItems[index],
        quantity: validQuantity,
        subtotal: (selectedProduct.price || 0) * validQuantity,
      };

      const totals = calculateTotals(newItems);
      updateInvoiceItems(newItems, totals);
    }
  };

  const getProductUnit = (productId) => {
    const id = typeof productId === "object" ? productId._id : productId;
    const product = products.find((p) => p._id === id);
    return product ? product.unit : "piece";
  };

  const getProductMinQuantity = (productId) => {
    const id = typeof productId === "object" ? productId._id : productId;
    const product = products.find((p) => p._id === id);
    return product ? product.minQuantity || 0.01 : 0.01;
  };

  const getProductFromItem = (item) => {
    if (!item.product) return null;

    if (typeof item.product === "string") {
      return products.find((p) => p._id === item.product);
    }

    if (typeof item.product === "object" && item.product._id) {
      return products.find((p) => p._id === item.product._id);
    }

    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Invoice Items
            </h3>
            <p className="text-sm text-slate-500">Add products to your invoice</p>
          </div>
        </div>
        <button
          onClick={handleAddItem}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors group border border-indigo-100"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          Add Item
        </button>
      </div>

      {/* Empty State */}
      {localInvoice.items.length === 0 && (
        <div className="text-center py-16 px-6 bg-slate-50/50">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-slate-900 font-medium mb-1">No items added yet</h4>
          <p className="text-slate-500 text-sm">
            Click the "Add Item" button to start building your invoice.
          </p>
        </div>
      )}

      {/* Mobile View - Card Layout */}
      {localInvoice.items.length > 0 && (
        <>
          {/* Mobile Cards */}
          <div className="block sm:hidden">
            <div className="divide-y divide-slate-100">
              {localInvoice.items.map((item, index) => {
                const selectedProduct = getProductFromItem(item);
                return (
                  <div key={index} className="p-5 space-y-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item #{index + 1}</span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Selection */}
                    <div>
                      <ProductAutocomplete
                        products={products}
                        value={selectedProduct}
                        onChange={(product) => handleItemChange(index, product)}
                        placeholder="Select Product"
                      // className="border-slate-200 rounded-xl"
                      />
                    </div>

                    {/* Quantity, Unit, Price Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={getProductMinQuantity(item.product)}
                          step={getProductMinQuantity(item.product)}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, e.target.value)
                          }
                          className="w-full text-center border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                          Unit
                        </label>
                        <div className="bg-slate-100 border border-slate-200 px-2 py-2 rounded-lg text-center text-sm text-slate-600 font-medium">
                          {getProductUnit(item.product)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                          Price
                        </label>
                        <div className="bg-slate-100 border border-slate-200 px-2 py-2 rounded-lg text-center text-sm font-medium text-slate-900">
                          ₹{(item.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                      <span className="text-sm font-medium text-slate-500">
                        Subtotal
                      </span>
                      <span className="font-bold text-lg text-indigo-600">
                        ₹{(item.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop/Tablet View - Table Layout */}
          <div className="hidden sm:block overflow-visible">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px]">
                    Product Details
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                    Qty
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">
                    Total
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-16">

                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {localInvoice.items.map((item, index) => {
                  const selectedProduct = getProductFromItem(item);
                  return (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <ProductAutocomplete
                          products={products}
                          value={selectedProduct}
                          onChange={(product) =>
                            handleItemChange(index, product)
                          }
                          placeholder="Select Product"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min={getProductMinQuantity(item.product)}
                          step={getProductMinQuantity(item.product)}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, e.target.value)
                          }
                          className="w-20 text-center border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-slate-500 font-medium">
                        {getProductUnit(item.product)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                        ₹{(item.price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-indigo-600">
                        ₹{(item.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Remove Item"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceItemsSection;
