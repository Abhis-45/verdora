/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

type PromoBannerProps = {
  title: string;
  desc: string;
  img: string;
  href: string;
};

export default function PromoBanner({
  title,
  desc,
  img,
  href,
}: PromoBannerProps) {
  return (
    <div className="relative h-full rounded-lg overflow-hidden shadow hover:shadow-lg transform hover:scale-105 transition">
      {/* Background Image */}
      <Link
        href={href}
      >
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Content */}
        <div className="relative z-10 flex flex-col items-start justify-center h-full p-6 text-white">
          <h3 className="ml-10 text-xl font-bold">{title}</h3>
          <p className="mt-2 ml-10 text-sm max-w-xs">{desc}</p>
        </div>
      </Link>
    </div>
  );
}
