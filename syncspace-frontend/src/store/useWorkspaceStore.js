// store/useWorkspaceStore.js
// Tracks the currently active workspace (personal or a team)
// Used by sidebar WorkspaceSwitcher and page headers

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useWorkspaceStore = create(
  persist(
    (set) => ({
      // null = personal space, or a team object { _id, name, logo }
      activeWorkspace: null,

      setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
      clearWorkspace: () => set({ activeWorkspace: null }),
    }),
    { name: "syncspace-workspace" }
  )
);

export default useWorkspaceStore;
