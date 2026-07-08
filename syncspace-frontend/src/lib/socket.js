// lib/socket.js
// Singleton Socket.io client instance.
// WHY singleton: we want ONE persistent connection shared across
// the whole app — not a new connection per component.

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false, // don't connect immediately on import
  // We manually call socket.connect() after the user logs in,
  // and socket.disconnect() on logout.
  withCredentials: true,
});

export default socket;
