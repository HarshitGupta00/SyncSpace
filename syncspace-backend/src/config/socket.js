// config/socket.js
// Socket.io server creation + CORS config.
// Extracted from server.js as planned in the original folder structure,
// keeping server.js as a thin assembly file.

const { Server } = require("socket.io");
const { CLIENT_URL } = require("./env");

/**
 * Create and configure a Socket.io server instance.
 *
 * @param {import("http").Server} httpServer - The HTTP server to attach to
 * @returns {import("socket.io").Server} Configured Socket.io server
 */
const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};

module.exports = { createSocketServer };
