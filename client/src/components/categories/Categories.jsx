import React, { useState, useEffect } from "react";
import CategoryList from "./CategoryList";
import CategoryModal from "./CategoryModal";
import SearchBar from "../products/SearchBar";
import EmptyState from "../products/EmptyState";
import { Plus, FolderIcon, Grid3X3, List, Loader2 } from "lucide-react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categories";
import { toast } from "react-toastify";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCategory) {
        await updateCategory(currentCategory._id, formData);
        toast.success("Category updated successfully");
      } else {
        await createCategory(formData);
        toast.success("Category created successfully");
      }
      loadCategories();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const resetForm = () => {
    setCurrentCategory(null);
    setFormData({ name: "", description: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Manage your product categories
          </p>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and organize your product categories
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search categories..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="List View"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Content */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg lg:rounded-xl shadow-sm p-8 lg:p-12">
            <EmptyState
              icon={FolderIcon}
              title="No categories found"
              message={
                searchTerm
                  ? "Try adjusting your search"
                  : "Get started by adding your first category"
              }
              action={
                !searchTerm && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Category
                  </button>
                )
              }
            />
          </div>
        ) : (
          <CategoryList
            categories={filteredCategories}
            viewMode={viewMode}
            onEdit={(category) => {
              setCurrentCategory(category);
              setFormData({
                name: category.name,
                description: category.description || "",
              });
              setIsModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        currentCategory={currentCategory}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      />
    </div>
  );
};

export default Categories;
