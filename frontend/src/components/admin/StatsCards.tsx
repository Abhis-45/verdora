"use client";
import Skeleton from "../shared/Skeleton";

export default function StatsCards({
  productsCount,
  ordersCount,
  revenue,
  usersCount,
  isLoading,
}: {
  productsCount: number | string;
  ordersCount: number | string;
  revenue: number | string;
  usersCount: number | string;
  isLoading: boolean;
}) {
  const stats = [
    { label: "Products", value: productsCount },
    { label: "Orders", value: ordersCount },
    { label: "Revenue", value: revenue },
    { label: "Users", value: usersCount },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Flex row with horizontal scroll on small screens */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="min-w-35 flex-1 bg-white rounded-lg shadow-sm p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition"
          >
            {isLoading ? (
              <Skeleton className="h-6 w-20 rounded" />
            ) : (
              <>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
