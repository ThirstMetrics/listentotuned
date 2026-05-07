/**
 * Tuned Podcast Player - Axios HTTP Client
 *
 * Configurable Axios instance for communicating with the Azure backend.
 * Handles auth token injection, 401 refresh, and network-error retries.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { createMMKV } from 'react-native-mmkv';

// ---------------------------------------------------------------------------
// MMKV Storage (shared key-value store for tokens)
// ---------------------------------------------------------------------------

const storage = createMMKV({ id: 'tuned-auth' });

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Override this at build time via .env / react-native-config. */
const BASE_URL =
  (globalThis as any).__TUNED_API_BASE_URL__ ??
  'https://phpstack-1449472-6223187.cloudwaysapps.com/api';

const DEFAULT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Helper: Token Persistence
// ---------------------------------------------------------------------------

/**
 * Programmatically set the auth (bearer) token.
 * Persists to MMKV so future cold-starts can attach it automatically.
 */
function setAuthToken(token: string | null): void {
  if (token) {
    storage.set(AUTH_TOKEN_KEY, token);
  } else {
    storage.remove(AUTH_TOKEN_KEY);
  }
}

/**
 * Programmatically set the refresh token.
 */
function setRefreshToken(token: string | null): void {
  if (token) {
    storage.set(REFRESH_TOKEN_KEY, token);
  } else {
    storage.remove(REFRESH_TOKEN_KEY);
  }
}

/**
 * Clear all auth tokens (used during sign-out).
 */
function clearTokens(): void {
  storage.remove(AUTH_TOKEN_KEY);
  storage.remove(REFRESH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Request Interceptor - Attach Auth Token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getString(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response Interceptor - Handle 401 & Network Errors
// ---------------------------------------------------------------------------

/** Prevent multiple simultaneous refresh attempts. */
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processPendingRequests(token: string | null, error?: unknown): void {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ----- 401 Unauthorized: attempt token refresh ---------------------------
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes.
        return new Promise<string>((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = storage.getString(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post<{
          access_token: string;
          refresh_token: string;
        }>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

        const newToken = data.access_token;
        setAuthToken(newToken);
        setRefreshToken(data.refresh_token);

        processPendingRequests(newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processPendingRequests(null, refreshError);
        clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ----- Network errors (no response) --------------------------------------
    if (!error.response) {
      const networkError = new Error(
        'Network error: please check your internet connection.',
      );
      (networkError as any).isNetworkError = true;
      return Promise.reject(networkError);
    }

    // ----- All other errors: pass through ------------------------------------
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { apiClient, setAuthToken, setRefreshToken, clearTokens };
export default apiClient;
