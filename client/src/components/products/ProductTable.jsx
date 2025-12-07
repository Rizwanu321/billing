// components/products/ProductTable.jsx
import React, { useState } from "react";
import {
  Package,
  Clock,
  Edit2,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ProductTable = ({
  products,
  onEdit,
  onStockAdjust,
  onDelete,
  onStockHistory,
  searchTerm,
  selectedCategory,
}) => {
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedActions, setExpandedActions] = useState({}); // Add this state

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Add this function to toggle actions
  const toggleActions = (productId) => {
    setExpandedActions((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle nested category name
    if (sortField === "category") {
      aValue = a.category?.name || "";
      bValue = b.category?.name || "";
    }

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getCategoryName = (product) => {
    if (!product.category) return "Uncategorized";
    return product.category.name || "Uncategorized";
  };

  const formatUnitDisplay = (unit, stock) => {
    if (stock === 1) return unit;
    switch (unit) {
      case "kg":
        return "kgs";
      case "box":
        return "boxes";
      case "piece":
        return "pieces";
      default:
        return unit + "s";
    }
  };

  const getStockStatus = (product) => {
    if (!product.isStockRequired) {
      return {
        className: "bg-gray-100 text-gray-700",
        text: "N/A",
        icon: null,
      };
    }

    if (product.stock === 0) {
      return {
        className: "bg-red-100 text-red-700",
        text: "Out of Stock",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    }

    if (product.stock <= 10) {
      return {
        className: "bg-amber-100 text-amber-700",
        text: "Low Stock",
        icon: <TrendingDown className="w-4 h-4" />,
      };
    }

    return {
      className: "bg-green-100 text-green-700",
      text: "In Stock",
      icon: <TrendingUp className="w-4 h-4" />,
    };
  };

  const exportToPDF = () => {
    // Create PDF document (landscape A4) - MATCHING REVENUE TRANSACTIONS
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // ========== HEADER ========== (matching revenue transactions style)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Product Inventory Report', pageWidth / 2, 18, { align: 'center' });

    // Subtitle - filters info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    let filterText = '';
    if (searchTerm) {
      filterText += `Search: "${searchTerm}"`;
    }
    if (selectedCategory !== "all") {
      const categoryName = sortedProducts.find(
        (p) => p.category?._id === selectedCategory
      )?.category?.name;
      if (categoryName) {
        filterText += (filterText ? ' | ' : '') + `Category: "${categoryName}"`;
      }
    }
    if (!filterText) {
      filterText = 'All Products';
    }

    doc.text(filterText, pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(9);
    const generatedDate = new Date();
    doc.text(`Generated: ${generatedDate.toLocaleString('en-IN')}`, pageWidth / 2, 30, { align: 'center' });

    // ========== SUMMARY BOX ========== (matching revenue transactions style)
    const summaryStartY = 36;
    const boxHeight = 18;
    const boxWidth = (pageWidth - margin * 2) / 4;

    // Draw summary boxes
    const summaryItems = [
      { label: 'Total Products', value: String(sortedProducts.length) },
      { label: 'In Stock', value: String(sortedProducts.filter(p => p.isStockRequired && p.stock > 10).length) },
      { label: 'Low Stock', value: String(sortedProducts.filter(p => p.isStockRequired && p.stock > 0 && p.stock <= 10).length) },
      { label: 'Out of Stock', value: String(sortedProducts.filter(p => p.isStockRequired && p.stock === 0).length) }
    ];

    summaryItems.forEach((item, index) => {
      const x = margin + (boxWidth * index);

      // Box background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, summaryStartY, boxWidth - 2, boxHeight, 2, 2, 'FD');

      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, x + (boxWidth - 2) / 2, summaryStartY + 6, { align: 'center' });

      // Value
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(item.value, x + (boxWidth - 2) / 2, summaryStartY + 13, { align: 'center' });
    });

    // ========== TABLE ========== (matching revenue transactions style)
    const tableStartY = summaryStartY + boxHeight + 6;

    // Calculate table width and center it
    const colWidths = [12, 70, 40, 28, 20, 28, 30]; // Column widths
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
    const centerMargin = (pageWidth - totalTableWidth) / 2;

    // Prepare table data with proper formatting
    const tableData = sortedProducts.map((product, index) => {
      const stockStatus = getStockStatus(product);
      const priceValue = Number(product.price || 0).toFixed(2);
      const stockValue = product.isStockRequired
        ? Number(product.stock).toFixed(2)
        : "—";

      return [
        String(index + 1),
        product.name || "",
        getCategoryName(product),
        `Rs. ${priceValue}`,
        product.unit || "",
        stockValue,
        stockStatus.text,
      ];
    });

    const tableColumn = ['#', 'Product Name', 'Category', 'Price', 'Unit', 'Stock Qty', 'Status'];

    autoTable(doc, {
      head: [tableColumn],
      body: tableData,
      startY: tableStartY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: colWidths[0], halign: 'center' },  // #
        1: { cellWidth: colWidths[1], halign: 'left' },    // Product Name
        2: { cellWidth: colWidths[2], halign: 'left' },    // Category
        3: { cellWidth: colWidths[3], halign: 'right', fontStyle: 'bold' },  // Price
        4: { cellWidth: colWidths[4], halign: 'center' },  // Unit
        5: { cellWidth: colWidths[5], halign: 'center', fontStyle: 'bold' },  // Stock
        6: { cellWidth: colWidths[6], halign: 'center' },  // Status
      },
      margin: { left: centerMargin, right: centerMargin },
      tableWidth: totalTableWidth,
      didDrawPage: (data) => {
        // Footer on each page (matching revenue transactions style)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      },
    });

    // Save PDF
    const timestamp = generatedDate.toISOString().split("T")[0];
    doc.save(`products-inventory-${timestamp}.pdf`);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to PDF
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th
                onClick={() => handleSort("name")}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>Product Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort("category")}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Category</span>
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                onClick={() => handleSort("price")}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Price</span>
                  <SortIcon field="price" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Unit
              </th>
              <th
                onClick={() => handleSort("stock")}
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>Stock</span>
                  <SortIcon field="stock" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product, index) => {
              const stockStatus = getStockStatus(product);
              return (
                <tr
                  key={product._id}
                  className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      {getCategoryName(product)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">
                      ₹{Number(product.price).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      per {product.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                      {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.isStockRequired ? (
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {Number(product.stock).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatUnitDisplay(product.unit, product.stock)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${stockStatus.className}`}
                    >
                      {stockStatus.icon}
                      {stockStatus.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {product.isStockRequired && (
                        <button
                          onClick={() => onStockHistory(product)}
                          className="inline-flex items-center p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Stock History"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this product?"
                            )
                          ) {
                            onDelete(product._id);
                          }
                        }}
                        className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Ultra Compact */}
      <div className="lg:hidden">
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Ultra Compact Header */}
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Product
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-700 uppercase">
                  Price
                </th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-16">
                  •••
                </th>
              </tr>
            </thead>

            {/* Ultra Compact Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProducts.map((product, index) => {
                const stockStatus = getStockStatus(product);
                const showActions = expandedActions[product._id] || false;

                return (
                  <React.Fragment key={product._id}>
                    <tr
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-blue-50 transition-colors`}
                      onClick={() => toggleActions(product._id)}
                    >
                      {/* Product Info */}
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-gray-500 truncate">
                                {getCategoryName(product)}
                              </span>
                              {product.isStockRequired && (
                                <>
                                  <span className="text-xs text-gray-400">
                                    •
                                  </span>
                                  <span
                                    className={`text-xs font-medium ${product.stock === 0
                                      ? "text-red-600"
                                      : product.stock <= 10
                                        ? "text-amber-600"
                                        : "text-green-600"
                                      }`}
                                  >
                                    {Number(product.stock).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-2 py-2 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{Number(product.price).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.unit}
                        </div>
                      </td>

                      {/* Toggle Actions */}
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActions(product._id);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Actions Row */}
                    {showActions && (
                      <tr className="bg-blue-50">
                        <td colSpan="3" className="px-2 py-2">
                          <div className="flex gap-1 justify-end flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(product);
                                toggleActions(product._id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </button>
                            {product.isStockRequired && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStockHistory(product);
                                  toggleActions(product._id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1.5 bg-purple-600 text-white rounded text-xs font-medium"
                              >
                                <Clock className="h-3 w-3" />
                                History
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this product?"
                                  )
                                ) {
                                  onDelete(product._id);
                                }
                                toggleActions(product._id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs font-medium"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
