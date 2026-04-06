/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-head-element */
// pages/about.tsx
import Layout from "../components/common/layout";
import router from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function About() {
  return (
    <>
      <head>
        <title>About Us | Verdora</title>
      </head>
      <Layout>
        <main className="max-w-6xl mx-auto px-6 py-16">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Hero Heading */}
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-500 mb-10 text-center">
            About Verdora
          </h1>

          {/* About Section */}
          <section className="mb-16">
            {/* Mobile & Tablet: background image with gradient */}
            <div
              className="flex flex-col md:hidden rounded-2xl overflow-hidden bg-cover bg-center bg-fixed relative"
              style={{
                backgroundImage: "url('/images/product-5-succulent-mix.jpg')",
              }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-green-900/80 via-green-800/60 to-transparent"></div>

              <div className="relative px-5 py-7">
                <p className="text-base sm:text-lg font-light leading-relaxed text-white drop-shadow-md mb-4">
                  Verdora is built on a simple belief:{" "}
                  <span className="font-semibold text-green-200">
                    plants make life better
                  </span>
                  . We source{" "}
                  <span className="italic text-green-100">
                    healthy, sustainably grown plants
                  </span>
                  , pair them with expert care services, and provide the tools
                  and knowledge you need to keep them thriving.
                </p>

                <p className="text-base sm:text-lg font-light leading-relaxed text-white drop-shadow-md">
                  From{" "}
                  <span className="font-medium text-green-200">
                    urban balconies
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-green-200">
                    backyard gardens
                  </span>
                  , our mission is to help you grow a{" "}
                  <span className="font-semibold text-green-100">
                    greener, healthier home
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Desktop: side-by-side layout */}
            <div className="hidden md:flex flex-row items-center gap-10">
              <div className="flex-1">
                <p className="text-xl md:text-2xl font-light leading-relaxed mb-6 text-gray-900">
                  Verdora is built on a simple belief:{" "}
                  <span className="font-semibold bg-linear-to-r from-green-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                    plants make life better
                  </span>
                  . We source{" "}
                  <span className="italic text-green-700">
                    healthy, sustainably grown plants
                  </span>
                  , pair them with expert care services, and provide the tools
                  and knowledge you need to keep them thriving.
                </p>

                <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-900">
                  From{" "}
                  <span className="font-medium text-emerald-600">
                    urban balconies
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-emerald-600">
                    backyard gardens
                  </span>
                  , our mission is to help you grow a{" "}
                  <span className="font-semibold bg-linear-to-r from-green-500 to-teal-400 bg-clip-text text-transparent">
                    greener, healthier home
                  </span>
                  .
                </p>
              </div>

              <div className="flex-1">
                <div className="relative rounded-2xl overflow-hidden shadow-xl hover:scale-105 transition-transform duration-500">
                  <img
                    src="/images/product-5-succulent-mix.jpg"
                    alt="Verdora nursery"
                    className="w-full h-96 object-cover rounded-2xl"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent rounded-2xl" />
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section>
            <h2 className="text-3xl font-bold text-green-700 mb-8 text-center">
              Our Core Values
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Sustainability",
                  desc: "We prioritize eco-friendly practices and sustainable sourcing.",
                  icon: "🌱",
                },
                {
                  title: "Accessibility",
                  desc: "Making gardening easy and enjoyable for everyone.",
                  icon: "🌿",
                },
                {
                  title: "Community",
                  desc: "Building a community of plant lovers who share knowledge and joy.",
                  icon: "🌸",
                },
              ].map((value) => (
                <li
                  key={value.title}
                  className="p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="font-semibold text-xl mb-3 text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </Layout>
    </>
  );
}
