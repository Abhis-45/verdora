import { XMarkIcon } from "@heroicons/react/24/outline";
import ProductList from "./ProductList";
import { Order } from "@/types/user";

export default function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Only show Delivered OR Returned
  const steps =
    order.status === "returned"
      ? ["Ordered", "Shipped", "Returned"]
      : ["Ordered", "Shipped", "Delivered"];

  const currentStep = steps.findIndex(
    step => step.toLowerCase() === order.status?.toLowerCase()
  ) + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-green-900">Order #{order._id?.slice(-6)}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-5">
          {/* Status Timeline */}
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                    ${idx < currentStep ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"}
                    ${step === "Returned" && order.status === "returned" ? "bg-red-600 text-white" : ""}`}
                >
                  {idx + 1}
                </div>
                <span className="mt-1 text-[10px] sm:text-xs font-medium">{step}</span>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-full ${idx < currentStep - 1 ? "bg-green-600" : "bg-gray-300"}`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{order.name}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{order.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{order.mobile}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(order.date)}</span></div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`font-semibold ${order.status === "returned" ? "text-red-600" : "text-green-700"}`}>
                  {order.status}
                </span>
              </div>
              {/* Return Reason (only if returned) */}
              {order.status === "returned" && order.returnReason && (
                <div className="col-span-2">
                  <span className="text-gray-500">Return Reason:</span>
                  <span className="font-medium text-red-600">{order.returnReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <ProductList items={order.items || []} delivered={order.status === "delivered"} />

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs sm:text-sm">
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
              <span className="font-semibold">Total Paid:</span>
              <span className="font-bold text-green-700">₹{(order.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onClose();
              }}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-semibold"
            >
              Buy Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-xs sm:text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
