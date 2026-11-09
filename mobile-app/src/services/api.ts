import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { Config } from '@/constants/config';

const ACCESS_TOKEN_KEY = 'atelier.access-token';

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function restoreAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    accessToken = globalThis.sessionStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  } else {
    accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  }
  return accessToken;
}

export async function saveAccessToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.sessionStorage?.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  }
  accessToken = token;
}

export async function clearAccessToken(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.sessionStorage?.removeItem(ACCESS_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }
  accessToken = null;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${Config.apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      `Could not reach the API at ${Config.apiBaseUrl}. Check the phone and computer are on the same Wi-Fi and the API is running.`,
      0,
      'NETWORK_ERROR',
    );
  }

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new ApiError('The API returned an invalid response.', response.status, null);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearAccessToken();
      onUnauthorized?.();
    }
    const body = payload as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      body?.error?.message || `Request failed with status ${response.status}.`,
      response.status,
      body?.error?.code ?? null,
    );
  }
  return payload as T;
}
