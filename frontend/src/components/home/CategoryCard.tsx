import Link from "next/link";
import Image from "next/image";

type CategoryCardProps = {
  title: string;
  img: string | null;
  desc: string;
};

export default function CategoryCard({ title, img, desc }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(title)}`}
      className="relative block rounded-xl overflow-hidden group h-56 sm:h-64"
    >
      {/* Background Image */}
      {img ? (
        <Image
          src={img}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
          No Image
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />

      {/* Text Content */}
      <div className="absolute bottom-0 left-0 p-4 sm:p-5 text-white z-10">
        <h2 className="text-base sm:text-lg font-semibold drop-shadow-md">
          {title}
        </h2>
        <p className="text-xs sm:text-sm mt-1 line-clamp-2 drop-shadow-md">
          {desc}
        </p>
      </div>
    </Link>
  );
}
