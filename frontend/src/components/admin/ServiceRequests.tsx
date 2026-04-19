import React, { useCallback, useEffect, useState } from "react";
import {
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface ServiceRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  serviceSlug: string;
  packageId: string;
  packageName: string;
  price: number;
  selectedDate: string;
  selectedTime: string;
  message?: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ServiceRequestsProps {
  backendUrl: string;
  token: string;
}

export default function ServiceRequests({ backendUrl, token }: ServiceRequestsProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter && statusFilter !== "all"
          ? `${backendUrl}/api/admin/service-requests?status=${statusFilter}`
          : `${backendUrl}/api/admin/service-requests`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch service requests");
        return;
      }

      const data = await response.json();
      setRequests(Array.isArray(data.serviceRequests) ? data.serviceRequests : []);
    } catch (err) {
      console.error("Error fetching service requests:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, statusFilter, token]);

  useEffect(() => {
    void fetchServiceRequests();
  }, [fetchServiceRequests]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("⚠️ DELETE SERVICE REQUEST\n\nThis will permanently delete this service request.\n\nThis action CANNOT be undone!")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/service-requests/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("❌ Failed to delete service request");
        return;
      }

      alert("✅ Service request deleted successfully");
      fetchServiceRequests();
      setShowDetails(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error deleting service request:", err);
      alert("❌ Error deleting service request");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (id: string) => {
    if (!newStatus) {
      alert("Please select a new status");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/service-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes,
        }),
      });

      if (!response.ok) {
        alert("❌ Failed to update service request");
        return;
      }

      await response.json();
      alert("✅ Service request updated successfully");
      setAdminNotes("");
      setNewStatus("");
      fetchServiceRequests();
      setShowDetails(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error updating service request:", err);
      alert("❌ Error updating service request");
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.name.toLowerCase().includes(search.toLowerCase()) ||
      req.email.toLowerCase().includes(search.toLowerCase()) ||
      req.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (showDetails && selectedRequest) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setShowDetails(false);
            setSelectedRequest(null);
            setAdminNotes("");
            setNewStatus("");
          }}
          className="mb-4 text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          ← Back to List
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-emerald-600">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Request Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <p className="text-lg text-gray-900">{selectedRequest.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <p className="text-lg text-gray-900">{selectedRequest.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <p className="text-lg text-gray-900">{selectedRequest.phone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Current Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedRequest.status)}`}>
                {selectedRequest.status.toUpperCase()}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Service</label>
              <p className="text-lg text-gray-900">{selectedRequest.serviceSlug}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Package</label>
              <p className="text-lg text-gray-900">{selectedRequest.packageName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
              <p className="text-lg text-gray-900">₹{selectedRequest.price}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Requested Date</label>
              <p className="text-lg text-gray-900">{selectedRequest.selectedDate}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Requested Time</label>
              <p className="text-lg text-gray-900">{selectedRequest.selectedTime}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Submitted</label>
              <p className="text-lg text-gray-900">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {selectedRequest.message && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">Message</label>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
              </div>
            </div>
          )}

          {selectedRequest.adminNotes && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Admin Notes</h3>
              <p className="text-blue-700">{selectedRequest.adminNotes}</p>
            </div>
          )}

          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Select new status...</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="Add internal notes about this request..."
              />
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => handleUpdateStatus(selectedRequest._id)}
                disabled={updating || !newStatus}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-semibold"
              >
                <CheckIcon className="w-5 h-5" /> Update Request
              </button>

              <button
                onClick={() => handleDelete(selectedRequest._id)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
              >
                <TrashIcon className="w-5 h-5" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search by name, email, or package..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading service requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No service requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div>
                        <p>{req.name}</p>
                        <p className="text-gray-500 text-xs">{req.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{req.packageName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p>{req.selectedDate}</p>
                        <p className="text-gray-500 text-xs">{req.selectedTime}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{req.price}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setShowDetails(true);
                          setAdminNotes(req.adminNotes || "");
                          setNewStatus(req.status || "");
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
