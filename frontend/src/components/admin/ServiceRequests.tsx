import React, { useState, useEffect } from "react";
import {
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ServiceRequest {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  service: string;
  servicePackage: string;
  submittedAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  notes?: string;
}

interface ServiceRequestsProps {
  backendUrl: string;
}

export default function ServiceRequests({ backendUrl }: ServiceRequestsProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/contact/service-requests`);

      if (!response.ok) {
        alert("Failed to fetch service requests");
        return;
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching service requests:", err);
      alert("Error fetching service requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("⚠️ DELETE SERVICE REQUEST\n\nThis will permanently delete this service request.\n\nThis action CANNOT be undone!")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${backendUrl}/api/contact/service-requests/${id}`, {
        method: "DELETE",
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

  const handleMarkResolved = async (id: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`${backendUrl}/api/contact/service-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isResolved: true, notes }),
      });

      if (!response.ok) {
        alert("❌ Failed to update service request");
        return;
      }

      alert("✅ Service request marked as resolved");
      setNotes("");
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
      req.service.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter((r) => !r.isResolved);
  const resolvedRequests = filteredRequests.filter((r) => r.isResolved);

  if (showDetails && selectedRequest) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setShowDetails(false);
            setSelectedRequest(null);
            setNotes("");
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
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedRequest.isResolved
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {selectedRequest.isResolved ? "✅ Resolved" : "⏳ Pending"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Service</label>
              <p className="text-lg text-gray-900">{selectedRequest.service || "General Inquiry"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Package</label>
              <p className="text-lg text-gray-900">{selectedRequest.servicePackage || "N/A"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Submitted</label>
              <p className="text-lg text-gray-900">
                {new Date(selectedRequest.submittedAt).toLocaleDateString()}
              </p>
            </div>

            {selectedRequest.resolvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Resolved</label>
                <p className="text-lg text-gray-900">
                  {new Date(selectedRequest.resolvedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Subject</label>
            <p className="text-lg text-gray-900 mb-4">{selectedRequest.subject}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">Message</label>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
            </div>
          </div>

          {selectedRequest.notes && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Admin Notes</h3>
              <p className="text-blue-700">{selectedRequest.notes}</p>
            </div>
          )}

          {!selectedRequest.isResolved && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Add Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Add internal notes about this request..."
                />
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <button
                  onClick={() => handleMarkResolved(selectedRequest._id)}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-semibold"
                >
                  <CheckIcon className="w-5 h-5" /> Mark as Resolved
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
          )}

          {selectedRequest.isResolved && (
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(selectedRequest._id)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
              >
                <TrashIcon className="w-5 h-5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          📋 Service Requests
        </h2>
        <button
          onClick={fetchServiceRequests}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading service requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {search ? "No service requests found matching your search" : "No service requests yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-yellow-700 mb-3">
                ⏳ Pending ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowDetails(true);
                      setNotes(req.notes || "");
                    }}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{req.name}</h4>
                        <p className="text-sm text-gray-600">{req.email}</p>
                        <p className="text-sm text-gray-600">
                          Service: <strong>{req.service || "General"}</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{req.subject}</p>
                      </div>
                      <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded whitespace-nowrap">
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Requests */}
          {resolvedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                ✅ Resolved ({resolvedRequests.length})
              </h3>
              <div className="space-y-2">
                {resolvedRequests.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowDetails(true);
                      setNotes(req.notes || "");
                    }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{req.name}</h4>
                        <p className="text-sm text-gray-600">{req.email}</p>
                        <p className="text-sm text-gray-600">
                          Service: <strong>{req.service || "General"}</strong>
                        </p>
                      </div>
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded whitespace-nowrap">
                        {new Date(req.resolvedAt || req.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
