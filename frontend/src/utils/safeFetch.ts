/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Safe fetch wrapper with timeout support
 * Replaces deprecated AbortSignal.timeout() with Promise.race()
 */

export async function safeFetch(
  url: string,
  options?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = 15000, ...fetchOptions } = options || {};

  // Create timeout promise for race condition
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), timeout),
  );

  const fetchPromise = fetch(url, fetchOptions);

  try {
    const response = (await Promise.race([
      fetchPromise,
      timeoutPromise,
    ])) as Response;

    return response;
  } catch (error: any) {
    // Improve error message for timeouts
    if (error.message === "Request timeout") {
      throw new Error("Network timeout - please check your connection");
    }
    throw error;
  }
}

/**
 * Make a safe GET request with timeout
 */
export async function safeGet<T = any>(
  url: string,
  timeout = 15000,
): Promise<T> {
  const response = await safeFetch(url, { timeout });

  if (!response.ok) {
    throw new Error(`Server Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Make a safe POST request with timeout
 */
export async function safePost<T = any>(
  url: string,
  body: any,
  timeout = 15000,
): Promise<T> {
  const response = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeout,
  });

  if (!response.ok) {
    throw new Error(`Server Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Make a safe PUT request with timeout
 */
export async function safePut<T = any>(
  url: string,
  body: any,
  timeout = 15000,
): Promise<T> {
  const response = await safeFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeout,
  });

  if (!response.ok) {
    throw new Error(`Server Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Make a safe DELETE request with timeout
 */
export async function safeDelete<T = any>(
  url: string,
  timeout = 15000,
): Promise<T> {
  const response = await safeFetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    timeout,
  });

  if (!response.ok) {
    throw new Error(`Server Error: ${response.status}`);
  }

  return response.json().catch(() => null); // DELETE might return empty
}
