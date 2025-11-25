import React from "react";
import { IndianRupee, Users, Receipt, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      <div className="grid grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <IndianRupee className="w-4 h-4 text-gray-500" />
          </div>
          <div className="pt-4">
            <div className="text-2xl font-bold">₹45,231.89</div>
            <p className="text-xs text-green-500">+20.1% from last month</p>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
            <Users className="w-4 h-4 text-gray-500" />
          </div>
          <div className="pt-4">
            <div className="text-2xl font-bold">2,345</div>
            <p className="text-xs text-green-500">+15% from last month</p>
          </div>
        </div>

        {/* Invoices Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Pending Invoices
            </h3>
            <Receipt className="w-4 h-4 text-gray-500" />
          </div>
          <div className="pt-4">
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-red-500">+2 from yesterday</p>
          </div>
        </div>

        {/* Growth Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Growth Rate</h3>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </div>
          <div className="pt-4">
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-green-500">+2.5% from last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
