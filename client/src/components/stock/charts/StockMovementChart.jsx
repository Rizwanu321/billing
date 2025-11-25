// components/stock/charts/StockMovementChart.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const StockMovementChart = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Stock Movement Trends</h3>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              style={{ fontSize: "10px" }}
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              style={{ fontSize: "10px" }} 
              stroke="#6B7280"
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="additions"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Stock In"
            />
            <Line
              type="monotone"
              dataKey="removals"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Stock Out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockMovementChart;