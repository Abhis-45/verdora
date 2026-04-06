/* eslint-disable @next/next/no-img-element */
export default function AboutSection() {
  return (
    <section className="mb-8 sm:mb-10">
      {/* Mobile & Tablet: background image with parallax */}
      <div
        className="flex flex-col items-center gap-6 md:hidden rounded-lg overflow-hidden bg-cover bg-center bg-fixed relative"
        style={{ backgroundImage: "url('/images/product-4-tulsi.jpg')" }}
      >
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-linear-to-t from-green-900/80 via-green-800/60 to-transparent"></div>

        <div className="relative px-4 py-6 sm:px-6 sm:py-7">
          <h2
            className="text-lg sm:text-xl mb-2 sm:mb-3 font-bold text-white drop-shadow-md"
            style={{ fontFamily: "Floralia, serif" }}
          >
            Our Passion for Green Living
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-gray-100 drop-shadow-md max-w-md">
            We believe every leaf tells a story — of care, of patience, and of
            the simple joy that plants bring into our homes. Verdora exists to
            nurture that joy: thoughtfully sourced plants, expert care, and
            services that help your space breathe and thrive.
          </p>
        </div>
      </div>

      {/* Desktop: original side-by-side layout */}
      <div className="hidden md:flex flex-row items-center gap-8">
        <div className="flex-1">
          <h2
            className="text-xl mb-4 font-bold text-green-600"
            style={{ fontFamily: "Floralia, serif" }}
          >
            Our Passion for Green Living
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            We believe every leaf tells a story — of care, of patience, and of
            the simple joy that plants bring into our homes. Verdora exists to
            nurture that joy: thoughtfully sourced plants, expert care, and
            services that help your space breathe and thrive.
          </p>
        </div>
        <div className="flex-1">
          <img
            src="/images/product-4-tulsi.jpg"
            alt="Nursery staff caring for plants"
            className="rounded-lg shadow w-full object-cover h-72"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
