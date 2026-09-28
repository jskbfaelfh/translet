import React, { createContext, useContext, useState, useEffect } from "react";
import { api, getAuthToken, setAuthToken, removeAuthToken } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.error("Auth fetch failed:", err);
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (phone_or_email, password) => {
    const res = await api.login(phone_or_email, password);
    setAuthToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (phone_or_email, password) => {
    const res = await api.register(phone_or_email, password);
    setAuthToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
