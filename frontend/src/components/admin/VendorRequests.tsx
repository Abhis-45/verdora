import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface VendorRequest {
  _id: string;
  vendorName: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: { _id: string; username: string; email: string };
  rejectedBy?: { _id: string; username: string; email: string };
  rejectionReason?: string;
}

interface VendorRequestsProps {
  token: string;
  backendUrl: string;
  onAccept?: (vendorRequestId: string, requestData: VendorRequest) => void;
}

export default function VendorRequests({ token, backendUrl, onAccept }: VendorRequestsProps) {
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchVendorRequests();
  }, []);

  const fetchVendorRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/vendor-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Failed to fetch vendor requests");
        return;
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching vendor requests:", err);
      alert("Error fetching vendor requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm("Are you sure you want to approve this vendor?")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/vendor-requests/${id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        alert("Failed to approve vendor request");
        return;
      }

      alert("✅ Vendor request approved successfully");
      
      // Refresh vendor requests and keep the details panel open
      const updatedRequests = await fetch(`${backendUrl}/api/admin/vendor-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json());
      
      setRequests(updatedRequests);
      
      // Update the selected request with new data
      const updatedRequest = updatedRequests.find((r: any) => r._id === id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
    } catch (err) {
      console.error("Error approving vendor request:", err);
      alert("❌ Error approving vendor request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("❌ Please provide a rejection reason");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to reject this vendor? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/vendor-requests/${id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejectionReason }),
        }
      );

      if (!response.ok) {
        alert("Failed to reject vendor request");
        return;
      }

      alert("✅ Vendor request rejected");
      
      // Refresh vendor requests and keep the details panel open
      const updatedRequests = await fetch(`${backendUrl}/api/admin/vendor-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json());
      
      setRequests(updatedRequests);
      
      // Update the selected request with new data
      const updatedRequest = updatedRequests.find((r: any) => r._id === id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
      
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting vendor request:", err);
      alert("❌ Error rejecting vendor request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = "⚠️ DELETE VENDOR REQUEST\n\nThis will permanently delete this vendor registration request and all associated data.\n\nThis action CANNOT be undone!";
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/vendor-requests/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        alert("❌ Failed to delete vendor request");
        return;
      }

      alert("✅ Vendor request deleted successfully");
      fetchVendorRequests();
      setShowDetails(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Error deleting vendor request:", err);
      alert("❌ Error deleting vendor request");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      req.shopName.toLowerCase().includes(search.toLowerCase()) ||
      req.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const approvedRequests = filteredRequests.filter((r) => r.status === "approved");
  const rejectedRequests = filteredRequests.filter((r) => r.status === "rejected");

  if (showDetails && selectedRequest) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setShowDetails(false);
            setSelectedRequest(null);
            setRejectionReason("");
          }}
          className="mb-4 text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          ← Back to List
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-emerald-600">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Vendor Request Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Vendor Name
              </label>
              <p className="text-lg text-gray-900">{selectedRequest.vendorName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Shop/Business Name
              </label>
              <p className="text-lg text-gray-900">{selectedRequest.shopName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <p className="text-lg text-gray-900">{selectedRequest.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Phone
              </label>
              <p className="text-lg text-gray-900">{selectedRequest.phone}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Business Address
              </label>
              <p className="text-lg text-gray-900">{selectedRequest.address}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedRequest.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : selectedRequest.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {selectedRequest.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Requested On
              </label>
              <p className="text-lg text-gray-900">
                {new Date(selectedRequest.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Last Updated
              </label>
              <p className="text-lg text-gray-900">
                {new Date(selectedRequest.updatedAt || selectedRequest.createdAt).toLocaleDateString()}
              </p>
            </div>

            {selectedRequest.status === "approved" && selectedRequest.approvedAt && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Approved On
                  </label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedRequest.approvedAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Approved By
                  </label>
                  <p className="text-lg text-gray-900">
                    {selectedRequest.approvedBy?.username || "Admin"}
                    {selectedRequest.approvedBy?.email && (
                      <span className="block text-sm text-gray-600">
                        {selectedRequest.approvedBy.email}
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}

            {selectedRequest.status === "rejected" && selectedRequest.rejectedAt && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Rejected On
                  </label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedRequest.rejectedAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Rejected By
                  </label>
                  <p className="text-lg text-gray-900">
                    {selectedRequest.rejectedBy?.username || "Admin"}
                    {selectedRequest.rejectedBy?.email && (
                      <span className="block text-sm text-gray-600">
                        {selectedRequest.rejectedBy.email}
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {selectedRequest.status === "pending" && (
            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Enter reason for rejection (optional)"
                />
              </div>

              <div className="flex gap-3 flex-col sm:flex-row">
                <button
                  onClick={() => onAccept && onAccept(selectedRequest._id, selectedRequest)}
                  disabled={actionLoading || !onAccept}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-semibold"
                >
                  <CheckIcon className="w-5 h-5" /> Accept & Create Account
                </button>

                <button
                  onClick={() => handleApprove(selectedRequest._id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
                >
                  <CheckIcon className="w-5 h-5" /> Approve Only
                </button>

                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
                >
                  <XMarkIcon className="w-5 h-5" /> Reject
                </button>
              </div>
            </div>
          )}

          {selectedRequest.status === "rejected" && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Rejection Reason</h3>
              <p className="text-red-700">
                {selectedRequest.rejectionReason || "No reason provided"}
              </p>
            </div>
          )}

          {(selectedRequest.status === "approved" || selectedRequest.status === "rejected") && (
            <div className="mt-8 flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => handleDelete(selectedRequest._id)}
                disabled={deleteLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-semibold"
              >
                <TrashIcon className="w-5 h-5" /> Delete Request
              </button>
            </div>
          )}

          {selectedRequest.status === "approved" && (
            <div className="mt-6">
              <Link
                href="/admin/vendor-signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
              >
                <ArrowRightIcon className="w-5 h-5" /> Create Vendor Account
              </Link>
              <p className="text-sm text-gray-500 mt-3">
                Click the button above to proceed to create a vendor account for this approved request
              </p>
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
          🎯 Vendor Registration Requests
        </h2>
        <button
          onClick={fetchVendorRequests}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by vendor name, shop name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading vendor requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {search
              ? "No vendors found matching your search"
              : "No vendor requests yet"}
          </p>
        </div>
      ) : (
        // Desktop table view
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-lg">
          <table className="w-full">
            <thead className="bg-linear-to-r from-emerald-600 to-teal-500 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Vendor Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Shop Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Requested</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <tr key={req._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{req.vendorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{req.shopName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{req.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{req.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{req.address}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : req.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {req.status === "pending" && "⏳"}
                      {req.status === "approved" && "✅"}
                      {req.status === "rejected" && "❌"} {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setShowDetails(true);
                      }}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {loading ? null : filteredRequests.length === 0 ? null : (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              onClick={() => {
                setSelectedRequest(req);
                setShowDetails(true);
              }}
              className={`rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                req.status === "pending"
                  ? "bg-yellow-50 border border-yellow-200"
                  : req.status === "approved"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{req.vendorName}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold ${
                    req.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : req.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {req.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">{req.shopName}</p>
              <p className="text-sm text-gray-600">{req.email}</p>
              <p className="text-sm text-gray-600">{req.phone}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(req.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
