// hooks/useAuth.js
// Convenience hook that exposes auth state + rehydrates user on mount.
// Fetches fresh user data from /api/auth/me on app load so profile
// changes made in another tab/device are reflected.

import { useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import { authService } from "../services";

const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, updateUser, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Rehydrate user from server on mount — ensures fresh profile data
    authService.getMe()
      .then(res => {
        const { user: freshUser, teams } = res.data.data;
        updateUser(freshUser);
      })
      .catch(() => {
        // 401 → auto-logout handled by api.js interceptor
      });
  }, []); // run once on mount

  return { user, token, isAuthenticated, logout };
};

export default useAuth;
