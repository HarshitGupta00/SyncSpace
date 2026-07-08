# SyncSpace  🚀

[![Status](https://img.shields.io/badge/status-building-orange?style=for-the-badge)](https://github.com/) [![React](https://img.shields.io/badge/React-?style=for-the-badge&logo=react&logoColor=white)](https://github.com/facebook/react) [![Vite](https://img.shields.io/badge/Vite-?style=for-the-badge&logo=vite&logoColor=white)](https://github.com/vitejs/vite) [![Tailwind](https://img.shields.io/badge/TailwindCSS-?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://github.com/tailwindlabs/tailwindcss) [![Yjs](https://img.shields.io/badge/Yjs-?style=for-the-badge&logo=gnu&logoColor=white)](https://github.com/yjs/yjs) [![Socket.io](https://img.shields.io/badge/Socket.io-?style=for-the-badge&logo=socketdotio&logoColor=white)](https://github.com/socketio/socket.io)

SyncSpace is a colourful, real-time collaborative workspace for teams — co-edit documents and whiteboards, manage projects, invite teammates, and ask an AI assistant questions about your content. This repo is **currently building** (work-in-progress). 🎨⚙️

## Quick Status
- **Currently building**: core features (auth, teams, Yjs editor) are in active development.

## Highlights (in simple language)
- ✨ Real-time collaborative document editor (CRDT-powered via Yjs) — safe concurrent typing.
- 🖊️ Collaborative whiteboard with synchronized shapes and live cursors.
- 🤖 AI Chat Assistant (RAG) that answers questions using full-document context.
- 👥 Team & project hierarchy with invite flow and role-based permissions.
- 🌐 Offline-first editing: work offline and sync without conflicts when you reconnect.

For the detailed project vision and module breakdown, see [SyncSpace Project Overview.md](SyncSpace%20Project%20Overview.md).

## Tech Stack (direct links)
- Frontend: [React](https://github.com/facebook/react) — UI framework
- Editor: [TipTap](https://github.com/ueberdosis/tiptap) or [Slate](https://github.com/ianstormtaylor/slate) — rich text editor options
- Styles: [TailwindCSS](https://github.com/tailwindlabs/tailwindcss)
- Bundler / Dev: [Vite](https://github.com/vitejs/vite)
- Real-time CRDT: [Yjs](https://github.com/yjs/yjs)
- Real-time events: [Socket.io](https://github.com/socketio/socket.io)
- Backend runtime: [Node.js](https://github.com/nodejs/node)
- Backend framework: [Express](https://github.com/expressjs/express)
- Database: [MongoDB](https://github.com/mongodb/mongo)
- Vector DB / RAG options: [Pinecone](https://www.pinecone.io/), [Chroma](https://github.com/chroma-core/chroma), [pgvector](https://github.com/pgvector/pgvector)
- LLM integrations: [OpenAI Node](https://github.com/openai/openai-node) (or cloud LLMs)

## Quick Architecture Summary
- Editor & whiteboard use Yjs so concurrent edits merge safely (CRDT guarantees).
- Notifications and presence use Socket.io — lightweight event stream.
- AI assistant: documents are chunked, embedded, stored in a vector store, and queried for retrieval-augmented generation (RAG).

## Folder Structure (short)
The repo contains two main folders: `syncspace-frontend/` and `syncspace-backend/`. A full, annotated structure is available in [SyncSpace  Folder-Structure.md](SyncSpace%20%20Folder-Structure.md).

- syncspace-frontend/
  - `src/pages/` — full pages (Editor, Whiteboard, Dashboard, Login, Signup, Accept Invite)
  - `src/components/` — UI primitives, editor/whiteboard components, modals, drawers
  - `src/hooks/` — `useYjsDocument`, `useYjsWhiteboard`, `useSocket` and other helpers
  - `src/services/` — API client wrappers (auth, teams, documents, ai)

- syncspace-backend/
  - `src/controllers/` — route handlers (auth, team, document, ai)
  - `src/services/` — business logic (ragService, inviteTokenService, emailService)
  - `src/sockets/` — Socket.io handlers and Yjs sync integration
  - `src/models/` — Mongoose schemas (User, Team, Project, Document, Whiteboard, Invite)

## Getting Started (development)
1. Install and run the backend:

```bash
cd syncspace-backend
npm install
cp .env.example .env            # then edit .env to add MongoDB, API keys, etc.
npm run dev                     # or npm start depending on scripts
```

2. Install and run the frontend:

```bash
cd syncspace-frontend
npm install
cp .env.example .env            # set `VITE_API_URL` to your backend
npm run dev
```

Notes:
- The backend expects a MongoDB connection string and LLM / vector DB credentials in `.env`.
- The repo includes example `.env.example` files in each folder.

## Usage (what to try first)
1. Sign up — you'll get a personal workspace automatically.
2. Create a team and invite a colleague (or open a second browser/incognito window).
3. Create a project and add a document — open it in two windows and type together to see CRDT merge in action.
4. Open the right-side AI chat to ask questions about the open document (RAG-powered answers).

## Contributing
- Read the module list in [SyncSpace Project Overview.md](SyncSpace%20Project%20Overview.md) to understand priorities.
- The suggested build order starts with auth & teams, then Yjs editor, then invites, presence, whiteboard, and RAG.
- Pick a small issue, follow existing code style, and open a PR with a clear description.

## Where to read more
- Project vision & module breakdown: [SyncSpace Project Overview.md](SyncSpace%20Project%20Overview.md)
- Annotated folder layout: [SyncSpace  Folder-Structure.md](SyncSpace%20%20Folder-Structure.md)

---
If you'd like, I can also:
- add a short Quickstart with example `.env` values,
- create simple NPM scripts for combined dev (concurrently run frontend+backend), or
- scaffold a CONTRIBUTING.md and CODE_OF_CONDUCT.

Tell me which of those you'd like next and I'll add it.
