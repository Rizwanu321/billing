import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  MoreHorizontal,
  Folder,
  Calendar,
  AlertCircle,
  Package,
} from "lucide-react";

const CategoryList = ({ categories, viewMode, onEdit, onDelete }) => {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const ActionMenu = ({ category }) => (
    <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(category);
          setActiveMenuId(null);
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium"
      >
        <Edit2 className="h-4 w-4 text-blue-500" />
        Edit Details
      </button>
      <div className="h-px bg-gray-100 my-1" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirmId(category._id);
          setActiveMenuId(null);
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
        Delete Category
      </button>
    </div>
  );

  // --- GRID VIEW ---
  if (viewMode === "grid") {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-visible flex flex-col h-full cursor-pointer"
              onClick={() => onEdit(category)}
            >
              {/* Card Header */}
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(e, category._id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {activeMenuId === category._id && (
                      <ActionMenu category={category} />
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] leading-relaxed">
                  {category.description || "No description provided"}
                </p>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl flex items-center justify-between text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(category.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    View Details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Click backdrop to close menus */}
        {activeMenuId && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setActiveMenuId(null)}
          />
        )}

        <DeleteModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
        />
      </>
    );
  }

  // --- LIST VIEW ---
  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50/50">
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Category Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell"
                >
                  Created Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {categories.map((category) => (
                <tr
                  key={category._id}
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  onClick={() => onEdit(category)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {category.description || (
                        <span className="text-gray-400 italic">
                          No description
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {new Date(category.createdAt).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEdit(category)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(category._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          onDelete(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
      />
    </>
  );
};

// Extracted Delete Modal for cleaner code
const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Category?</h3>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Are you sure you want to delete this category? Products associated with it may become uncategorized.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 font-medium shadow-sm hover:shadow-red-500/25 transition-all text-sm"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
