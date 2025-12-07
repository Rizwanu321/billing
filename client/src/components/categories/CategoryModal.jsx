import React, { useEffect, useRef } from "react";
import { X, Save, AlertCircle, Folder, FileText } from "lucide-react";

const CategoryModal = ({
  isOpen,
  currentCategory,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Positioning */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={modalRef}
          className="relative transform rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Folder className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white">
                  {currentCategory ? "Edit Category" : "New Category"}
                </h2>
                <p className="text-blue-100 text-sm mt-0.5">
                  {currentCategory
                    ? "Update category details."
                    : "Create a new product category."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:bg-white/20 hover:text-white rounded-lg transition-colors focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="category-name"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <Folder className="h-4 w-4 text-blue-600" />
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="category-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base outline-none"
                  placeholder="e.g. Electronics, Summer Collection"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label
                  htmlFor="category-description"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base outline-none resize-none"
                  placeholder="Add a brief description to help organize your inventory..."
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center bg-blue-50 p-2 rounded-lg text-blue-700 border border-blue-100">
                  <AlertCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                  Descriptions are useful for searching and organizing your inventory.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 focus:outline-none transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
              >
                <Save className="h-5 w-5 mr-2" />
                {currentCategory ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
