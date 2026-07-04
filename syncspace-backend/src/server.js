// server.js
// Entry point — starts the HTTP server, initializes Socket.io, connects to DB.
//
// WHY Socket.io lives here (not in app.js):
// Socket.io wraps the raw HTTP server, not Express. Express's app.use() only
// handles HTTP request/response — Socket.io needs the underlying http.Server
// object directly to handle WebSocket upgrades. So the chain is:
//
//   Express app → http.Server → Socket.io wraps it
//
// app.js stays pure Express. server.js assembles the full server.

require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const { PORT, CLIENT_URL } = require("./config/env");
const registerSocketHandlers = require("./sockets/index");

// Create the raw HTTP server from our Express app
const httpServer = http.createServer(app);

// Attach Socket.io to the HTTP server
// CORS here mirrors what Express has — Socket.io handles its own CORS
// separately from Express CORS middleware.
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register all socket event handlers
// We pass `io` in so handlers can emit to rooms/namespaces
registerSocketHandlers(io);

// Make `io` accessible in controllers via req.app.get("io")
// WHY: controllers like commentController need to emit real-time notifications
// when a user is @mentioned. Rather than importing io directly (circular deps risk),
// we attach it to the Express app instance which is always available via req.app.
app.set("io", io);

// Start: connect DB first, then start listening
// WHY connect DB before starting server: if DB connection fails at startup,
// we want to know before accepting any traffic, not after.
const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`SyncSpace server running on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
};

// Handle unhandled promise rejections globally (e.g. a mongoose query that
// throws and wasn't caught by asyncHandler). Log and exit so the process
// manager can restart cleanly.
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  httpServer.close(() => process.exit(1));
});

startServer();
