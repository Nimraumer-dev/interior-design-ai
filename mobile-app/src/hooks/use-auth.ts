import { createContext, createElement, useContext, useState, type ReactNode } from 'react';

import { MOCK_USER } from '@/services/mock-data';
import { AuthState, LoginPayload, SignupPayload } from '@/types/auth';

const MOCK_PASSWORD = 'password123';

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<string | null>;
  signup: (payload: SignupPayload) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  async function login({ email, password }: LoginPayload): Promise<string | null> {
    setState(current => ({ ...current, isLoading: true }));
    await new Promise(resolve => setTimeout(resolve, 900));

    if (email === MOCK_USER.email && password === MOCK_PASSWORD) {
      setState({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
      return null;
    }

    setState(current => ({ ...current, isLoading: false }));
    return 'Invalid email or password.';
  }

  async function signup({ email, password, displayName }: SignupPayload): Promise<string | null> {
    setState(current => ({ ...current, isLoading: true }));
    await new Promise(resolve => setTimeout(resolve, 900));

    if (!email.includes('@')) {
      setState(current => ({ ...current, isLoading: false }));
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      setState(current => ({ ...current, isLoading: false }));
      return 'Password must be at least 8 characters.';
    }

    setState({
      user: { ...MOCK_USER, email, displayName },
      isAuthenticated: true,
      isLoading: false,
    });
    return null;
  }

  function logout() {
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }

  return createElement(
    AuthContext.Provider,
    { value: { ...state, login, signup, logout } },
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
