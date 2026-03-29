import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { USER_ROLES } from "../app/routes";
import { apiClient } from "../lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(USER_ROLES.public);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    let active = true;
    apiClient
      .getSession()
      .then((result) => {
        if (!active) {
          return;
        }

        setIsAuthenticated(true);
        setRole(result.user.role || USER_ROLES.public);
        setUser(result.user);
        setSubscription(result.subscription || null);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setIsAuthenticated(false);
        setRole(USER_ROLES.public);
        setUser(null);
        setSubscription(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Re-validate session when the tab becomes visible again (fixes stale state across tabs)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && isAuthenticated) {
        apiClient
          .getSession()
          .then((result) => {
            setRole(result.user.role || USER_ROLES.public);
            setUser(result.user);
            setSubscription(result.subscription || null);
          })
          .catch(() => {
            setIsAuthenticated(false);
            setRole(USER_ROLES.public);
            setUser(null);
            setSubscription(null);
          });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const hasActiveSubscription = subscription?.status === "active";

  const value = useMemo(
    () => ({
      loading,
      isAuthenticated,
      role,
      user,
      subscription,
      hasActiveSubscription,
      async signup(payload) {
        const result = await apiClient.signup(payload);
        setIsAuthenticated(true);
        setRole(result.user.role || USER_ROLES.public);
        setUser(result.user);
        setSubscription(result.subscription || null);
        return result;
      },
      async login(payload) {
        const result = await apiClient.login(payload);
        const session = await apiClient.getSession();
        setIsAuthenticated(true);
        setRole(result.user.role || USER_ROLES.public);
        setUser(session.user);
        setSubscription(session.subscription || null);
        return session;
      },
      async refreshSession() {
        const session = await apiClient.getSession();
        setIsAuthenticated(true);
        setRole(session.user.role || USER_ROLES.public);
        setUser(session.user);
        setSubscription(session.subscription || null);
        return session;
      },
      async clearSession() {
        await apiClient.logout();
        setIsAuthenticated(false);
        setRole(USER_ROLES.public);
        setUser(null);
        setSubscription(null);
      },
    }),
    [loading, isAuthenticated, role, user, subscription, hasActiveSubscription]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}