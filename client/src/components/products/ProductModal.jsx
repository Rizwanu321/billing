import React, { useState, useEffect } from "react";
import { fetchCategories } from "../../api/categories";
import { X, Package, Tag, IndianRupee, Box } from "lucide-react";

const ProductModal = ({
  currentProduct,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unitOptions = [
    { value: "piece", label: "Piece" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "gram", label: "Gram (g)" },
    { value: "liter", label: "Liter (L)" },
    { value: "ml", label: "Milliliter (ml)" },
    { value: "packet", label: "Packet" },
    { value: "box", label: "Box" },
    { value: "dozen", label: "Dozen" },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (currentProduct && currentProduct.category) {
      const categoryId = currentProduct.category._id || currentProduct.category;
      setFormData((prev) => ({
        ...prev,
        category: categoryId,
        unit: currentProduct.unit || "piece",
        minQuantity: currentProduct.minQuantity || 0.01,
      }));
    }
  }, [currentProduct, setFormData]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentCategoryValue = () => {
    if (!currentProduct) return formData.category || "";
    if (
      currentProduct.category &&
      typeof currentProduct.category === "object"
    ) {
      return currentProduct.category._id;
    }
    return currentProduct.category || formData.category || "";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {currentProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-blue-100 text-sm mt-0.5">
                {currentProduct
                  ? "Update product information"
                  : "Create a new product in your inventory"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Tag className="h-4 w-4 text-blue-600" />
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Box className="h-4 w-4 text-blue-600" />
              Category *
            </label>
            {loading ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-500">
                Loading categories...
              </div>
            ) : error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : (
              <select
                value={getCurrentCategoryValue()}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Unit of Measurement */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                Unit of Measurement *
              </label>
              <select
                value={formData.unit || "piece"}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                required
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Quantity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                Min Quantity Step *
              </label>
              <input
                type="number"
                value={formData.minQuantity || 0.01}
                onChange={(e) =>
                  handleInputChange("minQuantity", parseFloat(e.target.value))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                min="0.01"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Smallest sellable amount
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <IndianRupee className="h-4 w-4 text-blue-600" />
                Price per {formData.unit || "unit"} *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Initial Stock */}
            {!currentProduct && (
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Box className="h-4 w-4 text-blue-600" />
                  Initial Stock *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  min="0"
                  step={formData.minQuantity || 0.01}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  In {formData.unit || "units"}
                </p>
              </div>
            )}
          </div>

          {/* Stock Management Toggle */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="isStockRequired"
                checked={formData.isStockRequired || false}
                onChange={(e) =>
                  handleInputChange("isStockRequired", e.target.checked)
                }
                className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                Enable Stock Management
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-2 ml-8">
              Track inventory levels and receive low stock alerts
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {currentProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
