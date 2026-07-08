// pages/DocumentEditorPage.jsx
// Full-screen document editor — TipTap + Yjs CRDT + live cursors
// This is the core feature of the entire project.

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, CloudOff, Share2, Download, MoreHorizontal,
  ChevronRight, MessageSquare, History, Sparkles,
  Bold, Italic, Underline, Strikethrough, List,
  ListOrdered, Quote, Code, Link2, Table, Undo, Redo,
  Type, AlignLeft, X, Send, Loader2
} from "lucide-react";

// TipTap
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

// Yjs
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

import Avatar, { AvatarStack } from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import { drawerVariants } from "../styles/animations";
import { documentService, aiService } from "../services";
import useAuthStore from "../store/useAuthStore";
import useUIStore from "../store/useUIStore";
import { getCursorColor, debounce } from "../utils";
import toast from "react-hot-toast";

// ─── Toolbar Button ───────────────────────────────────────────
const ToolBtn = ({ onClick, active, title, children, disabled }) => (
  <button
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={`
      w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors
      ${active
        ? "bg-primary text-white"
        : "text-secondary hover:bg-app hover:text-primary"
      }
      disabled:opacity-40 disabled:cursor-not-allowed
    `}
  >
    {children}
  </button>
);

// ─── AI Chat Panel ────────────────────────────────────────────
const AIChatPanel = ({ docId, getPlainText, onClose }) => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I can answer questions about this document or summarize it for you. What would you like to know?" }
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", content: question }]);
    setLoading(true);
    try {
      const plainText = getPlainText();
      const res = await aiService.chat({ documentId: docId, question, plainText });
      setMessages(p => [...p, { role: "assistant", content: res.data.data.answer }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally { setLoading(false); }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setMessages(p => [...p, { role: "user", content: "Summarize this document" }]);
    try {
      const res = await aiService.summarize(getPlainText());
      setMessages(p => [...p, { role: "assistant", content: res.data.data.summary }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Couldn't summarize. Make sure the document has content." }]);
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      variants={drawerVariants} initial="hidden" animate="visible" exit="exit"
      className="w-96 h-screen fixed top-0 right-0 bg-surface border-l border-border z-30 flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <Sparkles size={15} className="text-accent-purple" /> AI Assistant
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-app text-tertiary hover:text-primary transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Quick action */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="w-full flex items-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 text-sm font-medium rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
        >
          <Sparkles size={14} /> Summarize this document
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-white rounded-tr-sm"
                : "bg-app border border-border text-primary rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-app border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={14} className="animate-spin text-tertiary" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about this document..."
            className="flex-1 px-3.5 py-2.5 bg-app border border-border rounded-xl text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-primary"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Document Right Panel ─────────────────────────────────────
const DocRightPanel = ({ doc, activePanel, onTabChange }) => {
  const tabs = ["Document", "Comments"];
  return (
    <div className="w-72 border-l border-border bg-surface flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activePanel === tab
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Document tab */}
      {activePanel === "Document" && doc && (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {[
            { label: "Title",       value: doc.title       },
            { label: "Description", value: doc.description || "No description" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm text-primary">{value}</p>
            </div>
          ))}

          {doc.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-app border border-border rounded-full text-secondary">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Created by</p>
            <div className="flex items-center gap-2">
              <Avatar user={doc.owner} size="xs" />
              <span className="text-sm text-primary">{doc.owner?.name}</span>
            </div>
          </div>
        </div>
      )}

      {activePanel === "Comments" && (
        <div className="flex-1 flex items-center justify-center text-secondary text-sm px-4 text-center">
          <div>
            <MessageSquare size={28} className="mx-auto mb-2 text-tertiary" />
            <p className="font-medium text-primary text-sm">No comments yet</p>
            <p className="text-xs text-tertiary mt-1">Select text to add a comment</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Document Editor Page ────────────────────────────────
const DocumentEditorPage = () => {
  const { docId }    = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();

  const [doc, setDoc]             = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | error
  const [activePanel, setActivePanel] = useState("Document");
  const [showAI, setShowAI]       = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Yjs setup
  const ydoc     = useRef(new Y.Doc());
  const provider = useRef(null);

  useEffect(() => {
    // Load doc metadata
    documentService.getDocument(docId)
      .then(r => setDoc(r.data.data.document))
      .catch(() => toast.error("Document not found"))
      .finally(() => setLoading(false));

    // Setup Yjs WebSocket provider
    // HocuspocusProvider connects to a y-websocket server that handles CRDT sync
    provider.current = new HocuspocusProvider({
      url: import.meta.env.VITE_YJS_WEBSOCKET_URL || "ws://localhost:1234",
      name: `document-${docId}`,  // room name — each doc has its own Yjs room
      document: ydoc.current,
      token: localStorage.getItem("token"),
      onAwarenessChange: ({ states }) => {
        // Awareness = presence data (who's online, where their cursor is)
        const users = [];
        states.forEach((state, clientId) => {
          if (state.user && clientId !== provider.current?.awareness.clientID) {
            users.push(state.user);
          }
        });
        setOnlineUsers(users);
      },
    });

    // Set our own presence data
    provider.current?.setAwarenessField("user", {
      name:  user?.name  || "Anonymous",
      color: getCursorColor(user?._id || ""),
      avatar: user?.avatar || "",
    });

    return () => provider.current?.destroy();
  }, [docId, user]);

  // Debounced auto-save — saves Yjs state snapshot to MongoDB
  const autoSave = useCallback(
    debounce(async (editor) => {
      if (!editor) return;
      setSaveStatus("saving");
      try {
        const yjsState = Y.encodeStateAsUpdate(ydoc.current);
        const base64   = btoa(String.fromCharCode(...new Uint8Array(yjsState)));
        await documentService.saveSnapshot(docId, base64);

        // Also index for RAG after content changes
        const plainText = editor.getText();
        if (plainText.trim().length > 10) {
          aiService.indexDoc(docId, plainText).catch(() => {}); // fire and forget
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 3000), // save 3 seconds after last keystroke
  [docId]);

  // TipTap editor with Yjs collaboration extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }), // disable local history — Yjs handles undo/redo
      UnderlineExt,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing... (type / for commands)" }),

      // CRDT collaboration — this is what makes real-time sync work
      Collaboration.configure({
        document: ydoc.current, // the shared Yjs document
      }),

      // Live cursors — each collaborator's cursor shown with their name + color
      CollaborationCursor.configure({
        provider: provider.current,
        user: {
          name:  user?.name  || "Anonymous",
          color: getCursorColor(user?._id || ""),
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      autoSave(editor); // trigger debounced save on every content change
    },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
      },
    },
  }, [provider.current]); // re-init when provider is ready

  const getPlainText = () => editor?.getText() || "";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <Loader2 size={24} className="animate-spin text-tertiary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* ── Top bar ── */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-4 flex-shrink-0 bg-surface">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-secondary flex-1 min-w-0">
          <Link to="/documents" className="hover:text-primary transition-colors truncate">Documents</Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <span className="text-primary font-medium truncate">{doc?.title || "Untitled"}</span>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs text-tertiary flex-shrink-0">
          {saveStatus === "saving" && <><Loader2 size={12} className="animate-spin"/> Saving...</>}
          {saveStatus === "saved"  && <><Cloud size={12} className="text-status-green"/> Saved</>}
          {saveStatus === "error"  && <><CloudOff size={12} className="text-status-red"/> Save failed</>}
        </div>

        {/* Online users */}
        {onlineUsers.length > 0 && (
          <AvatarStack users={onlineUsers} max={4} size="xs" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button variant="secondary" size="sm" icon={Share2}>Share</Button>
          <Button size="sm" icon={Download}>Export</Button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-app text-tertiary transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
      {editor && (
        <div className="h-11 border-b border-border flex items-center px-4 gap-1 flex-shrink-0 bg-surface overflow-x-auto">
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={14}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={14}/></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          {/* Block type */}
          <select
            className="text-xs border border-border rounded-md px-2 py-1 bg-surface text-primary focus:outline-none h-7"
            onChange={e => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: parseInt(v) }).run();
            }}
          >
            <option value="p">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
          <div className="w-px h-5 bg-border mx-1" />

          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}          active={editor.isActive("bold")}          title="Bold"><Bold size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}        active={editor.isActive("italic")}        title="Italic"><Italic size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()}     active={editor.isActive("underline")}     title="Underline"><Underline size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}        active={editor.isActive("strike")}        title="Strikethrough"><Strikethrough size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()}     active={editor.isActive("highlight")}     title="Highlight"><Type size={13}/></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}    active={editor.isActive("bulletList")}    title="Bullet List"><List size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}   active={editor.isActive("orderedList")}   title="Numbered List"><ListOrdered size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}    active={editor.isActive("blockquote")}    title="Quote"><Quote size={13}/></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}     active={editor.isActive("codeBlock")}     title="Code Block"><Code size={13}/></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />

          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()}   active={editor.isActive({textAlign:"left"})}   title="Align Left"><AlignLeft size={13}/></ToolBtn>
          <div className="flex-1" />

          {/* Panel toggles */}
          <ToolBtn onClick={() => setShowAI(p => !p)}          active={showAI}           title="AI Assistant"><Sparkles size={13}/></ToolBtn>
          <ToolBtn onClick={() => setActivePanel(p => p)}      active={false}            title="Comments"><MessageSquare size={13}/></ToolBtn>
          <ToolBtn onClick={() => {}}                           active={false}            title="Version History"><History size={13}/></ToolBtn>
        </div>
      )}

      {/* ── Editor body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Writing area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-16 py-12">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Right panel */}
        <DocRightPanel
          doc={doc}
          activePanel={activePanel}
          onTabChange={setActivePanel}
        />

        {/* AI Chat drawer */}
        <AnimatePresence>
          {showAI && (
            <AIChatPanel
              docId={docId}
              getPlainText={getPlainText}
              onClose={() => setShowAI(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Status bar ── */}
      <div className="h-8 border-t border-border flex items-center px-6 gap-6 flex-shrink-0 bg-surface">
        <span className="text-xs text-tertiary">
          {editor?.storage.characterCount?.words?.() || 0} words
        </span>
        <span className="text-xs text-tertiary">English (US)</span>
        <span className="flex-1" />
        <span className="text-xs text-tertiary">
          Last edited {doc?.updatedAt ? new Date(doc.updatedAt).toLocaleTimeString() : "just now"}
        </span>
      </div>
    </div>
  );
};

export default DocumentEditorPage;
