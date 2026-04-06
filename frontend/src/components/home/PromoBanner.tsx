/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

type PromoBannerProps = {
  title: string;
  desc: string;
  img: string;
  cta: string;
  href: string;
};

export default function PromoBanner({
  title,
  desc,
  img,
  cta,
  href,
}: PromoBannerProps) {
  return (
    <div className="relative h-full rounded-lg overflow-hidden shadow hover:shadow-lg transform hover:scale-105 transition">
      {/* Background Image */}
      <img
        src={img}
        alt={title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-green-200 via-green-100 to-green-50 opacity-70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full p-6 text-green-900">
        <h3 className="ml-10 text-xl font-bold">{title}</h3>
        <p className="mt-2 ml-10 text-sm max-w-xs">{desc}</p>
        <Link
          href={href}
          className="ml-10 mt-4 inline-block px-4 py-2 bg-linear-to-r from-green-400 to-emerald-600 
                     rounded-md text-white font-medium transition transform hover:scale-105 hover:shadow-lg"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
