// components/revenue/RevenueExport.jsx
import React, { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import { generateRevenuePDF, exportRevenueCSV } from "../../api/revenue";

const RevenueExport = () => {
  const [exporting, setExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: "pdf",
    includeDetails: true,
    includeSummary: true,
    includeCharts: true,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === "pdf") {
        const blob = await generateRevenuePDF(exportOptions);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `revenue-report-${exportOptions.startDate}-to-${exportOptions.endDate}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (format === "csv") {
        const blob = await exportRevenueCSV(exportOptions);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `revenue-data-${exportOptions.startDate}-to-${exportOptions.endDate}.csv`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Export Revenue Data
      </h3>

      <div className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={exportOptions.startDate}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  startDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={exportOptions.endDate}
              onChange={(e) =>
                setExportOptions({ ...exportOptions, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeDetails}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeDetails: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Include transaction details
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeSummary}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeSummary: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Include summary statistics
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={exportOptions.includeCharts}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  includeCharts: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Include charts and graphs (PDF only)
            </span>
          </label>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export as PDF"}
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Table className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export as CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueExport;
