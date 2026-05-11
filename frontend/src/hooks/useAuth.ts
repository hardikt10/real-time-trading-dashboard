import { useEffect, useState } from "react";
import type { AuthResponse, AuthUser } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearSession = (nextError: string | null = null) => {
    setUser(null);
    setExpiresAt(null);
    setError(nextError);
    setIsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include"
        });

        if (response.status === 401) {
          if (!cancelled) {
            setUser(null);
            setExpiresAt(null);
            setError(null);
            setIsLoading(false);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to restore your demo session.");
        }

        const payload = (await response.json()) as AuthResponse;
        if (cancelled) {
          return;
        }

        setUser(payload.user);
        setExpiresAt(payload.expiresAt);
        setError(null);
      } catch (requestError) {
        if (!cancelled) {
          setUser(null);
          setExpiresAt(null);
          setError(requestError instanceof Error ? requestError.message : "Unable to restore session.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to sign in.");
      }

      const payload = (await response.json()) as AuthResponse;
      setUser(payload.user);
      setExpiresAt(payload.expiresAt);
      setError(null);
      setIsLoading(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
      throw requestError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // This is a mocked session, so clearing the local state is still enough on failure.
    }

    clearSession();
  };

  return {
    user,
    expiresAt,
    error,
    isLoading,
    isSubmitting,
    login,
    logout,
    clearSession
  };
};
