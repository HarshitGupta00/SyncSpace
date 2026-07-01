# SyncSpace — Folder Structure (Frontend + Backend)

Two separate repos: `syncspace-frontend` and `syncspace-backend`.
Frontend uses a **type-based** structure (components/hooks/pages/services separated) — chosen over feature-based because component categories already map cleanly to the 37-item UI inventory (pages, modals, drawers, dropdowns, popovers), and this is a solo-built project where feature-folder duplication overhead isn't worth it.

---

## 1. Frontend — `syncspace-frontend/`

```
syncspace-frontend/
├── public/
│   ├── favicon.svg
│   └── logo.svg
│
├── src/
│   ├── main.jsx                      # App entry point
│   ├── App.jsx                       # Root component, router setup
│   ├── index.css                     # Tailwind imports + global styles + CSS variables
│   │
│   ├── routes/
│   │   ├── AppRouter.jsx             # All route definitions
│   │   └── ProtectedRoute.jsx        # Auth guard wrapper
│   │
│   ├── pages/                        # One file per "Full Page" (1-12 from your list)
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── AcceptInvitePage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── TeamWorkspacePage.jsx
│   │   ├── ProjectDashboardPage.jsx
│   │   ├── DocumentsManagementPage.jsx
│   │   ├── DocumentEditorPage.jsx
│   │   ├── WhiteboardsManagementPage.jsx
│   │   ├── WhiteboardEditorPage.jsx
│   │   └── UserProfilePage.jsx
│   │
│   ├── components/
│   │   ├── layout/                   # Shared structural pieces
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── AppShell.jsx          # Wraps sidebar + topbar + page content
│   │   │   └── MobileNavDrawer.jsx   # Responsive sidebar-as-drawer on mobile
│   │   │
│   │   ├── modals/                   # 17-30 from your list
│   │   │   ├── CreateTeamModal.jsx
│   │   │   ├── CreateProjectModal.jsx
│   │   │   ├── CreateDocumentModal.jsx
│   │   │   ├── CreateWhiteboardModal.jsx
│   │   │   ├── RenameTeamModal.jsx
│   │   │   ├── RenameProjectModal.jsx
│   │   │   ├── RenameDocumentModal.jsx
│   │   │   ├── DeleteConfirmationModal.jsx
│   │   │   ├── InviteMembersModal.jsx
│   │   │   ├── TeamMemberManagementModal.jsx
│   │   │   ├── ShareDocumentModal.jsx
│   │   │   ├── PermissionsModal.jsx
│   │   │   ├── ExportDocumentModal.jsx
│   │   │   └── ExportWhiteboardModal.jsx
│   │   │
│   │   ├── drawers/                  # 13-16 from your list
│   │   │   ├── AIChatDrawer.jsx
│   │   │   ├── VersionHistoryDrawer.jsx
│   │   │   ├── CommentsDrawer.jsx
│   │   │   └── NotificationsDrawer.jsx
│   │   │
│   │   ├── dropdowns/                # 31-32
│   │   │   ├── WorkspaceSwitcherDropdown.jsx
│   │   │   └── UserMenuDropdown.jsx
│   │   │
│   │   ├── popovers/                 # 35
│   │   │   └── MentionUserPicker.jsx
│   │   │
│   │   ├── floating/                 # 33-34
│   │   │   ├── SlashCommandMenu.jsx
│   │   │   └── RichTextToolbar.jsx
│   │   │
│   │   ├── editor/                   # Document editor specific building blocks
│   │   │   ├── DocumentEditorCanvas.jsx     # TipTap/Slate wrapper
│   │   │   ├── DocumentRightPanel.jsx       # Tabbed: Document | Comments
│   │   │   ├── DocumentBreadcrumb.jsx
│   │   │   └── PropertyField.jsx            # Reusable key-value property row
│   │   │
│   │   ├── whiteboard/               # Whiteboard editor specific building blocks
│   │   │   ├── WhiteboardCanvas.jsx         # Konva/Fabric wrapper
│   │   │   ├── WhiteboardToolbar.jsx
│   │   │   ├── WhiteboardCreatePanel.jsx    # Left "Create" tool list
│   │   │   ├── WhiteboardRightPanel.jsx     # Tabbed: Board | Styles | Comments
│   │   │   └── ShapeRenderer.jsx
│   │   │
│   │   ├── collaboration/            # 36-37 — shared real-time UI bits
│   │   │   ├── PresenceAvatarStack.jsx
│   │   │   ├── LiveCursor.jsx
│   │   │   └── LiveCursorLabel.jsx
│   │   │
│   │   └── ui/                       # Generic reusable primitives (buttons, inputs, etc.)
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Avatar.jsx
│   │       ├── Badge.jsx             # Status/role pills
│   │       ├── Card.jsx
│   │       ├── StatCard.jsx
│   │       ├── ProgressBar.jsx
│   │       ├── Tabs.jsx
│   │       ├── Tooltip.jsx
│   │       ├── Toast.jsx
│   │       ├── Skeleton.jsx          # Loading skeletons
│   │       ├── EmptyState.jsx
│   │       └── Modal.jsx             # Base modal wrapper (Framer Motion enter/exit)
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSocket.js              # Socket.io connection hook
│   │   ├── useYjsDocument.js         # Yjs binding for text editor
│   │   ├── useYjsWhiteboard.js       # Yjs binding for whiteboard shapes
│   │   ├── usePresence.js            # Online users / awareness
│   │   ├── useDebounce.js
│   │   ├── useClickOutside.js        # For dropdowns/popovers
│   │   └── useMediaQuery.js          # Responsive breakpoint detection
│   │
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── WorkspaceContext.jsx      # Current team/personal space
│   │   └── ThemeContext.jsx          # Dark mode (if implemented)
│   │
│   ├── services/                     # API call layer (axios instances per resource)
│   │   ├── api.js                    # Base axios instance + interceptors
│   │   ├── authService.js
│   │   ├── teamService.js
│   │   ├── projectService.js
│   │   ├── documentService.js
│   │   ├── whiteboardService.js
│   │   ├── inviteService.js
│   │   ├── commentService.js
│   │   ├── notificationService.js
│   │   └── aiService.js              # RAG chat endpoints
│   │
│   ├── store/                        # Global state (Zustand/Redux — pick one)
│   │   ├── useAuthStore.js
│   │   ├── useWorkspaceStore.js
│   │   └── useUIStore.js             # Modal/drawer open states, etc.
│   │
│   ├── lib/
│   │   ├── yjsProvider.js            # Yjs doc + websocket provider setup
│   │   ├── socket.js                 # Socket.io client instance
│   │   └── constants.js              # Roles, permission levels, enums
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── formatFileSize.js
│   │   ├── getInitials.js            # For avatar fallback
│   │   ├── cursorColor.js            # Deterministic color per user for live cursors
│   │   └── validators.js
│   │
│   └── styles/
│       └── animations.js             # Shared Framer Motion variants (fade, slide, scale)
│
├── .env.example
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 2. Backend — `syncspace-backend/`

```
syncspace-backend/
├── src/
│   ├── server.js                     # Entry point — starts Express + Socket.io + Yjs websocket
│   ├── app.js                        # Express app config (middleware, routes mounted)
│   │
│   ├── config/
│   │   ├── db.js                     # MongoDB connection
│   │   ├── env.js                    # Centralized env variable validation/export
│   │   └── socket.js                 # Socket.io server setup + CORS
│   │
│   ├── models/                       # Mongoose schemas
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── TeamMember.js             # Join table: User ↔ Team (role)
│   │   ├── Project.js
│   │   ├── Document.js
│   │   ├── Whiteboard.js
│   │   ├── Invite.js
│   │   ├── Comment.js
│   │   ├── Notification.js
│   │   └── DocumentVersion.js        # Version history snapshots
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── teamController.js
│   │   ├── projectController.js
│   │   ├── documentController.js
│   │   ├── whiteboardController.js
│   │   ├── inviteController.js
│   │   ├── commentController.js
│   │   ├── notificationController.js
│   │   ├── userController.js
│   │   └── aiController.js           # RAG endpoints (chat, summarize)
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── teamRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── whiteboardRoutes.js
│   │   ├── inviteRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── userRoutes.js
│   │   ├── aiRoutes.js
│   │   └── index.js                  # Mounts all routers onto /api
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT verification
│   │   ├── roleMiddleware.js         # Team/project role-based access checks
│   │   ├── errorMiddleware.js        # Centralized error handler
│   │   └── rateLimiter.js
│   │
│   ├── sockets/                      # Socket.io event handlers
│   │   ├── index.js                  # Registers all socket namespaces/handlers
│   │   ├── presenceHandler.js        # Online users, awareness broadcast
│   │   ├── notificationHandler.js
│   │   └── yjsHandler.js             # Yjs document sync (or separate y-websocket server)
│   │
│   ├── services/                     # Business logic separated from controllers
│   │   ├── emailService.js           # Resend/Nodemailer wrapper
│   │   ├── inviteTokenService.js     # JWT invite token generate/verify
│   │   ├── ragService.js             # Chunking, embeddings, vector store query
│   │   ├── llmService.js             # LLM API call wrapper (OpenAI/Gemini)
│   │   └── permissionService.js      # Shared permission-check logic
│   │
│   ├── utils/
│   │   ├── generateToken.js          # JWT sign helper
│   │   ├── asyncHandler.js           # Wraps controllers to catch async errors
│   │   ├── apiResponse.js            # Standardized success/error response shape
│   │   └── chunkText.js              # Document chunking for RAG
│   │
│   └── validators/                   # Request body validation schemas (Zod/Joi)
│       ├── authValidator.js
│       ├── teamValidator.js
│       ├── documentValidator.js
│       └── inviteValidator.js
│
├── .env.example
├── package.json
└── README.md
```

---

## 3. Why This Structure

- **Type-based frontend** keeps things predictable: any of your 37 listed components has an obvious home (`modals/`, `drawers/`, `dropdowns/`, `popovers/`, `floating/`). No need to decide "which feature folder does this belong to."
- **`editor/` and `whiteboard/` get their own component folders** instead of being lumped into generic `components/` — they're complex enough (canvas, toolbars, panels) to warrant separation, and this mirrors how the two editor pages are clearly distinct subsystems in your design reference.
- **`collaboration/` folder** isolates the real-time presence/cursor UI since it's reused identically across both the document editor and whiteboard editor.
- **`hooks/` separates Yjs and Socket.io concerns** (`useYjsDocument`, `useYjsWhiteboard`, `usePresence`) so real-time logic doesn't leak into UI components directly.
- **Backend separates `controllers/` from `services/`** — controllers stay thin (handle req/res), services hold actual logic (especially important for `ragService.js` and `permissionService.js`, which are non-trivial and reused across routes).
- **`sockets/` is isolated from `routes/`** — real-time event handling is architecturally different from REST and deserves its own folder rather than being mixed into controllers.
- **`TeamMember.js` model exists separately from `User` and `Team`** — this is the join table that makes the many-to-many `User ↔ Team` relationship (with role) clean to query, matching the Module 0 structure already locked in.

---

## 4. Still To Decide (flag for next step)

- **State management library**: Zustand (lighter, simpler) vs Redux Toolkit (more boilerplate, more structure) — `store/` folder assumes one is picked
- **Rich text editor**: TipTap vs Slate.js — affects `editor/` internals
- **Whiteboard library**: Konva vs Fabric.js — affects `whiteboard/` internals
- **Validation library**: Zod vs Joi — affects `validators/` folder
- **Vector DB for RAG**: Pinecone vs Chroma vs pgvector — affects `ragService.js` implementation only, not folder structure

These don't need to be locked before the DB schema step, but worth deciding before actual coding starts.
