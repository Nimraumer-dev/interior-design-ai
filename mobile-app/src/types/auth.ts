export type AuthProvider = 'email' | 'google' | 'apple';

export type UserPlan = 'free' | 'pro' | 'studio';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProvider;
  createdAt?: string;
  role?: 'user' | 'admin';
  credits?: number;
  reservedCredits?: number;
  availableCredits?: number;
  generationsUsed?: number;
  generationsLimit?: number;
  plan: UserPlan;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload extends LoginPayload {
  displayName: string;
}
