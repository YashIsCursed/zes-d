/**
 * AuthContext.jsx  –  Real JWT Authentication Context
 * Wraps the app with <AuthProvider> and exposes useAuth() hook.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, connectSocket, disconnectSocket } from '../utils/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [socket, setSocket]           = useState(null);

  // Restore session from localStorage on page load
  useEffect(() => {
    const token = localStorage.getItem('zes_token');
    const user  = localStorage.getItem('zes_user');
    if (token && user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      const s = connectSocket(token);
      setSocket(s);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('zes_token', token);
    localStorage.setItem('zes_user',  JSON.stringify(user));
    setCurrentUser(user);
    const s = connectSocket(token);
    setSocket(s);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('zes_token');
    localStorage.removeItem('zes_user');
    disconnectSocket();
    setCurrentUser(null);
    setSocket(null);
  }, []);

  const changePassword = useCallback(async (current, next) => {
    await authApi.changePassword(current, next);
    const updated = { ...currentUser, force_pwd_change: 0 };
    localStorage.setItem('zes_user', JSON.stringify(updated));
    setCurrentUser(updated);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, loading, socket, login, logout, changePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
