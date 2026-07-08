// store/useUIStore.js
// Global UI state — which modals/drawers are open.
// WHY in a store instead of local state: modals can be triggered
// from multiple places (a button in a table row, a keyboard shortcut,
// a right-click menu) — global state avoids prop drilling.

import { create } from "zustand";

const useUIStore = create((set) => ({
  // Modals
  modals: {
    createTeam:      false,
    createProject:   false,
    createDocument:  false,
    createWhiteboard:false,
    renameTeam:      false,
    renameProject:   false,
    renameDocument:  false,
    deleteConfirm:   false,
    inviteMembers:   false,
    memberManagement:false,
    shareDocument:   false,
    permissions:     false,
    exportDocument:  false,
    exportWhiteboard:false,
  },

  // Drawers
  drawers: {
    aiChat:         false,
    versionHistory: false,
    comments:       false,
    notifications:  false,
  },

  // Context data passed to modals (e.g. which item to delete/rename)
  modalContext: null,

  // Open/close modals
  openModal: (modalName, context = null) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
      modalContext: context,
    })),

  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
      modalContext: null,
    })),

  // Open/close drawers
  openDrawer: (drawerName) =>
    set((state) => ({
      drawers: { ...state.drawers, [drawerName]: true },
    })),

  closeDrawer: (drawerName) =>
    set((state) => ({
      drawers: { ...state.drawers, [drawerName]: false },
    })),

  toggleDrawer: (drawerName) =>
    set((state) => ({
      drawers: { ...state.drawers, [drawerName]: !state.drawers[drawerName] },
    })),
}));

export default useUIStore;
