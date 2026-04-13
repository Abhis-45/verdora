/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/common/layout";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import Spinner from "@/components/shared/Spinner";
import RefreshButton from "@/components/shared/RefreshButton";
import ReviewSubmitModal from "@/components/product/ReviewSubmitModal";
import { Order, OrderItem } from "@/types/user";
import { buildCartKey } from "@/utils/productOptions";
import { formatDeliveryDate } from "@/utils/delivery";
import { uploadImages } from "@/utils/attachments";
import AuthPopup from "@/components/auth/AuthPop";
import { generateInvoicePDF } from "@/utils/generateInvoice";

const ORDER_STATUS_STYLES: Record<string, string> = {
  accepted: "bg-amber-100 text-amber-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  returned: "bg-red-100 text-red-700",
  replaced: "bg-purple-100 text-purple-700",
  refunded: "bg-rose-100 text-rose-700",
};

const ORDER_FLOW = ["accepted", "shipped", "delivered"];
const RETURN_ACTION_LABELS: Record<"returned" | "replaced", string> = {
  returned: "Return",
  replaced: "Replace",
};

export default function OrdersPage() {
  const router = useRouter();
  const { forceLogout } = useUser();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<OrderItem | null>(null);
  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [actionItem, setActionItem] = useState<OrderItem | null>(null);
  const [actionType, setActionType] = useState<"returned" | "replaced">(
    "returned",
  );
  const [actionReason, setActionReason] = useState("");
  const [actionImages, setActionImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const sortOrders = useCallback(
    (list: Order[]) =>
      [...list].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const syncOrderInState = useCallback((updatedOrder: Order) => {
    setOrders((current) =>
      current.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order,
      ),
    );
    setSelectedOrder((current) =>
      current?._id === updatedOrder._id ? updatedOrder : current,
    );
  }, []);

  const loadOrders = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setShowAuthPopup(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 15000),
      );

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const response = (await Promise.race([
        fetch(`${BACKEND_URL}/api/profile/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        timeoutPromise,
      ])) as Response;

      if (response.status === 401) {
        forceLogout();
        setError(null);
        setShowAuthPopup(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      const ordersList: Order[] = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
          ? data.orders
          : [];

      setOrders(sortOrders(ordersList.filter((order) => order && order._id)));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load orders. Please try again.",
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [forceLogout, sortOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const buyAgain = (order: Order) => {
    (order.items || []).forEach((item) => {
      const cartKey = buildCartKey(
        item.id,
        item.selectedSize?.id,
        item.selectedSize?.label,
      );

      addToCart({
        cartKey,
        id: item.id,
        productId: item.id,
        name: item.title,
        price: item.price || item.mrp || 0,
        quantity: item.quantity || 1,
        image: item.image,
        mrp: item.mrp,
        selectedSize: item.selectedSize,
        originAddress: item.originAddress,
        deliveryEstimate: item.deliveryEstimate,
      } as any);
    });

    setSelectedOrder(null);
    router.push("/cart");
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getItemStatus = (item: OrderItem, order: Order) =>
    item.status || order.status || "accepted";

  const canReviewItem = (item: OrderItem) =>
    Boolean(
      item.canReview ?? (item.status === "delivered" && !item.reviewSubmitted),
    );

  const canReturnOrReplaceItem = (item: OrderItem) =>
    Boolean(item.canReturnOrReplace);

  const firstReviewableItem = (order: Order) =>
    order.items.find((item) => canReviewItem(item)) || null;

  const firstReturnableItem = (order: Order) =>
    order.items.find((item) => canReturnOrReplaceItem(item)) || null;

  const openReviewModal = (order: Order, item: OrderItem) => {
    setReviewingOrderId(order._id);
    setReviewingItem(item);
    setReviewModalOpen(true);
  };

  const openActionModal = (
    order: Order,
    item: OrderItem,
    type: "returned" | "replaced",
  ) => {
    setActionOrderId(order._id);
    setActionItem(item);
    setActionType(type);
    setActionReason("");
    setActionImages([]);
    setActionModalOpen(true);
  };

  const handleActionImageSelection = (files: FileList | null) => {
    if (!files) return;

    const nextImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setActionImages(nextImages);
  };

  const submitCustomerAction = async () => {
    if (!actionOrderId || !actionItem?._id || !actionReason.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setActionSubmitting(true);
    try {
      const uploadedImages = await uploadImages({
        files: actionImages.map((image) => image.file),
        token,
        endpoint: "/api/profile/orders/attachments/upload",
      });

      const response = await fetch(
        `/api/profile/orders/${actionOrderId}/items/${actionItem._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: actionType,
            reason: actionReason.trim(),
            images: uploadedImages,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update order item");
      }

      syncOrderInState(data.order);
      setActionModalOpen(false);
      setActionItem(null);
      setActionOrderId(null);
      setActionReason("");
      setActionImages([]);
    } catch (actionError) {
      alert(
        actionError instanceof Error
          ? actionError.message
          : "Failed to update order item",
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  const orderProgress = useMemo(() => {
    if (!selectedOrder) return 0;
    const status = selectedOrder.status?.toLowerCase();
    if (!ORDER_FLOW.includes(status)) return ORDER_FLOW.length;
    return ORDER_FLOW.indexOf(status) + 1;
  }, [selectedOrder]);

  if (loading) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <Spinner />
        </div>
      </Layout>
    );
  }

  const handleAuthClose = () => {
    setShowAuthPopup(false);
    router.replace("/");
  };

  const handleAuthLogin = () => {
    setShowAuthPopup(false);
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (storedToken) {
      loadOrders();
    }
  };

  if (showAuthPopup) {
    return (
      <Layout>
        <AuthPopup
          onClose={handleAuthClose}
          onLogin={handleAuthLogin}
          initialMessage={"Please sign in to view your orders"}
          initialType={"error"}
        />
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Order History | Verdora</title>
      </Head>
      <Layout>
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 font-semibold text-green-600 transition hover:text-green-700"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-green-900">My Orders</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track delivery, write reviews after delivery, and request a
                return or replacement within 7 days.
              </p>
            </div>
            <RefreshButton onClick={loadOrders} />
          </div>

          {error ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <p className="mb-4 font-semibold text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center">
              <h2 className="mb-4 text-2xl font-bold text-green-900 sm:text-3xl">
                No Orders Yet
              </h2>
              <p className="mb-6 text-gray-600">
                You have not placed any orders yet.
              </p>
              <button
                onClick={() => router.push("/products")}
                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const reviewItem = firstReviewableItem(order);
                const returnableItem = firstReturnableItem(order);

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-left"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex gap-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <button
                              key={`${item.id}-${index}`}
                              type="button"
                              onClick={() =>
                                router.push(`/productpage/${item.id}`)
                              }
                              className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100 cursor-pointer transition hover:shadow-md hover:ring-2 hover:ring-blue-300"
                              title="View product"
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  No image
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {order.items?.[0]?.title || "Items"}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {order.items.length} item
                            {order.items.length !== 1 ? "s" : ""}
                          </div>
                          {order.deliveryEstimate?.estimatedDeliveryDate && (
                            <div className="mt-1 text-xs text-blue-700">
                              ETA{" "}
                              {formatDeliveryDate(
                                order.deliveryEstimate.estimatedDeliveryDate,
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-lg font-bold text-green-900">
                            Rs. {(order.total || 0).toFixed(2)}
                          </div>
                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              ORDER_STATUS_STYLES[order.status] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-xs text-gray-600">
                            {formatDate(order.date)}
                          </div>
                          <span className="mt-2 inline-block text-sm font-semibold text-green-600">
                            View details
                          </span>
                        </div>
                      </div>
                    </button>

                    {(reviewItem || returnableItem) && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                        {reviewItem && (
                          <button
                            type="button"
                            onClick={() => openReviewModal(order, reviewItem)}
                            className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                          >
                            Write Review
                          </button>
                        )}
                        {returnableItem && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal(
                                  order,
                                  returnableItem,
                                  "returned",
                                )
                              }
                              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                            >
                              Return Item
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal(
                                  order,
                                  returnableItem,
                                  "replaced",
                                )
                              }
                              className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-200"
                            >
                              Replace Item
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedOrder && (
            <div
              className="app-modal-shell"
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="app-modal-card w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-green-900 sm:text-xl">
                    Order #{selectedOrder._id.slice(-6)}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 transition hover:text-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6 p-4 sm:p-6">
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Current status
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            ORDER_STATUS_STYLES[selectedOrder.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedOrder.status.toUpperCase()}
                        </span>
                      </div>
                      {selectedOrder.deliveryEstimate
                        ?.estimatedDeliveryDate && (
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold text-gray-800">
                            Estimated delivery
                          </p>
                          <p className="text-sm text-blue-700">
                            {formatDeliveryDate(
                              selectedOrder.deliveryEstimate
                                .estimatedDeliveryDate,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedOrder.statusReason && (
                      <p className="mt-3 text-sm text-gray-600">
                        Note: {selectedOrder.statusReason}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {ORDER_FLOW.map((step, index) => {
                      const active = index < orderProgress;
                      return (
                        <div key={step} className="text-center">
                          <div
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                              active
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <p className="mt-2 text-xs font-semibold uppercase text-gray-600">
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <div className="font-semibold text-gray-900">
                          {selectedOrder.name || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <div className="font-semibold text-gray-900">
                          {selectedOrder.email || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <div className="font-semibold text-gray-900">
                          {selectedOrder.mobile || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Order Date:</span>
                        <div className="font-semibold text-gray-900">
                          {formatDate(selectedOrder.date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.address && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                      <h3 className="mb-3 font-bold text-gray-900">
                        Delivery Address
                      </h3>
                      <div className="space-y-1 text-sm text-gray-700">
                        <div className="font-semibold text-blue-900">
                          {selectedOrder.address.label || "Address"}
                        </div>
                        <div>{selectedOrder.address.address || "N/A"}</div>
                        <div>
                          {selectedOrder.address.city || "N/A"},{" "}
                          {selectedOrder.address.state || "N/A"}{" "}
                          {selectedOrder.address.pincode || "N/A"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-3 font-bold text-gray-900">Products</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => {
                        const itemStatus = getItemStatus(item, selectedOrder);

                        return (
                          <div
                            key={`${item.id}-${index}`}
                            className="rounded-xl border border-gray-200 p-3 sm:p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/productpage/${item.id}`)
                                }
                                className="h-20 w-20 shrink-0 overflow-hidden rounded bg-gray-100 cursor-pointer transition hover:shadow-md hover:ring-2 hover:ring-blue-300"
                                title="View product"
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                    No Image
                                  </div>
                                )}
                              </button>

                              <div className="flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {item.title || "Product"}
                                    </h4>
                                    {item.selectedSize?.label && (
                                      <div className="mt-1 text-sm text-green-700">
                                        Size: {item.selectedSize.label}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      ORDER_STATUS_STYLES[itemStatus] ||
                                      "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {itemStatus.toUpperCase()}
                                  </span>
                                </div>

                                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                                  <div>Quantity: {item.quantity}</div>
                                  <div>
                                    Price:{" "}
                                    <span className="font-semibold text-gray-900">
                                      Rs. {(item.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                  {item.deliveryEstimate
                                    ?.estimatedDeliveryDate && (
                                    <div className="text-blue-700">
                                      Delivery by{" "}
                                      {formatDeliveryDate(
                                        item.deliveryEstimate
                                          .estimatedDeliveryDate,
                                      )}
                                    </div>
                                  )}
                                  <div className="font-semibold text-green-900">
                                    Subtotal: Rs.{" "}
                                    {(
                                      (item.price || 0) * (item.quantity || 0)
                                    ).toFixed(2)}
                                  </div>
                                </div>

                                {item.statusReason && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    {item.statusReason}
                                  </p>
                                )}
                                {item.returnReason && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Reason: {item.returnReason}
                                  </p>
                                )}
                                {item.returnRequestImages &&
                                  item.returnRequestImages.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                      {item.returnRequestImages.map(
                                        (image, imageIndex) => (
                                          <div
                                            key={`${item._id || item.id}-${imageIndex}`}
                                            className="overflow-hidden rounded-xl border border-gray-200"
                                          >
                                            <img
                                              src={image.url}
                                              alt={`Support image ${imageIndex + 1}`}
                                              className="h-20 w-full object-cover"
                                            />
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                {item.returnWindowEndsAt &&
                                  canReturnOrReplaceItem(item) && (
                                    <p className="mt-1 text-xs text-amber-700">
                                      Return or replace available until{" "}
                                      {formatDate(item.returnWindowEndsAt)}
                                    </p>
                                  )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {canReviewItem(item) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openReviewModal(selectedOrder, item)
                                      }
                                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
                                    >
                                      Write a Review
                                    </button>
                                  )}
                                  {item.reviewSubmitted && (
                                    <span className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                                      Review submitted
                                    </span>
                                  )}
                                  {canReturnOrReplaceItem(item) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openActionModal(
                                            selectedOrder,
                                            item,
                                            "returned",
                                          )
                                        }
                                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                                      >
                                        Return
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openActionModal(
                                            selectedOrder,
                                            item,
                                            "replaced",
                                          )
                                        }
                                        className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-200"
                                      >
                                        Replace
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold text-gray-900">
                      Order Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold text-gray-900">
                          Rs.{" "}
                          {(
                            (selectedOrder.total || 0) +
                            (selectedOrder.discount || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                      {(selectedOrder.discount || 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span className="font-semibold">
                            -Rs. {(selectedOrder.discount || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedOrder.couponCode && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Coupon: {selectedOrder.couponCode}</span>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between border-t border-gray-300 pt-2">
                        <span className="font-bold text-gray-900">
                          Total Paid:
                        </span>
                        <span className="text-lg font-bold text-green-900">
                          Rs. {(selectedOrder.total || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedOrder.status === "delivered" && (
                      <button
                        onClick={() => generateInvoicePDF(selectedOrder)}
                        className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
                      >
                        📥 Download Invoice PDF
                      </button>
                    )}
                    <button
                      onClick={() => buyAgain(selectedOrder)}
                      className="w-full rounded-lg bg-green-600 py-2 font-semibold text-white transition hover:bg-green-700"
                    >
                      Buy Again
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="w-full rounded-lg bg-gray-200 py-2 font-semibold transition hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {reviewModalOpen && reviewingItem && reviewingOrderId && (
        <ReviewSubmitModal
          isOpen={true}
          productId={reviewingItem.id || ""}
          productName={reviewingItem.title || "Product"}
          productImage={reviewingItem.image}
          orderId={reviewingOrderId}
          orderItemId={reviewingItem._id}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewingItem(null);
            setReviewingOrderId(null);
          }}
          onSubmitSuccess={loadOrders}
        />
      )}

      {actionModalOpen && actionItem && (
        <div
          className="app-modal-shell"
          onClick={() => setActionModalOpen(false)}
        >
          <div
            className="app-modal-card w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-green-900">
                  {RETURN_ACTION_LABELS[actionType]} Request
                </h3>
                <p className="mt-1 text-sm text-gray-600">{actionItem.title}</p>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="text-gray-500 transition hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 flex gap-2">
              {(["returned", "replaced"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActionType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    actionType === type
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {RETURN_ACTION_LABELS[type]}
                </button>
              ))}
            </div>

            <label className="mt-5 block text-sm font-semibold text-gray-900">
              Reason
            </label>
            <textarea
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              rows={4}
              placeholder={`Tell us why you want to ${actionType === "returned" ? "return" : "replace"} this item`}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-900">
                Add Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  handleActionImageSelection(event.target.files)
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-green-100 file:px-3 file:py-2 file:font-semibold file:text-green-700"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload up to 4 images for return or replacement support.
              </p>
              {actionImages.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {actionImages.map((image, index) => (
                    <div
                      key={`${image.file.name}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img
                        src={image.preview}
                        alt={`Attachment ${index + 1}`}
                        className="h-24 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setActionImages((current) =>
                            current.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {actionItem.returnWindowEndsAt && (
              <p className="mt-2 text-xs text-amber-700">
                Available until {formatDate(actionItem.returnWindowEndsAt)}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting || !actionReason.trim()}
                onClick={submitCustomerAction}
                className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
              >
                {actionSubmitting
                  ? "Submitting..."
                  : `${RETURN_ACTION_LABELS[actionType]} Item`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
