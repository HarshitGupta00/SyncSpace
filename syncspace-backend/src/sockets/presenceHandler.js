// sockets/presenceHandler.js
// Handles "who is currently online / in this document" events.
// This powers the PresenceAvatarStack component on the frontend.
//
// HOW IT WORKS:
// When a user opens a document, the frontend emits "presence:join" with
// { documentId, user: { _id, name, avatar, color } }.
// The server adds them to a Socket.io ROOM named after that documentId,
// then broadcasts the updated online users list to everyone in that room.
// When they leave/disconnect, they're removed from the room and the list
// is broadcast again.
//
// WHY Socket.io rooms: rooms let us broadcast to ONLY the users in one
// document, not to every connected user. document_abc's events stay isolated
// from document_xyz's events, even though they share the same Socket.io server.

// In-memory map: documentId -> Map<socketId, userInfo>
// WHY in-memory instead of Redis/DB: presence is inherently ephemeral —
// it doesn't need to survive a server restart. If it resets, clients
// simply re-emit presence:join on reconnect.
const documentPresence = new Map();

const presenceHandler = (io, socket) => {

  // Client emits this when they open a document/whiteboard
  socket.on("presence:join", ({ roomId, user }) => {
    socket.join(roomId); // join the Socket.io room for this document

    // Track this user in the in-memory presence map
    if (!documentPresence.has(roomId)) {
      documentPresence.set(roomId, new Map());
    }
    documentPresence.get(roomId).set(socket.id, user);

    // Broadcast updated presence list to everyone in the room
    const users = Array.from(documentPresence.get(roomId).values());
    io.to(roomId).emit("presence:update", users);
  });

  // Client emits this when they close the document (optional — disconnect handles it too)
  socket.on("presence:leave", ({ roomId }) => {
    leaveRoom(io, socket, roomId);
  });

  // Clean up when client disconnects (tab closed, network drop, etc.)
  socket.on("disconnect", () => {
    // A user might be in multiple rooms (multiple docs open in tabs)
    // We need to remove them from ALL rooms they were in.
    documentPresence.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        leaveRoom(io, socket, roomId);
      }
    });
  });

};

// Helper: remove from room + broadcast updated list
const leaveRoom = (io, socket, roomId) => {
  socket.leave(roomId);
  if (documentPresence.has(roomId)) {
    documentPresence.get(roomId).delete(socket.id);
    const users = Array.from(documentPresence.get(roomId).values());
    io.to(roomId).emit("presence:update", users);

    // Clean up the room from the map if empty
    if (documentPresence.get(roomId).size === 0) {
      documentPresence.delete(roomId);
    }
  }
};

module.exports = presenceHandler;
