import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { router, useSegments } from 'expo-router';
import { useRef } from 'react';

import {
  apiRequest,
  ApiError,
  clearAccessToken,
  restoreAccessToken,
  saveAccessToken,
  setUnauthorizedHandler,
} from '@/services/api';
import { fetchDesignHistory } from '@/services/design-api';
import { useDesignStore } from '@/stores/design-store';
import { AuthState, LoginPayload, SignupPayload } from '@/types/auth';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
  reservedCredits: number;
  availableCredits: number;
}

interface AuthResponse {
  user: ApiUser;
  accessToken?: string;
}

interface AuthContextValue extends AuthState {
  authError: string | null;
  login: (payload: LoginPayload) => Promise<string | null>;
  signup: (payload: SignupPayload) => Promise<string | null>;
  refreshMe: (signal?: AbortSignal) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: ApiUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    provider: 'email' as const,
    role: user.role,
    credits: user.credits,
    reservedCredits: user.reservedCredits,
    availableCredits: user.availableCredits,
    plan: 'free' as const,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'The request could not be completed. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      useDesignStore.getState().clearDesigns();
      if (segmentsRef.current[0] !== '(auth)') {
        router.replace('/(auth)/login');
      }
    });

    let active = true;
    void (async () => {
      try {
        const token = await restoreAccessToken();
        if (token) {
          const response = await apiRequest<{ user: ApiUser }>('/auth/me');
          if (active) {
            setState({ user: mapUser(response.user), isAuthenticated: true, isLoading: false });
            useDesignStore.getState().setDisplayName(response.user.name);
            try {
              useDesignStore.getState().replaceDesigns(await fetchDesignHistory());
            } catch (error) {
              setAuthError(`Signed in, but design history could not be refreshed: ${getErrorMessage(error)}`);
            }
          }
        } else if (active) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        if (active) {
          setAuthError(getErrorMessage(error));
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    })();

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  async function completeAuthentication(
    path: '/auth/login' | '/auth/register',
    payload: Record<string, string>,
  ): Promise<string | null> {
    setAuthError(null);
    setState(current => ({ ...current, isLoading: true }));
    try {
      const response = await apiRequest<AuthResponse>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.accessToken) throw new Error('The API did not return an access token.');
      await saveAccessToken(response.accessToken);
      useDesignStore.getState().clearDesigns();
      useDesignStore.getState().setDisplayName(response.user.name);
      setState({ user: mapUser(response.user), isAuthenticated: true, isLoading: false });
      try {
        useDesignStore.getState().replaceDesigns(await fetchDesignHistory());
      } catch (error) {
        setAuthError(`Signed in, but design history could not be refreshed: ${getErrorMessage(error)}`);
      }
      return null;
    } catch (error) {
      const message = getErrorMessage(error);
      setAuthError(message);
      setState(current => ({ ...current, isLoading: false }));
      return message;
    }
  }

  function login({ email, password }: LoginPayload): Promise<string | null> {
    return completeAuthentication('/auth/login', { email: email.trim(), password });
  }

  function signup({ email, password, displayName }: SignupPayload): Promise<string | null> {
    return completeAuthentication('/auth/register', {
      name: displayName.trim(),
      email: email.trim(),
      password,
    });
  }

  const refreshMe = useCallback(async (signal?: AbortSignal): Promise<void> => {
    const response = await apiRequest<{ user: ApiUser }>('/auth/me', { signal });
    const user = mapUser(response.user);
    setState(current => ({ ...current, user, isAuthenticated: true }));
    useDesignStore.getState().setDisplayName(user.displayName);
  }, []);

  async function logout(): Promise<void> {
    await clearAccessToken();
    useDesignStore.getState().clearDesigns();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }

  return createElement(
    AuthContext.Provider,
    { value: { ...state, authError, login, signup, refreshMe, logout } },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
