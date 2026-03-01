import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../shared/api';
import { getPayloadFromToken } from '../shared/session';
import type { LoginResponse, RegisterResponse, UserRole } from '../shared/types';

type AuthMode = 'login' | 'register';

type UseAuthSessionResult = {
  token: string;
  role: UserRole | '';
  authUsername: string;
  isAuthenticated: boolean;
  authMode: AuthMode;
  username: string;
  password: string;
  authError: string;
  authMessage: string;
  setToken: (value: string) => void;
  setRole: (value: UserRole | '') => void;
  setAuthUsername: (value: string) => void;
  setAuthMode: (value: AuthMode) => void;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setAuthError: (value: string) => void;
  setAuthMessage: (value: string) => void;
  login: () => Promise<boolean>;
  register: () => Promise<boolean>;
  logout: () => void;
};

export function useAuthSession(): UseAuthSessionResult {
  const initialToken = localStorage.getItem('accessToken') ?? '';
  const initialPayload = getPayloadFromToken(initialToken);

  const [token, setToken] = useState(initialToken);
  const [role, setRole] = useState<UserRole | ''>(initialPayload.role ?? '');
  const [authUsername, setAuthUsername] = useState(initialPayload.username ?? '');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('cliente');
  const [password, setPassword] = useState('123456');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const isAuthenticated = useMemo(() => token.length > 0, [token]);

  useEffect(() => {
    if (!token) {
      setRole('');
      setAuthUsername('');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authUsername');
      return;
    }

    const payload = getPayloadFromToken(token);
    if (payload.role) {
      setRole(payload.role);
      localStorage.setItem('userRole', payload.role);
    }
    if (payload.username) {
      setAuthUsername(payload.username);
      localStorage.setItem('authUsername', payload.username);
    }
  }, [token]);

  async function login(): Promise<boolean> {
    setAuthError('');
    setAuthMessage('');

    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      const normalizedUsername = username.trim().toLowerCase();
      setToken(data.accessToken);
      setRole(data.role);
      setAuthUsername(normalizedUsername);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('authUsername', normalizedUsername);
      return true;
    } catch (loginError) {
      setAuthError(String(loginError));
      return false;
    }
  }

  async function register(): Promise<boolean> {
    setAuthError('');
    setAuthMessage('');

    try {
      const created = await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setAuthMode('login');
      setAuthMessage(
        `User ${created.username} created. Now login with your credentials.`,
      );
      return true;
    } catch (registerError) {
      setAuthError(String(registerError));
      return false;
    }
  }

  function logout() {
    setToken('');
    setRole('');
    setAuthUsername('');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authUsername');
  }

  return {
    token,
    role,
    authUsername,
    isAuthenticated,
    authMode,
    username,
    password,
    authError,
    authMessage,
    setToken,
    setRole,
    setAuthUsername,
    setAuthMode,
    setUsername,
    setPassword,
    setAuthError,
    setAuthMessage,
    login,
    register,
    logout,
  };
}
