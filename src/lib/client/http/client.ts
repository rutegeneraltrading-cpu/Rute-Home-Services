import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000;
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
        credentials: 'include', // Always send cookies for auth
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message:
            error.message ||
            error.error ||
            error.error_description ||
            `HTTP ${response.status}`,
          data: error,
        };
      }
      if (response.status === 204 || response.status === 205) {
        return undefined as T;
      }

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();
      if (!responseText) {
        return undefined as T;
      }

      if (contentType.includes('application/json')) {
        return JSON.parse(responseText) as T;
      }

      return responseText as unknown as T;
    } catch (error: unknown) {
      const isAbort =
        error instanceof Error && error.name === 'AbortError';
      const isOffline = !navigator.onLine;
      const isNetworkFailure =
        error instanceof Error && error.message === 'Failed to fetch';

      if (isAbort || isNetworkFailure || isOffline) {
        const now = Date.now();
        if (now - lastNetworkErrorTime >= NETWORK_ERROR_DEBOUNCE_MS) {
          lastNetworkErrorTime = now;
          if (isAbort && !isOffline) {
            toast({
              variant: 'destructive',
              title: 'Request Timed Out',
              description:
                'The server is taking too long to respond. Please try again.',
            });
            throw new Error('Request timed out. Please try again.');
          }
          toast({
            variant: 'destructive',
            title: 'Network Error',
            description: 'Please check your internet connection.',
          });
        }
        throw new Error(
          isAbort && !isOffline
            ? 'Request timed out. Please try again.'
            : 'Network error. Please check your connection.',
        );
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

  async patch<T>(
    url: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
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
