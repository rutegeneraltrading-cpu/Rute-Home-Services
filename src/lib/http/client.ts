import { useCallback } from 'react';

/**
 * HTTP Client with network error handling
 * Centralized error handling and retry logic
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
}

interface HTTPError {
  status?: number;
  message: string;
  data?: unknown;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
let lastNetworkErrorTime = 0;
const NETWORK_ERROR_DEBOUNCE_MS = 5000;

class HTTPClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    url: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
    const fullURL = `${this.baseURL}${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(fullURL, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: error.message || `HTTP ${response.status}`,
          data: error,
        };
      }

      return response.json();
    } catch (error: unknown) {
      // Network error (no internet, timeout, etc)
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof Error && error.message === 'Failed to fetch') ||
        !navigator.onLine
      ) {
        const now = Date.now();
        if (now - lastNetworkErrorTime >= NETWORK_ERROR_DEBOUNCE_MS) {
          lastNetworkErrorTime = now;
          // This will be caught in mutation/query onError handlers
        }
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(
    url: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    url: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HTTPClient(process.env.NEXT_PUBLIC_API_URL || '');

export function useErrorToast() {
  return useCallback((error: unknown) => {
    let message = 'Something went wrong';

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error && error.message) {
      message = error.message;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    ) {
      message = String((error as Record<string, unknown>).message);
    }

    // You can integrate with toast here
    console.error(message);
  }, []);
}
