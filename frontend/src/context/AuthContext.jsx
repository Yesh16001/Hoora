import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('campusfind_token');
      if (token) {
        try {
          const data = await api.getMe();
          if (data.success) {
            setUser(data.user);
          } else {
            localStorage.removeItem('campusfind_token');
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem('campusfind_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      if (data.success) {
        localStorage.setItem('campusfind_token', data.token);
        setUser(data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        return data;
      }
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const register = async (name, email, password, role = 'student') => {
    try {
      const data = await api.register({ name, email, password, role });
      if (data.success) {
        localStorage.setItem('campusfind_token', data.token);
        setUser(data.user);
        showToast('Registration successful! Welcome to CampusFind.', 'success');
        return data;
      }
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('campusfind_token');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, toast, showToast }}>
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
