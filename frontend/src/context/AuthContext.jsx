import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('taskflow_user');
    const token = localStorage.getItem('taskflow_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data);
  };

  const register = async (name, username, email, password) => {
    const { data } = await api.post('/auth/register', { name, username, email, password });
    persistSession(data);
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  };

  const resetPassword = async (token, password) => {
    const { data } = await api.put(`/auth/reset-password/${token}`, { password });
    persistSession(data);
  };

  // Used after an OAuth redirect: we already have a JWT in the URL, just need
  // to fetch the profile it belongs to and store the session the same way.
  const loginWithToken = async (token) => {
    localStorage.setItem('taskflow_token', token);
    const { data } = await api.get('/auth/me');
    localStorage.setItem('taskflow_user', JSON.stringify(data));
    setUser(data);
  };

  // Edit profile: name, username, and/or avatar (a base64 data URI, or '' to clear it)
  const updateProfile = async (updates) => {
    const { data } = await api.put('/auth/profile', updates);
    const updatedUser = { ...user, ...data };
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const persistSession = (data) => {
    const { token, ...userInfo } = data;
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, forgotPassword, resetPassword, loginWithToken, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
