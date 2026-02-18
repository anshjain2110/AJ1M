import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('tlj_admin_token') || null);
  const [admin, setAdmin] = useState(null);

  const api = useCallback((method, url, data) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (method === 'get') return axios.get(`${BACKEND_URL}${url}`, { headers });
    if (method === 'post') return axios.post(`${BACKEND_URL}${url}`, data, { headers });
    if (method === 'patch') return axios.patch(`${BACKEND_URL}${url}`, data, { headers });
    if (method === 'delete') return axios.delete(`${BACKEND_URL}${url}`, { headers });
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, { email, password });
    setToken(res.data.token);
    setAdmin({ email: res.data.email });
    localStorage.setItem('tlj_admin_token', res.data.token);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('tlj_admin_token');
  }, []);

  return (
    <AdminContext.Provider value={{ token, admin, login, logout, api }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be within AdminProvider');
  return ctx;
}
