import React from "react";

const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 text-center">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
      <div className="relative p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full border-4 border-white shadow-lg">
        <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
      </div>
    </div>
    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
      {title}
    </h3>
    <p className="text-sm sm:text-base text-gray-600 max-w-md mb-6">
      {message}
    </p>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
