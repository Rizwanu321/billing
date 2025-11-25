import React, { useState, useEffect } from "react";
import { Plus, Search, Package } from "lucide-react";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../api/products";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockAdjustment, setStockAdjustment] = useState({
    type: "add",
    quantity: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
    setFilteredProducts(data);
  };

  const filterProducts = () => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await updateProduct(currentProduct._id, formData);
      } else {
        await createProduct(formData);
      }
      loadProducts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      const quantity =
        stockAdjustment.type === "remove"
          ? -Math.abs(parseInt(stockAdjustment.quantity))
          : Math.abs(parseInt(stockAdjustment.quantity));

      if (quantity === 0) {
        alert("Please enter a valid quantity");
        return;
      }

      await updateProductStock(currentProduct._id, {
        adjustment: quantity,
      });

      await loadProducts();
      setIsStockModalOpen(false);
      setStockAdjustment({ type: "add", quantity: 0 });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Error adjusting stock";
      alert(errorMessage);
      console.error("Error adjusting stock:", error);
    }
  };

  const resetForm = () => {
    setCurrentProduct(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
    });
  };

  // Empty state message component
  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg">
      <Package className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-500">
        {searchTerm
          ? "Try adjusting your search terms or clearing the search"
          : "Click the 'Add Product' button to add your first product"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-600 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search products by name or category"
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Grid with Empty State */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {filteredProducts.length === 0 ? (
          <EmptyState
            message={
              searchTerm
                ? "No products found matching your search"
                : "No products available"
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="p-4 border rounded-lg">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="font-medium">₹{product.price}</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      product.stock > 10
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Stock: {product.stock}
                  </span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setCurrentProduct(product);
                      setFormData(product);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setCurrentProduct(product);
                      setIsStockModalOpen(true);
                    }}
                  >
                    <Package className="h-4 w-4" />
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this product?"
                        )
                      ) {
                        await deleteProduct(product._id);
                        loadProducts();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {currentProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {currentProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Adjust Stock</h2>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-100 border rounded-md"
                  value={currentProduct?.name}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-100 border rounded-md"
                  value={currentProduct?.stock}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Adjustment Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={stockAdjustment.type}
                  onChange={(e) =>
                    setStockAdjustment((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={stockAdjustment.quantity}
                  onChange={(e) =>
                    setStockAdjustment((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setIsStockModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
