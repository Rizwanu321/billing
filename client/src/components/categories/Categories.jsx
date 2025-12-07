import React, { useState, useEffect } from "react";
import CategoryList from "./CategoryList";
import CategoryModal from "./CategoryModal";
import EmptyState from "../products/EmptyState";
import {
  Plus,
  Layers, // Changed from LayerTriggers to Layers which is a valid icon
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Search,
  Folder,
  Tag,
  Clock,
} from "lucide-react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categories";
import { toast } from "react-hot-toast";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [formData, setFormData] = useState({ name: "", description: "" });

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
      toast.success("Category removed successfully");
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

  const stats = [
    {
      label: "Total Categories",
      value: categories.length,
      icon: Folder,
      color: "blue",
    },
    {
      label: "Active",
      value: categories.length,
      icon: Tag,
      color: "green",
    },
    {
      label: "Newest Added",
      value: categories.length > 0 ? categories[categories.length - 1].name : "-",
      icon: Clock,
      color: "purple",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading your categories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Categories
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and organize your product catalog structure
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Category
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1 truncate max-w-[150px]">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Search & Layout Actions */}
        <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 sm:text-sm"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <ListIcon className="h-4 w-4 mr-2" />
              List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 min-h-[400px]">
          {filteredCategories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={searchTerm ? "No matching categories" : "No categories yet"}
              message={
                searchTerm
                  ? `No categories found matching "${searchTerm}". Try a different search term.`
                  : "Create your first category to start organizing your products."
              }
              action={
                !searchTerm && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Category
                  </button>
                )
              }
            />
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
      </div>

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
