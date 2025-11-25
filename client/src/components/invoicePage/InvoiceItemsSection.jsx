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
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-visible">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ShoppingCart className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-600" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            Invoice Items
          </h3>
        </div>
        <button
          onClick={handleAddItem}
          className="w-full sm:w-auto flex items-center justify-center px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors group text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
          Add Item
        </button>
      </div>

      {/* Empty State */}
      {localInvoice.items.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4 sm:px-6">
          <Package className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">
            No items added. Click "Add Item" to begin.
          </p>
        </div>
      )}

      {/* Mobile View - Card Layout */}
      {localInvoice.items.length > 0 && (
        <>
          {/* Mobile Cards */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {localInvoice.items.map((item, index) => {
                const selectedProduct = getProductFromItem(item);
                return (
                  <div key={index} className="p-4 space-y-3">
                    {/* Product Selection */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Product
                      </label>
                      <ProductAutocomplete
                        products={products}
                        value={selectedProduct}
                        onChange={(product) => handleItemChange(index, product)}
                        placeholder="Select Product"
                      />
                    </div>

                    {/* Quantity, Unit, Price Row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
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
                          className="w-full text-center border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Unit
                        </label>
                        <div className="bg-gray-50 px-2 py-1.5 rounded text-center text-sm text-gray-600">
                          {getProductUnit(item.product)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Price
                        </label>
                        <div className="bg-gray-50 px-2 py-1.5 rounded text-center text-sm font-medium">
                          ₹{(item.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Subtotal and Delete */}
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <span className="text-xs text-gray-500">
                          Subtotal:{" "}
                        </span>
                        <span className="font-bold text-indigo-600">
                          ₹{(item.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop/Tablet View - Table Layout */}
          <div className="hidden sm:block overflow-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" />
                      Product
                    </div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {localInvoice.items.map((item, index) => {
                  const selectedProduct = getProductFromItem(item);
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-3">
                        <ProductAutocomplete
                          products={products}
                          value={selectedProduct}
                          onChange={(product) =>
                            handleItemChange(index, product)
                          }
                          placeholder="Select Product"
                        />
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-center">
                        <input
                          type="number"
                          min={getProductMinQuantity(item.product)}
                          step={getProductMinQuantity(item.product)}
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, e.target.value)
                          }
                          className="w-16 lg:w-20 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-center text-sm text-gray-500">
                        {getProductUnit(item.product)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right text-sm font-medium">
                        ₹{(item.price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-right text-sm font-bold text-indigo-600">
                        ₹{(item.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                        >
                          <Trash className="w-4 lg:w-5 h-4 lg:h-5" />
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
