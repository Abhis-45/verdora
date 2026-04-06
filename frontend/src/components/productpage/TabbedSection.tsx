/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ProductDescription from "./ProductDescription";
import ReviewSection from "../product/ReviewSection";
import { Transition } from "@headlessui/react";

interface TabbedSectionProps {
  product: any;
  productIdVal: string | string[];
  user: any;
}

export default function TabbedSection({
  product,
  productIdVal,
  user,
}: TabbedSectionProps) {
  const [activeTab, setActiveTab] = useState<
    "description" | "features" | "reviews"
  >("description");

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-md shadow-lg p-6">
      <div className="border-b border-gray-200 flex space-x-6 text-sm font-medium">
        {["description", "features", "reviews"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 capitalize ${
              activeTab === tab
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-green-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-6 relative">
        <Transition
          key={activeTab}
          appear
          show={true}
          as="div"
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 translate-y-2"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-2"
        >
          {activeTab === "description" && (
            <div>
              <ProductDescription
                description={product.description}
                tags={product.tags}
              />
            </div>
          )}

          {activeTab === "features" && (
            <div className="text-sm text-gray-700">
              <ProductDescription tags={product.tags} />
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <ReviewSection
                productId={product._id || productIdVal}
                isUserLoggedIn={!!user}
                userOrders={user?.orders || []}
                hasPurchased={Boolean(
                  user?.orders?.some((order: any) =>
                    order?.items?.some((item: any) => item.id === productIdVal),
                  ),
                )}
              />
            </div>
          )}
        </Transition>
      </div>
    </div>
  );
}
