// routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

// Pages
import LandingPage            from "../pages/LandingPage";
import LoginPage              from "../pages/LoginPage";
import SignupPage             from "../pages/SignupPage";
import AcceptInvitePage       from "../pages/AcceptInvitePage";
import DashboardPage          from "../pages/DashboardPage";
import TeamWorkspacePage      from "../pages/TeamWorkspacePage";
import ProjectDashboardPage   from "../pages/ProjectDashboardPage";
import DocumentsManagementPage from "../pages/DocumentsManagementPage";
import DocumentEditorPage     from "../pages/DocumentEditorPage";
import WhiteboardsManagementPage from "../pages/WhiteboardsManagementPage";
import WhiteboardEditorPage   from "../pages/WhiteboardEditorPage";
import UserProfilePage        from "../pages/UserProfilePage";

// Layout
import AppShell from "../components/layout/AppShell";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public route wrapper — redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/invite/accept" element={<AcceptInvitePage />} />

        {/* Protected routes — wrapped in AppShell (sidebar + topbar) */}
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="teams"       element={<TeamWorkspacePage />} />
          <Route path="projects"    element={<ProjectDashboardPage />} />
          <Route path="documents"   element={<DocumentsManagementPage />} />
          <Route path="whiteboards" element={<WhiteboardsManagementPage />} />
          <Route path="profile"     element={<UserProfilePage />} />
        </Route>

        {/* Editor routes — full screen, no sidebar */}
        <Route path="/documents/:docId/edit"
          element={<ProtectedRoute><DocumentEditorPage /></ProtectedRoute>} />
        <Route path="/whiteboards/:wbId/edit"
          element={<ProtectedRoute><WhiteboardEditorPage /></ProtectedRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
