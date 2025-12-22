import React, { useMemo, useState } from "react";
import { api } from "../api/client";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const isAuthed = !!token;

  const login = async (email, password) => {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const register = async (email, password) => {
    const data = await api("/auth/register", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const value = useMemo(
    () => ({ token, isAuthed, login, register, logout }),
    [token, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
