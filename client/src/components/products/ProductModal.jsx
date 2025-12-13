import React, { useState, useEffect } from "react";
import { fetchCategories } from "../../api/categories";
import { X, Package, Tag, IndianRupee, Box } from "lucide-react";
import { useTranslation } from "react-i18next";

const ProductModal = ({
  currentProduct,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unitOptions = [
    { value: "piece", label: "Piece", minStep: 1 },
    { value: "kg", label: "Kilogram (kg)", minStep: 0.01 },
    { value: "gram", label: "Gram (g)", minStep: 0.01 },
    { value: "liter", label: "Liter (L)", minStep: 0.01 },
    { value: "ml", label: "Milliliter (ml)", minStep: 0.01 },
    { value: "packet", label: "Packet", minStep: 1 },
    { value: "box", label: "Box", minStep: 1 },
    { value: "dozen", label: "Dozen", minStep: 1 },
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
    setFormData((prev) => {
      const updates = { [field]: value };

      // Auto-set minQuantity when unit changes
      if (field === "unit") {
        const selectedUnit = unitOptions.find(opt => opt.value === value);
        if (selectedUnit) {
          updates.minQuantity = selectedUnit.minStep;
        }
      }

      return { ...prev, ...updates };
    });
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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {currentProduct ? t('products.editProduct') : t('products.addNewProduct')}
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5 hidden sm:block">
                {currentProduct
                  ? t('products.updateProductInformation')
                  : t('products.createNewProductInInventory')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200 flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Product Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Tag className="h-4 w-4 text-blue-600" />
                {t('products.productName')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder={t('products.enterProductName')}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Box className="h-4 w-4 text-blue-600" />
                {t('products.category')} *
              </label>
              {loading ? (
                <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-gray-500 text-sm sm:text-base">
                  {t('products.loadingCategories')}...
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : (
                <select
                  value={getCurrentCategoryValue()}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-white"
                  required
                >
                  <option value="">{t('products.selectCategory')}</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Unit of Measurement */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  {t('products.unit')} *
                </label>
                <select
                  value={formData.unit || "piece"}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base bg-white"
                  required
                >
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Quantity - Auto-suggested but editable */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  {t('products.minQtyStep')} *
                  <span className="ml-auto text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded">{t('products.suggested')}</span>
                </label>
                <input
                  type="number"
                  value={formData.minQuantity || 0.01}
                  onChange={(e) =>
                    handleInputChange("minQuantity", parseFloat(e.target.value))
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  min="0.01"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('products.autoFilledBasedOnUnit')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Price */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                  {t('products.pricePer')} {formData.unit || t('products.unit')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm sm:text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Initial Stock - Only shown when adding new product AND stock management is enabled */}
              {!currentProduct && formData.isStockRequired && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Box className="h-4 w-4 text-blue-600" />
                    {t('products.initialStock')} *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    min="0"
                    step={formData.minQuantity || 0.01}
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    {t('products.in')} {formData.unit || t('products.units')}
                  </p>
                </div>
              )}
            </div>

            {/* Stock Management Toggle */}
            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100">
              <label className="flex items-start cursor-pointer gap-3">
                <input
                  type="checkbox"
                  id="isStockRequired"
                  checked={formData.isStockRequired || false}
                  onChange={(e) =>
                    handleInputChange("isStockRequired", e.target.checked)
                  }
                  className="w-5 h-5 min-h-[20px] min-w-[20px] text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 rounded cursor-pointer mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 block">
                    {t('products.enableStockManagement')}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('products.trackInventoryLevels')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl text-gray-700 font-medium hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
              >
                {t('products.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all duration-200 text-sm sm:text-base"
              >
                {currentProduct ? t('products.updateProduct') : t('products.createProduct')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
