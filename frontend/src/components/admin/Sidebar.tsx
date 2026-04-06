import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Products", href: "/admin/products" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Users", href: "/admin/users" },
  { name: "Settings", href: "/admin/settings" },
];

export default function Sidebar({
  onLinkClick,
  className = "",
}: {
  onLinkClick?: () => void;
  className?: string;
}) {
  const router = useRouter();

  return (
    <aside
      className={`flex h-full w-64 flex-col bg-white shadow-lg ${className}`}
    >
      <div className="px-6 py-4 text-2xl font-bold text-green-600">
        Verdora Admin
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} legacyBehavior>
            <a
              onClick={() => {
                if (onLinkClick) onLinkClick(); // 👈 closes drawer
              }}
              className={`block px-3 py-2 rounded-lg transition ${
                router.pathname === item.href
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "hover:bg-green-50 text-gray-700"
              }`}
            >
              {item.name}
            </a>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
