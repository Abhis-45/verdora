import Link from "next/link";

type ServiceCardProps = {
  slug: string;   // ✅ unique identifier for routing
  title: string;
  desc: string;
  icon?: React.ReactNode;
};

export default function ServiceCard({ slug, title, desc, icon }: ServiceCardProps) {
  return (
    <Link
      href={`/services#${slug}`} // ✅ link to full Services page with anchor
      className="flex flex-col items-center text-center p-6 rounded-lg shadow hover:shadow-lg transition bg-white cursor-pointer"
    >
      {icon && <div className="mb-3 text-green-600">{icon}</div>}
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{desc}</p>
    </Link>
  );
}
