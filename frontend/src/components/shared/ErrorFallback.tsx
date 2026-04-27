import Link from "next/link";
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
  statusCode?: number;
}

export default function ErrorFallback({
  error = "Something went wrong",
  onRetry,
  statusCode = 500,
}: ErrorFallbackProps) {
  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return "Page not found";
      case 500:
        return "Server error";
      case 503:
        return "Service unavailable";
      default:
        return error;
    }
  };

  const getErrorDescription = () => {
    switch (statusCode) {
      case 404:
        return "The page you're looking for doesn't exist.";
      case 500:
        return "Something went wrong on our end. Our team is working to fix it.";
      case 503:
        return "We're temporarily unavailable. Please try again soon.";
      default:
        return "We're having trouble loading this content. Please try again.";
    }
  };

  return (
    <div className="top-0 flex items-center justify-center min-h-screen bg-linear-to-br from-red-50 to-orange-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {getErrorMessage()}
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">{getErrorDescription()}</p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Try Again
            </button>
          )}

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            <HomeIcon className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        {/* Optional: Error Code */}
        {statusCode !== 200 && (
          <p className="text-xs text-gray-500 mt-6">Error Code: {statusCode}</p>
        )}
      </div>
    </div>
  );
}
