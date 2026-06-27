import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Initialize from localStorage ──
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('healthcareToken');
      const storedUser = localStorage.getItem('healthcareUser');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Refresh user data from server
          const response = await authAPI.getMe();
          const freshUser = response.data;
          setUser(freshUser);
          localStorage.setItem('healthcareUser', JSON.stringify(freshUser));
        } catch (error) {
          // Token might be expired or JSON invalid — clear everything
          localStorage.removeItem('healthcareToken');
          localStorage.removeItem('healthcareUser');
          setUser(null);
          setToken(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // ── Login ──
  const login = useCallback(async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token } = response.data;

    localStorage.setItem('healthcareToken', access_token);
    setToken(access_token);

    // Fetch full user data
    const userResponse = await authAPI.getMe();
    const userData = userResponse.data;

    localStorage.setItem('healthcareUser', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  // ── Register ──
  const register = useCallback(async (data) => {
    await authAPI.register(data);
    return await login(data.email, data.password);
  }, [login]);

  // ── Logout ──
  const logout = useCallback(() => {
    localStorage.removeItem('healthcareToken');
    localStorage.removeItem('healthcareUser');
    setToken(null);
    setUser(null);
  }, []);

  // ── Update User ──
  const updateUser = useCallback(async (data) => {
    const response = await authAPI.updateMe(data);
    const updatedUser = response.data;
    setUser(updatedUser);
    localStorage.setItem('healthcareUser', JSON.stringify(updatedUser));
    return updatedUser;
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
