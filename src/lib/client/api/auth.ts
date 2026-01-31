// API client for authentication
const API_BASE = '/api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'worker';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
}

export interface ErrorResponse {
  error: string;
}

// Sign up new user
export async function signupAPI(
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Signup failed');
  }

  return data;
}

// Login user
export async function loginAPI(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

// Logout user
export async function logoutAPI(): Promise<void> {
  const response = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Logout failed');
  }
}

// Get current user
export async function getCurrentUserAPI(): Promise<User | null> {
  const response = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get user');
  }

  return data.user;
}
