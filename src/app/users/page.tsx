"use client";

import { useState } from "react";
import UserForm from "@/app/components/UserForm";
import UserList from "@/app/components/UserList";

export default function UsersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            User Management
          </h1>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            <UserForm onSuccess={handleSuccess} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <UserList key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
