import { useEffect, useState } from "react";

import { api } from "../api/api.js";

import { AuthContext } from "./AuthContextValue.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const setSession = (account, accountRole) => {
    setUser(account);
    setRole(accountRole);

    sessionStorage.setItem("amanak_last_role", accountRole);
  };

  const clearSession = () => {
    setUser(null);
    setRole(null);

    sessionStorage.removeItem("amanak_last_role");
  };

  const childLogin = async (credentials) => {
    const response = await api.post("/auth/login", credentials);

    setSession(response.data.user, "child");

    return response.data;
  };

  const childRegister = async (credentials) => {
    const response = await api.post("/auth/register", credentials);

    setSession(response.data.user, "child");

    return response.data;
  };

  const parentLogin = async (credentials) => {
    const response = await api.post("/parent/login", credentials);

    setSession(response.data.parent, "parent");

    return response.data;
  };

  const parentRegister = async (credentials) => {
    const response = await api.post("/parent/register", credentials);

    const parent = response.data?.parent;

    if (!parent) {
      throw new Error("Invalid registration response");
    }

    return response.data;
  };

  const adminLogin = async (credentials) => {
    const response = await api.post("/admin/login", credentials);

    setSession(response.data.admin, "admin");

    return response.data;
  };

  const childLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  };

  const parentLogout = async () => {
    try {
      await api.post("/parent/logout");
    } finally {
      clearSession();
    }
  };

  const adminLogout = async () => {
    try {
      await api.post("/admin/logout");
    } finally {
      clearSession();
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const lastRole = sessionStorage.getItem("amanak_last_role");

      if (!lastRole) {
        setLoading(false);
        return;
      }

      try {
        if (lastRole === "child") {
          const response = await api.get("/auth/me");

          setUser(response.data.user);

          setRole("child");
        }

        if (lastRole === "parent") {
          const response = await api.get("/parent/me");

          setUser(response.data.parent);

          setRole("parent");
        }

        if (lastRole === "admin") {
          const response = await api.get("/admin/me");

          setUser(response.data.admin);

          setRole("admin");
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const value = {
    user,
    role,
    loading,

    isAuthenticated: Boolean(user),

    childLogin,
    childRegister,
    childLogout,

    parentLogin,
    parentRegister,
    parentLogout,

    adminLogin,
    adminLogout,

    clearSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
