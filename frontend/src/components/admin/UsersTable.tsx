/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import Skeleton from "../shared/Skeleton";

export default function UsersTable({
  users,
  isLoading,
}: {
  users: any[];
  isLoading: boolean;
}) {
  const [sortBy, setSortBy] = useState("name");
  const sortedUsers = useMemo(() => {
    const list = [...users];
    if (sortBy === "email")
      return list.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
    if (sortBy === "role")
      return list.sort((a, b) => (a.role || "").localeCompare(b.role || ""));
    return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [sortBy, users]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-full mb-2" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-gray-500">
        No users found
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="role">Sort by Role</option>
        </select>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {sortedUsers.map((user) => (
          <div
            key={user.id}
            className="rounded-2xl border border-gray-200 p-4 shadow-sm"
          >
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                ID {user.id}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                {user.role}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{user.id}</td>
                <td className="px-6 py-4">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
