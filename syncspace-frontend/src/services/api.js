// services/api.js
// Base axios instance used by ALL service files.
// WHY a shared instance:
//   1. Base URL configured once — change VITE_API_URL in .env, everywhere updates
//   2. Request interceptor automatically attaches the JWT token to every request
//   3. Response interceptor handles 401 (token expired) globally — auto logout

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// REQUEST INTERCEPTOR — attach JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR — handle auth errors globally
api.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
