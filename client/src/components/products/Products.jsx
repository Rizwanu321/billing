// components/products/Products.jsx
import React, { useState, useEffect } from "react";
import ProductList from "./ProductList";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";
import StockAdjustmentModal from "./StockAdjustmentModal";
import SearchBar from "./SearchBar";
import EmptyState from "./EmptyState";
import { Plus, Package, Grid, List, Table2 } from "lucide-react";
import StockHistoryModal from "./StockHistoryModal";
import { toast } from "react-hot-toast";

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../../api/products";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // grid, list, or table
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockAdjustment, setStockAdjustment] = useState({
    type: "add",
    quantity: 0,
  });
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    unit: "piece",
    minQuantity: 0.01,
    isStockRequired: false,
  });
  const [isStockHistoryModalOpen, setIsStockHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState(null);

  const openStockHistoryModal = (product) => {
    setSelectedProductForHistory(product);
    setIsStockHistoryModalOpen(true);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category?._id === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (
        !formData.name ||
        !formData.price ||
        !formData.category ||
        !formData.unit
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseFloat(formData.stock || 0),
        minQuantity: parseFloat(formData.minQuantity || 0.01),
      };

      if (currentProduct) {
        await updateProduct(currentProduct._id, productData);
        toast.success("Product updated successfully");
      } else {
        await createProduct(productData);
        toast.success("Product created successfully");
      }

      loadProducts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);

      const quantity = parseFloat(stockAdjustment.quantity);

      if (isNaN(quantity) || quantity <= 0) {
        setError("Please enter a valid quantity");
        setLoading(false);
        return;
      }

      const minStep = currentProduct.minQuantity || 0.01;
      const epsilon = 0.00001;
      const remainder = Math.abs(quantity % minStep);
      const isValidMultiple =
        remainder < epsilon || Math.abs(remainder - minStep) < epsilon;

      if (!isValidMultiple) {
        setError(`Quantity must be a multiple of ${minStep}`);
        setLoading(false);
        return;
      }

      const adjustment =
        stockAdjustment.type === "remove"
          ? -Math.abs(quantity)
          : Math.abs(quantity);

      if (
        stockAdjustment.type === "remove" &&
        Math.abs(adjustment) > currentProduct.stock
      ) {
        setError(
          `Cannot remove more than the current stock (${currentProduct.stock} ${currentProduct.unit || "units"
          })`
        );
        setLoading(false);
        return;
      }

      const reason = `Manual ${stockAdjustment.type} via product management`;

      await updateProductStock(currentProduct._id, adjustment, reason);

      toast.success(
        `Stock ${stockAdjustment.type === "add" ? "added" : "removed"
        } successfully`
      );

      await loadProducts();
      setIsStockModalOpen(false);
      setStockAdjustment({ type: "add", quantity: 0 });
    } catch (error) {
      setError(error.message || "Error adjusting stock");
      toast.error(error.message || "Failed to adjust stock");
      console.error("Stock Adjustment Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setLoading(true);
        await deleteProduct(productId);
        toast.success("Product deleted successfully");
        loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setCurrentProduct(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      unit: "piece",
      minQuantity: 0.01,
      isStockRequired: false,
    });
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      ...product,
      category: product.category?._id || product.category,
      unit: product.unit || "piece",
      minQuantity: product.minQuantity || 0.01,
    });
    setIsModalOpen(true);
  };

  const openStockModal = (product) => {
    setCurrentProduct(product);
    const minQuantity = product.minQuantity || 0.01;
    setStockAdjustment({
      type: "add",
      quantity: minQuantity,
    });
    setIsStockModalOpen(true);
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category?._id).filter(Boolean))
  ).map((id) => {
    const product = products.find((p) => p.category?._id === id);
    return { _id: id, name: product?.category?.name };
  });

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.isStockRequired && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.isStockRequired && p.stock === 0)
      .length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                    Products
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">
                    Manage your inventory with ease
                  </p>
                </div>
              </div>
            </div>
            <button
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => setIsModalOpen(true)}
              disabled={loading}
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="text-sm sm:text-base">Add Product</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-600 font-medium mb-2">
                Total Products
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900">
                {stats.total}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4 border border-amber-200">
              <p className="text-xs sm:text-sm text-amber-600 font-medium mb-2">
                Low Stock
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-900">
                {stats.lowStock}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 sm:p-4 border border-red-200">
              <p className="text-xs sm:text-sm text-red-600 font-medium mb-2">
                Out of Stock
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-900">
                {stats.outOfStock}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-4 border border-green-200">
              <p className="text-xs sm:text-sm text-green-600 font-medium mb-2">
                Total Value
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-900">
                ₹{stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
              <select
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "table"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                  title="Table View"
                >
                  <Table2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                  title="Grid View"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                  title="List View"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          {loading && filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-gray-200 border-t-blue-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">
                Loading products...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searchTerm ? "No matching products" : "No products yet"}
              message={
                searchTerm
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first product"
              }
              action={
                <button
                  className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product
                </button>
              }
            />
          ) : viewMode === "table" ? (
            <ProductTable
              products={filteredProducts}
              onEdit={openEditModal}
              onStockAdjust={openStockModal}
              onDelete={handleDelete}
              onStockHistory={openStockHistoryModal}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
            />
          ) : (
            <ProductList
              products={filteredProducts}
              onEdit={openEditModal}
              onStockAdjust={openStockModal}
              onDelete={handleDelete}
              onStockHistory={openStockHistoryModal}
              viewMode={viewMode}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <ProductModal
          currentProduct={currentProduct}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          isLoading={loading}
        />
      )}
      {isStockModalOpen && (
        <StockAdjustmentModal
          currentProduct={currentProduct}
          stockAdjustment={stockAdjustment}
          setStockAdjustment={setStockAdjustment}
          onSubmit={handleStockAdjustment}
          onClose={() => setIsStockModalOpen(false)}
          error={error}
          isLoading={loading}
        />
      )}

      {isStockHistoryModalOpen && (
        <StockHistoryModal
          productId={selectedProductForHistory._id}
          productName={selectedProductForHistory.name}
          productUnit={selectedProductForHistory.unit || "piece"}
          onClose={() => {
            setIsStockHistoryModalOpen(false);
            setSelectedProductForHistory(null);
          }}
        />
      )}
    </div>
  );
};

export default Products;
