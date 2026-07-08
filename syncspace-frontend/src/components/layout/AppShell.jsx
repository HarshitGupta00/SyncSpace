// components/layout/AppShell.jsx
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { pageVariants } from "../../styles/animations";
import useSocket from "../../hooks/useSocket";
import useAuth from "../../hooks/useAuth";

// Drawers
import NotificationsDrawer from "../drawers/NotificationsDrawer";

// Global modals
import CreateTeamModal        from "../modals/CreateTeamModal";
import CreateProjectModal     from "../modals/CreateProjectModal";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";
import InviteMembersModal     from "../modals/InviteMembersModal";
import ShareDocumentModal     from "../modals/ShareDocumentModal";
import ExportDocumentModal    from "../modals/ExportDocumentModal";

import useUIStore from "../../store/useUIStore";

const AppShell = () => {
  // Initialize socket connection and rehydrate user on mount
  useSocket();
  useAuth();

  const { drawers, modals } = useUIStore();

  return (
    <div className="min-h-screen bg-app">
      <Sidebar />

      <div className="ml-sidebar min-h-screen flex flex-col">
        <TopBar />

        <motion.main
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          className="mt-topbar flex-1 overflow-auto"
        >
          <Outlet />
        </motion.main>
      </div>

      {/* ── Global Drawers ── */}
      <NotificationsDrawer isOpen={drawers.notifications} />

      {/* ── Global Modals ── */}
      <CreateTeamModal         isOpen={modals.createTeam}      />
      <CreateProjectModal      isOpen={modals.createProject}   />
      <DeleteConfirmationModal isOpen={modals.deleteConfirm}   />
      <InviteMembersModal      isOpen={modals.inviteMembers}   />
      <ShareDocumentModal      isOpen={modals.shareDocument}   />
      <ExportDocumentModal     isOpen={modals.exportDocument}  />
    </div>
  );
};

export default AppShell;
