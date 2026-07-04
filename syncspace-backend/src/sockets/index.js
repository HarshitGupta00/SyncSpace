// sockets/index.js
// Registers all Socket.io event handlers.
// Individual handlers are split into separate files by concern —
// same reason routes are split: keeps each file focused on one thing.

const presenceHandler = require("./presenceHandler");
const notificationHandler = require("./notificationHandler");

const registerSocketHandlers = (io) => {

  io.on("connection", (socket) => {
    // 'connection' fires every time a new client connects via WebSocket.
    // `socket` represents that specific client's connection.
    console.log(`Socket connected: ${socket.id}`);

    // Register handlers — each function attaches event listeners to this socket
    presenceHandler(io, socket);
    notificationHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Yjs handles its own disconnect cleanup via y-websocket.
      // Presence cleanup (removing user from "online" list) is handled
      // inside presenceHandler's disconnect listener.
    });
  });

};

module.exports = registerSocketHandlers;
