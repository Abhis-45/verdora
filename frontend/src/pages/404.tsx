import Link from "next/link";
import Layout from "../components/common/layout";
import router from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function Custom404() {
  return (
    <Layout>
      <title>404 Not Found | Verdora</title>
      <main className="min-h-screen bg-white">
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-8xl sm:text-9xl font-bold text-green-600 mb-4">
              404
            </h1>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
              Page Not Found
            </p>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Sorry, the page you&apos;re looking for does&apos;t exist.
              Let&apos;s get you back on track!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Go Home
              </Link>
              <Link
                href="/products"
                className="px-8 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition font-semibold"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
