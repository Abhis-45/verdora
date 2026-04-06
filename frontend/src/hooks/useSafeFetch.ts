import { useState, useCallback } from "react";

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
  silent?: boolean;
}

interface FetchResult<T> {
  data: T | null;
  error: Error | null;
  isSuccess: boolean;
  message?: string;
}

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 2;

export function useSafeFetch() {
  const [isLoading, setIsLoading] = useState(false);

  const safeFetch = useCallback(
    async <T>(
      url: string,
      options: FetchOptions = {},
    ): Promise<FetchResult<T>> => {
      const {
        onError,
        silent = true,
        timeout = DEFAULT_TIMEOUT,
        retries = DEFAULT_RETRIES,
        ...fetchOptions
      } = options;

      setIsLoading(true);

      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt <= retries) {
        try {
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timeout - taking too long")),
              timeout,
            ),
          );

          // Create fetch promise
          const fetchPromise = fetch(url, fetchOptions);

          // Race both promises
          const response = await Promise.race([fetchPromise, timeoutPromise]);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Server Error (${response.status}): ${errorText || response.statusText}`,
            );
          }

          const data = await response.json();
          setIsLoading(false);
          return { data, error: null, isSuccess: true };
        } catch (error) {
          lastError =
            error instanceof Error
              ? error
              : new Error("Unknown error occurred");

          // Retry on timeout or network errors
          if (
            attempt < retries &&
            (lastError.message.includes("timeout") ||
              lastError.message.includes("fetch") ||
              lastError.message.includes("NetworkError"))
          ) {
            attempt++;
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          } else {
            break;
          }
        }
      }

      if (!silent && process.env.NODE_ENV !== "production") {
        console.error("Fetch error:", lastError);
      }

      // Convert to user-friendly error message
      let userMessage = "Unable to load data. Please try again.";
      if (lastError?.message.includes("timeout")) {
        userMessage =
          "Request timed out. Please check your connection and try again.";
      } else if (lastError?.message.includes("fetch")) {
        userMessage =
          "Unable to connect to server. Please check your internet connection.";
      } else if (lastError?.message.includes("Server Error")) {
        userMessage = lastError.message;
      }

      onError?.(lastError || new Error(userMessage));
      setIsLoading(false);

      return {
        data: null,
        error: lastError,
        isSuccess: false,
        message: userMessage,
      };
    },
    [],
  );

  return { safeFetch, isLoading };
}
