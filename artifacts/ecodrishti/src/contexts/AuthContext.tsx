import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, setAuthTokenGetter } from '@workspace/api-client-react';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

const LOCAL_TOKEN_PREFIX = 'local:';
const LOCAL_USER_KEY = 'eco_user';

function isLocalToken(value: string | null): value is string {
  return !!value && value.startsWith(LOCAL_TOKEN_PREFIX);
}

function readLocalUser(): User | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeLocalSession(token: string, user: User) {
  localStorage.setItem('eco_token', token);
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

function clearLocalSession() {
  localStorage.removeItem('eco_token');
  localStorage.removeItem(LOCAL_USER_KEY);
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eco_token'));
  const [localUser, setLocalUser] = useState<User | null>(() => readLocalUser());
  const queryClient = useQueryClient();

  useEffect(() => {
    setAuthTokenGetter(token ? () => token : null);
  }, [token]);

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      enabled: !!token && !isLocalToken(token),
      queryKey: getGetMeQueryKey(),
      retry: false
    }
  });

  useEffect(() => {
    if (isError && token && !isLocalToken(token)) {
      clearLocalSession();
      setAuthTokenGetter(null);
      setToken(null);
      setLocalUser(null);
    }
  }, [isError, token]);

  const login = (newToken: string, newUser: User) => {
    writeLocalSession(newToken, newUser);
    setAuthTokenGetter(() => newToken);
    setToken(newToken);
    setLocalUser(newUser);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
  };

  const logout = () => {
    clearLocalSession();
    setAuthTokenGetter(null);
    setToken(null);
    setLocalUser(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.clear();
  };

  const currentUser = user || localUser;

  return (
    <AuthContext.Provider value={{ user: currentUser, isLoading: isLoading && !!token && !isLocalToken(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
