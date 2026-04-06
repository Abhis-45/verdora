/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import Layout from "../components/common/layout";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function Error({ statusCode }: { statusCode?: number }) {
  const router = useRouter();

  const messages: { [key: number]: string } = {
    500: "Internal server error",
    503: "Service unavailable",
    502: "Bad gateway",
  };

  const message = statusCode
    ? messages[statusCode] || "An error occurred while processing your request"
    : "An error occurred";

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl sm:text-7xl font-bold text-green-600 mb-4">
            {statusCode || "Error"}
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
            Something went wrong
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            {message}. Please try again later or return to the home page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Go Back
            </button>
            <Link
              href="/"
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

Error.getInitialProps = ({ res, err }: { res: any; err: any }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
