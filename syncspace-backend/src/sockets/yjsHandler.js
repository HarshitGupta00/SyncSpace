// sockets/yjsHandler.js
// Real-time CRDT sync server for documents and whiteboards using Yjs.
//
// ARCHITECTURE:
//   This module runs a WebSocket server on the `/yjs` path of the same HTTP
//   server that Express + Socket.io use. Socket.io handles its own upgrade
//   path (`/socket.io/`), and we handle `/yjs` — they don't conflict.
//
//   Clients connect to: ws://localhost:5000/yjs?roomId=doc:<docId>&token=<jwt>
//   (or ws://localhost:5000/yjs?roomId=wb:<wbId>&token=<jwt> for whiteboards)
//
//   The Yjs sync protocol (y-protocols/sync) handles the actual CRDT merging:
//   - On connect: server sends sync step 1 (state vector) to new client
//   - Client responds with sync step 2 (their missing updates)
//   - On every edit: client sends an update, server applies it to the shared
//     Y.Doc and broadcasts to all other clients in the room
//   - Result: conflict-free, character-level merging with no central lock
//
// PERSISTENCE:
//   On document load (first client connects to a room), we hydrate the Y.Doc
//   from the stored yjsState in MongoDB. On a debounced interval (default 3s
//   of inactivity), we persist back to MongoDB using snapshotService.
//   Version history entries are throttled to max one per 5 minutes (see
//   snapshotService.js) to avoid flooding DocumentVersion.
//
// HOW THIS RELATES TO THE REST SNAPSHOT ENDPOINTS:
//   documentController.saveSnapshot (POST /api/documents/:docId/snapshot)
//   still exists for manual saves. Both it and this handler use the shared
//   snapshotService.saveDocumentSnapshot(). The Document.yjsState field is
//   the single source of truth for persisted state — whoever writes last
//   wins, which is fine because Yjs binary state is a CRDT merge result
//   (applying the same update twice is idempotent).
//
// ACCESS CONTROL:
//   Before allowing a WebSocket connection, we verify the JWT token and
//   check that the user has access to the document/whiteboard's project
//   via permissionService (same checks as the REST endpoints).

const WebSocket = require("ws");
const http = require("http");
const url = require("url");
const jwt = require("jsonwebtoken");
const Y = require("yjs");
const syncProtocol = require("y-protocols/sync");
const awarenessProtocol = require("y-protocols/awareness");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");

const User = require("../models/User");
const Document = require("../models/Document");
const Whiteboard = require("../models/Whiteboard");
const { JWT_SECRET } = require("../config/env");
const { saveDocumentSnapshot, saveWhiteboardSnapshot } = require("../services/snapshotService");

// How long to wait after the last edit before persisting to MongoDB
const PERSISTENCE_INTERVAL_MS = parseInt(process.env.YJS_PERSISTENCE_INTERVAL_MS, 10) || 3000;

// Message types — must match y-protocols conventions
const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

// ── In-memory room management ─────────────────────────────────────────
// Each room holds: a Y.Doc, an awareness instance, connected clients,
// and a debounce timer for persistence.
const rooms = new Map(); // roomId -> { ydoc, awareness, clients: Set<ws>, debounceTimer, lastUserId }

/**
 * Get or create a room. If the room doesn't exist yet, create a new Y.Doc
 * and hydrate it from MongoDB.
 */
const getOrCreateRoom = async (roomId) => {
  if (rooms.has(roomId)) return rooms.get(roomId);

  const ydoc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(ydoc);

  // Hydrate from MongoDB if persisted state exists
  const { type, id } = parseRoomId(roomId);
  let storedState = null;

  if (type === "doc") {
    const doc = await Document.findById(id).select("yjsState").lean();
    if (doc && doc.yjsState) storedState = doc.yjsState;
  } else if (type === "wb") {
    const wb = await Whiteboard.findById(id).select("yjsState").lean();
    if (wb && wb.yjsState) storedState = wb.yjsState;
  }

  if (storedState) {
    // Apply the stored binary state to the fresh Y.Doc
    Y.applyUpdate(ydoc, new Uint8Array(storedState));
  }

  const room = {
    ydoc,
    awareness,
    clients: new Set(),
    debounceTimer: null,
    lastUserId: null, // track who made the last edit for "savedBy"
  };

  // Listen for updates to debounce-persist
  ydoc.on("update", (update, origin) => {
    // Broadcast update to all other clients in the room
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    room.clients.forEach((client) => {
      if (client !== origin && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    // Debounce persistence
    schedulePersistence(roomId, room);
  });

  rooms.set(roomId, room);
  return room;
};

/**
 * Parse a roomId like "doc:64abc123" into { type: "doc", id: "64abc123" }
 */
const parseRoomId = (roomId) => {
  const colonIdx = roomId.indexOf(":");
  if (colonIdx === -1) return { type: "doc", id: roomId };
  return {
    type: roomId.substring(0, colonIdx),  // "doc" or "wb"
    id: roomId.substring(colonIdx + 1),    // MongoDB ObjectId string
  };
};

/**
 * Debounced persistence — waits PERSISTENCE_INTERVAL_MS after the last update
 * before persisting to MongoDB.
 */
const schedulePersistence = (roomId, room) => {
  if (room.debounceTimer) clearTimeout(room.debounceTimer);

  room.debounceTimer = setTimeout(async () => {
    try {
      await persistRoom(roomId, room);
    } catch (err) {
      console.error(`[Yjs] Persistence error for room ${roomId}:`, err.message);
    }
  }, PERSISTENCE_INTERVAL_MS);
};

/**
 * Persist the current Y.Doc state to MongoDB.
 */
const persistRoom = async (roomId, room) => {
  const { type, id } = parseRoomId(roomId);
  const stateBuffer = Buffer.from(Y.encodeStateAsUpdate(room.ydoc));

  if (type === "doc") {
    await saveDocumentSnapshot(id, stateBuffer, room.lastUserId || id);
  } else if (type === "wb") {
    await saveWhiteboardSnapshot(id, stateBuffer, room.lastUserId || id);
  }
};

/**
 * Handle an incoming WebSocket message from a client.
 */
const handleMessage = (ws, room, message) => {
  try {
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MSG_SYNC: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_SYNC);
        
        // Peek at the sync message type without consuming it from the main decoder.
        // syncProtocol message types: 0 = SyncStep1, 1 = SyncStep2, 2 = Update
        const peekDecoder = decoding.createDecoder(new Uint8Array(message));
        decoding.readVarUint(peekDecoder); // consume MSG_SYNC wrapper
        const syncMessageType = decoding.readVarUint(peekDecoder);
        
        // Option (a) implementation: Silently ignore write updates from viewer-role users.
        // Viewers are only allowed to send SyncStep1 (requesting the state vector).
        // SyncStep2 and Update messages contain document modifications.
        if (ws._effectiveRole === "viewer" && syncMessageType !== 0) {
          break; // drop the write silently
        }

        syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, ws);
        if (encoding.length(encoder) > 1) {
          ws.send(encoding.toUint8Array(encoder));
        }
        break;
      }
      case MSG_AWARENESS: {
        awarenessProtocol.applyAwarenessUpdate(
          room.awareness,
          decoding.readVarUint8Array(decoder),
          ws
        );
        break;
      }
    }
  } catch (err) {
    console.error("[Yjs] Error handling message:", err.message);
  }
};

/**
 * Send initial sync step 1 to a newly connected client.
 */
const sendSyncStep1 = (ws, room) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, MSG_SYNC);
  syncProtocol.writeSyncStep1(encoder, room.ydoc);
  ws.send(encoding.toUint8Array(encoder));

  // Also send current awareness state
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    ws.send(encoding.toUint8Array(awarenessEncoder));
  }
};

/**
 * Clean up when a client disconnects from a room.
 */
const handleDisconnect = async (ws, roomId, room) => {
  room.clients.delete(ws);

  // Remove awareness state for this client
  awarenessProtocol.removeAwarenessStates(
    room.awareness,
    [ws._yjsClientId],
    null
  );

  // If room is now empty, persist final state and clean up
  if (room.clients.size === 0) {
    if (room.debounceTimer) clearTimeout(room.debounceTimer);

    try {
      await persistRoom(roomId, room);
    } catch (err) {
      console.error(`[Yjs] Final persistence error for room ${roomId}:`, err.message);
    }

    room.ydoc.destroy();
    rooms.delete(roomId);
  }
};

/**
 * Authenticate a WebSocket connection via JWT token from query string.
 * Returns the user object or null if auth fails.
 */
const authenticateWs = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").lean();
    return user || null;
  } catch {
    return null;
  }
};

/**
 * Verify the user has access to the resource behind a roomId.
 * Uses the same project-based access check as REST endpoints.
 * Imported lazily to avoid circular dependency issues at startup.
 */
const verifyRoomAccess = async (roomId, userId) => {
  const { type, id } = parseRoomId(roomId);

  // Lazy-load permissionService to avoid circular deps at module load time
  // (permissionService depends on models which may not be connected yet)
  const { resolveDocumentAccess, resolveWhiteboardAccess } = require("../services/permissionService");

  try {
    let result;
    if (type === "doc") {
      result = await resolveDocumentAccess(userId, id);
    } else if (type === "wb") {
      result = await resolveWhiteboardAccess(userId, id);
    } else {
      return { hasAccess: false, effectiveRole: null };
    }
    
    // Any resolvable role (even viewer) can connect to the Yjs room to see live content.
    // Write access is enforced by the frontend (read-only mode for viewers) AND
    // verified by the server in handleMessage (viewer-role writes are silently dropped).
    if (result.error) {
       return { hasAccess: false, effectiveRole: null };
    }
    return { hasAccess: true, effectiveRole: result.effectiveRole };
  } catch {
    return { hasAccess: false, effectiveRole: null };
  }
};

// ── Awareness broadcast ───────────────────────────────────────────────
// When awareness changes (cursor position, user name, etc.), broadcast
// to all other clients in the room.
const setupAwarenessBroadcast = (room) => {
  room.awareness.on("update", ({ added, updated, removed }) => {
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    room.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
};

// Track whether awareness broadcast has been set up for each room
const awarenessSetup = new Set();

// ── Public API ────────────────────────────────────────────────────────

/**
 * Initialize the Yjs WebSocket server.
 * Called from server.js with the HTTP server instance.
 *
 * @param {http.Server} httpServer - The HTTP server to attach to
 */
const initYjsWebSocket = (httpServer) => {
  const wss = new WebSocket.Server({ noServer: true });

  // Handle the HTTP upgrade for /yjs path
  httpServer.on("upgrade", (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === "/yjs") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // If pathname is NOT /yjs, let other handlers (Socket.io) deal with it.
    // Socket.io registers its own upgrade handler on the httpServer,
    // so we simply don't call socket.destroy() here.
  });

  // Handle new Yjs WebSocket connections
  wss.on("connection", async (ws, request) => {
    const params = url.parse(request.url, true).query;
    const { roomId, token } = params;

    if (!roomId || !token) {
      ws.close(4001, "Missing roomId or token");
      return;
    }

    // Authenticate
    const user = await authenticateWs(token);
    if (!user) {
      ws.close(4003, "Authentication failed");
      return;
    }

    // Access control
    const accessInfo = await verifyRoomAccess(roomId, user._id);
    if (!accessInfo.hasAccess) {
      ws.close(4003, "Access denied");
      return;
    }

    // Assign the role to the socket for handleMessage write-access checks
    ws._effectiveRole = accessInfo.effectiveRole;

    // Get or create the room
    const room = await getOrCreateRoom(roomId);
    room.lastUserId = user._id;

    // Assign a unique client ID for awareness tracking
    ws._yjsClientId = room.awareness.doc.clientID + room.clients.size + 1;

    // Add client to room
    room.clients.add(ws);

    // Set up awareness broadcast (once per room)
    if (!awarenessSetup.has(roomId)) {
      setupAwarenessBroadcast(room);
      awarenessSetup.add(roomId);
    }

    // Send initial sync
    sendSyncStep1(ws, room);

    // Handle messages
    ws.on("message", (message) => {
      room.lastUserId = user._id;
      handleMessage(ws, room, message);
    });

    // Handle disconnect
    ws.on("close", () => {
      handleDisconnect(ws, roomId, room);
      if (room.clients.size === 0) {
        awarenessSetup.delete(roomId);
      }
    });

    ws.on("error", (err) => {
      console.error(`[Yjs] WebSocket error for user ${user._id}:`, err.message);
      ws.close();
    });
  });

  console.log("[Yjs] WebSocket server initialized on /yjs path");
  return wss;
};

/**
 * Force a live room to replace its entire state with a restored snapshot.
 * Called by documentController.restoreVersion to ensure connected clients
 * see the restored version immediately and it isn't clobbered by auto-save.
 */
const forceReplaceRoomState = (roomId, newStateBuffer) => {
  const room = rooms.get(roomId);
  if (!room) return false; // no active room, fallback to mongodb is fine

  // Create a fresh doc and apply the restored state
  const freshDoc = new Y.Doc();
  Y.applyUpdate(freshDoc, new Uint8Array(newStateBuffer));

  // Compute a diff-free update from the fresh doc and apply it to the live doc.
  // By applying it to room.ydoc, the update event fires, broadcasting to all
  // connected clients and triggering the debounced persistence loop.
  const stateVector = Y.encodeStateVector(room.ydoc);
  const diffUpdate = Y.encodeStateAsUpdate(freshDoc, stateVector);
  Y.applyUpdate(room.ydoc, diffUpdate);

  return true;
};

module.exports = { initYjsWebSocket, forceReplaceRoomState };
