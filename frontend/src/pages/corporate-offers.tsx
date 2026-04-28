import Head from "next/head";
import Layout from "../components/common/layout";
import ProductCard from "../components/home/ProductCard";
import Link from "next/link";
import BulkOrderForm from "../components/corporate/BulkOrderForm";
import Breadcrumb from "../components/common/Breadcrumb";

const corporateProducts = [
  {
    id: 101,
    name: "Office Desk Plant Combo",
    price: 999,
    image: "/images/corporate1.jpg",
    quantity: 1,
  },
  {
    id: 102,
    name: "Conference Room Green Pack",
    price: 1499,
    image: "/images/corporate2.jpg",
    quantity: 1,
  },
  {
    id: 103,
    name: "Reception Green Welcome Pack",
    price: 1999,
    image: "/images/corporate3.jpg",
    quantity: 1,
  },
  {
    id: 104,
    name: "Employee Wellness Plant Kit",
    price: 799,
    image: "/images/corporate4.jpg",
    quantity: 1,
  },
];

export default function CorporateOffers() {
  return (
    <>
      <Head>
        <title>Corporate Offers | Verdora</title>
        <meta
          name="description"
          content="Bulk corporate plant combos with custom packaging and branding."
        />
      </Head>
      <Layout>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Banner */}
          <section className="relative bg-linear-to-r from-green-700 via-green-600 to-green-500 text-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="absolute inset-0 bg-[url('/images/leaf-pattern.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 px-6 sm:px-12 py-16 text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
                Corporate Plant Combos
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl mb-6">
                Elevate your workplace with bulk plant orders, customized
                packaging, and branding tailored to your organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="#corporate-products"
                  className="bg-white text-green-700 font-semibold px-6 py-3 rounded-md shadow hover:bg-gray-100 transition"
                >
                  Browse Corporate Products
                </Link>
                <Link
                  href="#bulk-inquiry"
                  className="bg-green-900 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-green-800 transition"
                >
                  Request Bulk Quote
                </Link>
              </div>
            </div>
          </section>

          {/* Back Link and Breadcrumb */}
          <div className="mb-12 flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="text-green-700 font-medium hover:underline text-sm sm:text-base"
            >
              ← Back
            </Link>
            <div className="text-xs sm:text-sm">
              <Breadcrumb />
            </div>
          </div>

          {/* Corporate Products */}
          <section id="corporate-products" className="mb-12">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-700">
              Designed for Organizations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {corporateProducts.map((p) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </section>

          {/* Bulk Order Inquiry Form Component */}
          <section id="bulk-inquiry" className="mb-12">
            <BulkOrderForm />
          </section>
        </main>
      </Layout>
    </>
  );
}
