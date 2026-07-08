// pages/WhiteboardEditorPage.jsx
// Updated: uses y-websocket (y-protocols/sync) instead of HocuspocusProvider
// Backend now runs native Yjs WebSocket on /yjs path

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Share2, Play, MoreHorizontal,
  MousePointer2, Square, Circle, Minus, ArrowRight,
  Pencil, Type, Image, Table, Frame, LayoutTemplate,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Cloud, Loader2,
  StickyNote, MessageSquare
} from "lucide-react";
import { Stage, Layer, Rect, Circle as KonvaCircle, Text as KText } from "react-konva";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import Button from "../components/ui/Button";
import { AvatarStack } from "../components/ui/Avatar";
import { whiteboardService } from "../services";
import useAuthStore from "../store/useAuthStore";
import { getCursorColor, debounce } from "../utils";
import toast from "react-hot-toast";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const YJS_WS_URL = SOCKET_URL.replace(/^http/, "ws");

const TOOLS = [
  { id: "select", icon: MousePointer2, label: "Select",    key: "v" },
  { id: "frame",  icon: Frame,         label: "Frame",     key: "f" },
  { id: "circle", icon: Circle,        label: "Ellipse",   key: "o" },
  { id: "rect",   icon: Square,        label: "Rectangle", key: "r" },
  { id: "arrow",  icon: ArrowRight,    label: "Arrow",     key: "a" },
  { id: "pen",    icon: Pencil,        label: "Draw",      key: "p" },
  { id: "text",   icon: Type,          label: "Text",      key: "t" },
  { id: "image",  icon: Image,         label: "Image",     key: "i" },
];

const CREATE_TOOLS = [
  { label: "Sticky Note", icon: StickyNote,     key: "N" },
  { label: "Text",        icon: Type,           key: "T" },
  { label: "Shape",       icon: Square,         key: ""  },
  { label: "Line",        icon: Minus,          key: ""  },
  { label: "Arrow",       icon: ArrowRight,     key: ""  },
  { label: "Image",       icon: Image,          key: ""  },
  { label: "Table",       icon: Table,          key: ""  },
  { label: "Frame",       icon: Frame,          key: ""  },
  { label: "Templates",   icon: LayoutTemplate, key: ""  },
];

// ─── Board Right Panel ─────────────────────────────────────────
const BoardRightPanel = ({ wb }) => {
  const [activeTab, setActiveTab] = useState("Board");
  return (
    <div className="w-72 border-l border-border bg-surface flex flex-col h-full flex-shrink-0">
      <div className="flex border-b border-border flex-shrink-0">
        {["Board", "Styles", "Comments"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-secondary hover:text-primary"
            }`}>{tab}
          </button>
        ))}
      </div>

      {activeTab === "Board" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Whiteboard Name</p>
            <p className="text-sm text-primary font-medium">{wb?.title || "Untitled Whiteboard"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-secondary">{wb?.description || "No description"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">Background</p>
            <div className="flex gap-2">
              {["#FFFFFF","#F5F5F5","#FFF9F0","#F0F4FF","#0A0A0A"].map(color => (
                <button key={color}
                  className="w-7 h-7 rounded-md border-2 border-border hover:border-primary transition-colors"
                  style={{ background: color }} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">Board Settings</p>
            <div className="flex flex-col gap-2.5">
              {["Grid","Snap to grid","Show cursor"].map(label => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-secondary">{label}</span>
                  <button className="w-10 h-5 bg-primary rounded-full relative">
                    <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">Export</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1">PNG</Button>
              <Button variant="secondary" size="sm" className="flex-1">PDF</Button>
              <Button variant="secondary" size="sm" className="flex-1">···</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "Board" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare size={24} className="mx-auto mb-2 text-tertiary" />
            <p className="text-sm font-medium text-primary">
              {activeTab === "Comments" ? "No comments" : "No styles"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Whiteboard Editor ────────────────────────────────────
const WhiteboardEditorPage = () => {
  const { wbId } = useParams();
  const { user }  = useAuthStore();

  const [wb, setWb]               = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [shapes, setShapes]       = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [zoom, setZoom]           = useState(100);
  const [loading, setLoading]     = useState(true);

  const stageRef  = useRef(null);
  const ydoc      = useRef(new Y.Doc());
  const yShapes   = useRef(null);
  const provider  = useRef(null);

  useEffect(() => {
    whiteboardService.getWhiteboard(wbId)
      .then(r => setWb(r.data.data.whiteboard))
      .catch(() => toast.error("Whiteboard not found"))
      .finally(() => setLoading(false));

    // Y.Map to store shapes — each key is a shapeId, value is the shape object
    yShapes.current = ydoc.current.getMap("shapes");

    yShapes.current.observe(() => {
      const all = [];
      yShapes.current.forEach((val, key) => all.push({ id: key, ...val }));
      setShapes(all);
    });

    // Connect to backend Yjs WebSocket — room prefix "wb:" tells the server
    // this is a whiteboard (vs "doc:" for documents)
    const token = localStorage.getItem("token") || "";
    const wsProvider = new WebsocketProvider(
      `${YJS_WS_URL}/yjs`,
      `wb:${wbId}`,
      ydoc.current,
      { params: { token }, disableBc: true }
    );

    provider.current = wsProvider;

    wsProvider.awareness.on("change", () => {
      const states = wsProvider.awareness.getStates();
      const users = [];
      states.forEach((state, clientId) => {
        if (state.user && clientId !== wsProvider.awareness.clientID) {
          users.push(state.user);
        }
      });
      setOnlineUsers(users);
    });

    wsProvider.awareness.setLocalStateField("user", {
      name:  user?.name  || "Anonymous",
      color: getCursorColor(user?._id || ""),
    });

    return () => wsProvider.destroy();
  }, [wbId, user]);

  // Debounced REST snapshot — backup persistence alongside the Yjs server's own persistence
  const autoSave = useCallback(debounce(async () => {
    setSaveStatus("saving");
    try {
      const yjsState = Y.encodeStateAsUpdate(ydoc.current);
      const base64   = btoa(String.fromCharCode(...new Uint8Array(yjsState)));
      await whiteboardService.saveSnapshot(wbId, base64);
      setSaveStatus("saved");
    } catch { setSaveStatus("error"); }
  }, 2000), [wbId]);

  const addShape = useCallback((type, x, y) => {
    const id = `shape_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const base = { type, x, y, fill: "#E2E8F0", stroke: "#94A3B8", strokeWidth: 1 };
    const data = type === "rect"
      ? { ...base, width: 120, height: 80 }
      : type === "circle"
      ? { ...base, radius: 50 }
      : type === "text"
      ? { ...base, text: "Double click to edit", fontSize: 14, fill: "#0A0A0A" }
      : base;

    // Yjs transact — atomic group operation, merges cleanly under concurrent edits
    ydoc.current.transact(() => { yShapes.current.set(id, data); });
    autoSave();
  }, [autoSave]);

  const handleStageClick = (e) => {
    if (activeTool === "select") {
      setSelectedId(e.target === e.target.getStage() ? null : e.target.id());
      return;
    }
    const pos = e.target.getStage().getPointerPosition();
    if (["rect","circle","text"].includes(activeTool)) {
      addShape(activeTool, pos.x, pos.y);
      setActiveTool("select");
    }
  };

  const handleShapeDrag = (id, x, y) => {
    ydoc.current.transact(() => {
      const existing = yShapes.current.get(id);
      if (existing) yShapes.current.set(id, { ...existing, x, y });
    });
    autoSave();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <Loader2 size={24} className="animate-spin text-tertiary" />
    </div>
  );

  return (
    <div className="h-screen bg-[#F8F8F8] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="h-14 border-b border-border bg-surface flex items-center px-4 gap-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-1.5 text-sm text-secondary flex-1 min-w-0">
          <Link to="/whiteboards" className="hover:text-primary transition-colors">Whiteboards</Link>
          <ChevronRight size={14} />
          <span className="text-primary font-medium truncate">{wb?.title || "Untitled"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-tertiary">
          {saveStatus === "saving" && <><Loader2 size={12} className="animate-spin"/> Saving...</>}
          {saveStatus === "saved"  && <><Cloud size={12} className="text-status-green"/> Saved</>}
        </div>

        {/* Centered toolbar */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-2 py-1.5">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button key={id} title={label} onClick={() => setActiveTool(id)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                activeTool === id ? "bg-primary text-white" : "text-secondary hover:bg-app hover:text-primary"
              }`}>
              <Icon size={15} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onlineUsers.length > 0 && <AvatarStack users={onlineUsers} max={4} size="xs" />}
          <Button variant="secondary" size="sm" icon={Share2}>Share</Button>
          <Button size="sm" icon={Play}>Present</Button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-app text-tertiary">
            <MoreHorizontal size={15}/>
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left create panel */}
        <div className="w-48 border-r border-border bg-surface flex flex-col py-3 px-2 flex-shrink-0">
          <p className="text-2xs font-semibold text-tertiary uppercase tracking-wider px-2 mb-2">Create</p>
          {CREATE_TOOLS.map(({ label, icon: Icon, key }) => (
            <button key={label}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-secondary hover:bg-app hover:text-primary transition-colors w-full text-left">
              <Icon size={14} className="flex-shrink-0 text-tertiary" />
              <span>{label}</span>
              {key && <span className="ml-auto text-2xs text-tertiary">{key}</span>}
            </button>
          ))}
        </div>

        {/* Konva canvas */}
        <div className="flex-1 overflow-hidden relative cursor-crosshair"
          style={{
            background: "#F8F8F8",
            backgroundImage: "radial-gradient(circle, #D1D5DB 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        >
          <Stage
            ref={stageRef}
            width={window.innerWidth - 220 - 288}
            height={window.innerHeight - 56}
            onClick={handleStageClick}
            scaleX={zoom / 100}
            scaleY={zoom / 100}
          >
            <Layer>
              {shapes.map((shape) => {
                const common = {
                  key: shape.id, id: shape.id,
                  x: shape.x, y: shape.y,
                  draggable: activeTool === "select",
                  onDragEnd: (e) => handleShapeDrag(shape.id, e.target.x(), e.target.y()),
                  fill:        shape.fill,
                  stroke:      selectedId === shape.id ? "#7C5CFC" : shape.stroke,
                  strokeWidth: selectedId === shape.id ? 2 : shape.strokeWidth,
                };
                if (shape.type === "rect")   return <Rect {...common} width={shape.width} height={shape.height} cornerRadius={6} />;
                if (shape.type === "circle") return <KonvaCircle {...common} radius={shape.radius} />;
                if (shape.type === "text")   return <KText {...common} text={shape.text} fontSize={shape.fontSize} fill={shape.fill} />;
                return null;
              })}
            </Layer>
          </Stage>

          {shapes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-secondary text-sm font-medium">Click to add shapes</p>
                <p className="text-tertiary text-xs mt-1">Select a tool from the toolbar and click on the canvas</p>
              </div>
            </div>
          )}
        </div>

        <BoardRightPanel wb={wb} />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-60 flex items-center gap-1 bg-surface border border-border rounded-xl px-2 py-1.5 shadow-md z-10">
        <button onClick={() => setZoom(p => Math.max(25, p - 10))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-app text-secondary transition-colors">
          <ZoomOut size={13}/>
        </button>
        <span className="text-xs font-semibold text-primary w-12 text-center">{zoom}%</span>
        <button onClick={() => setZoom(p => Math.min(200, p + 10))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-app text-secondary transition-colors">
          <ZoomIn size={13}/>
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button onClick={() => setZoom(100)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-app text-secondary transition-colors">
          <Maximize2 size={13}/>
        </button>
      </div>
    </div>
  );
};

export default WhiteboardEditorPage;
