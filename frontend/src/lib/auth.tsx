"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserResponse,
  UserRole,
  UserLoginPayload,
  UserRegisterPayload,
  loginUser,
  registerUser,
  fetchCurrentUser,
} from "@/lib/api";

interface AuthContextType {
  user: UserResponse | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: UserLoginPayload) => Promise<void>;
  register: (payload: UserRegisterPayload) => Promise<void>;
  logout: () => void;
  loginAsDemo: (role: UserRole) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalRole: UserRole | null;
  openAuthModal: (targetRole?: UserRole) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "soteria_access_token";
const USER_KEY = "soteria_user_profile";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole | null>(null);

  // Restore persistent authentication from localStorage on client mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify token in background
        fetchCurrentUser(savedToken)
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          })
          .catch(() => {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          });
      }
    } catch (err) {
      console.error("Failed to restore authentication state", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (payload: UserLoginPayload) => {
    setIsLoading(true);
    try {
      const response = await loginUser(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: UserRegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await registerUser(payload);
      setToken(response.access_token);
      setUser(response.user);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const loginAsDemo = useCallback(async (demoRole: UserRole) => {
    if (demoRole === "HQ_COMMANDER") {
      await login({ email: "commander@soteria.gov", password: "Command@2026" });
    } else if (demoRole === "VOLUNTEER") {
      await login({ email: "aarav.volunteer@soteria.org", password: "Rescue@2026" });
    } else {
      await login({ email: "citizen@soteria.org", password: "Citizen@2026" });
    }
  }, [login]);

  const openAuthModal = useCallback((targetRole?: UserRole) => {
    setAuthModalRole(targetRole || null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        loginAsDemo,
        isAuthModalOpen,
        authModalRole,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
