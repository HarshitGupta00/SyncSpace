// store/useAuthStore.js
// Zustand store for authentication state.
// WHY Zustand: no boilerplate, works like a simple hook.
// WHY store instead of just Context: Zustand is accessible outside React
// components too (e.g. in api.js interceptors if needed).

import { create } from "zustand";
import { persist } from "zustand/middleware";
// `persist` middleware automatically saves state to localStorage
// and rehydrates it on page reload — so user stays logged in.

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      teams: [],
      isAuthenticated: false,

      // Called after successful login/signup
      setAuth: (user, token, teams = []) => {
        localStorage.setItem("token", token); // also save token separately for api.js interceptor
        set({ user, token, teams, isAuthenticated: true });
      },

      // Update user profile (e.g. after updateMe API call)
      updateUser: (updatedUser) => set((state) => ({
        user: { ...state.user, ...updatedUser },
      })),

      // Add a newly joined team to the list
      addTeam: (team) => set((state) => ({
        teams: [...state.teams, team],
      })),

      // Logout — clear everything
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, teams: [], isAuthenticated: false });
      },
    }),
    {
      name: "syncspace-auth", // localStorage key
      partialState: (state) => ({
        // Only persist what's needed — don't persist functions
        user: state.user,
        token: state.token,
        teams: state.teams,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
