# SyncSpace — Real-Time Collaborative Workspace

### Complete Project Overview

---

## 1. What We Are Building

A **real-time collaborative workspace platform** (MERN stack) that combines:

1. A **CRDT-based collaborative document editor** (Google Docs-like, but conflict-free by design)
2. A **collaborative whiteboard** (Excalidraw-like infinite canvas)
3. An **AI Chat Assistant (RAG)** that has full context of the document and can answer questions about it
4. A complete **workspace + invite system** so teams can actually collaborate, not just demo solo

**One-line pitch for resume/interview:**
> "A real-time collaborative workspace where teams co-edit documents and whiteboards using CRDT-based conflict-free synchronization, with an integrated RAG-powered AI assistant that understands the full document context."

This is not a single feature clone — it's a **mini-product** with auth, team management, two different real-time collaboration surfaces (text + canvas), and an AI layer on top. That combination is what makes it stand out.

---

## 2. Core Problem It Solves

Most student "collaborative editor" projects break the moment two people type in the same place at the same time — they use naive broadcast (Socket.io relaying raw keystrokes), which causes overwrites and lost data.

This project solves that properly using **CRDT (Conflict-free Replicated Data Type)** via **Yjs**, the same category of technology used by real products (Figma uses a custom CRDT-like system, Linear uses similar ideas). This means:
- Multiple users can edit the *same word* at the *same time* and nothing breaks
- Users can go offline, keep editing, and sync automatically when they reconnect
- No central "lock" is needed to prevent conflicts — math guarantees the merge

This is the single biggest technical differentiator of the project, and it's the first thing to explain in an interview.

---

## 3. The 9 Modules

### Module 0 — Teams & Projects Structure (Foundation)

This is the structural backbone the whole app sits on — every other module plugs into this hierarchy.

```
User
 ├── works SOLO (personal space, no team required)
 └── can belong to MULTIPLE Teams
              ↓
            Team  (e.g. "Acme Corp", "College Project Group")
              ├── has multiple Members (roles: Owner / Admin / Member)
              └── has multiple Projects
                          ↓
                        Project  (e.g. "Marketing Site Redesign")
                          ├── has multiple Documents
                          └── has multiple Whiteboards
```

**Relationships:**
- `User ↔ Team` — many-to-many (a user can be in several teams; a team has several members)
- `Team → Project` — one-to-many
- `Project → Document` / `Project → Whiteboard` — one-to-many

**Functionality:**
1. On signup, every user automatically gets a **Personal space** — for solo work, no team involved
2. **"Create Team"** — user creates a team and becomes its **Owner** automatically
3. Owner/Admin can **invite members** to the team (this is where Module 7's invite system plugs in — invites are sent at the *team* level, not per-document)
4. Inside a team, members can create multiple **Projects**
5. Inside a project, members create **Documents** and **Whiteboards** — this is where the real-time collaboration (Modules 3 & 4) actually happens
6. **Workspace switcher** in the sidebar — user can switch between "Personal" and any team they belong to, similar to how Slack/Discord switch between servers

**Two-level permissions:**
- **Team-level role** — Owner / Admin / Member → controls team settings and member management
- **Project/Document-level role** — Viewer / Commenter / Editor → controls what a member can actually do inside a specific project or document (can be inherited from team role or overridden per-project)

**Why this matters for the resume/interview:** this turns the project from "a shared text editor" into "a multi-tenant collaborative platform" — the same structural pattern real products like Notion, Linear, and Slack use (user → org/team → project → content). It's a strong signal that you can model real-world data relationships, not just CRUD a flat list.

---

### Module 1 — Authentication & User Management
- Signup/Login (JWT-based)
- User profile (name, avatar)
- Session handling, protected routes
- Auto-creation of a personal space on signup

### Module 2 — Project & Document Management
- Create/rename/delete teams, projects, and documents
- Dashboard: documents owned, shared with me, recent — scoped to whichever team/personal space is active
- Permission levels: Viewer / Commenter / Editor (at project/document level)
- Public link sharing with selectable access level

### Module 3 — Real-Time Collaborative Text Editor (CRDT Core)
- Rich text editor (TipTap or Slate.js) — bold, italic, headings, lists, etc.
- **Yjs** powers the actual sync — conflict-free, character-level merging
- Live cursors with user name + color per collaborator
- Presence indicators (avatar stack showing who's currently viewing)
- Offline editing with automatic sync on reconnect
- Continuous auto-save (via Yjs persistence layer)
- Version history with restore ("time travel")
- Inline comments on selected text + @mentions

### Module 4 — Collaborative Whiteboard (Excalidraw-style)
- Infinite canvas with pan & zoom
- Tools: rectangle, ellipse, line, arrow, freehand draw, text
- Real-time shape sync across users (via Yjs `Y.Map`/`Y.Array` — same CRDT engine as the editor, for a unified real-time layer)
- Move, resize, delete shapes — all synced live
- Collaborative-safe undo/redo
- Live cursors on the canvas
- Export whiteboard as PNG

### Module 5 — AI Chat Assistant (RAG, Full-Document Context)
- Side-panel chat interface inside the document view
- Pipeline: document content → chunked → embedded → stored in a vector store
- On a user question: relevant chunks are retrieved → passed to an LLM along with the question → grounded answer generated
- Scoped to the **entire current document**, not just a snippet
- Persisted chat history per document
- One-click "Summarize this document" action
- Optional: cite which part of the document an answer came from

### Module 6 — Notifications
- Real-time (Socket.io) notifications for:
  - Being @mentioned in a comment
  - A document/workspace being shared with you
  - Someone joining a document you're currently editing

### Module 7 — Invite Collaborators ⭐ (Must-Have)
- "Invite Members" flow at the **team level**: enter one or more emails, assign a team role (Member/Admin) at invite time
- Email delivery via **Resend** (or Nodemailer as a fallback)
- **JWT invite token** encoding team ID, invited email, role, and expiry (~48 hrs)
- Accept-invite page:
  - Existing user → login → auto-joins the team
  - New user → signup → auto-joins the team after signup
- Pending invites list, resend/revoke options
- Team member management page (change role / remove member — Owner/Admin only)
- Edge cases handled: duplicate invites, expired tokens, already-a-member checks
- Once inside a team, members get access to its projects per their project-level permission (see Module 0)

### Module 8 — Cross-Cutting Polish
- Dark mode
- Word count / reading time
- Export document as PDF/Markdown
- Responsive layout (usable on tablet, not just desktop)

---

## 4. Real-Time Architecture (Important Design Decision)

The project has **three different real-time problems**, and each is matched to the right tool — but unified under one engine where possible:

| Feature | Sync Approach | Why |
|---|---|---|
| Text editor | **Yjs (CRDT)** | Needs character-level, conflict-free merging |
| Whiteboard | **Yjs (CRDT)** | Reuses the same CRDT engine for shapes — keeps the real-time backend unified instead of running two separate systems |
| AI Chat | **Plain REST API call** | Request–response, not continuous sync — no real-time infra needed here |
| Notifications / presence | **Socket.io** | Lightweight events (who's online, who got mentioned) — doesn't need CRDT guarantees |

**Why this matters for interviews:** being able to say *"I used CRDT for the editor and whiteboard because they need conflict-free merging, but plain Socket.io events for presence/notifications because those don't need that guarantee"* shows you picked tools based on the actual problem — not just because you knew one library.

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TipTap/Slate.js (editor), TailwindCSS |
| Whiteboard | Custom canvas (Konva/Fabric.js) + Yjs binding |
| Real-time sync | Yjs + y-websocket (or Socket.io as transport) |
| Backend | Node.js + Express |
| Database | MongoDB (users, teams, projects, documents, invites metadata) |
| Vector store (RAG) | Pinecone / Chroma / pgvector (pick one) |
| LLM | OpenAI API / Gemini API |
| Auth | JWT |
| Email | Resend (or Nodemailer) |
| Deployment | Vercel (frontend) + Render/Railway (backend) |

---

## 6. What Makes This Stand Out on a Resume

1. **CRDT instead of naive broadcast** — most students don't know what CRDT is; you'll be able to explain *why* it's better than Operational Transform or raw Socket.io broadcasting.
2. **Two collaboration surfaces, one engine** — text editor and whiteboard both running on Yjs is a deliberate architecture choice, not an accident.
3. **RAG with full-document context** — AI integration is a major 2026 hiring signal; being able to explain chunking, embeddings, and retrieval shows you understand the AI engineering pattern, not just "called an API."
4. **A real team/project hierarchy + invite system** — most student projects skip this entirely and hardcode a flat "one document, no teams" model; this project models the same User → Team → Project → Content pattern used by Notion, Linear, and Slack, plus solo mode for individual use.
5. **Offline-first editing** — a natural side benefit of CRDTs that's rarely implemented by students and is a strong talking point.

**Suggested resume line:**
> "Built a real-time collaborative workspace (MERN + Yjs) supporting multi-team organization (users can work solo or across multiple teams/projects), with CRDT-based conflict-free document and whiteboard editing, a RAG-powered AI assistant with full-document context, and a complete team invite/permission system — supporting offline editing with automatic conflict-free sync on reconnect."

---

## 7. Suggested Build Order (High-Level)

1. Auth + Teams/Projects/Documents CRUD + personal space (foundation — Module 0 & 1 & 2)
2. CRDT text editor with Yjs (core differentiator — get this solid first)
3. Team invite system (so multi-user testing is actually possible)
4. Presence + live cursors + notifications (Socket.io layer)
5. Whiteboard (reuse Yjs patterns from step 2)
6. RAG AI assistant (can be built in parallel once documents exist)
7. Polish: dark mode, export, version history, responsiveness

This order front-loads the hardest/most important piece (CRDT editor) while it's early and you have the most time, and keeps the AI layer (which is more independent) for when the core product already works.
