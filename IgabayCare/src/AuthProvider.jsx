import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ apiBase = "", children }) {
  const [token, setToken] = useState(() => localStorage.getItem("chat_token"));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("chat_user") || "null"));

  const login = async (email, password) => {
    const res = await fetch(`${apiBase}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("chat_token", data.token);
    localStorage.setItem("chat_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (email, password) => {
    const res = await fetch(`${apiBase}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    localStorage.setItem("chat_token", data.token);
    localStorage.setItem("chat_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("chat_token");
    localStorage.removeItem("chat_user");
    setToken(null);
    setUser(null);
  };

  const getToken = async () => token;

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}